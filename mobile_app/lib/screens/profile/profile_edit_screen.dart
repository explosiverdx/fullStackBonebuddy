import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../services/user_service.dart';
import 'profile_completion_form_screen.dart';

class ProfileEditScreen extends StatefulWidget {
  final String role; // 'patient', 'doctor', 'physio'

  const ProfileEditScreen({
    super.key,
    required this.role,
  });

  @override
  State<ProfileEditScreen> createState() => _ProfileEditScreenState();
}

class _ProfileEditScreenState extends State<ProfileEditScreen> {
  final _userService = UserService();
  bool _isLoading = true;
  dynamic _user;

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    try {
      // Fetch fresh user data from API to get complete profile
      final user = await _userService.getCurrentUser();
      setState(() {
        _user = user;
        _isLoading = false;
      });
    } catch (e) {
      // If API call fails, use the user from provider
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      setState(() {
        _user = authProvider.user;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Edit Profile'),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () {
              final authProvider = Provider.of<AuthProvider>(context, listen: false);
              final user = authProvider.user;
              // Navigate back to the appropriate profile screen
              if (user != null) {
                if (user.isPatient) {
                  context.go('/profile/patient');
                } else if (user.isDoctor) {
                  context.go('/profile/doctor');
                } else if (user.isPhysiotherapist) {
                  context.go('/profile/physiotherapist');
                } else {
                  context.pop();
                }
              } else {
                context.pop();
              }
            },
          ),
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    // ProfileCompletionFormScreen has its own Scaffold with AppBar
    // So we just return it directly
    return ProfileCompletionFormScreen(
      role: widget.role,
      isEditMode: true,
      existingUser: _user,
    );
  }
}

