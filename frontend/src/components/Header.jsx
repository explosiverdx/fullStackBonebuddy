import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const servicesData = [
  {
    id: 'knee-replacement-rehab',
    title: 'Knee Replacement Rehab',
  },
  {
    id: 'spinal-surgery-rehab',
    title: 'Spinal Surgery Rehab',
  },
  {
    id: 'hip-replacement-rehab',
    title: 'Hip Replacement Rehab',
  },
  {
    id: 'ankle-surgery-rehab',
    title: 'Ankle Surgery Rehab',
  },
  {
    id: 'elbow-surgery-rehab',
    title: 'Elbow Surgery Rehab',
  },
  {
    id: 'wrist-surgery-rehab',
    title: 'Wrist Surgery Rehab',
  },
  {
    id: 'shoulder-surgery-rehab',
    title: 'Shoulder Surgery Rehab',
  },
  {
    id: 'trauma-post-surgery',
    title: 'Trauma Post-Surgery',
  },
  {
    id: 'sports-injury-recovery',
    title: 'Sports Injury Recovery',
  },
  {
    id: 'neurosurgery-rehab',
    title: 'Neurosurgery Rehab',
  },
];

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isServicesDropdownOpen, setIsServicesDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const menuButtonRef = useRef(null);
  const servicesDropdownRef = useRef(null);
  const notificationRef = useRef(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleNotifications = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Notifications state - populated from API
  const [notifications, setNotifications] = useState([]);

  // Fetch notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) {
        setNotifications([]);
        return;
      }
      
      try {
        const response = await fetch('/api/v1/notifications', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          const notifs = data.data.notifications || [];
          
          // Transform to match UI format
          setNotifications(notifs.map(n => ({
            id: n._id,
            type: n.type,
            message: n.message,
            time: getTimeAgo(new Date(n.createdAt)),
            read: n.read,
            actionUrl: n.actionUrl
          })));
        } else {
          setNotifications([]);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
      }
    };

    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Helper function to format time ago
  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
      }
    }
    return 'Just now';
  };

  // Mark notification as read
  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read
      await fetch(`/api/v1/notifications/${notification.id}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        credentials: 'include'
      });

      // Update local state
      setNotifications(prev => prev.map(n => 
        n.id === notification.id ? { ...n, read: true } : n
      ));

      // Navigate if there's an action URL
      if (notification.actionUrl) {
        navigate(notification.actionUrl);
        setIsNotificationOpen(false);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Handle mobile menu outside click
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target)
      ) {
        setIsMobileMenuOpen(false);
      }
      
      // Handle services dropdown outside click
      if (
        servicesDropdownRef.current &&
        !servicesDropdownRef.current.contains(event.target)
      ) {
        setIsServicesDropdownOpen(false);
      }

      // Handle notification dropdown outside click
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close mobile menu when clicking on links
  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-blue-100 backdrop-blur-sm shadow-lg fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 flex justify-between items-center h-14 sm:h-16 md:h-20 gap-2 sm:gap-4">
        <div className="logo-section flex-shrink-0 min-w-0">
          <Link to="/" className="logo-link flex items-center gap-1 sm:gap-2 md:gap-3">
            <div className="logo-circle w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20 flex-shrink-0">
              <img src="/assets/bone buddy logo-1.png" alt="BoneBuddy logo" className="w-full h-full object-cover" />
            </div>
            <span className="logo-text text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-Roboto whitespace-nowrap">BONEBUDDY</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="desktop-nav hidden lg:flex items-center gap-3 xl:gap-4 2xl:gap-6 flex-shrink-0">
          <Link to="/" className="nav-link text-xs xl:text-sm 2xl:text-base whitespace-nowrap">Home</Link>
          <Link to="/about" className="nav-link text-xs xl:text-sm 2xl:text-base whitespace-nowrap">About us</Link>
          <div 
            className="relative" 
            ref={servicesDropdownRef}
            onMouseEnter={() => setIsServicesDropdownOpen(true)}
            onMouseLeave={() => setIsServicesDropdownOpen(false)}
          >
            <Link to="/services" className="nav-link text-xs xl:text-sm 2xl:text-base whitespace-nowrap">Our Services</Link>
            {isServicesDropdownOpen && (
              <div className="services-dropdown">
                {servicesData.map((service) => (
                  <Link 
                    key={service.id} 
                    to={`/services/${service.id}`}
                    className="dropdown-item"
                  >
                    {service.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link to="/blog" className="nav-link text-xs xl:text-sm 2xl:text-base whitespace-nowrap">Blog</Link>
          <Link to="/contact" className="nav-link text-xs xl:text-sm 2xl:text-base whitespace-nowrap">Contact us</Link>
        </nav>

        {/* User Actions - Desktop */}
        <div className="desktop-cta hidden lg:flex items-center gap-2 xl:gap-3 2xl:gap-4 flex-shrink-0">
          {user ? (
            <>
              {/* Notification Icon */}
              <div className="relative" ref={notificationRef}>
                <button 
                  onClick={toggleNotifications}
                  className="relative p-1.5 sm:p-2 text-gray-600 hover:text-teal-600 transition-colors"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] sm:text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {isNotificationOpen && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No notifications
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                              !notification.read ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                                !notification.read ? 'bg-blue-500' : 'bg-gray-300'
                              }`}></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900">{notification.message}</p>
                                <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 border-t border-gray-200 text-center">
                      <button className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                        View All Notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Info - Clickable to go to profile */}
              <button 
                onClick={() => {
                  const profileRoutes = {
                    'patient': '/PatientProfile',
                    'doctor': '/DoctorProfile',
                    'physiotherapist': '/PhysiotherapistProfile',
                    'admin': '/admin'
                  };
                  const userType = user.userType || user.role;
                  navigate(profileRoutes[userType] || '/PatientProfile');
                }}
                className="flex items-center gap-1.5 xl:gap-2 hover:bg-gray-100 px-2 xl:px-3 py-1.5 xl:py-2 rounded transition-colors"
              >
                <div className="w-7 h-7 xl:w-8 xl:h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-semibold text-xs xl:text-sm flex-shrink-0">
                  {(user.Fullname || user.username || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="text-xs xl:text-sm font-medium text-gray-700 whitespace-nowrap hidden 2xl:inline">{user.Fullname || user.username}</span>
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="px-2.5 xl:px-3 2xl:px-4 py-1.5 xl:py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs xl:text-sm whitespace-nowrap"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/signUp" className="btn-signin text-xs xl:text-sm 2xl:text-base px-2.5 xl:px-3 2xl:px-4 py-1.5 xl:py-2 2xl:py-2.5 whitespace-nowrap rounded-md">SignUp</Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          id="mobile-menu-button"
          className="mobile-menu-btn w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 lg:hidden flex-shrink-0"
          onClick={toggleMobileMenu}
          ref={menuButtonRef}
          aria-label="Toggle menu"
        >
          <svg className="menu-icon w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>

      {/* Mobile Navigation */}
      <div
        id="mobile-menu"
        className={`mobile-nav ${isMobileMenuOpen ? '' : 'hidden'}`}
        ref={mobileMenuRef}
      >
        <div className="mobile-nav-links">
          <Link to="/" className="mobile-link" onClick={handleMobileLinkClick}>Home</Link>
          <Link to="/about" className="mobile-link" onClick={handleMobileLinkClick}>About us</Link>
          <Link to="/services" className="mobile-link" onClick={handleMobileLinkClick}>Our Services</Link>
          <Link to="/blog" className="mobile-link" onClick={handleMobileLinkClick}>Blog</Link>
          <Link to="/contact" className="mobile-link" onClick={handleMobileLinkClick}>Contact us</Link>
          {user ? (
            <>
              <button 
                onClick={() => {
                  const profileRoutes = {
                    'patient': '/PatientProfile',
                    'doctor': '/DoctorProfile',
                    'physiotherapist': '/PhysiotherapistProfile',
                    'admin': '/admin'
                  };
                  const userType = user.userType || user.role;
                  navigate(profileRoutes[userType] || '/PatientProfile');
                  handleMobileLinkClick();
                }}
                className="px-4 py-2 text-gray-700 border-t hover:bg-gray-100 text-left"
              >
                <p className="text-sm font-medium">👤 My Profile</p>
                <p className="text-xs text-gray-500">{user.Fullname || user.username}</p>
              </button>
              <button 
                onClick={() => {
                  handleLogout();
                  handleMobileLinkClick();
                }} 
                className="mobile-btn bg-red-500 hover:bg-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/signUp" className="mobile-btn text-sm sm:text-base px-4 py-2.5 sm:py-3 rounded-md" onClick={handleMobileLinkClick}>SignIn/SignUp</Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
