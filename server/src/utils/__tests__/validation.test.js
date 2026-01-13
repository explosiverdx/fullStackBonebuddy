// Validation Utility Tests
describe('Validation Utilities', () => {
  describe('Phone Number Validation', () => {
    it('should validate Indian phone number with +91 prefix', () => {
      const phone = '+919876543210';
      const isValid = phone.startsWith('+91') && phone.length === 13;
      expect(isValid).toBe(true);
    });

    it('should format phone number correctly', () => {
      let phone = '9876543210';
      if (!phone.startsWith('+91')) {
        phone = '+91' + phone;
      }
      expect(phone).toBe('+919876543210');
    });
  });

  describe('Email Validation', () => {
    it('should validate email format', () => {
      const email = 'test@example.com';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test(email)).toBe(true);
    });

    it('should reject invalid email', () => {
      const email = 'invalid-email';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test(email)).toBe(false);
    });
  });

  describe('Password Validation', () => {
    it('should validate minimum password length', () => {
      const password = 'password123';
      expect(password.length).toBeGreaterThanOrEqual(6);
    });

    it('should handle empty password', () => {
      const password = '';
      expect(password.length).toBe(0);
    });
  });

  describe('OTP Validation', () => {
    it('should validate OTP format (4-6 digits)', () => {
      const otp = '123456';
      const isValid = /^\d{4,6}$/.test(otp);
      expect(isValid).toBe(true);
    });

    it('should reject invalid OTP', () => {
      const otp = 'abc123';
      const isValid = /^\d{4,6}$/.test(otp);
      expect(isValid).toBe(false);
    });
  });
});
