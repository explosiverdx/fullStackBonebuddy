import 'package:dio/dio.dart';
import '../config/app_config.dart';
import '../models/physio_model.dart';
import '../models/patient_model.dart';
import '../models/session_model.dart';
import '../services/api_service.dart';
import '../utils/helpers.dart';

class PhysioService {
  final ApiService _apiService = ApiService();
  late Dio _publicDio; // Separate Dio instance for public requests without auth
  
  PhysioService() {
    // Create a separate Dio instance for public requests (no auth headers)
    _publicDio = Dio(BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: AppConfig.connectTimeout,
      receiveTimeout: AppConfig.receiveTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
    ));
  }
  
  /// Fetch all physiotherapists with optional pagination and search
  /// Uses authenticated endpoint (but now has optional auth)
  Future<List<PhysioModel>> getAllPhysios({
    int page = 1,
    int limit = 50, // Get more to show all
    String? search,
    String sortBy = 'name',
    String sortOrder = 'asc',
  }) async {
    try {
      final queryParams = {
        'page': page.toString(),
        'limit': limit.toString(),
        'sortBy': sortBy,
        'sortOrder': sortOrder,
      };
      
      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }
      
      // Use public dio to avoid auth requirement
      final response = await _publicDio.get(
        '/physios/getAllPhysios',
        queryParameters: queryParams,
      );
      
      if (response.data != null && response.data['data'] != null) {
        final data = response.data['data'];
        
        // Handle both direct array and paginated response
        List<dynamic> physiosList;
        if (data['docs'] != null) {
          physiosList = data['docs'];
        } else if (data is List) {
          physiosList = data;
        } else {
          physiosList = [];
        }
        
        return physiosList
            .map((json) => PhysioModel.fromJson(json))
            .toList();
      }
      
      return [];
    } catch (e) {
      print('Error fetching physiotherapists: $e');
      rethrow;
    }
  }
  
  /// Fetch all physiotherapists from public endpoint (no authentication required)
  /// For use on public pages like home screen
  Future<List<PhysioModel>> getPublicPhysios({
    int page = 1,
    int limit = 50,
    String? search,
    String sortBy = 'name',
    String sortOrder = 'asc',
  }) async {
    try {
      final queryParams = {
        'page': page.toString(),
        'limit': limit.toString(),
        'sortBy': sortBy,
        'sortOrder': sortOrder,
      };
      
      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }
      
      // Try public endpoint first, fallback to getAllPhysios if public doesn't exist
      Response response;
      try {
        print('Calling /physios/public endpoint...');
        response = await _publicDio.get(
          '/physios/public',
          queryParameters: queryParams,
        );
        print('Public endpoint response status: ${response.statusCode}');
      } catch (e) {
        print('Public endpoint error: $e');
        // If public endpoint doesn't exist (404), try getAllPhysios (optional auth)
        if (e is DioException && (e.response?.statusCode == 404 || e.response?.statusCode == null)) {
          print('Public endpoint not available (404), trying getAllPhysios...');
          try {
            response = await _publicDio.get(
              '/physios/getAllPhysios',
              queryParameters: queryParams,
            );
            print('getAllPhysios response status: ${response.statusCode}');
          } catch (fallbackErr) {
            print('getAllPhysios also failed: $fallbackErr');
            rethrow;
          }
        } else {
          rethrow;
        }
      }
      
      if (response.data != null && response.data['data'] != null) {
        final data = response.data['data'];
        
        // Handle both direct array and paginated response
        List<dynamic> physiosList;
        if (data['docs'] != null) {
          physiosList = data['docs'];
        } else if (data is List) {
          physiosList = data;
        } else {
          physiosList = [];
        }
        
        return physiosList
            .map((json) => PhysioModel.fromJson(json))
            .toList();
      }
      
      return [];
    } catch (e) {
      print('Error fetching public physiotherapists: $e');
      if (e is DioException) {
        print('Status code: ${e.response?.statusCode}');
        print('Response: ${e.response?.data}');
      }
      rethrow;
    }
  }
  
  /// Get a single physiotherapist by ID
  Future<PhysioModel?> getPhysioById(String id) async {
    try {
      final response = await _apiService.get('/physios/$id');
      
      if (response.data != null && response.data['data'] != null) {
        return PhysioModel.fromJson(response.data['data']);
      }
      
      return null;
    } catch (e) {
      print('Error fetching physiotherapist: $e');
      return null;
    }
  }

  /// Get patients and sessions for the logged-in physiotherapist
  Future<Map<String, dynamic>> getMyPatientsAndSessions() async {
    try {
      final response = await _apiService.get('/physios/my-patients-sessions');
      
      if (response.data != null && response.data['data'] != null) {
        final data = response.data['data'];
        
        // Parse patients
        List<PatientModel> patients = [];
        if (data['patients'] != null && data['patients'] is List) {
          patients = (data['patients'] as List)
              .map((json) => PatientModel.fromJson(json))
              .toList();
        }
        
        // Parse sessions
        List<SessionModel> sessions = [];
        if (data['sessions'] != null && data['sessions'] is List) {
          sessions = (data['sessions'] as List)
              .map((json) => SessionModel.fromJson(json))
              .toList();
        }
        
        return {
          'patients': patients,
          'sessions': sessions,
          'stats': data['stats'] ?? {},
        };
      }
      
      return {
        'patients': <PatientModel>[],
        'sessions': <SessionModel>[],
        'stats': {},
      };
    } catch (e) {
      print('Error fetching patients and sessions: $e');
      rethrow;
    }
  }
}

