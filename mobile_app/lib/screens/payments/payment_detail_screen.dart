import 'package:flutter/material.dart';
import '../../models/payment_model.dart';
import '../../services/payment_service.dart';
import '../../utils/helpers.dart';
import 'payment_handler.dart';

class PaymentDetailScreen extends StatefulWidget {
  final PaymentModel payment;
  
  const PaymentDetailScreen({super.key, required this.payment});

  @override
  State<PaymentDetailScreen> createState() => _PaymentDetailScreenState();
}

class _PaymentDetailScreenState extends State<PaymentDetailScreen> {
  final PaymentService _paymentService = PaymentService();
  bool _isProcessing = false;

  Future<void> _handlePayment() async {
    if (widget.payment.amount == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Invalid payment amount')),
      );
      return;
    }

    setState(() => _isProcessing = true);
    
    try {
      await PaymentHandler.initiatePayment(
        context: context,
        payment: widget.payment,
        paymentService: _paymentService,
      );
      
      // Refresh payment data
      if (mounted) {
        Navigator.pop(context, true); // Return true to indicate refresh needed
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Payment failed: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final payment = widget.payment;
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Payment Details'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Payment Status Card
            Card(
              color: payment.isSuccess 
                  ? Colors.green[50] 
                  : payment.isPending 
                      ? Colors.orange[50] 
                      : payment.isFailed 
                          ? Colors.red[50] 
                          : Colors.grey[50],
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Icon(
                      payment.isSuccess 
                          ? Icons.check_circle 
                          : payment.isPending 
                              ? Icons.pending 
                              : Icons.error,
                      size: 48,
                      color: payment.isSuccess 
                          ? Colors.green 
                          : payment.isPending 
                              ? Colors.orange 
                              : Colors.red,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      payment.status?.toUpperCase() ?? 'UNKNOWN',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: payment.isSuccess 
                            ? Colors.green[900] 
                            : payment.isPending 
                                ? Colors.orange[900] 
                                : Colors.red[900],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Payment Information
            _buildInfoRow('Amount', Helpers.formatCurrency(payment.amount)),
            if (payment.description != null)
              _buildInfoRow('Description', payment.description!),
            if (payment.paidAt != null)
              _buildInfoRow('Paid On', Helpers.formatDate(payment.paidAt)),
            if (payment.createdAt != null)
              _buildInfoRow('Created On', Helpers.formatDate(payment.createdAt)),
            if (payment.razorpayPaymentId != null)
              _buildInfoRow('Transaction ID', payment.razorpayPaymentId!),
            if (payment.razorpayOrderId != null)
              _buildInfoRow('Order ID', payment.razorpayOrderId!),
            
            const SizedBox(height: 32),
            
            // Pay Button (if pending or failed)
            if (payment.canRetry && !_isProcessing)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _handlePayment,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0066CC),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text(
                    'Pay Now',
                    style: TextStyle(fontSize: 18, color: Colors.white),
                  ),
                ),
              ),
            
            if (_isProcessing)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: CircularProgressIndicator(),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 16),
            ),
          ),
        ],
      ),
    );
  }
}

