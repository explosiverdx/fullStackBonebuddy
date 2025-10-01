import React from 'react';
<<<<<<< HEAD
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
=======
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
>>>>>>> ac41f2888ab595bc1d6d09e0ce6c7df8ad58f7d9
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
<<<<<<< HEAD
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
=======
import Demo from './components/Demo';
>>>>>>> ac41f2888ab595bc1d6d09e0ce6c7df8ad58f7d9

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isSignInOpen = location.pathname === '/login';
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
<<<<<<< HEAD
        <Route path="/login" element={<Home />} />
        <Route path="/patient-signup" element={<ProtectedRoute allowedRoles={['patient']}><PatientSignup /></ProtectedRoute>} />
        <Route path="/user-profile" element={<Navigate to="/user" replace />} />
        <Route path="/user" element={<ProtectedRoute allowedRoles={['patient', 'admin', 'user']}><UserProfile /></ProtectedRoute>} />
        <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
=======
        <Route path="/signIn" element={<Home />} />
        <Route path="/patient-signup" element={<PatientSignup />} />
        <Route path="/user" element={<UserProfile />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
        <Route path="/demo/*" element={<Demo />} />
>>>>>>> ac41f2888ab595bc1d6d09e0ce6c7df8ad58f7d9
      </Routes>
      {!isAdminPage && !isDemoPage && <Footer />}
      <SignIn isOpen={isSignInOpen} onClose={closeSignIn} />
    </div>
  );
}

function AppWrapper() {
  return (
<<<<<<< HEAD
    <AuthProvider>
      <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <App />
      </Router>
    </AuthProvider>
=======
    <HelmetProvider>
      <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <App />
      </Router>
    </HelmetProvider>
>>>>>>> ac41f2888ab595bc1d6d09e0ce6c7df8ad58f7d9
  );
}

export default AppWrapper;
