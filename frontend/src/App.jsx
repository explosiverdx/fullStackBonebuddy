import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import './index.css'; // Import the main CSS file
import Header from './components/Header';
import Home from './components/Home';
import Services from './components/Services';
import About from './components/About';

import Pricing from './components/Pricing';
import Contact from './components/Contact';
import Footer from './components/Footer';
import SignIn from './components/SignIn';
import PatientSignup from './components/PatientSignup';
import AdminProfile from './components/AdminProfile';
import AdminDashboard from './components/AdminDashboard';
import UserProfile from './components/UserProfile';
import Demo from './components/Demo';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isSignInOpen = location.pathname === '/signIn';
  const isAdminPage = location.pathname.startsWith('/admin');
  const isDemoPage = location.pathname.startsWith('/demo');

  const closeSignIn = () => {
    navigate(-1);
  };

  return (
    <div className={`App ${isSignInOpen ? 'overflow-hidden' : ''}`}>
      {!isAdminPage && !isDemoPage && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/about" element={<About />} />
        
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/signIn" element={<Home />} />
        <Route path="/patient-signup" element={<PatientSignup />} />
        <Route path="/user" element={<UserProfile />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
        <Route path="/demo/*" element={<Demo />} />
      </Routes>
      {!isAdminPage && !isDemoPage && <Footer />}
      <SignIn isOpen={isSignInOpen} onClose={closeSignIn} />
    </div>
  );
}

function AppWrapper() {
  return (
    <HelmetProvider>
      <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <App />
      </Router>
    </HelmetProvider>
  );
}

export default AppWrapper;
