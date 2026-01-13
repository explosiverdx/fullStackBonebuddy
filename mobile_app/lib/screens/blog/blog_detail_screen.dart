import 'package:flutter/material.dart';
import '../../services/blog_service.dart';
import '../../models/blog_model.dart';
import '../../utils/helpers.dart';

class BlogDetailScreen extends StatefulWidget {
  final String slug;
  
  const BlogDetailScreen({super.key, required this.slug});

  @override
  State<BlogDetailScreen> createState() => _BlogDetailScreenState();
}

class _BlogDetailScreenState extends State<BlogDetailScreen> {
  final BlogService _blogService = BlogService();
  BlogModel? _blog;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadBlog();
  }

  Future<void> _loadBlog() async {
    try {
      final blog = await _blogService.getBlogBySlug(widget.slug);
      setState(() {
        _blog = blog;
        _isLoading = false;
      });
    } catch (e) {
      // Try by ID if slug fails
      try {
        final blog = await _blogService.getBlogById(widget.slug);
        setState(() {
          _blog = blog;
          _isLoading = false;
        });
      } catch (e2) {
        setState(() => _isLoading = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error loading blog: ${e.toString()}')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Blog Post'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _blog == null
              ? const Center(child: Text('Blog not found'))
              : SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (_blog!.image != null)
                        Image.network(
                          Helpers.getImageUrl(_blog!.image),
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return Container(
                              height: 200,
                              color: Colors.grey[300],
                              child: const Icon(Icons.article, size: 50),
                            );
                          },
                        ),
                      Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (_blog!.category != null)
                              Chip(
                                label: Text(_blog!.category!),
                                backgroundColor: Colors.blue[50],
                              ),
                            const SizedBox(height: 8),
                            Text(
                              _blog!.title,
                              style: const TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            if (_blog!.author != null || _blog!.createdAt != null) ...[
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  if (_blog!.author != null) ...[
                                    const Icon(Icons.person, size: 16),
                                    const SizedBox(width: 4),
                                    Text(_blog!.author!),
                                  ],
                                  if (_blog!.author != null && _blog!.createdAt != null)
                                    const Text(' • '),
                                  if (_blog!.createdAt != null)
                                    Text(
                                      Helpers.formatDate(_blog!.createdAt),
                                      style: TextStyle(color: Colors.grey[600]),
                                    ),
                                ],
                              ),
                            ],
                            const Divider(height: 32),
                            if (_blog!.content != null)
                              Text(
                                _blog!.content!,
                                style: const TextStyle(fontSize: 16, height: 1.6),
                              )
                            else if (_blog!.excerpt != null)
                              Text(
                                _blog!.excerpt!,
                                style: const TextStyle(fontSize: 16, height: 1.6),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }
}

