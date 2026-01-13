import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/bottom_nav_bar.dart';
import 'patient_profile_screen.dart';
import 'doctor_profile_screen.dart';
import 'physiotherapist_profile_screen.dart';

class UserProfileScreen extends StatelessWidget {
  const UserProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;

    if (user == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Profile')),
        body: const Center(
          child: Text('Please login to view profile'),
        ),
        bottomNavigationBar: const BottomNavBar(currentIndex: 3),
      );
    }

    // Check if profile is completed - if not, redirect to role selection
    if (user.profileCompleted == false) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        context.go('/role-selection');
      });
      return Scaffold(
        appBar: AppBar(title: const Text('Profile')),
        body: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    // Route to role-specific profile
    if (user.isPatient) {
      return const PatientProfileScreen();
    } else if (user.isDoctor) {
      return const DoctorProfileScreen();
    } else if (user.isPhysiotherapist) {
      return const PhysiotherapistProfileScreen();
    }

    // Default profile view
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          CircleAvatar(
            radius: 50,
            backgroundColor: const Color(0xFF0066CC),
            backgroundImage: user.avatar != null
                ? NetworkImage(user.avatar!)
                : null,
            child: user.avatar == null
                ? Text(
                    user.fullName?.substring(0, 1).toUpperCase() ?? 'U',
                    style: const TextStyle(fontSize: 36, color: Colors.white),
                  )
                : null,
          ),
          const SizedBox(height: 16),
          Text(
            user.fullName ?? 'User',
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
          if (user.email != null) ...[
            const SizedBox(height: 8),
            Text(
              user.email!,
              style: TextStyle(color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
          ],
          if (user.phoneNumber != null) ...[
            const SizedBox(height: 8),
            Text(
              user.phoneNumber!,
              style: TextStyle(color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
      bottomNavigationBar: const BottomNavBar(currentIndex: 3),
    );
  }
}

