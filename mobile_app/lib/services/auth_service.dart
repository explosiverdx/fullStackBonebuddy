import '../models/user_model.dart';
import '../utils/storage_helper.dart';
import 'api_service.dart';
import 'dart:convert';

class AuthService {
  final ApiService _apiService = ApiService();
  
  // Send OTP
  Future<Map<String, dynamic>> sendOtp(String phoneNumber) async {
    try {
      // Ensure phone number is properly formatted
      String formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith('+91')) {
        // Remove any + or country code if present
        formattedPhone = formattedPhone.replaceAll(RegExp(r'^\+?91'), '');
        formattedPhone = '+91$formattedPhone';
      }
      
      print('📞 AuthService.sendOtp called with: $formattedPhone');
      
      final response = await _apiService.post(
        '/users/send-otp',
        data: {'phoneNumber': formattedPhone},
      );
      
      print('✅ AuthService.sendOtp response received');
      return response.data;
    } catch (e) {
      print('❌ AuthService.sendOtp error: $e');
      rethrow;
    }
  }
  
  // Verify OTP
  Future<Map<String, dynamic>> verifyOtp(String phoneNumber, String otp) async {
    try {
      final response = await _apiService.post(
        '/users/verify-otp',
        data: {
          'phoneNumber': phoneNumber.startsWith('+91') ? phoneNumber : '+91$phoneNumber',
          'otp': otp,
        },
      );
      
      if (response.data != null && response.data['data'] != null) {
        final data = response.data['data'];
        
        // Save tokens
        await StorageHelper.saveAccessToken(data['accessToken']);
        if (data['refreshToken'] != null) {
          await StorageHelper.saveRefreshToken(data['refreshToken']);
        }
        
        // Save user data
        if (data['user'] != null) {
          await StorageHelper.saveUserData(data['user']);
        }
      }
      
      return response.data;
    } catch (e) {
      rethrow;
    }
  }
  
  // Register with Password
  Future<Map<String, dynamic>> registerWithPassword(String phoneNumber, String password) async {
    try {
      final response = await _apiService.post(
        '/users/register-with-password',
        data: {
          'phoneNumber': phoneNumber.startsWith('+91') ? phoneNumber : '+91$phoneNumber',
          'password': password,
        },
      );
      return response.data;
    } catch (e) {
      rethrow;
    }
  }
  
  // Login with Password
  Future<Map<String, dynamic>> loginWithPassword(String phoneNumber, String password) async {
    try {
      final response = await _apiService.post(
        '/users/login',
        data: {
          'mobile_number': phoneNumber.startsWith('+91') ? phoneNumber : '+91$phoneNumber',
          'password': password,
        },
      );
      
      if (response.data != null && response.data['data'] != null) {
        final data = response.data['data'];
        
        // Save tokens
        await StorageHelper.saveAccessToken(data['accessToken']);
        if (data['refreshToken'] != null) {
          await StorageHelper.saveRefreshToken(data['refreshToken']);
        }
        
        // Save user data
        if (data['user'] != null) {
          await StorageHelper.saveUserData(data['user']);
        }
      }
      
      return response.data;
    } catch (e) {
      rethrow;
    }
  }
  
  // Forgot Password - Request OTP
  Future<Map<String, dynamic>> forgotPasswordRequest(String phoneNumber) async {
    try {
      final response = await _apiService.post(
        '/users/forgot-password',
        data: {
          'phoneNumber': phoneNumber.startsWith('+91') ? phoneNumber : '+91$phoneNumber',
        },
      );
      return response.data;
    } catch (e) {
      rethrow;
    }
  }
  
  // Reset Password
  Future<Map<String, dynamic>> resetPassword(String phoneNumber, String otp, String newPassword) async {
    try {
      final response = await _apiService.post(
        '/users/reset-password',
        data: {
          'phoneNumber': phoneNumber.startsWith('+91') ? phoneNumber : '+91$phoneNumber',
          'otp': otp,
          'newPassword': newPassword,
        },
      );
      return response.data;
    } catch (e) {
      rethrow;
    }
  }
  
  // Get Current User
  Future<UserModel?> getCurrentUser() async {
    try {
      final response = await _apiService.get('/users/me');
      if (response.data != null && response.data['data'] != null) {
        final userData = response.data['data'];
        // Save updated user data to storage (includes hasPassword)
        await StorageHelper.saveUserData(userData);
        return UserModel.fromJson(userData);
      }
      return null;
    } catch (e) {
      return null;
    }
  }
  
  // Logout
  Future<void> logout() async {
    await StorageHelper.clearAll();
  }
  
  // Check if logged in
  Future<bool> isLoggedIn() async {
    return await StorageHelper.isLoggedIn();
  }
  
  // Get stored user data
  Future<UserModel?> getStoredUser() async {
    final userData = await StorageHelper.getUserData();
    if (userData != null) {
      return UserModel.fromJson(userData);
    }
    return null;
  }
  
  // Set Password (after OTP verification)
  Future<Map<String, dynamic>> setPassword(String password) async {
    try {
      final response = await _apiService.post(
        '/users/set-password',
        data: {'password': password},
      );
      
      // After setting password, refresh and update stored user data
      try {
        final user = await getCurrentUser();
        if (user != null) {
          // Convert user back to JSON and save (includes hasPassword: true now)
          final userJson = {
            '_id': user.id,
            'Fullname': user.fullName,
            'email': user.email,
            'mobile_number': user.phoneNumber,
            'userType': user.role,
            'avatar': user.avatar,
            'profileCompleted': user.profileCompleted,
            'hasPassword': user.hasPassword ?? true, // Password is now set
          };
          await StorageHelper.saveUserData(userJson);
        }
      } catch (e) {
        // If refresh fails, continue - password was set successfully
        print('Warning: Could not refresh user data after setting password: $e');
      }
      
      return response.data;
    } catch (e) {
      rethrow;
    }
  }
  
  // Get Access Token from storage
  Future<String?> getAccessToken() async {
    return await StorageHelper.getAccessToken();
  }
}

