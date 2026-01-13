import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import 'package:provider/provider.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeIn),
    );
    
    _controller.forward();
    
    _navigateToNext();
  }

  Future<void> _navigateToNext() async {
    await Future.delayed(const Duration(seconds: 3));
    
    if (!mounted) return;
    
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      
      // Add timeout to prevent hanging (10 seconds)
      try {
        await authProvider.checkAuthStatus().timeout(
          const Duration(seconds: 10),
        );
      } catch (e) {
        // If auth check times out or fails, navigate to login
        if (mounted) {
          context.go('/login');
          return;
        }
      }
      
      if (!mounted) return;
      
      if (authProvider.isAuthenticated) {
        // Refresh user data from API to get latest profileCompleted status
        // Add timeout here too (non-blocking - continue even if it fails)
        try {
          await authProvider.refreshUser().timeout(
            const Duration(seconds: 10),
          );
        } catch (e) {
          // If refresh fails or times out, continue with stored user data
          // This is non-blocking - we'll use whatever user data we have
        }
        
        if (!mounted) return;
        
        final user = authProvider.user;
        // Check if profile is completed
        if (user != null && user.profileCompleted == true) {
          context.go('/home');
        } else if (user != null && user.profileCompleted == false) {
          // Profile not completed, go to role selection
          context.go('/role-selection');
        } else {
          // User data not available, go to home (will be handled by router)
          context.go('/home');
        }
      } else {
        context.go('/login');
      }
    } catch (e) {
      // If any error occurs, navigate to login screen
      if (mounted) {
        context.go('/login');
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo Image only
              Image.asset(
                'assets/images/logo.png',
                width: 250,
                height: 250,
                fit: BoxFit.contain,
              ),
              const SizedBox(height: 50),
              const CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF0066CC)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

