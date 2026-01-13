import 'package:flutter/material.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../../models/payment_model.dart';
import '../../services/payment_service.dart';

class PaymentHandler {
  static Razorpay? _razorpay;
  static PaymentService? _currentPaymentService;
  static PaymentModel? _currentPayment;
  static BuildContext? _currentContext;
  static Function(bool)? _onComplete;

  static Future<void> initiatePayment({
    required BuildContext context,
    required PaymentModel payment,
    required PaymentService paymentService,
    Function(bool)? onComplete,
  }) async {
    _currentContext = context;
    _currentPayment = payment;
    _currentPaymentService = paymentService;
    _onComplete = onComplete;

    try {
      // Validate payment amount
      if (payment.amount == null || payment.amount! <= 0) {
        throw Exception('Invalid payment amount');
      }

      // Get Razorpay key
      String razorpayKey;
      try {
        razorpayKey = await paymentService.getRazorpayKey();
      } catch (e) {
        // If key retrieval fails, it's likely not configured
        if (e.toString().contains('not configured') || e.toString().contains('null')) {
          throw Exception('Razorpay payment gateway is not configured on the server.\n\nPlease add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the server\'s .env file.');
        }
        rethrow;
      }
      
      if (razorpayKey.isEmpty || razorpayKey == 'null' || razorpayKey == 'undefined') {
        throw Exception('Razorpay payment gateway is not configured on the server.\n\nPlease add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the server\'s .env file.');
      }

      // Only send existingPaymentId if payment can be retried (pending or failed status)
      // and has a valid ID
      String? existingPaymentIdToSend;
      if (payment.canRetry && payment.id.isNotEmpty) {
        existingPaymentIdToSend = payment.id;
      }
      
      // Create order
      final orderData = await paymentService.createRazorpayOrder(
        existingPaymentId: existingPaymentIdToSend,
        appointmentId: payment.appointmentId?.isNotEmpty == true ? payment.appointmentId : null,
        sessionId: payment.sessionId?.isNotEmpty == true ? payment.sessionId : null,
        amount: payment.amount!,
        description: payment.description?.isNotEmpty == true 
            ? payment.description! 
            : 'Payment for BoneBuddy services',
        paymentType: payment.paymentType?.isNotEmpty == true ? payment.paymentType : null,
      );
      
      // Validate order data
      if (orderData['orderId'] == null) {
        throw Exception('Failed to create payment order: Order ID not received');
      }

      // Initialize Razorpay
      _razorpay = Razorpay();
      _razorpay!.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
      _razorpay!.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
      _razorpay!.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);

      // Open Razorpay checkout
      var options = {
        'key': razorpayKey,
        'amount': (payment.amount! * 100).toInt(), // Amount in paise
        'name': 'BoneBuddy',
        'description': payment.description ?? 'Payment',
        'order_id': orderData['orderId'],
        'prefill': {
          'contact': '',
          'email': '',
        },
        'external': {
          'wallets': ['paytm']
        }
      };

      _razorpay!.open(options);
    } catch (e) {
      String errorMessage = 'Failed to initiate payment';
      final errorStr = e.toString();
      
      if (errorStr.contains('Patient profile not found')) {
        errorMessage = 'Please create a patient profile first to make payments.';
      } else if (errorStr.contains('not configured') || 
                 errorStr.contains('RAZORPAY_KEY_ID') ||
                 errorStr.contains('RAZORPAY_KEY_SECRET')) {
        errorMessage = 'Razorpay payment gateway is not configured on the server.\n\n'
                       'To enable payments:\n'
                       '1. Get Razorpay API keys from https://dashboard.razorpay.com/\n'
                       '2. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to server .env file\n'
                       '3. Restart the server';
      } else if (errorStr.contains('500')) {
        errorMessage = 'Server error occurred. Please try again later or contact support.\n\n'
                       'If the issue persists, check server logs for details.';
      } else {
        // Extract just the message part
        errorMessage = errorStr.replaceAll('Exception: ', '');
        if (errorMessage.length > 200) {
          errorMessage = errorMessage.substring(0, 200) + '...';
        }
      }
      
      if (_currentContext != null && _currentContext!.mounted) {
        ScaffoldMessenger.of(_currentContext!).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 5),
          ),
        );
      }
      _cleanup();
      rethrow;
    }
  }

  static void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    try {
      if (_currentPayment == null || _currentPaymentService == null) {
        return;
      }

      // Verify payment
      await _currentPaymentService!.verifyRazorpayPayment(
        paymentId: _currentPayment!.id,
        razorpayOrderId: response.orderId ?? '',
        razorpayPaymentId: response.paymentId ?? '',
        razorpaySignature: response.signature ?? '',
      );

      if (_currentContext != null && _currentContext!.mounted) {
        ScaffoldMessenger.of(_currentContext!).showSnackBar(
          const SnackBar(
            content: Text('Payment successful!'),
            backgroundColor: Colors.green,
          ),
        );
      }

      if (_onComplete != null) {
        _onComplete!(true);
      }
    } catch (e) {
      if (_currentContext != null && _currentContext!.mounted) {
        ScaffoldMessenger.of(_currentContext!).showSnackBar(
          SnackBar(
            content: Text('Payment verification failed: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
      if (_onComplete != null) {
        _onComplete!(false);
      }
    } finally {
      _cleanup();
    }
  }

  static void _handlePaymentError(PaymentFailureResponse response) {
    if (_currentContext != null && _currentContext!.mounted) {
      ScaffoldMessenger.of(_currentContext!).showSnackBar(
        SnackBar(
          content: Text('Payment failed: ${response.message ?? 'Unknown error'}'),
          backgroundColor: Colors.red,
        ),
      );
    }
    if (_onComplete != null) {
      _onComplete!(false);
    }
    _cleanup();
  }

  static void _handleExternalWallet(ExternalWalletResponse response) {
    if (_currentContext != null && _currentContext!.mounted) {
      ScaffoldMessenger.of(_currentContext!).showSnackBar(
        SnackBar(content: Text('External wallet selected: ${response.walletName}')),
      );
    }
  }

  static void _cleanup() {
    if (_razorpay != null) {
      _razorpay!.clear();
      _razorpay = null;
    }
    _currentPayment = null;
    _currentPaymentService = null;
    _currentContext = null;
    _onComplete = null;
  }

  static void dispose() {
    _cleanup();
  }
}

