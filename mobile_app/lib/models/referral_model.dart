class ReferralModel {
  final String id;
  final String? doctorId;
  final String? doctorName;
  final String? patientName;
  final String? patientPhone;
  final String? patientEmail;
  final int? patientAge;
  final String? patientGender;
  final String? condition;
  final String? surgeryType;
  final DateTime? surgeryDate;
  final String? notes;
  final String? status;
  final String? contactedBy;
  final DateTime? contactedAt;
  final String? registeredPatientId;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  ReferralModel({
    required this.id,
    this.doctorId,
    this.doctorName,
    this.patientName,
    this.patientPhone,
    this.patientEmail,
    this.patientAge,
    this.patientGender,
    this.condition,
    this.surgeryType,
    this.surgeryDate,
    this.notes,
    this.status,
    this.contactedBy,
    this.contactedAt,
    this.registeredPatientId,
    this.createdAt,
    this.updatedAt,
  });

  factory ReferralModel.fromJson(Map<String, dynamic> json) {
    return ReferralModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      doctorId: json['doctorId']?.toString(),
      doctorName: json['doctorName'],
      patientName: json['patientName'],
      patientPhone: json['patientPhone'],
      patientEmail: json['patientEmail'],
      patientAge: json['patientAge'],
      patientGender: json['patientGender'],
      condition: json['condition'],
      surgeryType: json['surgeryType'],
      surgeryDate: json['surgeryDate'] != null
          ? DateTime.parse(json['surgeryDate'])
          : null,
      notes: json['notes'],
      status: json['status'] ?? 'pending',
      contactedBy: json['contactedBy']?.toString(),
      contactedAt: json['contactedAt'] != null
          ? DateTime.parse(json['contactedAt'])
          : null,
      registeredPatientId: json['registeredPatientId']?.toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'doctorId': doctorId,
      'doctorName': doctorName,
      'patientName': patientName,
      'patientPhone': patientPhone,
      'patientEmail': patientEmail,
      'patientAge': patientAge,
      'patientGender': patientGender,
      'condition': condition,
      'surgeryType': surgeryType,
      'surgeryDate': surgeryDate?.toIso8601String(),
      'notes': notes,
      'status': status,
      'contactedBy': contactedBy,
      'contactedAt': contactedAt?.toIso8601String(),
      'registeredPatientId': registeredPatientId,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  bool get isPending => status == 'pending';
  bool get isContacted => status == 'contacted';
  bool get isRegistered => status == 'registered';
  bool get isRejected => status == 'rejected';
}

