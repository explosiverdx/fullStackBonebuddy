import 'package:dio/dio.dart';
import '../models/payment_model.dart';
import 'api_service.dart';

class PaymentService {
  final ApiService _apiService = ApiService();
  
  // Get user payments
  Future<List<PaymentModel>> getUserPayments() async {
    final response = await _apiService.get('/payments');
    
    List<dynamic> paymentsList = [];
    if (response.data != null) {
      if (response.data['data'] != null) {
        if (response.data['data']['docs'] != null) {
          paymentsList = response.data['data']['docs'];
        } else if (response.data['data'] is List) {
          paymentsList = response.data['data'];
        }
      } else if (response.data is List) {
        paymentsList = response.data;
      }
    }
    
    return paymentsList
        .map((json) => PaymentModel.fromJson(json))
        .toList();
  }
  
  // Get Razorpay key
  Future<String> getRazorpayKey() async {
    try {
      print('🔑 Fetching Razorpay key from server...');
      final response = await _apiService.get('/payments/razorpay/key');
      
      print('🔑 Razorpay key response status: ${response.statusCode}');
      print('🔑 Response data: ${response.data}');
      
      if (response.data != null && 
          response.data['data'] != null) {
        final key = response.data['data']['key'];
        // Check if key exists and is valid (not null, undefined, or empty)
        if (key != null && 
            key != 'null' && 
            key != 'undefined' && 
            key.toString().trim().isNotEmpty) {
          print('✅ Razorpay key retrieved successfully');
          return key.toString().trim();
        } else {
          print('❌ Razorpay key is empty or invalid: $key');
        }
      } else {
        print('❌ Invalid response structure: ${response.data}');
      }
      
      throw Exception('Razorpay payment gateway is not configured on the server.\n\n'
                     'To fix this:\n'
                     '1. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to server/.env file\n'
                     '2. Restart the server\n'
                     '3. Note: The mobile app does NOT need its own .env file');
    } on DioException catch (e) {
      print('❌ DioException getting Razorpay key: ${e.type}');
      print('   Status: ${e.response?.statusCode}');
      print('   Data: ${e.response?.data}');
      print('   Message: ${e.message}');
      
      String errorMessage = 'Failed to get Razorpay key';
      
      if (e.type == DioExceptionType.connectionTimeout || 
          e.type == DioExceptionType.receiveTimeout) {
        errorMessage = 'Connection timeout. Please check your internet connection and try again.';
      } else if (e.type == DioExceptionType.connectionError) {
        errorMessage = 'Cannot connect to server. Please check if the server is running and accessible.';
      } else if (e.response != null && e.response!.data != null) {
        final errorData = e.response!.data;
        if (errorData is Map) {
          errorMessage = errorData['message'] ?? 
                        errorData['error'] ?? 
                        errorMessage;
          // Check if key is null/undefined in response
          if (errorData['data'] != null && 
              (errorData['data']['key'] == null || 
               errorData['data']['key'] == 'null' || 
               errorData['data']['key'] == 'undefined')) {
            errorMessage = 'Razorpay payment gateway is not configured on the server.\n\n'
                          'To fix this:\n'
                          '1. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to server/.env file\n'
                          '2. Restart the server\n'
                          '3. Note: The mobile app does NOT need its own .env file';
          }
        }
      }
      
      throw Exception(errorMessage);
    } catch (e) {
      print('❌ General error getting Razorpay key: $e');
      final errorStr = e.toString();
      if (errorStr.contains('not configured') || 
          errorStr.contains('RAZORPAY_KEY_ID')) {
        throw Exception('Razorpay payment gateway is not configured on the server.\n\n'
                       'To fix this:\n'
                       '1. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to server/.env file\n'
                       '2. Restart the server\n'
                       '3. Note: The mobile app does NOT need its own .env file');
      }
      rethrow;
    }
  }
  
  // Create Razorpay payment order
  Future<Map<String, dynamic>> createRazorpayOrder({
    String? existingPaymentId,
    String? appointmentId,
    String? sessionId,
    required double amount,
    required String description,
    String? paymentType,
  }) async {
    try {
      print('💳 Creating Razorpay order...');
      print('   Amount: $amount');
      print('   Description: $description');
      print('   ExistingPaymentId: $existingPaymentId');
      print('   AppointmentId: $appointmentId');
      print('   SessionId: $sessionId');
      
      final requestData = <String, dynamic>{
        if (existingPaymentId != null && existingPaymentId.isNotEmpty) 
          'existingPaymentId': existingPaymentId,
        if (appointmentId != null && appointmentId.isNotEmpty) 
          'appointmentId': appointmentId,
        if (sessionId != null && sessionId.isNotEmpty) 
          'sessionId': sessionId,
        'amount': amount,
        'description': description.isNotEmpty ? description : 'Payment for BoneBuddy services',
        if (paymentType != null && paymentType.isNotEmpty) 
          'paymentType': paymentType,
      };
      
      print('💳 Request data: $requestData');
      
      final response = await _apiService.post(
        '/payments/razorpay/order',
        data: requestData,
      );
      
      print('💳 Order created successfully: ${response.statusCode}');
      print('💳 Response data: ${response.data}');
      
      if (response.data != null && response.data['data'] != null) {
        return response.data['data'];
      } else {
        throw Exception('Invalid response format from server');
      }
    } on DioException catch (e) {
      print('❌ DioException creating order: ${e.type}');
      print('   Status: ${e.response?.statusCode}');
      print('   Data: ${e.response?.data}');
      print('   Message: ${e.message}');
      
      // Extract server error message if available
      String errorMessage = 'Failed to create payment order';
      if (e.response != null && e.response!.data != null) {
        final errorData = e.response!.data;
        if (errorData is Map) {
          // Get the actual error message from server
          errorMessage = errorData['message'] ?? 
                        errorData['error'] ?? 
                        errorData['data']?.toString() ??
                        errorMessage;
          
          // Check for specific error cases
          if (errorMessage.contains('Patient profile not found')) {
            errorMessage = 'Please create a patient profile first to make payments.';
          } else if (errorMessage.contains('Only users with') && errorMessage.contains('patient')) {
            errorMessage = 'Only patients can create payment orders. Please ensure you are logged in as a patient.';
          } else if (errorMessage.contains('not configured') || 
                     errorMessage.contains('RAZORPAY_KEY')) {
            // This shouldn't happen if website works, but handle it anyway
            errorMessage = 'Razorpay payment gateway configuration issue on server. Please contact support.';
          }
        }
      } else if (e.type == DioExceptionType.connectionTimeout || 
                 e.type == DioExceptionType.receiveTimeout) {
        errorMessage = 'Connection timeout. Please check your internet connection.';
      } else if (e.type == DioExceptionType.connectionError) {
        errorMessage = 'Cannot connect to server. Please check if the server is running.';
      }
      
      throw Exception('$errorMessage (${e.response?.statusCode ?? 'Network error'})');
    } catch (e) {
      print('❌ General error creating order: $e');
      throw Exception('Failed to create payment order: ${e.toString()}');
    }
  }
  
  // Verify Razorpay payment
  Future<PaymentModel> verifyRazorpayPayment({
    required String paymentId,
    required String razorpayOrderId,
    required String razorpayPaymentId,
    required String razorpaySignature,
  }) async {
    final response = await _apiService.post(
      '/payments/razorpay/verify',
      data: {
        'paymentId': paymentId,
        'razorpay_order_id': razorpayOrderId,
        'razorpay_payment_id': razorpayPaymentId,
        'razorpay_signature': razorpaySignature,
      },
    );
    return PaymentModel.fromJson(response.data['data']);
  }
  
  // Create payment order (legacy)
  Future<Map<String, dynamic>> createPaymentOrder({
    required double amount,
    String? description,
  }) async {
    final response = await _apiService.post(
      '/payments/create-order',
      data: {
        'amount': amount,
        'description': description,
      },
    );
    return response.data['data'];
  }
  
  // Verify payment (legacy)
  Future<Map<String, dynamic>> verifyPayment({
    required String orderId,
    required String paymentId,
    required String signature,
  }) async {
    final response = await _apiService.post(
      '/payments/verify',
      data: {
        'orderId': orderId,
        'paymentId': paymentId,
        'signature': signature,
      },
    );
    return response.data['data'];
  }
}
