import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Auth Utils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should handle localStorage operations', () => {
    localStorage.setItem('test', 'value');
    expect(localStorage.getItem('test')).toBe('value');
    
    localStorage.removeItem('test');
    expect(localStorage.getItem('test')).toBeNull();
  });

  it('should handle token storage', () => {
    const token = 'test-token-123';
    localStorage.setItem('accessToken', token);
    expect(localStorage.getItem('accessToken')).toBe(token);
  });

  it('should handle user data storage', () => {
    const userData = { id: '123', name: 'Test User' };
    localStorage.setItem('user', JSON.stringify(userData));
    const retrieved = JSON.parse(localStorage.getItem('user'));
    expect(retrieved).toEqual(userData);
  });
});
