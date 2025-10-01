import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.jsx';

const DoctorProfileScreen = () => {
  const { currentUser, logout } = useAppContext();
  const navigate = useNavigate();

  if (!currentUser) {
    return <div className="p-4">You have been logged out.</div>;
  }

  const menuItems = [
    { label: 'Home', path: '/' },
    { label: 'Change address', path: '/change-address' },
    { label: 'Privacy policy', path: '/privacy-policy' },
    { label: 'Help', path: '/help' },
    { label: 'Change Mobile no', path: '/change-mobile' },
    { label: 'Logout', action: 'logout' },
  ];

  const handleMenuItemClick = (item) => {
    if (item.path) {
      navigate(item.path);
    } else if (item.action === 'logout') {
      logout();
      // Redirect to home or login page after logout
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-4 w-full">
      <div className="bg-white rounded-lg p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
          {currentUser.initials}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl sm:text-3xl font-semibold">{currentUser.name}</h2>
          <p className="text-gray-600 sm:text-lg">{currentUser.contact}</p>
        </div>
        <button
          onClick={() => handleMenuItemClick({ path: '/demo/edit-profile' })}
          className="ml-auto px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200 font-medium self-start sm:self-center"
          aria-label="Edit profile"
        >
          Edit
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => handleMenuItemClick(item)}
            className="w-full p-4 text-left hover:bg-gray-50 active:bg-gray-100 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 flex justify-between items-center border-b border-gray-100 last:border-b-0"
            aria-label={item.label}
          >
            <span className="font-medium text-gray-900">{item.label}</span>
            <svg
              className="w-5 h-5 text-gray-400 transform transition-transform duration-200 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DoctorProfileScreen;
