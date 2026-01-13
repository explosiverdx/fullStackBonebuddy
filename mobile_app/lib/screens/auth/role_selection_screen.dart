import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import 'package:provider/provider.dart';

class RoleSelectionScreen extends StatefulWidget {
  const RoleSelectionScreen({super.key});

  @override
  State<RoleSelectionScreen> createState() => _RoleSelectionScreenState();
}

class _RoleSelectionScreenState extends State<RoleSelectionScreen> {
  String? _selectedRole;
  bool _isLoading = false;

  final List<Map<String, dynamic>> _roles = [
    {
      'value': 'patient',
      'label': 'Patient',
      'icon': Icons.person,
      'color': const Color(0xFF0066CC),
    },
    {
      'value': 'doctor',
      'label': 'Doctor',
      'icon': Icons.medical_services,
      'color': const Color(0xFF00AA44),
    },
    {
      'value': 'physio',
      'label': 'Physiotherapist',
      'icon': Icons.fitness_center,
      'color': const Color(0xFFFF6600),
    },
  ];

  void _handleRoleSelection() {
    if (_selectedRole == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a role')),
      );
      return;
    }

    if (!mounted) return;

    setState(() => _isLoading = true);

    // Navigate to the appropriate profile screen based on selected role
    // The profile screens will show the completion form if profile is not completed
    String route;
    if (_selectedRole == 'patient') {
      route = '/profile/patient';
    } else if (_selectedRole == 'doctor') {
      route = '/profile/doctor';
    } else if (_selectedRole == 'physio') {
      route = '/profile/physiotherapist';
    } else {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Invalid role selected'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Use push instead of go to allow back navigation if needed
    // But since we don't want back navigation, we'll use go
    try {
      context.go(route);
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Navigation error: ${e.toString()}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Your Role'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            // Go back to login screen
            context.go('/login');
          },
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 40),
              const Icon(
                Icons.account_circle,
                size: 80,
                color: Color(0xFF0066CC),
              ),
              const SizedBox(height: 20),
              const Text(
                'Complete Your Profile',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF0066CC),
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 10),
              const Text(
                'Please select your role to continue',
                style: TextStyle(fontSize: 16, color: Colors.grey),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 40),
              
              // Role Selection Cards
              ..._roles.map((role) => Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: InkWell(
                  onTap: () {
                    setState(() {
                      _selectedRole = role['value'] as String;
                    });
                  },
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: _selectedRole == role['value']
                            ? role['color'] as Color
                            : Colors.grey.shade300,
                        width: _selectedRole == role['value'] ? 3 : 1,
                      ),
                      borderRadius: BorderRadius.circular(12),
                      color: _selectedRole == role['value']
                          ? (role['color'] as Color).withOpacity(0.1)
                          : Colors.white,
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: _selectedRole == role['value']
                                ? role['color'] as Color
                                : Colors.grey.shade200,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            role['icon'] as IconData,
                            color: _selectedRole == role['value']
                                ? Colors.white
                                : Colors.grey.shade600,
                            size: 32,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Text(
                            role['label'] as String,
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: _selectedRole == role['value']
                                  ? FontWeight.bold
                                  : FontWeight.normal,
                              color: _selectedRole == role['value']
                                  ? role['color'] as Color
                                  : Colors.black87,
                            ),
                          ),
                        ),
                        if (_selectedRole == role['value'])
                          Icon(
                            Icons.check_circle,
                            color: role['color'] as Color,
                            size: 28,
                          ),
                      ],
                    ),
                  ),
                ),
              )),
              
              const SizedBox(height: 32),
              
              // Continue Button
              ElevatedButton(
                onPressed: _isLoading ? null : _handleRoleSelection,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0066CC),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Text('Continue', style: TextStyle(fontSize: 16)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

