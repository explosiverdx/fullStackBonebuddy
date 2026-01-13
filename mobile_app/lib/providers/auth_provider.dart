import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();
  
  UserModel? _user;
  bool _isLoading = false;
  bool _isAuthenticated = false;
  
  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _isAuthenticated;
  
  AuthProvider() {
    checkAuthStatus();
  }
  
  // Expose auth service for direct calls when needed
  AuthService get authService => _authService;
  
  Future<void> checkAuthStatus() async {
    _isLoading = true;
    notifyListeners();
    
    final isLoggedIn = await _authService.isLoggedIn();
    if (isLoggedIn) {
      // First try to get from storage (faster)
      _user = await _authService.getStoredUser();
      
      // Always refresh from API to get latest data (especially profileCompleted status and hasPassword)
      try {
        final apiUser = await _authService.getCurrentUser();
        
        // If user doesn't have a password set, they need to complete registration
        // Log them out so they need to verify OTP again
        if (apiUser != null && (apiUser.hasPassword == false || apiUser.hasPassword == null)) {
          // User hasn't set password yet - log them out
          await logout();
          _isLoading = false;
          notifyListeners();
          return;
        }
        
        // Update stored user data with latest from API (includes hasPassword)
        if (apiUser != null) {
          _user = apiUser;
          // Save updated user data to storage (user data is already saved by getCurrentUser via verifyOtp)
          // The hasPassword will be included in next API call
        }
      } catch (e) {
        // If API call fails, check stored user
        if (_user == null) {
          _user = await _authService.getStoredUser();
        }
        
        // If stored user also doesn't have password, log out
        if (_user != null && (_user!.hasPassword == false || _user!.hasPassword == null)) {
          await logout();
          _isLoading = false;
          notifyListeners();
          return;
        }
      }
      
      _isAuthenticated = _user != null && (_user!.hasPassword == true);
    } else {
      _user = null;
      _isAuthenticated = false;
    }
    
    _isLoading = false;
    notifyListeners();
  }
  
  Future<bool> loginWithOtp(String phoneNumber, String otp) async {
    try {
      _isLoading = true;
      notifyListeners();
      
      final response = await _authService.verifyOtp(phoneNumber, otp);
      
      if (response['data'] != null && response['data']['user'] != null) {
        _user = UserModel.fromJson(response['data']['user']);
        _isAuthenticated = true;
        _isLoading = false;
        notifyListeners();
        return true;
      }
      
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }
  
  Future<bool> loginWithPassword(String phoneNumber, String password) async {
    try {
      _isLoading = true;
      notifyListeners();
      
      final response = await _authService.loginWithPassword(phoneNumber, password);
      
      if (response['data'] != null && response['data']['user'] != null) {
        _user = UserModel.fromJson(response['data']['user']);
        _isAuthenticated = true;
        _isLoading = false;
        notifyListeners();
        return true;
      }
      
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }
  
  Future<bool> registerWithPassword(String phoneNumber, String password) async {
    try {
      _isLoading = true;
      notifyListeners();
      
      final response = await _authService.registerWithPassword(phoneNumber, password);
      
      _isLoading = false;
      notifyListeners();
      return response['success'] == true;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }
  
  Future<void> logout() async {
    await _authService.logout();
    _user = null;
    _isAuthenticated = false;
    notifyListeners();
  }
  
  Future<void> refreshUser() async {
    try {
      _user = await _authService.getCurrentUser();
      notifyListeners();
    } catch (e) {
      // Handle error
    }
  }
  
  // Update user directly (used after profile completion)
  void updateUser(UserModel user) {
    _user = user;
    _isAuthenticated = user != null;
    notifyListeners();
  }
}

