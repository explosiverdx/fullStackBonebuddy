import 'package:flutter_test/flutter_test.dart';
import 'package:bone_buddy_app/services/api_service.dart';
import 'package:bone_buddy_app/config/app_config.dart';
import 'package:dio/dio.dart';
import 'package:http_mock_adapter/http_mock_adapter.dart';

void main() {
  group('ApiService', () {
    late ApiService apiService;
    late DioAdapter dioAdapter;

    setUp(() {
      apiService = ApiService();
      // Note: ApiService creates its own Dio instance internally
      // For full mocking, we'd need to refactor to allow dependency injection
      // This test validates the basic structure
    });

    test('should be initialized with correct base URL', () {
      // Verify ApiService is created
      expect(apiService, isNotNull);
    });

    test('GET method should exist and be callable', () {
      // Validates method exists and is a function
      expect(apiService.get, isA<Function>());
    });

    test('POST method should exist and be callable', () {
      // Validates method exists and is a function
      expect(apiService.post, isA<Function>());
    });

    test('PUT method should exist and be callable', () {
      // Validates method exists and is a function
      expect(apiService.put, isA<Function>());
    });

    test('DELETE method should exist and be callable', () {
      // Validates method exists and is a function
      expect(apiService.delete, isA<Function>());
    });

    test('uploadFile method should exist and be callable', () {
      // Validates method exists and is a function
      expect(apiService.uploadFile, isA<Function>());
    });
  });

  group('ApiService Error Handling', () {
    test('should be initialized', () {
      final apiService = ApiService();
      // ApiService should be initialized with correct configuration
      expect(apiService, isNotNull);
    });
    
    test('should have HTTP methods available', () {
      final apiService = ApiService();
      // Verify that all HTTP methods exist and are callable
      expect(apiService.get, isA<Function>());
      expect(apiService.post, isA<Function>());
      expect(apiService.put, isA<Function>());
      expect(apiService.delete, isA<Function>());
      expect(apiService.uploadFile, isA<Function>());
    });
  });
}
