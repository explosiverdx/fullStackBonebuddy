import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  const userType = user.userType || user.role;
  if (allowedRoles && !allowedRoles.includes(userType)) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
