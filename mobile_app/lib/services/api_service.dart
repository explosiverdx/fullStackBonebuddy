import 'dart:convert';
import 'package:dio/dio.dart';
import '../config/app_config.dart';
import '../utils/storage_helper.dart';

class ApiService {
  late Dio _dio;
  bool _isRefreshing = false;
  final List<({Function() resolve, Function(DioException) reject})> _failedQueue = [];
  
  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: AppConfig.connectTimeout,
      receiveTimeout: AppConfig.receiveTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
    ));
    
    _setupInterceptors();
  }
  
  void _setupInterceptors() {
    // Request Interceptor - Add token
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await StorageHelper.getAccessToken();
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        options.headers['Content-Type'] = 'application/json';
        handler.next(options);
      },
      onError: (error, handler) async {
        final retryKey = '_retry';
        final hasRetried = error.requestOptions.extra[retryKey] == true;
        
        if (error.response?.statusCode == 401 && !hasRetried) {
          error.requestOptions.extra[retryKey] = true;
          
          if (_isRefreshing) {
            // Queue the request
            return _queueRequest(() => _dio.fetch(error.requestOptions), (e) => handler.reject(e));
          }
          
          _isRefreshing = true;
          
          try {
            final refreshToken = await StorageHelper.getRefreshToken();
            if (refreshToken == null) {
              await StorageHelper.clearAll();
              _processQueue(null);
              return handler.reject(error);
            }
            
            final response = await _dio.post(
              '/users/refresh-token',
              data: {'refreshToken': refreshToken},
            );
            
            if (response.data != null && response.data['data'] != null) {
              final accessToken = response.data['data']['accessToken'];
              final newRefreshToken = response.data['data']['refreshToken'];
              
              await StorageHelper.saveAccessToken(accessToken);
              if (newRefreshToken != null) {
                await StorageHelper.saveRefreshToken(newRefreshToken);
              }
              
              // Retry original request
              error.requestOptions.headers['Authorization'] = 'Bearer $accessToken';
              final opts = error.requestOptions;
              final res = await _dio.fetch(opts);
              _processQueue(null);
              _isRefreshing = false;
              return handler.resolve(res);
            }
          } catch (e) {
            await StorageHelper.clearAll();
            _processQueue(e is DioException ? e : null);
            _isRefreshing = false;
            return handler.reject(error);
          }
        }
        
        handler.next(error);
      },
    ));
  }
  
  void _queueRequest(Function() resolve, Function(DioException) reject) {
    _failedQueue.add((resolve: resolve, reject: reject));
  }
  
  void _processQueue(DioException? error) {
    for (var item in _failedQueue) {
      if (error != null) {
        item.reject(error);
      } else {
        item.resolve();
      }
    }
    _failedQueue.clear();
  }
  
  // GET Request
  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) async {
    try {
      return await _dio.get(path, queryParameters: queryParameters);
    } catch (e) {
      rethrow;
    }
  }
  
  // POST Request
  Future<Response> post(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    try {
      return await _dio.post(path, data: data, queryParameters: queryParameters);
    } catch (e) {
      rethrow;
    }
  }
  
  // PUT Request
  Future<Response> put(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    try {
      return await _dio.put(path, data: data, queryParameters: queryParameters);
    } catch (e) {
      rethrow;
    }
  }
  
  // DELETE Request
  Future<Response> delete(String path, {Map<String, dynamic>? queryParameters}) async {
    try {
      return await _dio.delete(path, queryParameters: queryParameters);
    } catch (e) {
      rethrow;
    }
  }
  
  // Upload File
  Future<Response> uploadFile(
    String path,
    String filePath, {
    String fieldName = 'file',
    Map<String, dynamic>? additionalData,
  }) async {
    try {
      final formData = FormData.fromMap({
        if (additionalData != null) ...additionalData,
        fieldName: await MultipartFile.fromFile(filePath),
      });
      
      final token = await StorageHelper.getAccessToken();
      return await _dio.post(
        path,
        data: formData,
        options: Options(
          headers: {
            if (token != null) 'Authorization': 'Bearer $token',
            'Content-Type': 'multipart/form-data',
          },
        ),
      );
    } catch (e) {
      rethrow;
    }
  }
}


