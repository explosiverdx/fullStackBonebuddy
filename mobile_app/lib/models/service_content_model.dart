class ServiceContentModel {
  final String id;
  final String title;
  final String image;
  final List<ServiceSection> sections;
  
  ServiceContentModel({
    required this.id,
    required this.title,
    required this.image,
    required this.sections,
  });
}

class ServiceSection {
  final String title;
  final String? content;
  final List<String>? bulletPoints;
  final String? subtitle;
  
  ServiceSection({
    required this.title,
    this.content,
    this.bulletPoints,
    this.subtitle,
  });
}

