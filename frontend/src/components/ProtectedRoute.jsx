import React from 'react';
<<<<<<< HEAD
import { Navigate } from 'react-router-dom';
=======
import { Navigate, useLocation } from 'react-router-dom';
>>>>>>> 62d8ea7 (Error resolved)
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
<<<<<<< HEAD

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  const userType = user.userType || user.role;
=======
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
>>>>>>> 62d8ea7 (Error resolved)
  if (allowedRoles && !allowedRoles.includes(userType)) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
