import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import './index.css'; // Import the main CSS file
import Header from './components/Header';
import Home from './components/Home';
import Services from './components/Services';
import About from './components/About';
import Appointment from './components/Appointment';
import Pricing from './components/Pricing';
import Contact from './components/Contact';
import Footer from './components/Footer';
import SignIn from './components/SignIn';
import AdminProfile from './components/AdminProfile';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isSignInOpen = location.pathname === '/signIn';
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
        <Route path="/signIn" element={<Home />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Routes>
      {!isAdminPage && <Footer />}
  o    <SignIn isOpen={isSignInOpen} onClose={closeSignIn} />
    </div>
  );
}

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper;