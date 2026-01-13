class SessionModel {
  final String id;
  final String? patientId;
  final String? patientName;
  final String? physiotherapistId;
  final String? physiotherapistName;
  final String? physioId;
  final String? doctorId;
  final String? doctorName;
  final DateTime? sessionDate;
  final DateTime? scheduledDate;
  final String? status;
  final String? sessionType;
  final String? sessionVideo;
  final String? videoUrl;
  final String? notes;
  final DateTime? startTime;
  final DateTime? endTime;
  final int? durationMinutes;
  final int? actualDuration;
  final String? surgeryType;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  static String? _parseSessionVideo(dynamic sessionVideo) {
    if (sessionVideo == null) return null;
    if (sessionVideo is String) return sessionVideo;
    if (sessionVideo is Map) {
      return sessionVideo['url'] as String?;
    }
    return null;
  }
  
  SessionModel({
    required this.id,
    this.patientId,
    this.patientName,
    this.physiotherapistId,
    this.physiotherapistName,
    this.physioId,
    this.doctorId,
    this.doctorName,
    this.sessionDate,
    this.scheduledDate,
    this.status,
    this.sessionType,
    this.sessionVideo,
    this.videoUrl,
    this.notes,
    this.startTime,
    this.endTime,
    this.durationMinutes,
    this.actualDuration,
    this.surgeryType,
    this.createdAt,
    this.updatedAt,
  });
  
  factory SessionModel.fromJson(Map<String, dynamic> json) {
    // Handle patientId - it can be a string, ObjectId, or populated object
    String? extractPatientId(dynamic patientId) {
      if (patientId == null) return null;
      if (patientId is String) return patientId;
      if (patientId is Map) return patientId['_id']?.toString();
      return patientId.toString();
    }
    
    // Handle patientName - can be in patientId object (when populated) or patient field
    String? extractPatientName(dynamic patientId, dynamic patient) {
      if (patientId is Map) {
        return patientId['name'] ?? patientId['Fullname'];
      }
      if (patient is Map) {
        return patient['name'] ?? patient['Fullname'];
      }
      return json['patientName'] as String?;
    }
    
    return SessionModel(
      id: json['_id'] ?? json['id'] ?? '',
      patientId: extractPatientId(json['patientId']) ?? json['patient']?['_id']?.toString(),
      patientName: extractPatientName(json['patientId'], json['patient']) ?? json['patientName'],
      physiotherapistId: json['physiotherapistId']?.toString() ?? json['physiotherapist']?['_id']?.toString() ?? json['physio']?['_id']?.toString(),
      physiotherapistName: json['physiotherapist']?['name'] ?? json['physiotherapist']?['Fullname'] ?? json['physio']?['name'] ?? json['physiotherapistName'],
      physioId: json['physioId']?.toString() ?? json['physio']?['_id']?.toString(),
      doctorId: json['doctorId']?.toString() ?? json['doctor']?['_id']?.toString(),
      doctorName: json['doctor']?['name'] ?? json['doctor']?['Fullname'] ?? json['doctorName'],
      sessionDate: json['sessionDate'] != null
          ? DateTime.parse(json['sessionDate'])
          : null,
      scheduledDate: json['scheduledDate'] != null
          ? DateTime.parse(json['scheduledDate'])
          : (json['sessionDate'] != null ? DateTime.parse(json['sessionDate']) : null),
      status: json['status'],
      sessionType: json['sessionType'] ?? 'in-person',
      sessionVideo: _parseSessionVideo(json['sessionVideo']),
      videoUrl: json['videoUrl'] as String? ?? _parseSessionVideo(json['sessionVideo']),
      notes: json['notes'],
      startTime: json['startTime'] != null ? DateTime.parse(json['startTime']) : null,
      endTime: json['endTime'] != null ? DateTime.parse(json['endTime']) : null,
      durationMinutes: json['durationMinutes'],
      actualDuration: json['actualDuration'],
      surgeryType: json['surgeryType'],
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
      'patientId': patientId,
      'patientName': patientName,
      'physiotherapistId': physiotherapistId,
      'physiotherapistName': physiotherapistName,
      'doctorId': doctorId,
      'doctorName': doctorName,
      'scheduledDate': scheduledDate?.toIso8601String(),
      'status': status,
      'sessionType': sessionType,
      'videoUrl': videoUrl,
      'notes': notes,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }
  
  bool get isPending => status == 'pending' || status == 'scheduled';
  bool get isActive => status == 'active' || status == 'in-progress' || status == 'ongoing';
  bool get isCompleted => status == 'completed';
  bool get isCancelled => status == 'cancelled';
  bool get isMissed => status == 'missed';
  
  bool get canJoinVideo {
    if (sessionVideo == null || sessionVideo!.isEmpty) return false;
    if (status != 'active' && status != 'pending' && status != 'in-progress' && status != 'ongoing') return false;
    return true;
  }
  
  DateTime? get displayDate => sessionDate ?? scheduledDate;
}

