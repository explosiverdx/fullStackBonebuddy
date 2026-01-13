import '../models/referral_model.dart';
import 'api_service.dart';

class ReferralService {
  final ApiService _apiService = ApiService();

  /// Create a new referral
  Future<ReferralModel> createReferral({
    required String patientName,
    required String patientPhone,
    String? patientEmail,
    int? patientAge,
    String? patientGender,
    required String condition,
    String? surgeryType,
    DateTime? surgeryDate,
    String? notes,
  }) async {
    try {
      final response = await _apiService.post('/referrals', data: {
        'patientName': patientName,
        'patientPhone': patientPhone,
        if (patientEmail != null) 'patientEmail': patientEmail,
        if (patientAge != null) 'patientAge': patientAge,
        if (patientGender != null) 'patientGender': patientGender,
        'condition': condition,
        if (surgeryType != null) 'surgeryType': surgeryType,
        if (surgeryDate != null) 'surgeryDate': surgeryDate.toIso8601String(),
        if (notes != null) 'notes': notes,
      });

      if (response.data != null && response.data['data'] != null) {
        return ReferralModel.fromJson(response.data['data']);
      }
      throw Exception('Invalid response from server');
    } catch (e) {
      print('Error creating referral: $e');
      rethrow;
    }
  }

  /// Get all referrals for the logged-in doctor
  Future<List<ReferralModel>> getMyReferrals() async {
    try {
      final response = await _apiService.get('/referrals/my-referrals');

      if (response.data != null && response.data['data'] != null) {
        return (response.data['data'] as List)
            .map((json) => ReferralModel.fromJson(json))
            .toList();
      }
      return [];
    } catch (e) {
      print('Error fetching referrals: $e');
      rethrow;
    }
  }
}

