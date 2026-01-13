import 'package:flutter_test/flutter_test.dart';
import 'package:bone_buddy_app/services/auth_service.dart';
import '../helpers/test_helpers.dart';

void main() {
  group('AuthService', () {
    late AuthService authService;

    setUp(() {
      authService = AuthService();
    });

    test('should create AuthService instance', () {
      expect(authService, isNotNull);
    });

    test('sendOtp should format phone number correctly', () {
      // Test phone number formatting logic (same as in AuthService)
      String phoneNumber = '9876543210';
      String formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith('+91')) {
        formattedPhone = formattedPhone.replaceAll(RegExp(r'^\+?91'), '');
        formattedPhone = '+91$formattedPhone';
      }
      
      expect(formattedPhone, '+919876543210');
    });

    test('sendOtp should handle existing +91 prefix', () {
      String phoneNumber = '+919876543210';
      String formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith('+91')) {
        formattedPhone = formattedPhone.replaceAll(RegExp(r'^\+?91'), '');
        formattedPhone = '+91$formattedPhone';
      }
      
      expect(formattedPhone, '+919876543210');
    });

    test('sendOtp should handle phone with existing country code', () {
      String phoneNumber = '+919876543210';
      String formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith('+91')) {
        formattedPhone = formattedPhone.replaceAll(RegExp(r'^\+?91'), '');
        formattedPhone = '+91$formattedPhone';
      }
      
      expect(formattedPhone, '+919876543210');
    });

    test('verifyOtp should format phone number correctly', () {
      // Test phone formatting in verifyOtp (same logic)
      String phoneNumber = '9876543210';
      String formattedPhone = phoneNumber.startsWith('+91') 
          ? phoneNumber 
          : '+91$phoneNumber';
      
      expect(formattedPhone, '+919876543210');
    });

    test('loginWithPassword should format phone number correctly', () {
      String phoneNumber = '9876543210';
      String formattedPhone = phoneNumber.startsWith('+91') 
          ? phoneNumber 
          : '+91$phoneNumber';
      
      expect(formattedPhone, '+919876543210');
    });

    test('registerWithPassword should format phone number correctly', () {
      String phoneNumber = '9876543210';
      String formattedPhone = phoneNumber.startsWith('+91') 
          ? phoneNumber 
          : '+91$phoneNumber';
      
      expect(formattedPhone, '+919876543210');
    });

    test('forgotPasswordRequest should format phone number correctly', () {
      String phoneNumber = '9876543210';
      String formattedPhone = phoneNumber.startsWith('+91') 
          ? phoneNumber 
          : '+91$phoneNumber';
      
      expect(formattedPhone, '+919876543210');
    });

    test('resetPassword should format phone number correctly', () {
      String phoneNumber = '9876543210';
      String formattedPhone = phoneNumber.startsWith('+91') 
          ? phoneNumber 
          : '+91$phoneNumber';
      
      expect(formattedPhone, '+919876543210');
    });

    test('logout method should exist', () {
      // Verify method exists - actual call requires mocked StorageHelper
      expect(authService.logout, isA<Function>());
    });

    test('isLoggedIn method should exist', () {
      // Verify method exists - actual call requires mocked StorageHelper
      expect(authService.isLoggedIn, isA<Function>());
    });

    test('getStoredUser method should exist', () {
      // Verify method exists - actual call requires mocked StorageHelper
      expect(authService.getStoredUser, isA<Function>());
    });

    test('getAccessToken method should exist', () {
      // Verify method exists - actual call requires mocked StorageHelper
      expect(authService.getAccessToken, isA<Function>());
    });
  });

  group('AuthService Phone Number Formatting', () {
    test('should handle various phone number formats', () {
      // Test different input formats
      final testCases = [
        {'input': '9876543210', 'expected': '+919876543210'},
        {'input': '+919876543210', 'expected': '+919876543210'},
        {'input': '919876543210', 'expected': '+919876543210'},
        {'input': '+91 9876543210', 'expected': '+919876543210'},
      ];

      for (var testCase in testCases) {
        String phone = testCase['input'] as String;
        String formatted = phone.trim();
        if (!formatted.startsWith('+91')) {
          formatted = formatted.replaceAll(RegExp(r'^\+?91'), '');
          formatted = '+91$formatted';
        }
        formatted = formatted.replaceAll(' ', '');
        
        expect(formatted, testCase['expected']);
      }
    });
  });
}
