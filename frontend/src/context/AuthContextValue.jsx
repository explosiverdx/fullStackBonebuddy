import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifiedMobile, setVerifiedMobile] = useState(null);

  // Fetch current user on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get('/api/v1/users/me', { withCredentials: true });
        if (response.status === 200) {
          setUser(response.data.data);
          if (response.data.data.mobile_number) {
            setVerifiedMobile(response.data.data.mobile_number);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const login = (userData, accessToken) => {
    setUser(userData);
    if (userData && userData.mobile_number) {
      setVerifiedMobile(userData.mobile_number);
    }
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    }
  };

  const logout = () => {
    setUser(null);
    setVerifiedMobile(null);
    localStorage.removeItem('accessToken');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, verifiedMobile, setVerifiedMobile }}>
      {children}
    </AuthContext.Provider>
  );
};
