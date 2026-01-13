class PatientModel {
  final String id;
  final String? userId;
  final String? name;
  final String? gender;
  final DateTime? dateOfBirth;
  final int? age;
  final String? mobileNumber;
  final String? email;
  final String? address;
  final String? surgeryType;
  final DateTime? surgeryDate;
  final String? hospitalClinic;
  final String? bloodGroup;
  final String? allergies;
  final String? emergencyContactNumber;
  final String? medicalInsurance;
  final int? totalSessions;
  final int? completedSessions;
  final int? upcomingSessions;
  final DateTime? lastSession;
  final Map<String, dynamic>? user;

  PatientModel({
    required this.id,
    this.userId,
    this.name,
    this.gender,
    this.dateOfBirth,
    this.age,
    this.mobileNumber,
    this.email,
    this.address,
    this.surgeryType,
    this.surgeryDate,
    this.hospitalClinic,
    this.bloodGroup,
    this.allergies,
    this.emergencyContactNumber,
    this.medicalInsurance,
    this.totalSessions,
    this.completedSessions,
    this.upcomingSessions,
    this.lastSession,
    this.user,
  });

  factory PatientModel.fromJson(Map<String, dynamic> json) {
    return PatientModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      userId: json['userId']?.toString(),
      name: json['name'],
      gender: json['gender'],
      dateOfBirth: json['dateOfBirth'] != null
          ? DateTime.parse(json['dateOfBirth'])
          : null,
      age: json['age'],
      mobileNumber: json['mobileNumber'] ?? json['mobile_number'],
      email: json['email'],
      address: json['address'],
      surgeryType: json['surgeryType'],
      surgeryDate: json['surgeryDate'] != null
          ? DateTime.parse(json['surgeryDate'])
          : null,
      hospitalClinic: json['hospitalClinic'],
      bloodGroup: json['bloodGroup'],
      allergies: json['allergies'],
      emergencyContactNumber: json['emergencyContactNumber'],
      medicalInsurance: json['medicalInsurance'],
      totalSessions: json['totalSessions'],
      completedSessions: json['completedSessions'],
      upcomingSessions: json['upcomingSessions'],
      lastSession: json['lastSession'] != null
          ? DateTime.parse(json['lastSession'])
          : null,
      user: json['userId'] is Map ? json['userId'] : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'userId': userId,
      'name': name,
      'gender': gender,
      'dateOfBirth': dateOfBirth?.toIso8601String(),
      'age': age,
      'mobileNumber': mobileNumber,
      'email': email,
      'address': address,
      'surgeryType': surgeryType,
      'surgeryDate': surgeryDate?.toIso8601String(),
      'hospitalClinic': hospitalClinic,
      'bloodGroup': bloodGroup,
      'allergies': allergies,
      'emergencyContactNumber': emergencyContactNumber,
      'medicalInsurance': medicalInsurance,
      'totalSessions': totalSessions,
      'completedSessions': completedSessions,
      'upcomingSessions': upcomingSessions,
      'lastSession': lastSession?.toIso8601String(),
    };
  }
}

