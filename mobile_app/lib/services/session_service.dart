import '../models/session_model.dart';
import 'api_service.dart';

class SessionService {
  final ApiService _apiService = ApiService();
  
  // Get user sessions
  Future<List<SessionModel>> getUserSessions() async {
    final response = await _apiService.get('/sessions/mine');
    if (response.data != null && response.data['data'] != null) {
      return (response.data['data'] as List)
          .map((json) => SessionModel.fromJson(json))
          .toList();
    }
    return [];
  }
  
  // Get session by ID
  Future<SessionModel> getSessionById(String id) async {
    final response = await _apiService.get('/sessions/$id');
    return SessionModel.fromJson(response.data['data']);
  }
  
  // Update session
  Future<SessionModel> updateSession(String id, Map<String, dynamic> data) async {
    final response = await _apiService.put('/sessions/$id', data: data);
    return SessionModel.fromJson(response.data['data']);
  }
  
  // Send OTP to patient for session start
  Future<void> sendSessionStartOtp(String sessionId) async {
    final response = await _apiService.post('/sessions/send-start-otp', data: {
      'sessionId': sessionId,
    });
    if (response.data['success'] != true) {
      throw Exception(response.data['message'] ?? 'Failed to send OTP');
    }
  }
  
  // Send OTP to patient for session end
  Future<void> sendSessionEndOtp(String sessionId) async {
    final response = await _apiService.post('/sessions/send-end-otp', data: {
      'sessionId': sessionId,
    });
    if (response.data['success'] != true) {
      throw Exception(response.data['message'] ?? 'Failed to send OTP');
    }
  }
  
  // Start session with OTP verification
  Future<SessionModel> startSession(String sessionId, String otp) async {
    final response = await _apiService.post('/sessions/start', data: {
      'sessionId': sessionId,
      'otp': otp,
    });
    return SessionModel.fromJson(response.data['data']);
  }
  
  // End session with OTP verification
  Future<SessionModel> endSession(String sessionId, String otp, {String? notes}) async {
    final response = await _apiService.post('/sessions/end', data: {
      'sessionId': sessionId,
      'otp': otp,
      if (notes != null) 'notes': notes,
    });
    return SessionModel.fromJson(response.data['data']);
  }
}

