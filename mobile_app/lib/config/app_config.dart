// App Configuration
class AppConfig {
  // API Base URL - Update this with your production URL
  static const String apiBaseUrl = 'https://bonebuddy.cloud/api/v1';
  // For local development, use your IP address:
  // static const String apiBaseUrl = 'http://192.168.1.100:5000/api/v1';
  
  // App Information
  static const String appName = 'BoneBuddy';
  static const String appVersion = '1.0.0';
  
  // Razorpay Configuration (if needed for payments)
  static const String razorpayKeyId = 'YOUR_RAZORPAY_KEY_ID';
  
  // Timeouts
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
  
  // Pagination
  static const int defaultPageSize = 10;
  static const int blogPageSize = 9;
  
  // Image Upload
  static const int maxImageSizeMB = 10;
  static const int maxVideoSizeMB = 100;
  
  // Cache Duration
  static const Duration cacheExpiration = Duration(hours: 1);
}
