import 'package:flutter_test/flutter_test.dart';
import 'package:bone_buddy_app/models/user_model.dart';

void main() {
  group('UserModel', () {
    test('should create UserModel from JSON with all fields', () {
      final json = {
        '_id': '123',
        'Fullname': 'John Doe',
        'email': 'john@example.com',
        'mobile_number': '+919876543210',
        'role': 'patient',
        'avatar': 'https://example.com/avatar.jpg',
        'profileCompleted': true,
        'dateOfBirth': '1990-01-01',
        'gender': 'male',
        'address': '123 Main St',
        'emergencyContactNumber': '+919876543211',
        'surgeryType': 'Knee Replacement',
        'surgeryDate': '2024-01-01',
        'currentCondition': 'Recovering',
        'assignedDoctor': 'doctor123',
        'hospitalClinic': 'City Hospital',
        'assignedPhysiotherapist': 'physio123',
        'medicalHistory': 'None',
        'allergies': 'None',
        'bloodGroup': 'O+',
        'medicalInsurance': 'ABC Insurance',
      };

      final user = UserModel.fromJson(json);

      expect(user.id, '123');
      expect(user.fullName, 'John Doe');
      expect(user.email, 'john@example.com');
      expect(user.phoneNumber, '+919876543210');
      expect(user.role, 'patient');
      expect(user.avatar, 'https://example.com/avatar.jpg');
      expect(user.profileCompleted, true);
      expect(user.dateOfBirth, '1990-01-01');
      expect(user.gender, 'male');
      expect(user.address, '123 Main St');
      expect(user.isPatient, true);
      expect(user.isDoctor, false);
      expect(user.isPhysiotherapist, false);
      expect(user.isAdmin, false);
    });

    test('should handle alternate field names', () {
      final json = {
        'id': '456',
        'fullName': 'Jane Doe',
        'phoneNumber': '+919876543212',
        'userType': 'doctor',
        'hospitalName': 'Clinic ABC',
      };

      final user = UserModel.fromJson(json);

      expect(user.id, '456');
      expect(user.fullName, 'Jane Doe');
      expect(user.phoneNumber, '+919876543212');
      expect(user.role, 'doctor');
      expect(user.hospitalClinic, 'Clinic ABC');
      expect(user.isDoctor, true);
    });

    test('should handle profileCompleted as string "true"', () {
      final json = {
        '_id': '789',
        'profileCompleted': 'true',
      };

      final user = UserModel.fromJson(json);
      expect(user.profileCompleted, true);
    });

    test('should handle profileCompleted as boolean false', () {
      final json = {
        '_id': '789',
        'profileCompleted': false,
      };

      final user = UserModel.fromJson(json);
      expect(user.profileCompleted, false);
    });

    test('should handle null profileCompleted', () {
      final json = {
        '_id': '789',
      };

      final user = UserModel.fromJson(json);
      expect(user.profileCompleted, null);
    });

    test('should handle availableDays as List', () {
      final json = {
        '_id': '999',
        'role': 'physiotherapist',
        'availableDays': ['Monday', 'Wednesday', 'Friday'],
      };

      final user = UserModel.fromJson(json);
      expect(user.availableDays, ['Monday', 'Wednesday', 'Friday']);
      expect(user.isPhysiotherapist, true);
    });

    test('should convert UserModel to JSON', () {
      final user = UserModel(
        id: '123',
        fullName: 'Test User',
        email: 'test@example.com',
        phoneNumber: '+919876543210',
        role: 'patient',
        avatar: 'https://example.com/avatar.jpg',
        profileCompleted: true,
      );

      final json = user.toJson();

      expect(json['_id'], '123');
      expect(json['Fullname'], 'Test User');
      expect(json['email'], 'test@example.com');
      expect(json['mobile_number'], '+919876543210');
      expect(json['role'], 'patient');
      expect(json['avatar'], 'https://example.com/avatar.jpg');
    });

    test('should identify admin role correctly', () {
      final json = {
        '_id': 'admin123',
        'role': 'admin',
      };

      final user = UserModel.fromJson(json);
      expect(user.isAdmin, true);
      expect(user.isPatient, false);
      expect(user.isDoctor, false);
      expect(user.isPhysiotherapist, false);
    });

    test('should handle physio role as "physio"', () {
      final json = {
        '_id': 'physio123',
        'role': 'physio',
      };

      final user = UserModel.fromJson(json);
      expect(user.isPhysiotherapist, true);
    });

    test('should handle doctor profile fields', () {
      final json = {
        '_id': 'doc123',
        'role': 'doctor',
        'qualification': 'MBBS, MD',
        'specialization': 'Orthopedics',
        'experience': 10,
        'registrationNumber': 'REG123',
        'hospitalAffiliation': 'City Hospital',
        'clinicAffiliation': 'Health Clinic',
        'availableDays': ['Monday', 'Tuesday'],
        'availableTimeSlots': '9:00 AM - 5:00 PM',
        'consultationFee': 500,
        'bio': 'Experienced orthopedic surgeon',
      };

      final user = UserModel.fromJson(json);

      expect(user.qualification, 'MBBS, MD');
      expect(user.specialization, 'Orthopedics');
      expect(user.experience, 10);
      expect(user.registrationNumber, 'REG123');
      expect(user.hospitalAffiliation, 'City Hospital');
      expect(user.clinicAffiliation, 'Health Clinic');
      expect(user.availableTimeSlots, '9:00 AM - 5:00 PM');
      expect(user.consultationFee, 500);
      expect(user.bio, 'Experienced orthopedic surgeon');
    });

    test('should handle experience as string', () {
      final json = {
        '_id': 'doc123',
        'experience': '15',
      };

      final user = UserModel.fromJson(json);
      expect(user.experience, 15);
    });

    test('should handle consultationFee as string', () {
      final json = {
        '_id': 'doc123',
        'consultationFee': '1000',
      };

      final user = UserModel.fromJson(json);
      expect(user.consultationFee, 1000);
    });
  });
}
