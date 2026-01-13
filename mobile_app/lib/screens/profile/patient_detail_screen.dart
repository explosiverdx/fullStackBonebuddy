import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../models/patient_model.dart';
import '../../models/session_model.dart';
import '../../services/physio_service.dart';
import '../../services/doctor_service.dart';
import '../../services/session_service.dart';
import '../../providers/auth_provider.dart';
import '../../utils/helpers.dart';
import '../../widgets/bottom_nav_bar.dart';
import '../sessions/session_detail_screen.dart';

class PatientDetailScreen extends StatefulWidget {
  final PatientModel patient;

  const PatientDetailScreen({super.key, required this.patient});

  @override
  State<PatientDetailScreen> createState() => _PatientDetailScreenState();
}

class _PatientDetailScreenState extends State<PatientDetailScreen> {
  final PhysioService _physioService = PhysioService();
  final DoctorService _doctorService = DoctorService();
  final SessionService _sessionService = SessionService();
  List<SessionModel> _allSessions = [];
  List<SessionModel> _filteredSessions = [];
  String _selectedFilter = 'all'; // all, completed, pending, upcoming
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSessions();
  }

  Future<void> _loadSessions() async {
    setState(() => _isLoading = true);
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      
      List<SessionModel> allSessions = [];
      
      // Get sessions based on user type
      if (user?.isPhysiotherapist == true) {
        // Physiotherapist: get all their sessions and filter
        final data = await _physioService.getMyPatientsAndSessions();
        allSessions = data['sessions'] as List<SessionModel>;
      } else if (user?.isDoctor == true) {
        // Doctor: get all their sessions and filter
        final data = await _doctorService.getMyPatientsAndSessions();
        allSessions = data['sessions'] as List<SessionModel>;
      } else if (user?.isPatient == true) {
        // Patient: get their own sessions
        allSessions = await _sessionService.getUserSessions();
      } else {
        throw Exception('User type not recognized');
      }
      
      // Filter sessions for this patient
      final patientId = widget.patient.id.toString().trim();
      final patientName = widget.patient.name?.toString().trim() ?? '';
      
      print('🔍 Filtering sessions for patient:');
      print('  Patient ID: $patientId');
      print('  Patient Name: $patientName');
      print('  User Type: ${user?.role}');
      print('  Total sessions from API: ${allSessions.length}');
      
      final patientSessions = allSessions.where((s) {
        final sessionPatientId = s.patientId?.toString().trim() ?? '';
        final sessionPatientName = s.patientName?.toString().trim() ?? '';
        
        // Match by ID (most reliable)
        if (patientId.isNotEmpty && sessionPatientId.isNotEmpty) {
          if (patientId == sessionPatientId) {
            print('  ✅ Matched session ${s.id} by ID: $sessionPatientId');
            return true;
          }
          // Also check if IDs match when converted to lowercase (in case of case differences)
          if (patientId.toLowerCase() == sessionPatientId.toLowerCase()) {
            print('  ✅ Matched session ${s.id} by ID (case-insensitive): $sessionPatientId');
            return true;
          }
        }
        
        // Match by name (fallback)
        if (patientName.isNotEmpty && sessionPatientName.isNotEmpty) {
          if (patientName == sessionPatientName) {
            print('  ✅ Matched session ${s.id} by name: $sessionPatientName');
            return true;
          }
          // Case-insensitive name matching
          if (patientName.toLowerCase() == sessionPatientName.toLowerCase()) {
            print('  ✅ Matched session ${s.id} by name (case-insensitive): $sessionPatientName');
            return true;
          }
        }
        
        return false;
      }).toList();
      
      print('  📊 Found ${patientSessions.length} sessions for this patient');
      
      setState(() {
        _allSessions = patientSessions;
        _applyFilter();
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        String errorMessage = 'Error loading sessions';
        if (e.toString().contains('403') || e.toString().contains('Forbidden')) {
          errorMessage = 'Access denied. Please ensure you have permission to view this patient\'s sessions.';
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
    setState(() {
      switch (_selectedFilter) {
        case 'completed':
          _filteredSessions = _allSessions.where((s) => s.isCompleted).toList();
          break;
        case 'pending':
          _filteredSessions = _allSessions.where((s) => 
            s.isPending && (s.displayDate == null || s.displayDate!.isAfter(now))
          ).toList();
          break;
        case 'upcoming':
          _filteredSessions = _allSessions.where((s) => 
            (s.isPending || s.isActive) && 
            s.displayDate != null && 
            s.displayDate!.isAfter(now)
          ).toList();
          break;
        default:
          _filteredSessions = _allSessions;
      }
      // Sort by date (most recent first)
      _filteredSessions.sort((a, b) {
        final dateA = a.displayDate ?? DateTime(1970);
        final dateB = b.displayDate ?? DateTime(1970);
        return dateB.compareTo(dateA);
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.patient.name ?? 'Patient Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadSessions,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadSessions,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Patient Info Card
                    _buildPatientInfoCard(),
                    
                    const SizedBox(height: 24),
                    
                    // Filter Chips
                    _buildFilterChips(),
                    
                    const SizedBox(height: 16),
                    
                    // Sessions Section
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Sessions',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          '${_filteredSessions.length} ${_filteredSessions.length == 1 ? 'session' : 'sessions'}',
                          style: const TextStyle(
                            fontSize: 14,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 12),
                    
                    // Sessions List
                    if (_filteredSessions.isEmpty)
                      _buildEmptyState()
                    else
                      ..._filteredSessions.map((session) => 
                        _buildSessionCard(session)
                      ),
                  ],
                ),
              ),
            ),
      bottomNavigationBar: const BottomNavBar(currentIndex: 3),
    );
  }

  Widget _buildPatientInfoCard() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: const Color(0xFF0066CC),
                  child: Text(
                    widget.patient.name?.substring(0, 1).toUpperCase() ?? 'P',
                    style: const TextStyle(
                      fontSize: 24,
                      color: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.patient.name ?? 'Unknown Patient',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (widget.patient.mobileNumber != null)
                        Text(
                          widget.patient.mobileNumber!,
                          style: const TextStyle(
                            fontSize: 14,
                            color: Colors.grey,
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            if (widget.patient.email != null)
              _buildInfoRow('Email', widget.patient.email!),
            if (widget.patient.surgeryType != null)
              _buildInfoRow('Surgery Type', widget.patient.surgeryType!),
            if (widget.patient.age != null)
              _buildInfoRow('Age', widget.patient.age.toString()),
            if (widget.patient.gender != null)
              _buildInfoRow('Gender', widget.patient.gender!),
            if (widget.patient.address != null)
              _buildInfoRow('Address', widget.patient.address!),
            if (widget.patient.bloodGroup != null)
              _buildInfoRow('Blood Group', widget.patient.bloodGroup!),
            if (widget.patient.totalSessions != null) ...[
              const Divider(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildStatItem(
                    'Total',
                    widget.patient.totalSessions.toString(),
                    Icons.event,
                  ),
                  _buildStatItem(
                    'Completed',
                    widget.patient.completedSessions?.toString() ?? '0',
                    Icons.check_circle,
                    Colors.green,
                  ),
                  _buildStatItem(
                    'Upcoming',
                    widget.patient.upcomingSessions?.toString() ?? '0',
                    Icons.schedule,
                    Colors.orange,
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon, [Color? color]) {
    return Column(
      children: [
        Icon(icon, color: color ?? Colors.blue, size: 24),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: color ?? Colors.blue,
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

  Widget _buildFilterChips() {
    return SingleChildScrollView(
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
          session.surgeryType ?? 'Session',
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
    
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
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
          ],
        ),
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

