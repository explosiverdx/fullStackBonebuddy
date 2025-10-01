import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const BottomNavigation = () => {
  const location = useLocation();

  const navItems = [
    {
      path: '/demo',
      label: 'Home',
      icon: '🏠'
    },
    {
      path: '/demo/patients',
      label: 'My Patients',
      icon: '👥'
    },
    {
      path: '/demo/refer',
      label: 'Refer',
      icon: '⚙️',
      tooltip: 'Doctor referring patient to physiotherapy'
    }
  ];

  const getLinkClass = (path) => {
    const currentPath = location.pathname;
    if (path === '/demo' && currentPath === '/demo') {
        return 'bg-blue-100 text-blue-600';
    }
    if (path !== '/demo' && currentPath.startsWith(path)) {
        return 'bg-blue-100 text-blue-600';
    }
    return 'text-gray-600 hover:text-gray-900';
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 md:hidden">
      <div className="flex justify-around items-center py-2 px-2 sm:px-4">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            title={item.tooltip || ''}
            className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors ${
              getLinkClass(item.path)
            }`}
          >
            <span className="text-lg sm:text-xl mb-1">{item.icon}</span>
            <span className="text-xs sm:text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
