import React, { useState, useEffect, useMemo } from 'react';
import { AuthContext } from './AuthContextValue';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await fetch('/api/v1/users/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            },
          });
          if (response.ok) {
            const data = await response.json();
            setUser(data.data);
          } else {
            // Token might be expired, try refresh or clear
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
        } catch {
          // Auth check failed, clear tokens
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = (userData, accessToken, refreshToken) => {
    setUser(userData);
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await fetch('/api/v1/users/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  // Create authHeaders dynamically - updates when user changes
  const authHeaders = useMemo(() => {
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, authHeaders }}>
      {children}
    </AuthContext.Provider>
  );
};
