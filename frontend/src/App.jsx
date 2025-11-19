import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Blog from './components/Blog';
import BlogPost from './components/BlogPost'; // Import the Blog component
import './index.css'; // Import the main CSS file
import Header from './components/Header';
import Home from './components/Home';
import Services from './components/Services';
import KneeReplacementRehab from './components/ServicesContentPages/KneeReplacementRehab';
import SpinalSurgeryRehab from './components/ServicesContentPages/SpinalSurgeryRehab';
import HipReplacementRehab from './components/ServicesContentPages/HipReplacementRehab';
import AnkleSurgeryRehab from './components/ServicesContentPages/AnkleSurgeryRehab';
import ElbowSurgeryRehab from './components/ServicesContentPages/ElbowSurgeryRehab';
import WristSurgeryRehab from './components/ServicesContentPages/WristSurgeryRehab';
import ShoulderSurgeryRehab from './components/ServicesContentPages/ShoulderSurgeryRehab';
import TraumaPostSurgery from './components/ServicesContentPages/TraumaPostSurgery';
import SportsInjuryRecovery from './components/ServicesContentPages/SportsInjuryRecovery';
import NeurosurgeryRehab from './components/ServicesContentPages/NeurosurgeryRehab';
import About from './components/About';

import Contact from './components/Contact';
import Footer from './components/Footer';
import SignIn from './components/SignIn';
import PatientSignup from './components/PatientSignup';
import SignUpForm from './components/SignUpForm';
import AdminProfile from './components/AdminProfile';
import AdminDashboard from './components/AdminDashboard';
import AdminLoginGate from './components/AdminLoginGate';
import UserProfile from './components/UserProfile';
import PatientProfile from './components/PatientProfile';
import DoctorProfile from './components/DoctorProfile';
import PhysiotherapistProfile from './components/PhysiotherapistProfile';
import Appointment from './components/Appointment';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginRedirector from './components/LoginRedirector';
import ScrollToTop from './components/ScrollToTop';
import FloatingWhatsAppButton from './components/FloatingWhatsAppButton';
import AIAssistant from './components/AIAssistant';
import Analytics from './components/Analytics';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isSignInOpen = location.pathname === '/signUp';
  const isAdminPage = location.pathname.startsWith('/admin');

  const closeSignIn = () => {
    navigate(-1);
  };

  return (
    <div className={`App flex flex-col min-h-screen ${isSignInOpen ? 'overflow-hidden' : ''}`}>
      <Analytics />
      <ScrollToTop />
      {!isAdminPage && <Header />}
      <main className={`flex-grow ${!isAdminPage ? 'pt-20' : ''}`}>
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/knee-replacement-rehab" element={<KneeReplacementRehab />} />
        <Route path="/services/spinal-surgery-rehab" element={<SpinalSurgeryRehab />} />
        <Route path="/services/hip-replacement-rehab" element={<HipReplacementRehab />} />
        <Route path="/services/ankle-surgery-rehab" element={<AnkleSurgeryRehab />} />
        <Route path="/services/elbow-surgery-rehab" element={<ElbowSurgeryRehab />} />
        <Route path="/services/wrist-surgery-rehab" element={<WristSurgeryRehab />} />
        <Route path="/services/shoulder-surgery-rehab" element={<ShoulderSurgeryRehab />} />
        <Route path="/services/trauma-post-surgery" element={<TraumaPostSurgery />} />
        <Route path="/services/sports-injury-recovery" element={<SportsInjuryRecovery />} />
        <Route path="/services/neurosurgery-rehab" element={<NeurosurgeryRehab />} />
        <Route path="/about" element={<About />} />
        <Route path="/appointment" element={<Appointment />} />

        <Route path="/contact" element={<Contact />} />
        <Route path="/signUp" element={<Home />} />
        <Route path="/login-success" element={<ProtectedRoute><LoginRedirector /></ProtectedRoute>} />
        <Route path="/userForm" element={<ProtectedRoute allowedRoles={['patient', 'doctor', 'physiotherapist']}><PatientSignup /></ProtectedRoute>} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/user-profile" element={<Navigate to="/user" replace />} />
        <Route path="/user" element={<ProtectedRoute allowedRoles={['patient', 'admin', 'user']}><UserProfile /></ProtectedRoute>} />
        <Route path="/PatientProfile" element={<ProtectedRoute allowedRoles={['patient']}><PatientProfile /></ProtectedRoute>} />
        <Route path="/DoctorProfile" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorProfile /></ProtectedRoute>} />
        <Route path="/PhysiotherapistProfile" element={<ProtectedRoute allowedRoles={['physiotherapist', 'physio']}><PhysiotherapistProfile /></ProtectedRoute>} />
        <Route path="/admin/*" element={<AdminLoginGate><AdminDashboard /></AdminLoginGate>} />
      </Routes>
      </main>
      {!isAdminPage && <Footer />}
      {!isAdminPage && <FloatingWhatsAppButton />}
      {!isAdminPage && <AIAssistant />}
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
