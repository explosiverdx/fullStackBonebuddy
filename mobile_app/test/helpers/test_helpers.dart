import 'package:flutter_test/flutter_test.dart';
import 'package:bone_buddy_app/models/user_model.dart';
import 'package:bone_buddy_app/models/session_model.dart';
import 'package:bone_buddy_app/models/blog_model.dart';

/// Creates a mock user for testing
UserModel createMockUser({
  String? id,
  String? fullName,
  String? email,
  String? phoneNumber,
  String? role,
  bool? profileCompleted,
}) {
  return UserModel(
    id: id ?? 'test_user_id',
    fullName: fullName ?? 'Test User',
    email: email ?? 'test@example.com',
    phoneNumber: phoneNumber ?? '+919876543210',
    role: role ?? 'patient',
    profileCompleted: profileCompleted ?? true,
  );
}

/// Creates a mock patient user
UserModel createMockPatient({
  String? id,
  String? name,
}) {
  return createMockUser(
    id: id,
    fullName: name,
    role: 'patient',
  );
}

/// Creates a mock doctor user
UserModel createMockDoctor({
  String? id,
  String? name,
  String? specialization,
  int? experience,
}) {
  return UserModel(
    id: id ?? 'test_doctor_id',
    fullName: name ?? 'Dr. Test',
    email: 'doctor@example.com',
    phoneNumber: '+919876543211',
    role: 'doctor',
    specialization: specialization ?? 'Orthopedics',
    experience: experience ?? 10,
    profileCompleted: true,
  );
}

/// Creates a mock physiotherapist user
UserModel createMockPhysiotherapist({
  String? id,
  String? name,
}) {
  return UserModel(
    id: id ?? 'test_physio_id',
    fullName: name ?? 'Physio Test',
    email: 'physio@example.com',
    phoneNumber: '+919876543212',
    role: 'physiotherapist',
    profileCompleted: true,
  );
}

/// Creates a mock session
SessionModel createMockSession({
  String? id,
  String? patientId,
  String? patientName,
  String? physiotherapistId,
  String? physiotherapistName,
  String? status,
  DateTime? sessionDate,
}) {
  return SessionModel(
    id: id ?? 'test_session_id',
    patientId: patientId ?? 'test_patient_id',
    patientName: patientName ?? 'Test Patient',
    physiotherapistId: physiotherapistId ?? 'test_physio_id',
    physiotherapistName: physiotherapistName ?? 'Test Physio',
    status: status ?? 'pending',
    sessionDate: sessionDate ?? DateTime.now().add(const Duration(days: 1)),
  );
}

/// Creates a mock blog post
BlogModel createMockBlog({
  String? id,
  String? title,
  String? content,
  String? author,
}) {
  return BlogModel(
    id: id ?? 'test_blog_id',
    title: title ?? 'Test Blog Post',
    content: content ?? 'This is test content.',
    excerpt: 'Test excerpt',
    author: author ?? 'Test Author',
    category: 'Health',
    image: 'https://example.com/image.jpg',
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
  );
}

/// Helper to create mock API response data
Map<String, dynamic> createMockApiResponse({
  bool success = true,
  String? message,
  dynamic data,
}) {
  return {
    'success': success,
    if (message != null) 'message': message,
    if (data != null) 'data': data,
  };
}

/// Helper to create mock user JSON
Map<String, dynamic> createMockUserJson({
  String? id,
  String? fullName,
  String? email,
  String? phoneNumber,
  String? role,
  bool? profileCompleted,
}) {
  return {
    '_id': id ?? 'test_user_id',
    'Fullname': fullName ?? 'Test User',
    'email': email ?? 'test@example.com',
    'mobile_number': phoneNumber ?? '+919876543210',
    'role': role ?? 'patient',
    'profileCompleted': profileCompleted ?? true,
  };
}

/// Helper to create mock login response
Map<String, dynamic> createMockLoginResponse({
  required String userId,
  required String accessToken,
  String? refreshToken,
  Map<String, dynamic>? userData,
}) {
  return {
    'success': true,
    'message': 'Login successful',
    'data': {
      'accessToken': accessToken,
      'refreshToken': refreshToken ?? 'refresh_token_123',
      'user': userData ?? createMockUserJson(id: userId),
    },
  };
}

/// Helper to create mock OTP response
Map<String, dynamic> createMockOtpResponse({bool success = true}) {
  return {
    'success': success,
    'message': success ? 'OTP sent successfully' : 'Failed to send OTP',
  };
}
