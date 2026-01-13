// Helper utilities
class Helpers {
  // Get full image URL
  static String getImageUrl(String? imagePath) {
    if (imagePath == null || imagePath.isEmpty) {
      return '';
    }
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Add base URL if relative path
    return 'https://bonebuddy.cloud$imagePath';
  }
  
  // Format date
  static String formatDate(DateTime? date) {
    if (date == null) return '';
    return '${date.day}/${date.month}/${date.year}';
  }
  
  // Format currency
  static String formatCurrency(double? amount) {
    if (amount == null) return '₹0.00';
    return '₹${amount.toStringAsFixed(2)}';
  }
  
  // Validate email
  static bool isValidEmail(String email) {
    return RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email);
  }
  
  // Validate phone (10 digits)
  static bool isValidPhone(String phone) {
    return RegExp(r'^\d{10}$').hasMatch(phone);
  }
}

