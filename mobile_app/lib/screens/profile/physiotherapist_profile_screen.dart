import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../services/physio_service.dart';
import '../../models/patient_model.dart';
import '../../models/session_model.dart';
import '../../utils/helpers.dart';
import '../../widgets/bottom_nav_bar.dart';
import 'profile_completion_form_screen.dart';

class PhysiotherapistProfileScreen extends StatefulWidget {
  const PhysiotherapistProfileScreen({super.key});

  @override
  State<PhysiotherapistProfileScreen> createState() => _PhysiotherapistProfileScreenState();
}

class _PhysiotherapistProfileScreenState extends State<PhysiotherapistProfileScreen> with SingleTickerProviderStateMixin {
  final PhysioService _physioService = PhysioService();
  final TextEditingController _searchController = TextEditingController();
  
  late TabController _tabController;
  List<PatientModel> _patients = [];
  List<PatientModel> _filteredPatients = [];
  List<SessionModel> _sessions = [];
  Map<String, dynamic> _stats = {};
  bool _isLoading = true;
  String _selectedFilter = 'all'; // all, knee, spinal, hip, ankle, elbow, wrist, shoulder, trauma, sports, neuro

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _checkProfileCompletion();
  }

  void _checkProfileCompletion() {
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      // Force refresh user data from API to get latest status
      await authProvider.refreshUser();
      final user = authProvider.user;
      
      if (user == null || user.profileCompleted == false) {
        // Show profile completion form instead of redirecting
        setState(() {
          _isLoading = false;
        });
      } else {
        _loadData();
      }
    });
  }
  
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Refresh user data when screen is shown
    _refreshUserData();
  }

  Future<void> _refreshUserData() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    await authProvider.refreshUser();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final data = await _physioService.getMyPatientsAndSessions();
      setState(() {
        _patients = data['patients'] as List<PatientModel>;
        _sessions = data['sessions'] as List<SessionModel>;
        _stats = data['stats'] as Map<String, dynamic>;
        _applyPatientFilters();
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading data: ${e.toString()}')),
        );
      }
    }
  }

  void _applyPatientFilters() {
    final searchQuery = _searchController.text.toLowerCase().trim();
    
    setState(() {
      _filteredPatients = _patients.where((patient) {
        // Apply search filter
        if (searchQuery.isNotEmpty) {
          final nameMatch = patient.name?.toLowerCase().contains(searchQuery) ?? false;
          final emailMatch = patient.email?.toLowerCase().contains(searchQuery) ?? false;
          final phoneMatch = patient.mobileNumber?.contains(searchQuery) ?? false;
          final surgeryMatch = patient.surgeryType?.toLowerCase().contains(searchQuery) ?? false;
          
          if (!nameMatch && !emailMatch && !phoneMatch && !surgeryMatch) {
            return false;
          }
        }
        
        // Apply surgery type filter
        if (_selectedFilter != 'all') {
          final patientSurgeryType = patient.surgeryType?.toLowerCase().trim() ?? '';
          final filterType = _selectedFilter.toLowerCase();
          
          // Map filter types to common surgery type variations
          bool matchesFilter = false;
          
          switch (_selectedFilter) {
            case 'knee':
              matchesFilter = patientSurgeryType.contains('knee') || 
                             patientSurgeryType.contains('knee replacement');
              break;
            case 'spinal':
              matchesFilter = patientSurgeryType.contains('spine') || 
                             patientSurgeryType.contains('spinal') ||
                             patientSurgeryType.contains('spine surgery');
              break;
            case 'hip':
              matchesFilter = patientSurgeryType.contains('hip') || 
                             patientSurgeryType.contains('hip replacement');
              break;
            case 'ankle':
              matchesFilter = patientSurgeryType.contains('ankle');
              break;
            case 'elbow':
              matchesFilter = patientSurgeryType.contains('elbow');
              break;
            case 'wrist':
              matchesFilter = patientSurgeryType.contains('wrist');
              break;
            case 'shoulder':
              matchesFilter = patientSurgeryType.contains('shoulder');
              break;
            case 'trauma':
              matchesFilter = patientSurgeryType.contains('trauma') || 
                             patientSurgeryType.contains('fracture') ||
                             patientSurgeryType.contains('injury');
              break;
            case 'sports':
              matchesFilter = patientSurgeryType.contains('sport') || 
                             patientSurgeryType.contains('athletic');
              break;
            case 'neuro':
              matchesFilter = patientSurgeryType.contains('neuro') || 
                             patientSurgeryType.contains('neurological');
              break;
            case 'all':
            default:
              matchesFilter = true;
              break;
          }
          
          if (!matchesFilter) return false;
        }
        
        return true;
      }).toList();
      
      // Sort by name
      _filteredPatients.sort((a, b) {
        final nameA = a.name ?? '';
        final nameB = b.name ?? '';
        return nameA.compareTo(nameB);
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, _) {
        final user = authProvider.user;

        // Show profile completion form if profile is not completed
        if (user == null) {
          return Scaffold(
            appBar: AppBar(title: const Text('Physiotherapist Profile')),
            body: const Center(child: CircularProgressIndicator()),
          );
        }
        
        // Check profileCompleted explicitly - must be true (not null, not false)
        if (user.profileCompleted != true) {
          return const ProfileCompletionFormScreen(role: 'physio');
        }
        
        // Profile is completed, show actual profile view
        return _buildProfileView(user);
      },
    );
  }
  
  Widget _buildProfileView(user) {

    return Scaffold(
      appBar: AppBar(
        title: const Text('Physiotherapist Profile'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: Colors.white,
          indicatorWeight: 3,
          tabs: const [
            Tab(text: 'Overview', icon: Icon(Icons.dashboard)),
            Tab(text: 'Patients', icon: Icon(Icons.people)),
            Tab(text: 'Sessions', icon: Icon(Icons.event)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            color: Colors.white,
            onPressed: () {
              context.push('/profile/physiotherapist/edit');
            },
            tooltip: 'Edit Profile',
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            color: Colors.white,
            onPressed: _loadData,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildOverviewTab(user),
                _buildPatientsTab(),
                _buildSessionsTab(),
              ],
      ),
      bottomNavigationBar: const BottomNavBar(currentIndex: 3),
    );
  }

  Widget _buildOverviewTab(user) {
    final totalPatients = _stats['totalPatients'] ?? _patients.length;
    final totalSessions = _stats['totalSessions'] ?? _sessions.length;
    final upcomingSessions = _stats['upcomingSessions'] ?? _sessions.where((s) => s.isPending || s.isActive).length;
    final completedSessions = _stats['completedSessions'] ?? _sessions.where((s) => s.isCompleted).length;
    
    return RefreshIndicator(
      onRefresh: _loadData,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Profile Header
            Center(
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 50,
                    backgroundColor: const Color(0xFF0066CC),
                    backgroundImage: user?.avatar != null
                        ? NetworkImage(user!.avatar!)
                        : null,
                    child: user?.avatar == null
                        ? Text(
                            user?.fullName?.substring(0, 1).toUpperCase() ?? 'P',
                            style: const TextStyle(fontSize: 36, color: Colors.white),
                          )
                        : null,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    user?.fullName ?? 'Physiotherapist',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (user?.email != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      user!.email!,
                      style: const TextStyle(color: Colors.grey),
                    ),
                  ],
                ],
              ),
            ),
            
            const SizedBox(height: 32),
            
            // Stats Cards
            Row(
              children: [
                Expanded(
                  child: _buildStatCard(
                    'Patients',
                    totalPatients.toString(),
                    Icons.people,
                    Colors.blue,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildStatCard(
                    'Sessions',
                    totalSessions.toString(),
                    Icons.event,
                    Colors.green,
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 12),
            
            Row(
              children: [
                Expanded(
                  child: _buildStatCard(
                    'Upcoming',
                    upcomingSessions.toString(),
                    Icons.schedule,
                    Colors.orange,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildStatCard(
                    'Completed',
                    completedSessions.toString(),
                    Icons.check_circle,
                    Colors.purple,
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 24),
            
            // Quick Actions
            Card(
              elevation: 2,
              child: InkWell(
                onTap: () {
                  context.push('/sessions');
                },
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      const Icon(Icons.event, color: Color(0xFF0066CC), size: 32),
                      const SizedBox(width: 16),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'View All Sessions',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              'See all sessions with filters',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.arrow_forward, color: Color(0xFF0066CC)),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Icon(icon, size: 32, color: color),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              label,
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPatientsTab() {
    return Column(
      children: [
        // Search Bar
        Container(
          padding: const EdgeInsets.all(16),
          child: TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Search patients by name, email, phone, or surgery type...',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        setState(() {
                          _searchController.clear();
                          _applyPatientFilters();
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
                _applyPatientFilters();
              });
            },
          ),
        ),
        
        // Filter Chips
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          height: 50,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              _buildPatientFilterChip('All', 'all'),
              const SizedBox(width: 8),
              _buildPatientFilterChip('Knee', 'knee'),
              const SizedBox(width: 8),
              _buildPatientFilterChip('Spinal', 'spinal'),
              const SizedBox(width: 8),
              _buildPatientFilterChip('Hip', 'hip'),
              const SizedBox(width: 8),
              _buildPatientFilterChip('Ankle', 'ankle'),
              const SizedBox(width: 8),
              _buildPatientFilterChip('Elbow', 'elbow'),
              const SizedBox(width: 8),
              _buildPatientFilterChip('Wrist', 'wrist'),
              const SizedBox(width: 8),
              _buildPatientFilterChip('Shoulder', 'shoulder'),
              const SizedBox(width: 8),
              _buildPatientFilterChip('Trauma', 'trauma'),
              const SizedBox(width: 8),
              _buildPatientFilterChip('Sports', 'sports'),
              const SizedBox(width: 8),
              _buildPatientFilterChip('Neuro', 'neuro'),
            ],
          ),
        ),
        
        const Divider(height: 1),
        
        // Patients Count
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${_filteredPatients.length} ${_filteredPatients.length == 1 ? 'patient' : 'patients'}',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey,
                ),
              ),
              if (_searchController.text.isNotEmpty || _selectedFilter != 'all')
                TextButton.icon(
                  onPressed: () {
                    _searchController.clear();
                    setState(() {
                      _selectedFilter = 'all';
                    });
                    _applyPatientFilters();
                  },
                  icon: const Icon(Icons.clear_all, size: 16),
                  label: const Text('Clear filters'),
                  style: TextButton.styleFrom(
                    foregroundColor: const Color(0xFF0066CC),
                  ),
                ),
            ],
          ),
        ),
        
        // Patients List
        Expanded(
          child: _patients.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.people_outline, size: 64, color: Colors.grey),
                      const SizedBox(height: 16),
                      const Text(
                        'No patients found',
                        style: TextStyle(fontSize: 18, color: Colors.grey),
                      ),
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: _loadData,
                        style: TextButton.styleFrom(
                          foregroundColor: const Color(0xFF0066CC),
                        ),
                        child: const Text('Refresh'),
                      ),
                    ],
                  ),
                )
              : _filteredPatients.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.search_off, size: 64, color: Colors.grey),
                          const SizedBox(height: 16),
                          const Text(
                            'No patients match your search',
                            style: TextStyle(fontSize: 18, color: Colors.grey),
                          ),
                          const SizedBox(height: 8),
                          TextButton(
                            onPressed: () {
                              _searchController.clear();
                              setState(() {
                                _selectedFilter = 'all';
                              });
                              _applyPatientFilters();
                            },
                            style: TextButton.styleFrom(
                              foregroundColor: const Color(0xFF0066CC),
                            ),
                            child: const Text('Clear filters'),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadData,
                      child: ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
                        itemCount: _filteredPatients.length,
                        itemBuilder: (context, index) {
                          final patient = _filteredPatients[index];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: const Color(0xFF0066CC),
                child: Text(
                  patient.name?.substring(0, 1).toUpperCase() ?? 'P',
                  style: const TextStyle(color: Colors.white),
                ),
              ),
              title: Text(
                patient.name ?? 'Unknown Patient',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (patient.mobileNumber != null)
                    Text(
                      'Phone: ${patient.mobileNumber}',
                      style: const TextStyle(fontSize: 12),
                    ),
                  if (patient.surgeryType != null)
                    Text(
                      'Surgery: ${patient.surgeryType}',
                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                  if (patient.totalSessions != null)
                    Text(
                      'Sessions: ${patient.completedSessions ?? 0}/${patient.totalSessions} completed',
                      style: const TextStyle(fontSize: 12, color: Colors.blue),
                    ),
                ],
              ),
              trailing: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  if (patient.upcomingSessions != null && patient.upcomingSessions! > 0)
                    Chip(
                      label: Text(
                        '${patient.upcomingSessions} upcoming',
                        style: const TextStyle(fontSize: 10),
                      ),
                      backgroundColor: Colors.orange[100],
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                    ),
                ],
              ),
              onTap: () {
                context.push(
                  '/patients/${patient.id}',
                  extra: patient,
                );
              },
            ),
          );
        },
                      ),
                    ),
        ),
      ],
    );
  }

  Widget _buildPatientFilterChip(String label, String value) {
    final isSelected = _selectedFilter == value;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          _selectedFilter = value;
          _applyPatientFilters();
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

  Widget _buildSessionsTab() {
    return Column(
      children: [
        // Header with "View All" button
        Container(
          padding: const EdgeInsets.all(16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Recent Sessions',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              TextButton.icon(
                onPressed: () {
                  context.push('/sessions');
                },
                icon: const Icon(Icons.arrow_forward, size: 18),
                label: const Text('View All'),
                style: TextButton.styleFrom(
                  foregroundColor: const Color(0xFF0066CC),
                ),
              ),
            ],
          ),
        ),
        
        // Sessions List
        Expanded(
          child: _sessions.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.event_busy, size: 64, color: Colors.grey),
                      const SizedBox(height: 16),
                      const Text(
                        'No sessions found',
                        style: TextStyle(fontSize: 18, color: Colors.grey),
                      ),
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: _loadData,
                        style: TextButton.styleFrom(
                          foregroundColor: const Color(0xFF0066CC),
                        ),
                        child: const Text('Refresh'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadData,
                  child: ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 80),
                    itemCount: _sessions.length > 10 ? 10 : _sessions.length, // Show only first 10
                    itemBuilder: (context, index) {
                      final session = _sessions[index];
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
                              _loadData();
                            }
                          },
                        ),
                      );
                    },
                  ),
                ),
        ),
      ],
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
