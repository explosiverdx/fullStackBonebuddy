import '../models/blog_model.dart';
import '../config/app_config.dart';
import 'api_service.dart';

class BlogService {
  final ApiService _apiService = ApiService();
  
  // Get all blogs with pagination
  Future<Map<String, dynamic>> getBlogs({
    int page = 1,
    int limit = AppConfig.blogPageSize,
    String? category,
  }) async {
    try {
      final queryParams = {
        'page': page,
        'limit': limit,
        if (category != null && category.isNotEmpty) 'category': category,
      };
      
      print('📝 Fetching blogs with params: $queryParams');
      final response = await _apiService.get('/blogs', queryParameters: queryParams);
      
      print('📝 Blog API response structure: ${response.data.keys}');
      print('📝 Blog API data structure: ${response.data['data']?.keys}');
      
      // Handle different response structures
      final data = response.data['data'];
      if (data == null) {
        print('❌ No data in response');
        return {
          'blogs': <BlogModel>[],
          'totalPages': 1,
          'currentPage': page,
          'total': 0,
        };
      }
      
      // Check if it's a paginated response (from aggregatePaginate)
      List<dynamic> blogsList;
      int totalPages = 1;
      int currentPage = page;
      int total = 0;
      
      if (data['docs'] != null) {
        // Paginated response structure
        blogsList = data['docs'] as List;
        totalPages = data['totalPages'] ?? data['totalpages'] ?? 1;
        currentPage = data['page'] ?? page;
        total = data['totalDocs'] ?? data['total'] ?? 0;
      } else if (data is List) {
        // Direct list response
        blogsList = data;
      } else {
        print('❌ Unexpected response structure: ${data.runtimeType}');
        blogsList = [];
      }
      
      final blogs = blogsList
          .map((json) {
            try {
              return BlogModel.fromJson(json);
            } catch (e) {
              print('❌ Error parsing blog: $e');
              print('   Blog JSON: $json');
              return null;
            }
          })
          .whereType<BlogModel>()
          .toList();
      
      print('✅ Loaded ${blogs.length} blogs (page $currentPage of $totalPages)');
      
      return {
        'blogs': blogs,
        'totalPages': totalPages,
        'currentPage': currentPage,
        'total': total,
      };
    } catch (e) {
      print('❌ Error fetching blogs: $e');
      rethrow;
    }
  }
  
  // Get blog by slug or ID (server uses same endpoint)
  Future<BlogModel> getBlogBySlug(String slug) async {
    try {
      print('📝 Fetching blog by slug: $slug');
      final response = await _apiService.get('/blogs/$slug');
      print('📝 Blog detail response: ${response.data.keys}');
      
      final data = response.data['data'];
      if (data == null) {
        throw Exception('No blog data found');
      }
      
      return BlogModel.fromJson(data);
    } catch (e) {
      print('❌ Error fetching blog by slug: $e');
      rethrow;
    }
  }
  
  // Get blog by ID (same endpoint as slug)
  Future<BlogModel> getBlogById(String id) async {
    try {
      print('📝 Fetching blog by ID: $id');
      final response = await _apiService.get('/blogs/$id');
      
      final data = response.data['data'];
      if (data == null) {
        throw Exception('No blog data found');
      }
      
      return BlogModel.fromJson(data);
    } catch (e) {
      print('❌ Error fetching blog by ID: $e');
      rethrow;
    }
  }
}

