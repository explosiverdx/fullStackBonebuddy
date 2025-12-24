import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const TopBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold text-teal-600">BoneBuddy</h1>
      </div>
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <button className="relative p-2 text-gray-600 hover:text-teal-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 7v5l-5 5V7h5z" />
          </svg>
          {/* Notification badge */}
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">3</span>
        </button>

        {/* User Avatar */}
        <div className="flex items-center space-x-2">
          <img
            src={user?.avatar || '/default-avatar.png'}
            alt="User Avatar"
            className="w-8 h-8 rounded-full object-cover border-2 border-teal-600"
          />
          <span className="text-sm font-medium text-gray-700">{user?.Fullname || 'User'}</span>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default TopBar;
