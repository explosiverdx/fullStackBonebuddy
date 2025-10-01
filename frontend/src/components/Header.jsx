import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const menuButtonRef = useRef(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target)
      ) {
        setIsMobileMenuOpen(false);
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
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-20">
        <div className="logo-section">
          <Link to="/" className="logo-link">
            <div className="logo-circle">
              <img src="/assets/BoneBuddy_Logo-modified.webp" alt="BoneBuddy logo" />
            </div>
            <span className="logo-text">BONEBUDDY</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/services" className="nav-link">Services</Link>
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/pricing" className="nav-link">Pricing</Link>
          <Link to="/contact" className="nav-link">Contact</Link>
        </nav>

        {/* Book Appointment */}
        <div className="desktop-cta">
          <Link to="/appointment" className="btn-appointment">Book Appointment</Link>
          <Link to="/login" className="btn-signin">SignUp</Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          id="mobile-menu-button"
          className="mobile-menu-btn"
          onClick={toggleMobileMenu}
          ref={menuButtonRef}
        >
          <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <Link to="/services" className="mobile-link" onClick={handleMobileLinkClick}>Services</Link>
          <Link to="/about" className="mobile-link" onClick={handleMobileLinkClick}>About</Link>
          <Link to="/pricing" className="mobile-link" onClick={handleMobileLinkClick}>Pricing</Link>
          <Link to="/contact" className="mobile-link" onClick={handleMobileLinkClick}>Contact</Link>
          <Link to="/appointment" className="mobile-btn" onClick={handleMobileLinkClick}>Book Appointment</Link>
          <Link to="/login" className="mobile-btn" onClick={handleMobileLinkClick}>SignIn/SignUp</Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
