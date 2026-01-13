import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/blog_service.dart';
import '../../models/blog_model.dart';
import '../../widgets/bottom_nav_bar.dart';
import '../../utils/helpers.dart';
import 'blog_detail_screen.dart';

class BlogListScreen extends StatefulWidget {
  const BlogListScreen({super.key});

  @override
  State<BlogListScreen> createState() => _BlogListScreenState();
}

class _BlogListScreenState extends State<BlogListScreen> {
  final BlogService _blogService = BlogService();
  List<BlogModel> _blogs = [];
  String? _selectedCategory;
  int _currentPage = 1;
  int _totalPages = 1;
  bool _isLoading = false;
  final ScrollController _scrollController = ScrollController();

  final List<String> _categories = [
    'All Posts',
    'Physiotherapy',
    'Recovery Tips',
    'Success Stories',
    'News',
    'Health & Wellness',
    'Exercise',
    'Other',
  ];

  @override
  void initState() {
    super.initState();
    _loadBlogs();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent * 0.9) {
      if (_currentPage < _totalPages && !_isLoading) {
        _loadBlogs(loadMore: true);
      }
    }
  }

  Future<void> _loadBlogs({bool loadMore = false}) async {
    if (_isLoading) return;
    
    setState(() => _isLoading = true);
    
    try {
      final page = loadMore ? _currentPage + 1 : 1;
      final category = _selectedCategory == 'All Posts' || _selectedCategory == null
          ? null
          : _selectedCategory;
      
      final result = await _blogService.getBlogs(
        page: page,
        category: category,
      );
      
      setState(() {
        if (loadMore) {
          _blogs.addAll(result['blogs'] as List<BlogModel>);
        } else {
          _blogs = result['blogs'] as List<BlogModel>;
        }
        _currentPage = result['currentPage'] as int;
        _totalPages = result['totalPages'] as int;
      });
    } catch (e) {
      print('❌ Error loading blogs: $e');
      if (mounted) {
        setState(() {
          if (!loadMore) {
            _blogs = [];
          }
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading blogs: ${e.toString()}'),
            duration: const Duration(seconds: 4),
            action: SnackBarAction(
              label: 'Retry',
              onPressed: () => _loadBlogs(),
            ),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Blog'),
      ),
      body: Column(
        children: [
          // Category Filter
          SizedBox(
            height: 50,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              itemCount: _categories.length,
              itemBuilder: (context, index) {
                final category = _categories[index];
                final isSelected = _selectedCategory == category ||
                    (_selectedCategory == null && category == 'All Posts');
                
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: FilterChip(
                    label: Text(category),
                    selected: isSelected,
                    onSelected: (selected) {
                      setState(() {
                        _selectedCategory = selected ? category : null;
                        _currentPage = 1;
                      });
                      _loadBlogs();
                    },
                    selectedColor: const Color(0xFF0066CC),
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : Colors.black,
                    ),
                  ),
                );
              },
            ),
          ),
          
          // Blog List
          Expanded(
            child: _isLoading && _blogs.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : _blogs.isEmpty
                    ? const Center(child: Text('No blogs found'))
                    : RefreshIndicator(
                        onRefresh: _loadBlogs,
                        child: ListView.builder(
                          controller: _scrollController,
                          padding: const EdgeInsets.all(16),
                          itemCount: _blogs.length + (_isLoading ? 1 : 0),
                          itemBuilder: (context, index) {
                            if (index == _blogs.length) {
                              return const Center(
                                child: Padding(
                                  padding: EdgeInsets.all(16.0),
                                  child: CircularProgressIndicator(),
                                ),
                              );
                            }
                            
                            final blog = _blogs[index];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 16),
                              child: InkWell(
                                onTap: () {
                                  if (blog.slug != null) {
                                    context.push('/blog/${blog.slug}');
                                  } else {
                                    context.push('/blog/${blog.id}');
                                  }
                                },
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    if (blog.image != null)
                                      ClipRRect(
                                        borderRadius: const BorderRadius.vertical(
                                          top: Radius.circular(12),
                                        ),
                                        child: Image.network(
                                          Helpers.getImageUrl(blog.image),
                                          height: 200,
                                          fit: BoxFit.cover,
                                          errorBuilder: (context, error, stackTrace) {
                                            return Container(
                                              height: 200,
                                              color: Colors.grey[300],
                                              child: const Icon(Icons.article, size: 50),
                                            );
                                          },
                                        ),
                                      ),
                                    Padding(
                                      padding: const EdgeInsets.all(16.0),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          if (blog.category != null)
                                            Chip(
                                              label: Text(
                                                blog.category!,
                                                style: const TextStyle(fontSize: 12),
                                              ),
                                              backgroundColor: Colors.blue[50],
                                            ),
                                          const SizedBox(height: 8),
                                          Text(
                                            blog.title,
                                            style: const TextStyle(
                                              fontSize: 18,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                          if (blog.excerpt != null) ...[
                                            const SizedBox(height: 8),
                                            Text(
                                              blog.excerpt!,
                                              style: TextStyle(
                                                color: Colors.grey[600],
                                              ),
                                              maxLines: 3,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ],
                                          if (blog.createdAt != null) ...[
                                            const SizedBox(height: 8),
                                            Text(
                                              Helpers.formatDate(blog.createdAt),
                                              style: TextStyle(
                                                fontSize: 12,
                                                color: Colors.grey[500],
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
      bottomNavigationBar: const BottomNavBar(currentIndex: 2),
    );
  }
}

