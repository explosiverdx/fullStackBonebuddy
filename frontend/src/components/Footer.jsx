import React from 'react';

const Footer = () => {
  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-brand">
          <div className="footer-logo">
            <img src="/assets/BoneBuddy_Logo-modified.png" alt="BoneBuddy logo" />
          </div>
          <span className="footer-logo-text">BONEBUDDY</span>
          <p>Providing expert physiotherapy and rehabilitation services to help you recover and live pain-free.</p>
          <div className="footer-social">
            <a href="#"><i className="fab fa-facebook-f"></i></a>
            <a href="#"><i className="fab fa-twitter"></i></a>
            <a href="#"><i className="fab fa-instagram"></i></a>
            <a href="#"><i className="fab fa-linkedin-in"></i></a>
          </div>
        </div>

        <div className="footer-links">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#about">About Us</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>

        <div className="footer-contact">
          <h3>Contact Us</h3>
          <p><i className="fas fa-map-marker-alt"></i> Plot No.44, A-Block, Indira Nagar, Lucknow, 226010</p>
          <p><i className="fas fa-phone"></i> +91 8881119890</p>
          <p><i className="fas fa-envelope"></i> info@bonebuddy.com</p>
          <p><i className="fas fa-clock"></i> Mon-Sat: 8AM-6PM</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2025 BoneBuddy. All rights reserved.</p>
        <div className="footer-policy">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Cookie Policy</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;