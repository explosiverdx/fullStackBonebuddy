// App Constants
class AppConstants {
  // User Roles
  static const String rolePatient = 'patient';
  static const String roleDoctor = 'doctor';
  static const String rolePhysiotherapist = 'physiotherapist';
  static const String roleAdmin = 'admin';
  
  // Storage Keys
  static const String keyAccessToken = 'access_token';
  static const String keyRefreshToken = 'refresh_token';
  static const String keyUserData = 'user_data';
  static const String keyIsLoggedIn = 'is_logged_in';
  
  // Session Status
  static const String sessionPending = 'pending';
  static const String sessionActive = 'active';
  static const String sessionCompleted = 'completed';
  static const String sessionCancelled = 'cancelled';
  
  // Payment Status
  static const String paymentPending = 'pending';
  static const String paymentSuccess = 'success';
  static const String paymentFailed = 'failed';
  
  // Blog Categories
  static const List<String> blogCategories = [
    'Physiotherapy',
    'Recovery Tips',
    'Success Stories',
    'News',
    'Health & Wellness',
    'Exercise',
    'Other'
  ];
  
  // Service IDs
  static const Map<String, String> serviceIds = {
    'knee-replacement-rehab': 'Knee Replacement Rehab',
    'spinal-surgery-rehab': 'Spinal Surgery Rehab',
    'hip-replacement-rehab': 'Hip Replacement Rehab',
    'ankle-surgery-rehab': 'Ankle Surgery Rehab',
    'elbow-surgery-rehab': 'Elbow Surgery Rehab',
    'wrist-surgery-rehab': 'Wrist Surgery Rehab',
    'shoulder-surgery-rehab': 'Shoulder Surgery Rehab',
    'trauma-post-surgery': 'Trauma Post-Surgery',
    'sports-injury-recovery': 'Sports Injury Recovery',
    'neurosurgery-rehab': 'Neurosurgery Rehab',
  };
}

