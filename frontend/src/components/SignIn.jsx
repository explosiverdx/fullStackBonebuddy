import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Note: Link is not used, can be removed if not needed elsewhere.
import { useAuth } from '../hooks/useAuth';
import { sendAdminOtp, verifyAdminOtp } from '../api/auth.js';
import apiClient from '../api/apiClient';

const SignIn = ({ isOpen, onClose, initialMode = 'user' }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  // Mode can be 'user' or 'admin'
  const [mode, setMode] = useState(initialMode);

  // State for User login/signup
  const [step, setStep] = useState('phone'); // 'phone', 'otp', 'forgot-password-phone', 'forgot-password-reset'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authMode, setAuthMode] = useState('password'); // 'otp' or 'password'
  const [shareOnWhatsApp, setShareOnWhatsApp] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // --- User Flow Handlers ---

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }
    try {
      const response = await fetch('/api/v1/users/register-with-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phoneNumber: `+91${phoneNumber}`, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setStep('otp');
        console.log('Registration with password successful, OTP sent');
      } else {
        console.error('Failed to register:', data.message);
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to register:', error);
      alert('Failed to register. Please try again.');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/v1/users/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phoneNumber: `+91${phoneNumber}`, otp }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log('OTP verified:', data);
        login(data.data.user, data.data.accessToken, data.data.refreshToken);
        navigate('/login-success', { replace: true });
      } else {
        alert(`Error: ${data.message || 'Invalid OTP'}`);
      }
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      alert('Failed to verify OTP. Please try again.');
    }
  };


  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length !== 10) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }
    if (!password || password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    
    try {
      console.log('[LOGIN] Attempting login with:', { phoneNumber, hasPassword: !!password });
      const response = await apiClient.post('/users/login', {
        mobile_number: `+91${phoneNumber}`,
        password
      });
      
      console.log('[LOGIN] Response received:', response.status, response.data);
      
      if (response.data && response.data.data) {
        console.log('Logged in with password:', response.data);
        login(response.data.data.user, response.data.data.accessToken, response.data.data.refreshToken);
        navigate('/login-success', { replace: true });
      } else {
        alert(`Error: ${response.data?.message || 'Login failed'}`);
      }
    } catch (error) {
      console.error('[LOGIN] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.message || error.message,
        url: error.config?.url,
        fullError: error
      });
      
      if (error.response?.status === 404) {
        alert('Login endpoint not found. Please ensure the backend server is running on port 8000.');
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to login. Please try again.';
        alert(`Error: ${errorMessage}`);
      }
    }
  };

  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/v1/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: `+91${phoneNumber}` }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('An OTP has been sent to your phone number.');
        setStep('forgot-password-reset');
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Forgot password request failed:', error);
      alert('Failed to send reset OTP. Please try again.');
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    try {
      const response = await fetch('/api/v1/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: `+91${phoneNumber}`, otp, newPassword: password }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Password has been reset successfully. Please log in with your new password.');
        setStep('phone');
        setAuthMode('password');
        setPassword('');
        setConfirmPassword('');
        setOtp('');
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Password reset failed:', error);
      alert('Failed to reset password. Please try again.');
    }
  };

  // --- Admin Flow Handlers ---

  const handleAdminOtp = async (e) => {
    e.preventDefault();
    try {
      await sendAdminOtp(`+91${phoneNumber}`);
      setStep('otp');
    } catch (error) {
      if (error.message === 'Admin not found') {
        alert('You are not authorized as an admin.');
      } else {
        alert(`Error: ${error.message}`);
      }
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      // verifyAdminOtp returns response.data, which has structure: { statusCode, data: { user, accessToken, refreshToken }, message, success }
      const response = await verifyAdminOtp(`+91${phoneNumber}`, otp);
      const { user, accessToken, refreshToken } = response.data;
      console.log('Admin login successful, token:', accessToken);
      login(user, accessToken, refreshToken);
      navigate('/admin', { state: { user: user } });
    } catch (error) {
      // Handle axios error response
      const errorMessage = error.response?.data?.message || error.message || 'Failed to verify OTP. Please try again.';
      if (errorMessage.includes('Admin not found') || errorMessage.includes('not authorized')) {
        alert('You are not authorized as an admin.');
      } else {
        alert(`Error: ${errorMessage}`);
      }
    }
  };

  const handleBack = () => {
    setStep('phone');
    setOtp('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowLoginPassword(false);
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
  };
  // Reset state when the slider is closed or mode changes
  const handleClose = () => {
    setMode('user');
    setStep('phone');
    setPhoneNumber('');
    setOtp('');
    setPassword('');
    setConfirmPassword('');
    setAuthMode('password');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowLoginPassword(false);
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
    onClose();
  };

  const switchMode = (newMode) => {
    // Reset states to ensure clean forms
    setStep('phone');
    setPhoneNumber('');
    setOtp('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowLoginPassword(false);
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
    setMode(newMode); // Keep this to switch between user/admin
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-60 z-50 transition-opacity duration-300 flex items-center justify-center ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-slate-300 w-full h-full sm:max-w-md sm:h-auto sm:rounded-lg shadow-xl transform transition-all duration-300 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Use max-h-[90vh] on larger screens to ensure it fits and is scrollable */}
        <div className="p-4 sm:p-6 flex flex-col max-h-screen sm:max-h-[90vh] overflow-y-auto bg-slate-300 sm:rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            {(mode === 'user' && step !== 'phone') || mode === 'admin' ? (
              <button // Back button for user OTP/password steps and all admin steps
                onClick={mode === 'user' ? handleBack : () => switchMode('user')}
                className="text-xl sm:text-2xl font-bold text-gray-600 hover:text-teal-500 transition-colors flex-shrink-0"
              >
                &#x2190;
              </button>
            ) : (
              <div /> /* Placeholder for spacing */
            )}
            <button
              onClick={handleClose}
              className="text-xl sm:text-2xl font-bold text-gray-600 hover:text-red-500 transition-colors flex-shrink-0"
            >
              &#x2715;
            </button>
          </div>

          {/* User Login Flow */}
          {mode === 'user' && (
            <>
              {step === 'phone' && authMode === 'otp' && ( // OTP Signup/Login
                <>
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 text-teal-500">Sign Up</h2>
                  <form onSubmit={handleSendOtp} className="flex flex-col space-y-4">
                    {/* Phone Number Input */}
                    <div className="mb-4">
                      <label htmlFor="phone" className="text-sm text-gray-600">
                        Phone Number
                      </label>
                      <div className="relative mt-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-600">
                          +91{' '}
                        </span>
                        <input
                          type="tel"
                          id="phone"
                          value={phoneNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setPhoneNumber(value);
                          }}
                          maxLength="10"
                          pattern="[0-9]{10}"
                          className="w-full p-2 pl-12 border-b-2 border-gray-300 focus:border-teal-500 hover:border-teal-400 outline-none transition-colors"
                          placeholder="10 digits only"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">OTP will be sent to this number by SMS</p>
                    </div>
                    <div className="mb-4">
                      <label htmlFor="password" className="text-sm text-gray-600">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full p-2 pr-10 border-b-2 border-gray-300 focus:border-teal-500 hover:border-teal-400 outline-none transition-colors"
                          placeholder="At least 6 characters"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-teal-500 focus:outline-none"
                        >
                          {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label htmlFor="confirm-password" className="text-sm text-gray-600">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          id="confirm-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full p-2 pr-10 border-b-2 border-gray-300 focus:border-teal-500 hover:border-teal-400 outline-none transition-colors"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-teal-500 focus:outline-none"
                        >
                          {showConfirmPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    {/* WhatsApp Checkbox */}
                    <div className="flex items-start my-6">
                      <input
                        type="checkbox"
                        id="whatsapp"
                        checked={shareOnWhatsApp}
                        onChange={() => setShareOnWhatsApp(!shareOnWhatsApp)}
                        className="h-5 w-5 text-teal-500 border-gray-300 rounded focus:ring-teal-500"
                      /> 
                      <label htmlFor="whatsapp" className="ml-3 text-sm text-gray-700">
                        Share health tips, appointment details and offers with me on{' '}
                        <span className="font-bold">Whatsapp</span>
                      </label>
                    </div>
                    {/* Bottom Section */}
                    <div className="mt-auto">
                      <p className="text-xs text-gray-500 mb-4">
                        By clicking Continue, you agree to our{' '}
                        <a href="#" className="text-teal-500 font-bold">
                          Privacy Policy
                        </a>{' '}
                        &{' '}
                        <a href="#" className="text-teal-500 font-bold">
                          Terms and Conditions
                        </a>
                      </p>
                      <button
                        type="submit"
                        className="w-full bg-teal-500 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-teal-600 hover:scale-105 transition-all"
                      >
                        Continue
                      </button>
                      <p className="text-center text-sm mt-4">Already registered with a password?
                        <button
                          type="button"
                          onClick={() => setAuthMode('password')}
                          className="text-teal-500 font-bold ml-1"
                        >
                          Sign In
                        </button>
                      </p>
                    </div>
                  </form>
                </>
              )}
              {step === 'phone' && authMode === 'password' && ( // Password Login
                <>
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 text-teal-500">Sign In / Sign Up</h2>
                  <form onSubmit={handlePasswordLogin} className="flex flex-col space-y-4" noValidate>
                    <div className="mb-4">
                      <label htmlFor="phone-password" className="text-sm text-gray-600">Phone Number</label>
                      <div className="relative mt-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-600">+91 </span>
                        <input
                          type="tel"
                          id="phone-password"
                          value={phoneNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setPhoneNumber(value);
                          }}
                          maxLength="10"
                          pattern="[0-9]{10}"
                          className="w-full p-2 pl-12 border-b-2 border-gray-300 focus:border-teal-500 hover:border-teal-400 outline-none transition-colors"
                          placeholder="10 digits only"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">For existing users, enter password to sign in.</p>
                    </div>
                    <div className="mb-4">
                      <label htmlFor="password-login" className="text-sm text-gray-600 mt-1">Password</label>
                      <div className="relative">
                        <input
                          type={showLoginPassword ? "text" : "password"}
                          id="password-login"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full p-2 pr-10 border-b-2 border-gray-300 focus:border-teal-500 hover:border-teal-400 outline-none transition-colors"
                          placeholder="Enter your password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-teal-500 focus:outline-none"
                        >
                          {showLoginPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <div className="text-right mt-1">
                        <button
                          type="button"
                          onClick={() => setStep('forgot-password-phone')}
                          className="text-xs text-teal-500 font-semibold hover:text-teal-600"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    </div>
                    <div className="flex items-start my-6">
                      <input
                        type="checkbox"
                        id="whatsapp"
                        checked={shareOnWhatsApp}
                        onChange={() => setShareOnWhatsApp(!shareOnWhatsApp)}
                        className="h-5 w-5 text-teal-500 border-gray-300 rounded focus:ring-teal-500"
                      />
                      <label htmlFor="whatsapp" className="ml-3 text-sm text-gray-700">
                        Share health tips, appointment details and offers with me on{' '}
                        <span className="font-bold">Whatsapp</span>
                      </label>
                    </div>
                    <div className="mt-auto">
                      <p className="text-xs text-gray-500 mb-4">
                        By clicking Sign In, you agree to our{' '}
                        <a href="#" className="text-teal-500 font-bold">Privacy Policy</a>{' '}
                        &{' '}
                        <a href="#" className="text-teal-500 font-bold">Terms and Conditions</a>
                      </p>
                      <button type="submit" className="w-full bg-teal-500 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-teal-600 hover:scale-105 transition-all">
                        Sign In
                      </button>
                      <p className="text-center text-sm mt-4">New user or no password set?
                        <button type="button" onClick={() => setAuthMode('otp')} className="text-teal-500 font-bold ml-1">
                          Sign Up / Login with OTP
                        </button>
                      </p>
                    </div>
                  </form>
                </>
              )}
              {step === 'otp' && (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold mb-2 text-teal-500">Enter OTP</h2>
                  <p className="text-sm text-gray-600 mb-4 sm:mb-6">An OTP has been sent to +91 {phoneNumber}.</p>
                  <form onSubmit={handleVerifyOtp} className="flex flex-col space-y-4">
                    {/* OTP Input */}
                    <div className="mb-4">
                      <label htmlFor="otp" className="text-sm text-gray-600">
                        One-Time Password
                      </label>
                      <input
                        type="text"
                        id="otp"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full p-2 border-b-2 border-gray-300 focus:border-teal-500 hover:border-teal-400 outline-none transition-colors"
                        required
                      />
                    </div>
                    <div className="mt-auto">
                      <button
                        type="submit"
                        className="w-full bg-teal-500 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-teal-600 hover:scale-105 transition-all"
                      >
                        Verify OTP
                      </button>
                    </div>
                  </form>
                </>
              )}
              {step === 'create-password' && (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 text-teal-500">Create Password</h2>
                  <form onSubmit={handleSetPassword} className="flex flex-col space-y-4">
                    <div className="mb-4">
                      <label htmlFor="password-create" className="text-sm text-gray-600">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          id="password-create"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full p-2 pr-10 border-b-2 border-gray-300 focus:border-teal-500 hover:border-teal-400 outline-none transition-colors"
                          required
                          placeholder="At least 6 characters"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-teal-500 focus:outline-none"
                        >
                          {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label htmlFor="confirm-password-create" className="text-sm text-gray-600">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          id="confirm-password-create"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full p-2 pr-10 border-b-2 border-gray-300 focus:border-teal-500 hover:border-teal-400 outline-none transition-colors"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-teal-500 focus:outline-none"
                        >
                          {showConfirmPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="mt-auto">
                      <button
                        type="submit"
                        className="w-full bg-teal-500 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-teal-600 hover:scale-105 transition-all"
                      >
                        Set Password and Login
                      </button>
                      <p className="text-center text-sm mt-4">
                        <button
                          type="button"
                          onClick={handleBack}
                          className="text-teal-500 font-bold"
                        >
                          Back
                        </button>
                      </p>
                    </div>
                  </form>
                </>
              )}
              {step === 'forgot-password-phone' && (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 text-teal-500">Forgot Password</h2>
                  <p className="text-sm text-gray-600 mb-4 sm:mb-6">Enter your phone number to receive a password reset OTP.</p>
                  <form onSubmit={handleForgotPasswordRequest} className="flex flex-col space-y-4">
                    <div className="mb-4">
                      <label htmlFor="forgot-phone" className="text-sm text-gray-600">Phone Number</label>
                      <div className="relative mt-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-600">+91 </span>
                        <input
                          type="tel"
                          id="forgot-phone"
                          value={phoneNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setPhoneNumber(value);
                          }}
                          maxLength="10"
                          pattern="[0-9]{10}"
                          className="w-full p-2 pl-12 border-b-2 border-gray-300 focus:border-teal-500 hover:border-teal-400 outline-none transition-colors"
                          placeholder="10 digits only"
                          required
                        />
                      </div>
                    </div>
                    <div className="mt-auto">
                      <button type="submit" className="w-full bg-teal-500 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-teal-600">
                        Send Reset OTP
                      </button>
                      <p className="text-center text-sm mt-4">
                        <button type="button" onClick={handleBack} className="text-teal-500 font-bold">
                          Back to Sign In
                        </button>
                      </p>
                    </div>
                  </form>
                </>
              )}
              {step === 'forgot-password-reset' && (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 text-teal-500">Reset Your Password</h2>
                  <form onSubmit={handleResetPasswordSubmit} className="flex flex-col space-y-4">
                    <div className="mb-4">
                      <label htmlFor="reset-otp" className="text-sm text-gray-600">Reset OTP</label>
                      <input
                        type="text"
                        id="reset-otp"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full p-2 border-b-2 border-gray-300 focus:border-teal-500 hover:border-teal-400 outline-none transition-colors"
                        required
                        placeholder="Enter the OTP from SMS"
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="new-password" className="text-sm text-gray-600">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          id="new-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full p-2 pr-10 border-b-2 border-gray-300 focus:border-teal-500 hover:border-teal-400 outline-none transition-colors"
                          required
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-teal-500 focus:outline-none"
                        >
                          {showNewPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label htmlFor="confirm-new-password" className="text-sm text-gray-600">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmNewPassword ? "text" : "password"}
                          id="confirm-new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full p-2 pr-10 border-b-2 border-gray-300 focus:border-teal-500 hover:border-teal-400 outline-none transition-colors"
                          required
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-teal-500 focus:outline-none"
                        >
                          {showConfirmNewPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="mt-auto">
                      <button type="submit" className="w-full bg-teal-500 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-teal-600">
                        Reset Password
                      </button>
                    </div>
                  </form>
                </>
              )}
            </>
          )}

          {/* Admin Login Flow */}
          {mode === 'admin' && (
            <>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-teal-500">Admin Sign In</h2>
              <p className="text-sm text-gray-600 mb-4 sm:mb-6">
                Enter your registered admin mobile number to sign in.
              </p>
              {step === 'phone' && (
                <form onSubmit={handleAdminOtp} className="flex flex-col space-y-4">
                  {/* Mobile Number Input */}
                  <div className="mb-4 mt-1">
                    <label htmlFor="admin-mobile" className="text-sm text-gray-600">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-600">
                        +91{' '}
                      </span>
                      <input
                        type="tel"
                        id="admin-mobile"
                        value={phoneNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setPhoneNumber(value);
                        }}
                        maxLength="10"
                        pattern="[0-9]{10}"
                        className="w-full p-2 pl-12 border-b-2 border-gray-300 focus:border-teal-500 hover:border-teal-400 outline-none transition-colors"
                        placeholder="10 digits only"
                        required
                      />
                    </div>
                  </div>
                  {/* Bottom Section */}
                  <div className="mt-auto">
                    <button
                      type="submit"
                      className="w-full bg-teal-500 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-teal-600 hover:scale-105 transition-all"
                    >
                      Send OTP
                    </button>
                    <p className="text-center text-sm mt-4">
                      Not an admin?{' '}
                      <button
                        type="button"
                        onClick={() => switchMode('user')}
                        className="text-teal-500 font-bold"
                      >
                        Login as a user
                      </button>
                    </p>
                  </div>
                </form>
              )}
              {step === 'otp' && (
                <form onSubmit={handleAdminLogin} className="flex flex-col space-y-4">
                  {/* OTP Input */}
                  <div className="mb-4">
                    <label htmlFor="admin-otp" className="text-sm text-gray-600">
                      One-Time Password
                    </label>
                    <input
                      type="text"
                      id="admin-otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full p-2 border-b-2 border-gray-300 focus:border-teal-500 hover:border-teal-400 outline-none transition-colors"
                      required
                    />
                  </div>
                  {/* Bottom Section */}
                  <div className="mt-auto">
                    <button
                      type="submit"
                      className="w-full bg-teal-500 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-teal-600 transition-colors"
                    >
                      Login as Admin
                    </button>
                    <p className="text-center text-sm mt-4">
                      Not an admin?{' '}
                      <button
                        type="button"
                        onClick={() => switchMode('user')}
                        className="text-teal-500 font-bold"
                      >
                        Login as a user
                      </button>
                    </p>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignIn;
