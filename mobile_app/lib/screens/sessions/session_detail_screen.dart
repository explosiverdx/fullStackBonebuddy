import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/session_model.dart';
import '../../models/user_model.dart';
import '../../providers/auth_provider.dart';
import '../../services/session_service.dart';
import '../../utils/helpers.dart';
import '../../widgets/bottom_nav_bar.dart';

class SessionDetailScreen extends StatefulWidget {
  final SessionModel session;
  
  const SessionDetailScreen({super.key, required this.session});

  @override
  State<SessionDetailScreen> createState() => _SessionDetailScreenState();
}

class _SessionDetailScreenState extends State<SessionDetailScreen> {
  final SessionService _sessionService = SessionService();
  final TextEditingController _startOtpController = TextEditingController();
  final TextEditingController _endOtpController = TextEditingController();
  final TextEditingController _notesController = TextEditingController();
  bool _startOtpSent = false;
  bool _endOtpSent = false;
  bool _isLoading = false;
  SessionModel? _currentSession;

  @override
  void initState() {
    super.initState();
    _currentSession = widget.session;
  }

  @override
  void dispose() {
    _startOtpController.dispose();
    _endOtpController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _refreshSession() async {
    try {
      final updatedSession = await _sessionService.getSessionById(_currentSession!.id);
      setState(() {
        _currentSession = updatedSession;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error refreshing session: $e')),
        );
      }
    }
  }

  Future<void> _sendStartOtp() async {
    setState(() => _isLoading = true);
    try {
      await _sessionService.sendSessionStartOtp(_currentSession!.id);
      setState(() {
        _startOtpSent = true;
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('OTP sent to patient. Please ask patient to share the OTP.'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error sending OTP: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _startSession() async {
    if (_startOtpController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter the OTP')),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final updatedSession = await _sessionService.startSession(
        _currentSession!.id,
        _startOtpController.text.trim(),
      );
      setState(() {
        _currentSession = updatedSession;
        _startOtpSent = false;
        _startOtpController.clear();
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Session started successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error starting session: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _sendEndOtp() async {
    setState(() => _isLoading = true);
    try {
      await _sessionService.sendSessionEndOtp(_currentSession!.id);
      setState(() {
        _endOtpSent = true;
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('OTP sent to patient. Please ask patient to share the OTP.'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error sending OTP: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _endSession() async {
    if (_endOtpController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter the OTP')),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final updatedSession = await _sessionService.endSession(
        _currentSession!.id,
        _endOtpController.text.trim(),
        notes: _notesController.text.trim().isNotEmpty ? _notesController.text.trim() : null,
      );
      setState(() {
        _currentSession = updatedSession;
        _endOtpSent = false;
        _endOtpController.clear();
        _notesController.clear();
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Session ended successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error ending session: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _joinVideoSession(BuildContext context) async {
    final videoUrl = _currentSession!.videoUrl ?? _currentSession!.sessionVideo;
    if (videoUrl == null || videoUrl.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Video session URL not available')),
      );
      return;
    }

    final uri = Uri.parse(videoUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open video session')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = _currentSession ?? widget.session;
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;
    final isPhysiotherapist = user?.isPhysiotherapist ?? false;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Session Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _isLoading ? null : _refreshSession,
          ),
        ],
      ),
      body: _isLoading && _currentSession == null
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Status Card
                  Card(
                    color: session.isCompleted 
                        ? Colors.green[50] 
                        : session.isActive || session.status == 'in-progress'
                            ? Colors.blue[50] 
                            : session.isPending 
                                ? Colors.orange[50] 
                                : session.isCancelled 
                                    ? Colors.red[50] 
                                    : Colors.grey[50],
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Icon(
                            session.isCompleted 
                                ? Icons.check_circle 
                                : session.isActive || session.status == 'in-progress'
                                    ? Icons.video_call 
                                    : session.isPending 
                                        ? Icons.schedule 
                                        : Icons.cancel,
                            size: 48,
                            color: session.isCompleted 
                                ? Colors.green 
                                : session.isActive || session.status == 'in-progress'
                                    ? Colors.blue 
                                    : session.isPending 
                                        ? Colors.orange 
                                        : Colors.red,
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  session.status?.toUpperCase() ?? 'UNKNOWN',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: session.isCompleted 
                                        ? Colors.green[900] 
                                        : session.isActive || session.status == 'in-progress'
                                            ? Colors.blue[900] 
                                            : session.isPending 
                                                ? Colors.orange[900] 
                                                : Colors.red[900],
                                  ),
                                ),
                                if (session.displayDate != null)
                                  Text(
                                    Helpers.formatDate(session.displayDate),
                                    style: const TextStyle(fontSize: 14),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Session Information
                  if (session.physiotherapistName != null)
                    _buildInfoRow('Physiotherapist', session.physiotherapistName!),
                  if (session.doctorName != null)
                    _buildInfoRow('Doctor', session.doctorName!),
                  if (session.surgeryType != null)
                    _buildInfoRow('Surgery Type', session.surgeryType!),
                  if (session.durationMinutes != null)
                    _buildInfoRow('Duration', '${session.durationMinutes} minutes'),
                  if (session.startTime != null)
                    _buildInfoRow('Start Time', Helpers.formatDate(session.startTime)),
                  if (session.endTime != null)
                    _buildInfoRow('End Time', Helpers.formatDate(session.endTime)),
                  
                  // Physiotherapist Controls: Start Session with OTP
                  if (isPhysiotherapist && (session.isPending || session.status == 'scheduled')) ...[
                    const SizedBox(height: 24),
                    Card(
                      color: Colors.blue[50],
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Start Session',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'Send OTP to patient to start the session. Patient will receive OTP on their phone.',
                              style: TextStyle(fontSize: 14, color: Colors.grey),
                            ),
                            const SizedBox(height: 16),
                            if (!_startOtpSent)
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton.icon(
                                  onPressed: _isLoading ? null : _sendStartOtp,
                                  icon: const Icon(Icons.send),
                                  label: const Text('Send OTP to Patient'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.blue,
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    foregroundColor: Colors.white,
                                  ),
                                ),
                              )
                            else ...[
                              TextField(
                                controller: _startOtpController,
                                decoration: InputDecoration(
                                  labelText: 'Enter OTP from Patient',
                                  hintText: '4-digit OTP',
                                  border: OutlineInputBorder(),
                                  prefixIcon: const Icon(Icons.lock),
                                ),
                                keyboardType: TextInputType.number,
                                maxLength: 4,
                              ),
                              const SizedBox(height: 12),
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton.icon(
                                  onPressed: _isLoading ? null : _startSession,
                                  icon: const Icon(Icons.play_arrow),
                                  label: const Text('Start Session'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.green,
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    foregroundColor: Colors.white,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 8),
                              TextButton(
                                onPressed: () {
                                  setState(() {
                                    _startOtpSent = false;
                                    _startOtpController.clear();
                                  });
                                },
                                child: const Text('Cancel'),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ],
                  
                  // Physiotherapist Controls: End Session with OTP
                  if (isPhysiotherapist && session.status == 'in-progress') ...[
                    const SizedBox(height: 24),
                    Card(
                      color: Colors.orange[50],
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'End Session',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'Send OTP to patient to end the session. Patient will receive OTP on their phone.',
                              style: TextStyle(fontSize: 14, color: Colors.grey),
                            ),
                            const SizedBox(height: 16),
                            if (!_endOtpSent)
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton.icon(
                                  onPressed: _isLoading ? null : _sendEndOtp,
                                  icon: const Icon(Icons.send),
                                  label: const Text('Send OTP to Patient'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.orange,
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    foregroundColor: Colors.white,
                                  ),
                                ),
                              )
                            else ...[
                              TextField(
                                controller: _endOtpController,
                                decoration: InputDecoration(
                                  labelText: 'Enter OTP from Patient',
                                  hintText: '4-digit OTP',
                                  border: OutlineInputBorder(),
                                  prefixIcon: const Icon(Icons.lock),
                                ),
                                keyboardType: TextInputType.number,
                                maxLength: 4,
                              ),
                              const SizedBox(height: 12),
                              TextField(
                                controller: _notesController,
                                decoration: const InputDecoration(
                                  labelText: 'Session Notes (Optional)',
                                  hintText: 'Add any notes about this session',
                                  border: OutlineInputBorder(),
                                  prefixIcon: Icon(Icons.note),
                                ),
                                maxLines: 3,
                              ),
                              const SizedBox(height: 12),
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton.icon(
                                  onPressed: _isLoading ? null : _endSession,
                                  icon: const Icon(Icons.stop),
                                  label: const Text('End Session'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.red,
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    foregroundColor: Colors.white,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 8),
                              TextButton(
                                onPressed: () {
                                  setState(() {
                                    _endOtpSent = false;
                                    _endOtpController.clear();
                                    _notesController.clear();
                                  });
                                },
                                child: const Text('Cancel'),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ],
                  
                  // Notes
                  if (session.notes != null && session.notes!.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    const Text(
                      'Notes',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Text(session.notes!),
                      ),
                    ),
                  ],
                  
                  const SizedBox(height: 32),
                  
                  // Video Session Button
                  if (session.canJoinVideo)
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () => _joinVideoSession(context),
                        icon: const Icon(Icons.video_call),
                        label: const Text(
                          'Join Video Session',
                          style: TextStyle(fontSize: 18),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0066CC),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ),
                  
                  // Watch Recorded Session
                  if (session.isCompleted && session.videoUrl != null && session.videoUrl!.isNotEmpty)
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () => _joinVideoSession(context),
                        icon: const Icon(Icons.play_circle_outline),
                        label: const Text(
                          'Watch Recorded Session',
                          style: TextStyle(fontSize: 18),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ),
                ],
              ),
            ),
      bottomNavigationBar: const BottomNavBar(currentIndex: 3),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
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
              style: const TextStyle(fontSize: 16),
            ),
          ),
        ],
      ),
    );
  }
}

