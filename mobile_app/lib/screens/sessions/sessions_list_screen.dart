import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../models/session_model.dart';
import '../../services/physio_service.dart';
import '../../services/doctor_service.dart';
import '../../services/session_service.dart';
import '../../providers/auth_provider.dart';
import '../../utils/helpers.dart';
import '../../widgets/bottom_nav_bar.dart';
import 'session_detail_screen.dart';

class SessionsListScreen extends StatefulWidget {
  const SessionsListScreen({super.key});

  @override
  State<SessionsListScreen> createState() => _SessionsListScreenState();
}

class _SessionsListScreenState extends State<SessionsListScreen> {
  final PhysioService _physioService = PhysioService();
  final DoctorService _doctorService = DoctorService();
  final SessionService _sessionService = SessionService();
  final TextEditingController _searchController = TextEditingController();
  List<SessionModel> _allSessions = [];
  List<SessionModel> _filteredSessions = [];
  String _selectedFilter = 'all'; // all, completed, pending, upcoming
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSessions();
    _searchController.addListener(_applyFilter);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadSessions() async {
    setState(() => _isLoading = true);
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      
      List<SessionModel> sessions = [];
      
      // Get sessions based on user type
      if (user?.isPhysiotherapist == true) {
        // Physiotherapist: get all their sessions
        final data = await _physioService.getMyPatientsAndSessions();
        sessions = data['sessions'] as List<SessionModel>;
      } else if (user?.isDoctor == true) {
        // Doctor: get all their sessions
        final data = await _doctorService.getMyPatientsAndSessions();
        sessions = data['sessions'] as List<SessionModel>;
      } else if (user?.isPatient == true) {
        // Patient: get their own sessions
        sessions = await _sessionService.getUserSessions();
      } else {
        throw Exception('User type not recognized');
      }
      
      setState(() {
        _allSessions = sessions;
        _applyFilter();
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        String errorMessage = 'Error loading sessions';
        if (e.toString().contains('403') || e.toString().contains('Forbidden')) {
          errorMessage = 'Access denied. Please ensure you have permission to view sessions.';
        } else {
          errorMessage = 'Error loading sessions: ${e.toString()}';
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    }
  }

  void _applyFilter() {
    final now = DateTime.now();
    final searchQuery = _searchController.text.toLowerCase().trim();
    
    setState(() {
      List<SessionModel> filtered = _allSessions;
      
      // Apply status filter
      switch (_selectedFilter) {
        case 'completed':
          filtered = filtered.where((s) => s.isCompleted).toList();
          break;
        case 'pending':
          filtered = filtered.where((s) => 
            s.isPending && (s.displayDate == null || s.displayDate!.isAfter(now))
          ).toList();
          break;
        case 'upcoming':
          filtered = filtered.where((s) => 
            (s.isPending || s.isActive) && 
            s.displayDate != null && 
            s.displayDate!.isAfter(now)
          ).toList();
          break;
        default:
          // No status filter
          break;
      }
      
      // Apply search filter
      if (searchQuery.isNotEmpty) {
        filtered = filtered.where((s) {
          final patientName = s.patientName?.toLowerCase() ?? '';
          final surgeryType = s.surgeryType?.toLowerCase() ?? '';
          final doctorName = s.doctorName?.toLowerCase() ?? '';
          final physioName = s.physiotherapistName?.toLowerCase() ?? '';
          final status = s.status?.toLowerCase() ?? '';
          
          return patientName.contains(searchQuery) ||
                 surgeryType.contains(searchQuery) ||
                 doctorName.contains(searchQuery) ||
                 physioName.contains(searchQuery) ||
                 status.contains(searchQuery);
        }).toList();
      }
      
      // Sort by date (most recent first)
      filtered.sort((a, b) {
        final dateA = a.displayDate ?? DateTime(1970);
        final dateB = b.displayDate ?? DateTime(1970);
        return dateB.compareTo(dateA);
      });
      
      _filteredSessions = filtered;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('All Sessions'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadSessions,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Search Bar
                Container(
                  padding: const EdgeInsets.all(16),
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Search by patient name, surgery type, doctor, or status...',
                      prefixIcon: const Icon(Icons.search),
                      suffixIcon: _searchController.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear),
                              onPressed: () {
                                setState(() {
                                  _searchController.clear();
                                  _applyFilter();
                                });
                              },
                            )
                          : null,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      filled: true,
                      fillColor: Colors.grey[100],
                    ),
                    onChanged: (value) {
                      setState(() {
                        _applyFilter();
                      });
                    },
                  ),
                ),
                
                // Filter Chips
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _buildFilterChip('All', 'all'),
                        const SizedBox(width: 8),
                        _buildFilterChip('Upcoming', 'upcoming'),
                        const SizedBox(width: 8),
                        _buildFilterChip('Pending', 'pending'),
                        const SizedBox(width: 8),
                        _buildFilterChip('Completed', 'completed'),
                      ],
                    ),
                  ),
                ),
                
                // Stats Bar
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  color: Colors.grey[100],
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _buildStatChip('Total', _allSessions.length, Colors.blue),
                          const SizedBox(width: 16),
                          _buildStatChip('Upcoming', _allSessions.where((s) => 
                            (s.isPending || s.isActive) && 
                            s.displayDate != null && 
                            s.displayDate!.isAfter(DateTime.now())
                          ).length, Colors.orange),
                          const SizedBox(width: 16),
                          _buildStatChip('Pending', _allSessions.where((s) => s.isPending).length, Colors.orange),
                          const SizedBox(width: 16),
                          _buildStatChip('Completed', _allSessions.where((s) => s.isCompleted).length, Colors.green),
                        ],
                      ),
                      if (_searchController.text.isNotEmpty || _selectedFilter != 'all')
                        TextButton.icon(
                          onPressed: () {
                            setState(() {
                              _searchController.clear();
                              _selectedFilter = 'all';
                              _applyFilter();
                            });
                          },
                          icon: const Icon(Icons.clear_all, size: 16),
                          label: const Text('Clear'),
                          style: TextButton.styleFrom(
                            foregroundColor: const Color(0xFF0066CC),
                          ),
                        ),
                    ],
                  ),
                ),
                
                const Divider(height: 1),
                
                // Results Count
                if (_searchController.text.isNotEmpty || _selectedFilter != 'all')
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Row(
                      children: [
                        Text(
                          '${_filteredSessions.length} ${_filteredSessions.length == 1 ? 'session' : 'sessions'} found',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  ),
                
                // Sessions List
                Expanded(
                  child: RefreshIndicator(
                    onRefresh: _loadSessions,
                    child: _filteredSessions.isEmpty
                        ? _buildEmptyState()
                        : ListView.builder(
                            padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
                            itemCount: _filteredSessions.length,
                            itemBuilder: (context, index) {
                              final session = _filteredSessions[index];
                              return _buildSessionCard(session);
                            },
                          ),
                  ),
                ),
              ],
            ),
      bottomNavigationBar: const BottomNavBar(currentIndex: 3),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _selectedFilter == value;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          _selectedFilter = value;
          _applyFilter();
        });
      },
      selectedColor: const Color(0xFF0066CC),
      checkmarkColor: Colors.white,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : Colors.black87,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
    );
  }

  Widget _buildStatChip(String label, int count, Color color) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          count.toString(),
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.grey,
          ),
        ),
      ],
    );
  }

  Widget _buildSessionCard(SessionModel session) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: _getStatusColor(session.status),
          child: Icon(
            session.isCompleted 
                ? Icons.check 
                : session.isActive 
                    ? Icons.video_call 
                    : Icons.event,
            color: Colors.white,
          ),
        ),
        title: Text(
          session.patientName ?? 'Patient',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (session.displayDate != null)
              Text(
                Helpers.formatDate(session.displayDate),
                style: const TextStyle(fontSize: 12),
              ),
            if (session.surgeryType != null)
              Text(
                session.surgeryType!,
                style: const TextStyle(fontSize: 12, color: Colors.grey),
              ),
            if (session.doctorName != null)
              Text(
                'Doctor: ${session.doctorName}',
                style: const TextStyle(fontSize: 12, color: Colors.grey),
              ),
          ],
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          mainAxisSize: MainAxisSize.min,
          children: [
            Chip(
              label: Text(
                session.status ?? 'unknown',
                style: const TextStyle(fontSize: 10),
              ),
              backgroundColor: _getStatusColor(session.status),
              labelStyle: const TextStyle(color: Colors.white),
              padding: const EdgeInsets.symmetric(horizontal: 4),
            ),
            if (session.canJoinVideo)
              const Padding(
                padding: EdgeInsets.only(top: 4),
                child: Icon(Icons.video_call, size: 16, color: Colors.blue),
              ),
          ],
        ),
        onTap: () async {
          final result = await context.push(
            '/sessions/${session.id}',
            extra: session,
          );
          if (result == true) {
            _loadSessions();
          }
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    String message;
    IconData icon;
    
    if (_searchController.text.isNotEmpty) {
      message = 'No sessions match your search';
      icon = Icons.search_off;
    } else {
      switch (_selectedFilter) {
        case 'completed':
          message = 'No completed sessions';
          icon = Icons.check_circle_outline;
          break;
        case 'pending':
          message = 'No pending sessions';
          icon = Icons.schedule_outlined;
          break;
        case 'upcoming':
          message = 'No upcoming sessions';
          icon = Icons.event_outlined;
          break;
        default:
          message = 'No sessions found';
          icon = Icons.event_busy;
      }
    }
    
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 64, color: Colors.grey),
          const SizedBox(height: 16),
          Text(
            message,
            style: const TextStyle(
              fontSize: 18,
              color: Colors.grey,
            ),
          ),
          const SizedBox(height: 8),
          if (_searchController.text.isNotEmpty || _selectedFilter != 'all')
            TextButton(
              onPressed: () {
                setState(() {
                  _searchController.clear();
                  _selectedFilter = 'all';
                  _applyFilter();
                });
              },
              style: TextButton.styleFrom(
                foregroundColor: const Color(0xFF0066CC),
              ),
              child: const Text('Clear filters'),
            )
          else
            TextButton(
              onPressed: _loadSessions,
              style: TextButton.styleFrom(
                foregroundColor: const Color(0xFF0066CC),
              ),
              child: const Text('Refresh'),
            ),
        ],
      ),
    );
  }

  Color _getStatusColor(String? status) {
    switch (status) {
      case 'completed':
        return Colors.green;
      case 'active':
      case 'in-progress':
      case 'ongoing':
        return Colors.blue;
      case 'pending':
      case 'scheduled':
        return Colors.orange;
      case 'cancelled':
        return Colors.red;
      case 'missed':
        return Colors.grey;
      default:
        return Colors.grey[300]!;
    }
  }
}

