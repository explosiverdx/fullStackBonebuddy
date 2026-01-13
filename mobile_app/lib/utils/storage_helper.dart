import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/constants.dart';

class StorageHelper {
  static final FlutterSecureStorage _secureStorage = const FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );
  
  static SharedPreferences? _prefs;
  
  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }
  
  // Secure Storage Methods (for tokens)
  static Future<void> saveAccessToken(String token) async {
    await _secureStorage.write(key: AppConstants.keyAccessToken, value: token);
  }
  
  static Future<String?> getAccessToken() async {
    return await _secureStorage.read(key: AppConstants.keyAccessToken);
  }
  
  static Future<void> saveRefreshToken(String token) async {
    await _secureStorage.write(key: AppConstants.keyRefreshToken, value: token);
  }
  
  static Future<String?> getRefreshToken() async {
    return await _secureStorage.read(key: AppConstants.keyRefreshToken);
  }
  
  static Future<void> clearTokens() async {
    await _secureStorage.delete(key: AppConstants.keyAccessToken);
    await _secureStorage.delete(key: AppConstants.keyRefreshToken);
  }
  
  // SharedPreferences Methods (for user data)
  static Future<void> saveUserData(Map<String, dynamic> userData) async {
    if (_prefs != null) {
      await _prefs!.setString(AppConstants.keyUserData, jsonEncode(userData));
      await _prefs!.setBool(AppConstants.keyIsLoggedIn, true);
    }
  }
  
  static Future<Map<String, dynamic>?> getUserData() async {
    if (_prefs != null) {
      final String? userDataStr = _prefs!.getString(AppConstants.keyUserData);
      if (userDataStr != null) {
        return jsonDecode(userDataStr) as Map<String, dynamic>;
      }
    }
    return null;
  }
  
  static Future<bool> isLoggedIn() async {
    if (_prefs != null) {
      return _prefs!.getBool(AppConstants.keyIsLoggedIn) ?? false;
    }
    return false;
  }
  
  static Future<void> clearUserData() async {
    if (_prefs != null) {
      await _prefs!.remove(AppConstants.keyUserData);
      await _prefs!.setBool(AppConstants.keyIsLoggedIn, false);
    }
    await clearTokens();
  }
  
  static Future<void> clearAll() async {
    await clearUserData();
    await _secureStorage.deleteAll();
    if (_prefs != null) {
      await _prefs!.clear();
    }
  }
}

