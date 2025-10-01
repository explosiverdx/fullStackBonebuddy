import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
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
import Appointment from './components/Appointment';
import Demo from './components/Demo';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isSignInOpen = location.pathname === '/login';
  const isAdminPage = location.pathname.startsWith('/admin');

  const closeSignIn = () => {
    navigate(-1);
  };

  return (
    <div className={`App ${isSignInOpen ? 'overflow-hidden' : ''}`}>
      {!isAdminPage && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/about" element={<About />} />
        <Route path="/appointment" element={<Appointment />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Home />} />
        <Route path="/demo/*" element={<Demo />} />
        <Route path="/patient-signup" element={<ProtectedRoute allowedRoles={['patient']}><PatientSignup /></ProtectedRoute>} />
        <Route path="/user-profile" element={<Navigate to="/user" replace />} />
        <Route path="/user" element={<ProtectedRoute allowedRoles={['patient', 'admin', 'user']}><UserProfile /></ProtectedRoute>} />
        <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      </Routes>
      {!isAdminPage && <Footer />}
      <SignIn isOpen={isSignInOpen} onClose={closeSignIn} />
    </div>
  );
}

function AppWrapper() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <App />
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default AppWrapper;
