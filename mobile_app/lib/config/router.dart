import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/otp_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/auth/role_selection_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/services/services_screen.dart';
import '../screens/services/service_detail_screen.dart';
import '../screens/blog/blog_list_screen.dart';
import '../screens/blog/blog_detail_screen.dart';
import '../screens/contact/contact_screen.dart';
import '../screens/about/about_screen.dart';
import '../screens/profile/user_profile_screen.dart';
import '../screens/profile/patient_profile_screen.dart';
import '../screens/profile/doctor_profile_screen.dart';
import '../screens/profile/physiotherapist_profile_screen.dart';
import '../screens/profile/patient_detail_screen.dart';
import '../screens/profile/profile_edit_screen.dart';
import '../screens/splash/splash_screen.dart';
import '../screens/sessions/session_detail_screen.dart';
import '../screens/sessions/sessions_list_screen.dart';
import '../screens/payments/payment_detail_screen.dart';
import '../models/session_model.dart';
import '../models/payment_model.dart';
import '../models/patient_model.dart';
import '../providers/auth_provider.dart';
import 'package:provider/provider.dart';

class AppRouter {
  static final GoRouter router = GoRouter(
    initialLocation: '/splash',
    debugLogDiagnostics: true,
    errorBuilder: (context, state) => Scaffold(
      appBar: AppBar(title: const Text('Error')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              'Route not found: ${state.uri}',
              style: const TextStyle(fontSize: 16),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => context.go('/home'),
              child: const Text('Go to Home'),
            ),
          ],
        ),
      ),
    ),
    routes: [
      GoRoute(
        path: '/',
        redirect: (context, state) {
          final authProvider = Provider.of<AuthProvider>(context, listen: false);
          return authProvider.isAuthenticated ? '/home' : '/splash';
        },
      ),
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/role-selection',
        builder: (context, state) => const RoleSelectionScreen(),
      ),
      GoRoute(
        path: '/otp',
        builder: (context, state) {
          final phoneNumber = state.uri.queryParameters['phone'] ?? '';
          final isRegistration = state.uri.queryParameters['register'] == 'true';
          return OtpScreen(phoneNumber: phoneNumber, isRegistration: isRegistration);
        },
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/services',
        builder: (context, state) => const ServicesScreen(),
      ),
      GoRoute(
        path: '/services/:id',
        builder: (context, state) {
          final serviceId = state.pathParameters['id'] ?? '';
          return ServiceDetailScreen(serviceId: serviceId);
        },
      ),
      GoRoute(
        path: '/blog',
        builder: (context, state) => const BlogListScreen(),
      ),
      GoRoute(
        path: '/blog/:slug',
        builder: (context, state) {
          final slug = state.pathParameters['slug'] ?? '';
          return BlogDetailScreen(slug: slug);
        },
      ),
      GoRoute(
        path: '/contact',
        builder: (context, state) => const ContactScreen(),
      ),
      GoRoute(
        path: '/about',
        builder: (context, state) => const AboutScreen(),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const UserProfileScreen(),
      ),
      GoRoute(
        path: '/profile/patient',
        builder: (context, state) => const PatientProfileScreen(),
      ),
      GoRoute(
        path: '/sessions/:id',
        builder: (context, state) {
          final session = state.extra as SessionModel?;
          if (session != null) {
            return SessionDetailScreen(session: session);
          }
          return const Scaffold(
            body: Center(child: Text('Session not found')),
          );
        },
      ),
      GoRoute(
        path: '/payments/:id',
        builder: (context, state) {
          final payment = state.extra as PaymentModel?;
          if (payment != null) {
            return PaymentDetailScreen(payment: payment);
          }
          return const Scaffold(
            body: Center(child: Text('Payment not found')),
          );
        },
      ),
      GoRoute(
        path: '/profile/doctor',
        builder: (context, state) => const DoctorProfileScreen(),
      ),
      GoRoute(
        path: '/profile/physiotherapist',
        builder: (context, state) => const PhysiotherapistProfileScreen(),
      ),
      GoRoute(
        path: '/profile/patient/edit',
        builder: (context, state) => ProfileEditScreen(role: 'patient'),
      ),
      GoRoute(
        path: '/profile/doctor/edit',
        builder: (context, state) => ProfileEditScreen(role: 'doctor'),
      ),
      GoRoute(
        path: '/profile/physiotherapist/edit',
        builder: (context, state) => ProfileEditScreen(role: 'physio'),
      ),
      GoRoute(
        path: '/sessions',
        builder: (context, state) => const SessionsListScreen(),
      ),
      GoRoute(
        path: '/patients/:id',
        builder: (context, state) {
          final patient = state.extra as PatientModel?;
          if (patient != null) {
            return PatientDetailScreen(patient: patient);
          }
          return const Scaffold(
            body: Center(child: Text('Patient not found')),
          );
        },
      ),
    ],
    redirect: (context, state) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final isLoggedIn = authProvider.isAuthenticated;
      
      // Allow role-selection (needed for profile completion during registration)
      if (state.matchedLocation == '/role-selection') {
        return null; // Allow access regardless of auth status
      }
      
      // Allow splash screen (it handles its own navigation)
      if (state.matchedLocation == '/splash') {
        return null;
      }
      
      // Check profile completion for logged-in users
      if (isLoggedIn) {
        final user = authProvider.user;
        // Only redirect if profileCompleted is explicitly false (not null, not true)
        // Also allow edit routes
        if (user != null && user.profileCompleted == false) {
          // Allow access to profile routes (they will show completion form)
          // and role-selection route, and edit routes
          final allowedRoutes = [
            '/role-selection',
            '/profile/patient',
            '/profile/doctor',
            '/profile/physiotherapist',
            '/profile/patient/edit',
            '/profile/doctor/edit',
            '/profile/physiotherapist/edit',
            '/login',
            '/register',
            '/otp',
            '/splash'
          ];
          
          if (!allowedRoutes.contains(state.matchedLocation)) {
            return '/role-selection';
          }
        }
        // If profileCompleted is true or null, allow navigation
      }
      
      // Handle root path
      if (state.matchedLocation == '/') {
        if (isLoggedIn) {
          final user = authProvider.user;
          // Only redirect to role-selection if profileCompleted is explicitly false
          if (user != null && user.profileCompleted == false) {
            return '/role-selection';
          }
          // If profileCompleted is true or null, go to home
          return '/home';
        }
        return '/splash';
      }
      
      // Public routes that don't require authentication
      final publicRoutes = ['/login', '/register', '/otp', '/splash'];
      final isPublicRoute = publicRoutes.contains(state.matchedLocation);
      
      // Protected routes
      final protectedRoutes = ['/profile', '/patients', '/sessions', '/home'];
      final isProtectedRoute = protectedRoutes.any((route) => state.matchedLocation.startsWith(route));
      
      // If trying to access protected route without login
      if (isProtectedRoute && !isLoggedIn) {
        return '/login';
      }
      
      // If logged in and trying to access login/splash
      if (isLoggedIn && (state.matchedLocation == '/login' || state.matchedLocation == '/splash')) {
        final user = authProvider.user;
        if (user != null && user.profileCompleted == false) {
          return '/role-selection';
        }
        return '/home';
      }
      
      return null;
    },
  );
}

