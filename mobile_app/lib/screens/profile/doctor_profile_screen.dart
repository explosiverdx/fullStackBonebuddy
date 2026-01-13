import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../services/doctor_service.dart';
import '../../services/referral_service.dart';
import '../../models/patient_model.dart';
import '../../models/session_model.dart';
import '../../models/referral_model.dart';
import '../../utils/helpers.dart';
import '../../widgets/bottom_nav_bar.dart';
import 'profile_completion_form_screen.dart';

class DoctorProfileScreen extends StatefulWidget {
  const DoctorProfileScreen({super.key});

  @override
  State<DoctorProfileScreen> createState() => _DoctorProfileScreenState();
}

class _DoctorProfileScreenState extends State<DoctorProfileScreen> with SingleTickerProviderStateMixin {
  final DoctorService _doctorService = DoctorService();
  final ReferralService _referralService = ReferralService();
  final TextEditingController _searchController = TextEditingController();
  
  late TabController _tabController;
  List<PatientModel> _patients = [];
  List<PatientModel> _filteredPatients = [];
  List<SessionModel> _sessions = [];
  List<ReferralModel> _referrals = [];
  List<ReferralModel> _filteredReferrals = [];
  Map<String, dynamic> _stats = {};
  bool _isLoading = true;
  bool _isLoadingReferrals = false;
  String _selectedFilter = 'all'; // all, knee, spinal, hip, ankle, elbow, wrist, shoulder, trauma, sports, neuro
  String _selectedReferralFilter = 'all'; // all, pending, contacted, registered, rejected

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _tabController.addListener(() {
      if (_tabController.index == 3 && _referrals.isEmpty) {
        _loadReferrals();
      }
    });
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
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      
      // Check if user is a doctor
      if (user == null || !user.isDoctor) {
        setState(() => _isLoading = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('You must be logged in as a doctor to view this profile'),
              backgroundColor: Colors.red,
            ),
          );
        }
        return;
      }
      
      final data = await _doctorService.getMyPatientsAndSessions();
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
        String errorMessage = 'Error loading data';
        if (e.toString().contains('403') || e.toString().contains('Forbidden')) {
          errorMessage = 'Access denied. Please ensure you are logged in as a doctor and have a doctor profile created.';
        } else {
          errorMessage = 'Error loading data: ${e.toString()}';
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
            appBar: AppBar(title: const Text('Doctor Profile')),
            body: const Center(child: CircularProgressIndicator()),
          );
        }
        
        // Check profileCompleted explicitly - must be true (not null, not false)
        if (user.profileCompleted != true) {
          return const ProfileCompletionFormScreen(role: 'doctor');
        }
        
        // Profile is completed, show actual profile view
        return _buildProfileView(user);
      },
    );
  }
  
  Widget _buildProfileView(user) {

    return Scaffold(
      appBar: AppBar(
        title: const Text('Doctor Profile'),
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
            Tab(text: 'Referrals', icon: Icon(Icons.assignment)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            color: Colors.white,
            onPressed: () {
              context.push('/profile/doctor/edit');
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
                _buildReferralsTab(),
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
                            user?.fullName?.substring(0, 1).toUpperCase() ?? 'D',
                            style: const TextStyle(fontSize: 36, color: Colors.white),
                          )
                        : null,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    user?.fullName ?? 'Doctor',
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

  Future<void> _loadReferrals() async {
    setState(() => _isLoadingReferrals = true);
    try {
      final referrals = await _referralService.getMyReferrals();
      setState(() {
        _referrals = referrals;
        _applyReferralFilters();
        _isLoadingReferrals = false;
      });
    } catch (e) {
      setState(() => _isLoadingReferrals = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading referrals: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _applyReferralFilters() {
    setState(() {
      if (_selectedReferralFilter == 'all') {
        _filteredReferrals = _referrals;
      } else {
        _filteredReferrals = _referrals.where((r) => r.status == _selectedReferralFilter).toList();
      }
      // Sort by date (most recent first)
      _filteredReferrals.sort((a, b) {
        final dateA = a.createdAt ?? DateTime(1970);
        final dateB = b.createdAt ?? DateTime(1970);
        return dateB.compareTo(dateA);
      });
    });
  }

  Widget _buildReferralsTab() {
    return Column(
      children: [
        // Header with Create button
        Container(
          padding: const EdgeInsets.all(16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'My Referrals',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              ElevatedButton.icon(
                onPressed: () => _showCreateReferralDialog(),
                icon: const Icon(Icons.add, size: 18),
                label: const Text('New Referral'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0066CC),
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
        ),
        
        // Filter Chips
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          height: 50,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              _buildReferralFilterChip('All', 'all'),
              const SizedBox(width: 8),
              _buildReferralFilterChip('Pending', 'pending'),
              const SizedBox(width: 8),
              _buildReferralFilterChip('Contacted', 'contacted'),
              const SizedBox(width: 8),
              _buildReferralFilterChip('Registered', 'registered'),
              const SizedBox(width: 8),
              _buildReferralFilterChip('Rejected', 'rejected'),
            ],
          ),
        ),
        
        const Divider(height: 1),
        
        // Referrals List
        Expanded(
          child: _isLoadingReferrals
              ? const Center(child: CircularProgressIndicator())
              : _referrals.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.assignment_outlined, size: 64, color: Colors.grey),
                          const SizedBox(height: 16),
                          const Text(
                            'No referrals found',
                            style: TextStyle(fontSize: 18, color: Colors.grey),
                          ),
                          const SizedBox(height: 8),
                          ElevatedButton.icon(
                            onPressed: () => _showCreateReferralDialog(),
                            icon: const Icon(Icons.add),
                            label: const Text('Create First Referral'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF0066CC),
                              foregroundColor: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    )
                  : _filteredReferrals.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.filter_list_off, size: 64, color: Colors.grey),
                              const SizedBox(height: 16),
                              const Text(
                                'No referrals match the filter',
                                style: TextStyle(fontSize: 18, color: Colors.grey),
                              ),
                            ],
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: _loadReferrals,
                          child: ListView.builder(
                            padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
                            itemCount: _filteredReferrals.length,
                            itemBuilder: (context, index) {
                              final referral = _filteredReferrals[index];
                              return _buildReferralCard(referral);
                            },
                          ),
                        ),
        ),
      ],
    );
  }

  Widget _buildReferralFilterChip(String label, String value) {
    final isSelected = _selectedReferralFilter == value;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          _selectedReferralFilter = value;
          _applyReferralFilters();
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

  Widget _buildReferralCard(ReferralModel referral) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: _getReferralStatusColor(referral.status),
          child: Icon(
            referral.isRegistered
                ? Icons.check_circle
                : referral.isContacted
                    ? Icons.phone
                    : referral.isRejected
                        ? Icons.cancel
                        : Icons.pending,
            color: Colors.white,
          ),
        ),
        title: Text(
          referral.patientName ?? 'Unknown Patient',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (referral.patientPhone != null)
              Text(
                'Phone: ${referral.patientPhone}',
                style: const TextStyle(fontSize: 12),
              ),
            if (referral.condition != null)
              Text(
                'Condition: ${referral.condition}',
                style: const TextStyle(fontSize: 12, color: Colors.grey),
              ),
            if (referral.surgeryType != null)
              Text(
                'Surgery: ${referral.surgeryType}',
                style: const TextStyle(fontSize: 12, color: Colors.grey),
              ),
            if (referral.createdAt != null)
              Text(
                'Referred: ${Helpers.formatDate(referral.createdAt)}',
                style: const TextStyle(fontSize: 12, color: Colors.blue),
              ),
          ],
        ),
        trailing: Chip(
          label: Text(
            referral.status ?? 'pending',
            style: const TextStyle(fontSize: 10),
          ),
          backgroundColor: _getReferralStatusColor(referral.status),
          labelStyle: const TextStyle(color: Colors.white),
          padding: const EdgeInsets.symmetric(horizontal: 4),
        ),
        onTap: () => _showReferralDetails(referral),
      ),
    );
  }

  Color _getReferralStatusColor(String? status) {
    switch (status) {
      case 'registered':
        return Colors.green;
      case 'contacted':
        return Colors.blue;
      case 'pending':
        return Colors.orange;
      case 'rejected':
        return Colors.red;
      default:
        return Colors.grey[300]!;
    }
  }

  void _showReferralDetails(ReferralModel referral) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Referral Details'),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildDetailRow('Patient Name', referral.patientName),
              _buildDetailRow('Phone', referral.patientPhone),
              if (referral.patientEmail != null)
                _buildDetailRow('Email', referral.patientEmail),
              if (referral.patientAge != null)
                _buildDetailRow('Age', referral.patientAge.toString()),
              if (referral.patientGender != null)
                _buildDetailRow('Gender', referral.patientGender),
              _buildDetailRow('Condition', referral.condition),
              if (referral.surgeryType != null)
                _buildDetailRow('Surgery Type', referral.surgeryType),
              if (referral.surgeryDate != null)
                _buildDetailRow('Surgery Date', Helpers.formatDate(referral.surgeryDate)),
              if (referral.notes != null && referral.notes!.isNotEmpty)
                _buildDetailRow('Notes', referral.notes),
              _buildDetailRow('Status', referral.status?.toUpperCase() ?? 'PENDING'),
              if (referral.createdAt != null)
                _buildDetailRow('Referred On', Helpers.formatDate(referral.createdAt)),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String? value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              '$label:',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            child: Text(value ?? 'N/A'),
          ),
        ],
      ),
    );
  }

  void _showCreateReferralDialog() {
    final formKey = GlobalKey<FormState>();
    final nameController = TextEditingController();
    final phoneController = TextEditingController();
    final emailController = TextEditingController();
    final ageController = TextEditingController();
    final conditionController = TextEditingController();
    final surgeryTypeController = TextEditingController();
    final notesController = TextEditingController();
    String? selectedGender;
    DateTime? selectedSurgeryDate;
    bool isSubmitting = false;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Create New Referral'),
          content: SingleChildScrollView(
            child: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextFormField(
                    controller: nameController,
                    decoration: const InputDecoration(
                      labelText: 'Patient Name *',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) =>
                        value == null || value.isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: phoneController,
                    decoration: const InputDecoration(
                      labelText: 'Patient Phone *',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.phone,
                    validator: (value) =>
                        value == null || value.isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: emailController,
                    decoration: const InputDecoration(
                      labelText: 'Patient Email',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.emailAddress,
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: ageController,
                          decoration: const InputDecoration(
                            labelText: 'Age',
                            border: OutlineInputBorder(),
                          ),
                          keyboardType: TextInputType.number,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: selectedGender,
                          decoration: const InputDecoration(
                            labelText: 'Gender',
                            border: OutlineInputBorder(),
                          ),
                          items: ['Male', 'Female', 'Other']
                              .map((gender) => DropdownMenuItem(
                                    value: gender,
                                    child: Text(gender),
                                  ))
                              .toList(),
                          onChanged: (value) {
                            setDialogState(() {
                              selectedGender = value;
                            });
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: conditionController,
                    decoration: const InputDecoration(
                      labelText: 'Condition *',
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 2,
                    validator: (value) =>
                        value == null || value.isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: surgeryTypeController,
                    decoration: const InputDecoration(
                      labelText: 'Surgery Type',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  InkWell(
                    onTap: () async {
                      final date = await showDatePicker(
                        context: context,
                        initialDate: DateTime.now(),
                        firstDate: DateTime(2000),
                        lastDate: DateTime(2100),
                      );
                      if (date != null) {
                        setDialogState(() {
                          selectedSurgeryDate = date;
                        });
                      }
                    },
                    child: InputDecorator(
                      decoration: const InputDecoration(
                        labelText: 'Surgery Date',
                        border: OutlineInputBorder(),
                        suffixIcon: Icon(Icons.calendar_today),
                      ),
                      child: Text(
                        selectedSurgeryDate != null
                            ? Helpers.formatDate(selectedSurgeryDate)
                            : 'Select date',
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: notesController,
                    decoration: const InputDecoration(
                      labelText: 'Notes',
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 3,
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: isSubmitting
                  ? null
                  : () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: isSubmitting
                  ? null
                  : () async {
                      if (formKey.currentState!.validate()) {
                        setDialogState(() {
                          isSubmitting = true;
                        });
                        try {
                          await _referralService.createReferral(
                            patientName: nameController.text,
                            patientPhone: phoneController.text,
                            patientEmail: emailController.text.isEmpty
                                ? null
                                : emailController.text,
                            patientAge: ageController.text.isEmpty
                                ? null
                                : int.tryParse(ageController.text),
                            patientGender: selectedGender,
                            condition: conditionController.text,
                            surgeryType: surgeryTypeController.text.isEmpty
                                ? null
                                : surgeryTypeController.text,
                            surgeryDate: selectedSurgeryDate,
                            notes: notesController.text.isEmpty
                                ? null
                                : notesController.text,
                          );
                          if (mounted) {
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Referral created successfully'),
                                backgroundColor: Colors.green,
                              ),
                            );
                            _loadReferrals();
                          }
                        } catch (e) {
                          setDialogState(() {
                            isSubmitting = false;
                          });
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Error creating referral: ${e.toString()}'),
                                backgroundColor: Colors.red,
                              ),
                            );
                          }
                        }
                      }
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0066CC),
                foregroundColor: Colors.white,
              ),
              child: isSubmitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Text('Create Referral'),
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
