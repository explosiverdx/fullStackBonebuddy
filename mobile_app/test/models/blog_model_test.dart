import 'package:flutter_test/flutter_test.dart';
import 'package:bone_buddy_app/models/blog_model.dart';

void main() {
  group('BlogModel', () {
    test('should create BlogModel from JSON with all fields', () {
      final json = {
        '_id': 'blog123',
        'title': 'Test Blog Post',
        'content': 'This is the full content of the blog post.',
        'excerpt': 'This is a short excerpt.',
        'image': 'https://example.com/image.jpg',
        'category': 'Health',
        'author': 'John Doe',
        'authorPhoto': 'https://example.com/author.jpg',
        'createdAt': '2024-01-15T10:00:00Z',
        'updatedAt': '2024-01-16T10:00:00Z',
        'slug': 'test-blog-post',
      };

      final blog = BlogModel.fromJson(json);

      expect(blog.id, 'blog123');
      expect(blog.title, 'Test Blog Post');
      expect(blog.content, 'This is the full content of the blog post.');
      expect(blog.excerpt, 'This is a short excerpt.');
      expect(blog.image, 'https://example.com/image.jpg');
      expect(blog.category, 'Health');
      expect(blog.author, 'John Doe');
      expect(blog.authorPhoto, 'https://example.com/author.jpg');
      expect(blog.slug, 'test-blog-post');
      expect(blog.createdAt, isNotNull);
      expect(blog.updatedAt, isNotNull);
    });

    test('should handle featuredImage as string', () {
      final json = {
        '_id': 'blog123',
        'title': 'Test Blog',
        'featuredImage': 'https://example.com/image.jpg',
      };

      final blog = BlogModel.fromJson(json);
      expect(blog.image, 'https://example.com/image.jpg');
    });

    test('should handle featuredImage as object with url', () {
      final json = {
        '_id': 'blog123',
        'title': 'Test Blog',
        'featuredImage': {
          'url': 'https://example.com/image.jpg',
        },
      };

      final blog = BlogModel.fromJson(json);
      expect(blog.image, 'https://example.com/image.jpg');
    });

    test('should handle featuredImage as object with secure_url', () {
      final json = {
        '_id': 'blog123',
        'title': 'Test Blog',
        'featuredImage': {
          'secure_url': 'https://example.com/secure-image.jpg',
        },
      };

      final blog = BlogModel.fromJson(json);
      expect(blog.image, 'https://example.com/secure-image.jpg');
    });

    test('should handle author as object with Fullname', () {
      final json = {
        '_id': 'blog123',
        'title': 'Test Blog',
        'author': {
          'Fullname': 'John Doe',
          'avatar': 'https://example.com/avatar.jpg',
        },
      };

      final blog = BlogModel.fromJson(json);
      expect(blog.author, 'John Doe');
      expect(blog.authorPhoto, 'https://example.com/avatar.jpg');
    });

    test('should handle author as object with fullName', () {
      final json = {
        '_id': 'blog123',
        'title': 'Test Blog',
        'author': {
          'fullName': 'Jane Doe',
          'photo': 'https://example.com/photo.jpg',
        },
      };

      final blog = BlogModel.fromJson(json);
      expect(blog.author, 'Jane Doe');
      expect(blog.authorPhoto, 'https://example.com/photo.jpg');
    });

    test('should handle author as string', () {
      final json = {
        '_id': 'blog123',
        'title': 'Test Blog',
        'author': 'John Doe',
      };

      final blog = BlogModel.fromJson(json);
      expect(blog.author, 'John Doe');
    });

    test('should handle excerpt fallback to description', () {
      final json = {
        '_id': 'blog123',
        'title': 'Test Blog',
        'description': 'This is a description.',
      };

      final blog = BlogModel.fromJson(json);
      expect(blog.excerpt, 'This is a description.');
    });

    test('should handle alternate id field', () {
      final json = {
        'id': 'blog123',
        'title': 'Test Blog',
      };

      final blog = BlogModel.fromJson(json);
      expect(blog.id, 'blog123');
    });

    test('should convert BlogModel to JSON', () {
      final blog = BlogModel(
        id: 'blog123',
        title: 'Test Blog Post',
        content: 'Full content',
        excerpt: 'Short excerpt',
        image: 'https://example.com/image.jpg',
        category: 'Health',
        author: 'John Doe',
        authorPhoto: 'https://example.com/author.jpg',
        createdAt: DateTime.parse('2024-01-15T10:00:00Z'),
        updatedAt: DateTime.parse('2024-01-16T10:00:00Z'),
        slug: 'test-blog-post',
      );

      final json = blog.toJson();

      expect(json['_id'], 'blog123');
      expect(json['title'], 'Test Blog Post');
      expect(json['content'], 'Full content');
      expect(json['excerpt'], 'Short excerpt');
      expect(json['image'], 'https://example.com/image.jpg');
      expect(json['category'], 'Health');
      expect(json['author'], 'John Doe');
      expect(json['authorPhoto'], 'https://example.com/author.jpg');
      expect(json['slug'], 'test-blog-post');
    });

    test('should handle null dates', () {
      final json = {
        '_id': 'blog123',
        'title': 'Test Blog',
        'createdAt': null,
        'updatedAt': null,
      };

      final blog = BlogModel.fromJson(json);
      expect(blog.createdAt, isNull);
      expect(blog.updatedAt, isNull);
    });

    test('should handle invalid date strings', () {
      final json = {
        '_id': 'blog123',
        'title': 'Test Blog',
        'createdAt': 'invalid-date',
      };

      final blog = BlogModel.fromJson(json);
      expect(blog.createdAt, isNull);
    });
  });
}
