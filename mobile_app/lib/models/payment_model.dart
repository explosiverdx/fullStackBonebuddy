class PaymentModel {
  final String id;
  final String? orderId;
  final String? razorpayOrderId;
  final String? razorpayPaymentId;
  final String? userId;
  final String? patientId;
  final String? patientName;
  final String? appointmentId;
  final String? sessionId;
  final double? amount;
  final String? status;
  final String? currency;
  final String? paymentType;
  final DateTime? paidAt;
  final DateTime? createdAt;
  final String? description;
  
  PaymentModel({
    required this.id,
    this.orderId,
    this.razorpayOrderId,
    this.razorpayPaymentId,
    this.userId,
    this.patientId,
    this.patientName,
    this.appointmentId,
    this.sessionId,
    this.amount,
    this.status,
    this.currency,
    this.paymentType,
    this.paidAt,
    this.createdAt,
    this.description,
  });
  
  factory PaymentModel.fromJson(Map<String, dynamic> json) {
    return PaymentModel(
      id: json['_id'] ?? json['id'] ?? '',
      orderId: json['orderId'],
      razorpayOrderId: json['razorpayOrderId'],
      razorpayPaymentId: json['razorpayPaymentId'],
      userId: json['userId']?.toString(),
      patientId: json['patientId']?.toString() ?? json['patient']?['_id']?.toString(),
      patientName: json['patient']?['Fullname'] ?? json['patientName'],
      appointmentId: json['appointmentId']?.toString(),
      sessionId: json['sessionId']?.toString(),
      amount: json['amount'] != null 
          ? (json['amount'] is int ? json['amount'].toDouble() : json['amount']?.toDouble())
          : null,
      status: json['status'],
      currency: json['currency'] ?? 'INR',
      paymentType: json['paymentType'],
      paidAt: json['paidAt'] != null
          ? DateTime.parse(json['paidAt'])
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : null,
      description: json['description'],
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'orderId': orderId,
      'razorpayOrderId': razorpayOrderId,
      'razorpayPaymentId': razorpayPaymentId,
      'patientId': patientId,
      'patientName': patientName,
      'amount': amount,
      'status': status,
      'currency': currency,
      'paidAt': paidAt?.toIso8601String(),
      'createdAt': createdAt?.toIso8601String(),
      'description': description,
    };
  }
  
  bool get isPending => status == 'pending';
  bool get isSuccess => status == 'completed' || status == 'success';
  bool get isFailed => status == 'failed';
  bool get isCancelled => status == 'cancelled';
  bool get canRetry => isPending || isFailed;
}

