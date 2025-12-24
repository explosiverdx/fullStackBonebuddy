import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const LoginRedirector = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Don't do anything until the user object is loaded
    if (loading) {
      return;
    }

    if (!user) {
      // If for some reason user is not logged in, go to home
      navigate('/');
      return;
    }

    // Check if the user needs to complete their profile
    if (!user.profileCompleted) {
      navigate('/userForm', { replace: true });
    } else {
      const userType = user.userType;
      const profileRoutes = {
        patient: '/PatientProfile',
        doctor: '/DoctorProfile',
        physiotherapist: '/PhysiotherapistProfile',
        admin: '/admin',
        user: '/user', // Fallback for generic user
      };
      navigate(profileRoutes[userType] || '/user', { replace: true });
    }
  }, [user, loading, navigate]);

  // Render a loading indicator while redirecting
  return <div className="flex items-center justify-center h-screen">Loading your dashboard...</div>;
};

export default LoginRedirector;