import '../models/patient_model.dart';
import '../models/session_model.dart';
import '../services/api_service.dart';

class DoctorService {
  final ApiService _apiService = ApiService();

  /// Get patients and sessions for the logged-in doctor
  Future<Map<String, dynamic>> getMyPatientsAndSessions() async {
    try {
      final response = await _apiService.get('/doctors/my-patients-sessions');
      
      if (response.data != null && response.data['data'] != null) {
        final data = response.data['data'];
        
        // Parse patients
        List<PatientModel> patients = [];
        if (data['patients'] != null && data['patients'] is List) {
          patients = (data['patients'] as List)
              .map((json) => PatientModel.fromJson(json))
              .toList();
        }
        
        // Parse sessions
        List<SessionModel> sessions = [];
        if (data['sessions'] != null && data['sessions'] is List) {
          sessions = (data['sessions'] as List)
              .map((json) => SessionModel.fromJson(json))
              .toList();
        }
        
        return {
          'patients': patients,
          'sessions': sessions,
          'stats': data['stats'] ?? {},
        };
      }
      
      return {
        'patients': <PatientModel>[],
        'sessions': <SessionModel>[],
        'stats': {},
      };
    } catch (e) {
      print('Error fetching patients and sessions: $e');
      // Check if it's a 403 error (forbidden)
      if (e.toString().contains('403') || e.toString().contains('Forbidden')) {
        print('⚠️ 403 Error: User may not be logged in as a doctor or doctor profile may not exist');
        print('⚠️ Please ensure you are logged in with a doctor account');
      }
      rethrow;
    }
  }
}

