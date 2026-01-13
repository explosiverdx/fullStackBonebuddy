import '../models/user_model.dart';
import 'api_service.dart';
import 'package:dio/dio.dart';
import '../utils/storage_helper.dart';
import '../config/app_config.dart';

class UserService {
  final ApiService _apiService = ApiService();
  
  // Get current user profile
  Future<UserModel> getCurrentUser() async {
    final response = await _apiService.get('/users/me');
    return UserModel.fromJson(response.data['data']);
  }
  
  // Update user profile
  Future<UserModel> updateProfile(Map<String, dynamic> data) async {
    final response = await _apiService.put('/users/me', data: data);
    return UserModel.fromJson(response.data['data']);
  }
  
  // Complete profile with FormData (for file uploads)
  Future<UserModel> completeProfile(FormData formData) async {
    // Use direct Dio call for multipart/form-data
    final dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
    ));
    
    // Add auth token
    final token = await StorageHelper.getAccessToken();
    if (token != null) {
      dio.options.headers['Authorization'] = 'Bearer $token';
    }
    
    final response = await dio.post(
      '/users/profile',
      data: formData,
      options: Options(
        contentType: 'multipart/form-data',
      ),
    );
    
    final userData = response.data['data'];
    
    // Save updated user data to storage
    if (userData != null) {
      await StorageHelper.saveUserData(userData);
    }
    
    return UserModel.fromJson(userData);
  }
  
  // Upload avatar
  Future<String> uploadAvatar(String filePath) async {
    final response = await _apiService.uploadFile(
      '/users/me/avatar',
      filePath,
      fieldName: 'avatar',
    );
    return response.data['data']['avatar'];
  }
  
  // Get user sessions
  Future<List<dynamic>> getUserSessions() async {
    final response = await _apiService.get('/sessions/mine');
    if (response.data != null && response.data['data'] != null) {
      return List<Map<String, dynamic>>.from(response.data['data']);
    }
    return [];
  }
}

