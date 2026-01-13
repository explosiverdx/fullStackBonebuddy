class BlogModel {
  final String id;
  final String title;
  final String? content;
  final String? excerpt;
  final String? image;
  final String? category;
  final String? author;
  final String? authorPhoto;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final String? slug;
  
  BlogModel({
    required this.id,
    required this.title,
    this.content,
    this.excerpt,
    this.image,
    this.category,
    this.author,
    this.authorPhoto,
    this.createdAt,
    this.updatedAt,
    this.slug,
  });
  
  factory BlogModel.fromJson(Map<String, dynamic> json) {
    // Handle featuredImage - can be a string URL or an object with url property
    String? imageUrl;
    if (json['featuredImage'] != null) {
      if (json['featuredImage'] is String) {
        imageUrl = json['featuredImage'];
      } else if (json['featuredImage'] is Map) {
        imageUrl = json['featuredImage']['url'] ?? json['featuredImage']['secure_url'];
      }
    }
    // Fallback to image field
    imageUrl ??= json['image'];
    
    // Handle author - can be object with Fullname or fullName
    String? authorName;
    if (json['author'] != null) {
      if (json['author'] is String) {
        authorName = json['author'];
      } else if (json['author'] is Map) {
        authorName = json['author']['Fullname'] ?? 
                     json['author']['fullName'] ?? 
                     json['author']['name'];
      }
    }
    authorName ??= json['authorName'];
    
    // Handle author photo
    String? authorPhotoUrl;
    if (json['author'] != null && json['author'] is Map) {
      authorPhotoUrl = json['author']['avatar'] ?? json['author']['photo'];
    }
    authorPhotoUrl ??= json['authorPhoto'];
    
    return BlogModel(
      id: json['_id'] ?? json['id'] ?? '',
      title: json['title'] ?? '',
      content: json['content'],
      excerpt: json['excerpt'] ?? json['description'],
      image: imageUrl,
      category: json['category'],
      author: authorName,
      authorPhoto: authorPhotoUrl,
      createdAt: json['createdAt'] != null 
          ? DateTime.tryParse(json['createdAt'].toString()) 
          : null,
      updatedAt: json['updatedAt'] != null 
          ? DateTime.tryParse(json['updatedAt'].toString()) 
          : null,
      slug: json['slug'],
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'title': title,
      'content': content,
      'excerpt': excerpt,
      'image': image,
      'category': category,
      'author': author,
      'authorPhoto': authorPhoto,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'slug': slug,
    };
  }
}

