import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // The user from context is the primary source of truth.
  // The user from location.state is a fallback for the exact moment of navigation after login.
  const finalUser = user || location.state?.user;

  if (loading && !finalUser) {
    return <div>Loading...</div>; // Only show loading if we truly have no user information yet.
  }

  if (!finalUser) {
    return <Navigate to="/" />;
  }

  const userType = finalUser.userType || finalUser.role;
  if (allowedRoles && !allowedRoles.includes(userType)) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
