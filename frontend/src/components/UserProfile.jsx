import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PatientProfile from './PatientProfile';
import DoctorProfile from './DoctorProfile';
import PhysiotherapistProfile from './PhysiotherapistProfile';

const UserProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.profileCompleted === false) {
      navigate('/userForm', { state: { phoneNumber: user.mobile_number } });
      return;
    }

    // Fetch user profile data from backend API
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/v1/users/me', {
          method: 'GET',
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setProfile(data.data);
        } else {
          alert('Failed to fetch profile data');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        alert('Error fetching profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 pt-20">
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-100 pt-20">
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">Profile not found</div>
        </div>
      </div>
    );
  }

  const renderRoleBasedProfile = () => {
    const role = profile.userType || profile.role;

    switch (role) {
      case 'patient':
      case 'user':
        return <PatientProfile profile={profile} />;
      case 'doctor':
        return <DoctorProfile />;
      case 'physiotherapist':
        return <PhysiotherapistProfile />;
      default:
        return <div className="p-6">Unknown role: {role}</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pt-20">
      <div className="container mx-auto px-4 py-8">
        {renderRoleBasedProfile()}
      </div>
    </div>
  );
};

export default UserProfile;
