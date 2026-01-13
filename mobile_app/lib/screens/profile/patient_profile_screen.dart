import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../services/user_service.dart';
import '../../services/session_service.dart';
import '../../services/payment_service.dart';
import '../../models/session_model.dart';
import '../../models/payment_model.dart';
import '../../utils/helpers.dart';
import '../../widgets/bottom_nav_bar.dart';
import 'profile_completion_form_screen.dart';

class PatientProfileScreen extends StatefulWidget {
  const PatientProfileScreen({super.key});

  @override
  State<PatientProfileScreen> createState() => _PatientProfileScreenState();
}

class _PatientProfileScreenState extends State<PatientProfileScreen> with SingleTickerProviderStateMixin {
  final SessionService _sessionService = SessionService();
  final PaymentService _paymentService = PaymentService();
  
  late TabController _tabController;
  List<SessionModel> _sessions = [];
  List<PaymentModel> _payments = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _checkProfileCompletion();
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

  void _checkProfileCompletion() {
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      // Force refresh user data from API to get latest status
      await authProvider.refreshUser();
      final user = authProvider.user;
      
      if (user == null || user.profileCompleted == false) {
        // Show profile completion form instead of redirecting
        // The form will be shown in the build method
        setState(() {
          _isLoading = false;
        });
      } else {
        _loadData();
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final sessions = await _sessionService.getUserSessions();
      final payments = await _paymentService.getUserPayments();
      setState(() {
        _sessions = sessions;
        _payments = payments;
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

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, _) {
        final user = authProvider.user;

        // Show profile completion form if profile is not completed
        if (user == null) {
          return Scaffold(
            appBar: AppBar(title: const Text('Patient Profile')),
            body: const Center(child: CircularProgressIndicator()),
          );
        }
        
        // Check profileCompleted explicitly - must be true (not null, not false)
        if (user.profileCompleted != true) {
          return const ProfileCompletionFormScreen(role: 'patient');
        }
        
        // Profile is completed, show actual profile view
        return _buildProfileView(user);
      },
    );
  }
  
  Widget _buildProfileView(user) {

    return Scaffold(
      appBar: AppBar(
        title: const Text('Patient Profile'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: Colors.white,
          indicatorWeight: 3,
          tabs: const [
            Tab(text: 'Overview', icon: Icon(Icons.dashboard)),
            Tab(text: 'Sessions', icon: Icon(Icons.event)),
            Tab(text: 'Reports', icon: Icon(Icons.description)),
            Tab(text: 'Payments', icon: Icon(Icons.payment)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            color: Colors.white,
            onPressed: () {
              context.push('/profile/patient/edit');
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
                _buildSessionsTab(),
                _buildReportsTab(),
                _buildPaymentsTab(),
              ],
            ),
      bottomNavigationBar: const BottomNavBar(currentIndex: 3),
    );
  }

  Widget _buildOverviewTab(user) {
    final pendingPayments = _payments.where((p) => p.isPending).length;
    final upcomingSessions = _sessions.where((s) => s.isPending || s.isActive).length;
    
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
                    user?.fullName ?? 'Patient',
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
                    'Sessions',
                    _sessions.length.toString(),
                    Icons.event,
                    Colors.blue,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildStatCard(
                    'Payments',
                    _payments.length.toString(),
                    Icons.payment,
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
                    'Pending',
                    pendingPayments.toString(),
                    Icons.pending_actions,
                    Colors.red,
                  ),
                ),
              ],
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

  Widget _buildSessionsTab() {
    if (_sessions.isEmpty) {
      return Center(
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
      );
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 80), // Extra bottom padding for bottom nav
        itemCount: _sessions.length,
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
                session.physiotherapistName ?? 'Session',
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
                mainAxisSize: MainAxisSize.min, // Prevent overflow
                children: [
                  Chip(
                    label: Text(
                      session.status ?? 'unknown',
                      style: const TextStyle(fontSize: 10),
                    ),
                    backgroundColor: _getStatusColor(session.status),
                    labelStyle: const TextStyle(color: Colors.white),
                    padding: const EdgeInsets.symmetric(horizontal: 4), // Reduce chip padding
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
    );
  }

  Widget _buildReportsTab() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.description, size: 64, color: Colors.grey),
          SizedBox(height: 16),
          Text(
            'Medical reports will be displayed here',
            style: TextStyle(fontSize: 18, color: Colors.grey),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentsTab() {
    if (_payments.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.payment, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            const Text(
              'No payments found',
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
      );
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 80), // Extra bottom padding for bottom nav
        itemCount: _payments.length,
        itemBuilder: (context, index) {
          final payment = _payments[index];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: payment.isSuccess 
                    ? Colors.green 
                    : payment.isPending 
                        ? Colors.orange 
                        : Colors.red,
                child: Icon(
                  payment.isSuccess 
                      ? Icons.check 
                      : payment.isPending 
                          ? Icons.pending 
                          : Icons.error,
                  color: Colors.white,
                ),
              ),
              title: Text(
                Helpers.formatCurrency(payment.amount),
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (payment.description != null)
                    Text(
                      payment.description!,
                      style: const TextStyle(fontSize: 12),
                    ),
                  if (payment.paidAt != null)
                    Text(
                      'Paid on ${Helpers.formatDate(payment.paidAt)}',
                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                ],
              ),
              trailing: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.end,
                mainAxisSize: MainAxisSize.min, // Prevent overflow
                children: [
                  Chip(
                    label: Text(
                      payment.status ?? 'unknown',
                      style: const TextStyle(fontSize: 10),
                    ),
                    backgroundColor: payment.isSuccess 
                        ? Colors.green[100] 
                        : payment.isPending 
                            ? Colors.orange[100] 
                            : Colors.red[100],
                    padding: const EdgeInsets.symmetric(horizontal: 4), // Reduce chip padding
                  ),
                  if (payment.canRetry)
                    const Padding(
                      padding: EdgeInsets.only(top: 4),
                      child: Icon(Icons.payment, size: 16, color: Colors.blue),
                    ),
                ],
              ),
              onTap: () async {
                final result = await context.push(
                  '/payments/${payment.id}',
                  extra: payment,
                );
                if (result == true) {
                  _loadData();
                }
              },
            ),
          );
        },
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
