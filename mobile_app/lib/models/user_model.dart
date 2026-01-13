class UserModel {
  final String id;
  final String? fullName;
  final String? email;
  final String? phoneNumber;
  final String? role;
  final String? avatar;
  final bool? profileCompleted;
  final bool? hasPassword; // Indicates if user has set a password
  final Map<String, dynamic>? patientProfile;
  final Map<String, dynamic>? doctorProfile;
  final Map<String, dynamic>? physiotherapistProfile;
  
  // Patient fields (merged from Patient model by backend)
  final String? dateOfBirth;
  final String? gender;
  final String? address;
  final String? emergencyContactNumber;
  final String? surgeryType;
  final String? surgeryDate;
  final String? currentCondition;
  final String? assignedDoctor;
  final String? hospitalClinic;
  final String? assignedPhysiotherapist;
  final String? medicalHistory;
  final String? allergies;
  final String? bloodGroup;
  final String? medicalInsurance;
  
  // Doctor/Physio fields (merged from Doctor/Physio models by backend)
  final String? qualification;
  final String? specialization;
  final int? experience;
  final String? registrationNumber;
  final String? hospitalAffiliation;
  final String? clinicAffiliation;
  final List<String>? availableDays;
  final String? availableTimeSlots;
  final int? consultationFee;
  final String? bio;
  
  UserModel({
    required this.id,
    this.fullName,
    this.email,
    this.phoneNumber,
    this.role,
    this.avatar,
    this.profileCompleted,
    this.hasPassword,
    this.patientProfile,
    this.doctorProfile,
    this.physiotherapistProfile,
    this.dateOfBirth,
    this.gender,
    this.address,
    this.emergencyContactNumber,
    this.surgeryType,
    this.surgeryDate,
    this.currentCondition,
    this.assignedDoctor,
    this.hospitalClinic,
    this.assignedPhysiotherapist,
    this.medicalHistory,
    this.allergies,
    this.bloodGroup,
    this.medicalInsurance,
    this.qualification,
    this.specialization,
    this.experience,
    this.registrationNumber,
    this.hospitalAffiliation,
    this.clinicAffiliation,
    this.availableDays,
    this.availableTimeSlots,
    this.consultationFee,
    this.bio,
  });
  
  // Helper function to convert empty strings to null
  // Also treats default pattern names (patient_XXXXX) as empty
  static String? _nullIfEmpty(dynamic value) {
    if (value == null) return null;
    final str = value.toString().trim();
    if (str.isEmpty) return null;
    // If name matches default pattern (patient_10digits), treat as empty
    if (RegExp(r'^patient_\d{10}$').hasMatch(str)) {
      return null;
    }
    return str;
  }
  
  factory UserModel.fromJson(Map<String, dynamic> json) {
    // Handle profileCompleted - check for true, false, or null
    bool? profileCompletedValue;
    if (json['profileCompleted'] != null) {
      profileCompletedValue = json['profileCompleted'] == true || json['profileCompleted'] == 'true';
    }
    
    // Handle availableDays - can be List or null
    List<String>? availableDaysList;
    if (json['availableDays'] != null) {
      if (json['availableDays'] is List) {
        availableDaysList = List<String>.from(json['availableDays']);
      }
    }
    
    return UserModel(
      id: json['_id'] ?? json['id'] ?? '',
      fullName: _nullIfEmpty(json['Fullname'] ?? json['fullName'] ?? json['name']),
      email: _nullIfEmpty(json['email']),
      phoneNumber: json['mobile_number'] ?? json['phoneNumber'] ?? json['mobileNumber'],
      role: json['role'] ?? json['userType'],
      avatar: json['avatar'],
      profileCompleted: profileCompletedValue,
      hasPassword: json['hasPassword'] == true,
      patientProfile: json['patientProfile'],
      doctorProfile: json['doctorProfile'],
      physiotherapistProfile: json['physiotherapistProfile'],
      // Patient fields
      dateOfBirth: json['dateOfBirth']?.toString(),
      gender: json['gender'],
      address: json['address'],
      emergencyContactNumber: json['emergencyContactNumber'],
      surgeryType: json['surgeryType'],
      surgeryDate: json['surgeryDate']?.toString(),
      currentCondition: json['currentCondition'],
      assignedDoctor: json['assignedDoctor'],
      hospitalClinic: json['hospitalClinic'] ?? json['hospitalName'],
      assignedPhysiotherapist: json['assignedPhysiotherapist'] ?? json['assignedPhysio'],
      medicalHistory: json['medicalHistory'],
      allergies: json['allergies'],
      bloodGroup: json['bloodGroup'],
      medicalInsurance: json['medicalInsurance'],
      // Doctor/Physio fields
      qualification: json['qualification'],
      specialization: json['specialization'],
      experience: json['experience'] is int ? json['experience'] : (json['experience'] != null ? int.tryParse(json['experience'].toString()) : null),
      registrationNumber: json['registrationNumber'],
      hospitalAffiliation: json['hospitalAffiliation'],
      clinicAffiliation: json['clinicAffiliation'],
      availableDays: availableDaysList,
      availableTimeSlots: json['availableTimeSlots'],
      consultationFee: json['consultationFee'] is int ? json['consultationFee'] : (json['consultationFee'] != null ? int.tryParse(json['consultationFee'].toString()) : null),
      bio: json['bio'],
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'Fullname': fullName,
      'email': email,
      'mobile_number': phoneNumber,
      'role': role,
      'avatar': avatar,
      'patientProfile': patientProfile,
      'doctorProfile': doctorProfile,
      'physiotherapistProfile': physiotherapistProfile,
    };
  }
  
  bool get isPatient => role == 'patient';
  bool get isDoctor => role == 'doctor';
  bool get isPhysiotherapist => role == 'physiotherapist' || role == 'physio';
  bool get isAdmin => role == 'admin';
}

