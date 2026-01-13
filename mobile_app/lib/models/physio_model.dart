class PhysioModel {
  final String id;
  final String name;
  final String? qualification;
  final String? specialization;
  final String? experience;
  final String? profilePhoto;
  final String? bio;
  final String? email;
  final String? contact;
  final int? consultationFee;
  final List<String>? availableDays;
  final int? patientsAssigned;
  
  PhysioModel({
    required this.id,
    required this.name,
    this.qualification,
    this.specialization,
    this.experience,
    this.profilePhoto,
    this.bio,
    this.email,
    this.contact,
    this.consultationFee,
    this.availableDays,
    this.patientsAssigned,
  });
  
  factory PhysioModel.fromJson(Map<String, dynamic> json) {
    return PhysioModel(
      id: json['_id']?.toString() ?? '',
      name: json['name'] ?? json['Fullname'] ?? 'Unknown',
      qualification: json['qualification'],
      specialization: json['specialization'],
      experience: json['experience']?.toString(),
      profilePhoto: json['profilePhoto'] ?? json['physioProfilePhoto'] ?? json['avatar'],
      bio: json['bio'],
      email: json['email'],
      contact: json['contact'] ?? json['mobile_number'],
      consultationFee: json['consultationFee'] is int 
          ? json['consultationFee'] 
          : (json['consultationFee'] is String 
              ? int.tryParse(json['consultationFee']) 
              : null),
      availableDays: json['availableDays'] != null 
          ? (json['availableDays'] is List 
              ? List<String>.from(json['availableDays']) 
              : [])
          : null,
      patientsAssigned: json['patientsAssigned'],
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'qualification': qualification,
      'specialization': specialization,
      'experience': experience,
      'profilePhoto': profilePhoto,
      'bio': bio,
      'email': email,
      'contact': contact,
      'consultationFee': consultationFee,
      'availableDays': availableDays,
      'patientsAssigned': patientsAssigned,
    };
  }
  
  // Helper getter for display
  String get displaySpecialty => specialization ?? 'Physiotherapist';
  
  String get displayExperience {
    if (experience == null) return '';
    if (experience!.contains('years') || experience!.contains('year')) {
      return experience!;
    }
    return '$experience years Experience';
  }
}

