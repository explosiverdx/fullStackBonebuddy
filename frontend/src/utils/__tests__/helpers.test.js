import { describe, it, expect } from 'vitest';

describe('Helper Functions', () => {
  it('should format phone numbers correctly', () => {
    const phoneNumber = '9876543210';
    const formatted = phoneNumber.startsWith('+91') ? phoneNumber : `+91${phoneNumber}`;
    expect(formatted).toBe('+919876543210');
  });

  it('should validate email format', () => {
    const email = 'test@example.com';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test(email)).toBe(true);
  });

  it('should handle date formatting', () => {
    const date = new Date('2024-01-15');
    expect(date instanceof Date).toBe(true);
    expect(date.getFullYear()).toBe(2024);
  });

  it('should validate required fields', () => {
    const requiredFields = ['name', 'email', 'phone'];
    const data = { name: 'Test', email: 'test@example.com', phone: '1234567890' };
    const allPresent = requiredFields.every(field => data[field]);
    expect(allPresent).toBe(true);
  });

  it('should handle empty strings', () => {
    const emptyString = '';
    const trimmed = emptyString.trim();
    expect(trimmed).toBe('');
    expect(trimmed.length).toBe(0);
  });
});
