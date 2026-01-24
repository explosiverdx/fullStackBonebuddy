import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { sendAdminOtp, verifyAdminOtp } from '../api/auth.js';
import apiClient from '../api/apiClient';

const SignIn = ({ isOpen, onClose, initialMode = 'user' }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'user' or 'admin'
  const [authType, setAuthType] = useState('signin'); // 'signin' or 'signup'
  
  // State for User login/signup
  const [step, setStep] = useState('phone'); // 'phone', 'otp', 'forgot-password-phone', 'forgot-password-reset'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [shareOnWhatsApp, setShareOnWhatsApp] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setStep('phone');
    setPhoneNumber('');
    setOtp('');
    setPassword('');
    setConfirmPassword('');
    setAuthType('signin');
    setError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowLoginPassword(false);
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
  };

  // --- User Flow Handlers ---

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!phoneNumber || phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
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
        setError('');
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Failed to register:', error);
      setError('Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/users/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phoneNumber: `+91${phoneNumber}`, otp }),
      });
      const data = await response.json();
      
      if (response.ok) {
        login(data.data.user, data.data.accessToken, data.data.refreshToken);
        navigate('/login-success', { replace: true });
        onClose();
      } else {
        setError(data.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!phoneNumber || phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post('/users/login', {
        mobile_number: `+91${phoneNumber}`,
        password
      });
      
      if (response.data && response.data.data) {
        login(response.data.data.user, response.data.data.accessToken, response.data.data.refreshToken);
        navigate('/login-success', { replace: true });
        onClose();
      } else {
        setError(response.data?.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('[LOGIN] Error:', error);
      
      if (error.response?.status === 404) {
        setError('User not found. Please sign up first.');
      } else if (error.response?.status === 401) {
        setError('Invalid phone number or password. Please try again.');
      } else {
        setError(error.response?.data?.message || error.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!phoneNumber || phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: `+91${phoneNumber}` }),
      });
      const data = await response.json();
      
      if (response.ok) {
        setStep('forgot-password-reset');
        setError('');
      } else {
        setError(data.message || 'Failed to send reset OTP. Please try again.');
      }
    } catch (error) {
      console.error('Forgot password request failed:', error);
      setError('Failed to send reset OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: `+91${phoneNumber}`, otp, newPassword: password }),
      });
      const data = await response.json();
      
      if (response.ok) {
        alert('Password has been reset successfully. Please sign in with your new password.');
        setStep('phone');
        setAuthType('signin');
        setPassword('');
        setConfirmPassword('');
        setOtp('');
        setError('');
      } else {
        setError(data.message || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      console.error('Password reset failed:', error);
      setError('Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Admin Flow Handlers ---

  const handleAdminOtp = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!phoneNumber || phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    try {
      await sendAdminOtp(`+91${phoneNumber}`);
      setStep('otp');
      setError('');
    } catch (error) {
      if (error.message === 'Admin not found') {
        setError('You are not authorized as an admin.');
      } else {
        setError(error.message || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const response = verifyAdminOtp(`+91${phoneNumber}`, otp);
      const { user, accessToken, refreshToken } = response.data;
      login(user, accessToken, refreshToken);
      navigate('/admin', { state: { user: user } });
      onClose();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to verify OTP. Please try again.';
      if (errorMessage.includes('Admin not found') || errorMessage.includes('not authorized')) {
        setError('You are not authorized as an admin.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep('phone');
    setOtp('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    setMode('user');
    onClose();
  };

  const switchMode = (newMode) => {
    resetForm();
    setMode(newMode);
  };

  const switchAuthType = (type) => {
    setAuthType(type);
    setStep('phone');
    setError('');
    setPassword('');
    setConfirmPassword('');
    setOtp('');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 transition-opacity duration-300 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl transform transition-all duration-300 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            {(step !== 'phone' || mode === 'admin') && (
              <button
                onClick={mode === 'user' ? handleBack : () => switchMode('user')}
                className="text-2xl font-bold text-gray-600 hover:text-teal-600 transition-colors"
              >
                ←
              </button>
            )}
            <h2 className="text-2xl font-bold text-gray-800">
              {mode === 'admin' 
                ? 'Admin Sign In' 
                : step === 'otp' 
                  ? 'Enter OTP' 
                  : step === 'forgot-password-phone' || step === 'forgot-password-reset'
                    ? 'Reset Password'
                    : authType === 'signin' 
                      ? 'Sign In' 
                      : 'Sign Up'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-2xl font-bold text-gray-400 hover:text-red-500 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* User Login Flow */}
          {mode === 'user' && (
            <>
              {/* Sign In / Sign Up Toggle */}
              {step === 'phone' && (
                <div className="mb-6 flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => switchAuthType('signin')}
                    className={`flex-1 py-2 px-4 rounded-md font-semibold transition-all ${
                      authType === 'signin'
                        ? 'bg-white text-teal-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => switchAuthType('signup')}
                    className={`flex-1 py-2 px-4 rounded-md font-semibold transition-all ${
                      authType === 'signup'
                        ? 'bg-white text-teal-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              )}

              {/* Sign In Form */}
              {step === 'phone' && authType === 'signin' && (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label htmlFor="phone-signin" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-600">+91</span>
                      <input
                        type="tel"
                        id="phone-signin"
                        value={phoneNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setPhoneNumber(value);
                        }}
                        maxLength="10"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                        placeholder="Enter 10-digit number"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password-signin" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        id="password-signin"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-teal-600"
                      >
                        {showLoginPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                    <div className="text-right mt-1">
                      <button
                        type="button"
                        onClick={() => setStep('forgot-password-phone')}
                        className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="whatsapp-signin"
                      checked={shareOnWhatsApp}
                      onChange={() => setShareOnWhatsApp(!shareOnWhatsApp)}
                      className="mt-1 h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <label htmlFor="whatsapp-signin" className="ml-2 text-sm text-gray-700">
                      Share health tips, appointment details and offers with me on{' '}
                      <span className="font-semibold">WhatsApp</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </button>

                  <p className="text-center text-sm text-gray-600">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchAuthType('signup')}
                      className="text-teal-600 font-semibold hover:text-teal-700"
                    >
                      Sign Up
                    </button>
                  </p>
                </form>
              )}

              {/* Sign Up Form */}
              {step === 'phone' && authType === 'signup' && (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <label htmlFor="phone-signup" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-600">+91</span>
                      <input
                        type="tel"
                        id="phone-signup"
                        value={phoneNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setPhoneNumber(value);
                        }}
                        maxLength="10"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                        placeholder="Enter 10-digit number"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">OTP will be sent to this number</p>
                  </div>

                  <div>
                    <label htmlFor="password-signup" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password-signup"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                        placeholder="At least 6 characters"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-teal-600"
                      >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirm-password-signup" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirm-password-signup"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                        placeholder="Confirm your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-teal-600"
                      >
                        {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="whatsapp-signup"
                      checked={shareOnWhatsApp}
                      onChange={() => setShareOnWhatsApp(!shareOnWhatsApp)}
                      className="mt-1 h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <label htmlFor="whatsapp-signup" className="ml-2 text-sm text-gray-700">
                      Share health tips, appointment details and offers with me on{' '}
                      <span className="font-semibold">WhatsApp</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                  >
                    {isLoading ? 'Sending OTP...' : 'Continue'}
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    By continuing, you agree to our{' '}
                    <a href="/privacy-policy" className="text-teal-600 font-semibold">Privacy Policy</a>
                    {' '}&{' '}
                    <a href="/terms" className="text-teal-600 font-semibold">Terms and Conditions</a>
                  </p>

                  <p className="text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchAuthType('signin')}
                      className="text-teal-600 font-semibold hover:text-teal-700"
                    >
                      Sign In
                    </button>
                  </p>
                </form>
              )}

              {/* OTP Verification */}
              {step === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="text-center mb-4">
                    <p className="text-sm text-gray-600">
                      An OTP has been sent to <span className="font-semibold">+91 {phoneNumber}</span>
                    </p>
                  </div>

                  <div>
                    <label htmlFor="otp-input" className="block text-sm font-medium text-gray-700 mb-1">
                      Enter OTP
                    </label>
                    <input
                      type="text"
                      id="otp-input"
                      value={otp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtp(value);
                      }}
                      maxLength="6"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-center text-2xl tracking-widest"
                      placeholder="000000"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                  >
                    {isLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>

                  <button
                    type="button"
                    onClick={handleBack}
                    className="w-full text-teal-600 font-semibold hover:text-teal-700"
                  >
                    ← Back
                  </button>
                </form>
              )}

              {/* Forgot Password - Phone */}
              {step === 'forgot-password-phone' && (
                <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Enter your phone number to receive a password reset OTP.
                  </p>

                  <div>
                    <label htmlFor="phone-forgot" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-600">+91</span>
                      <input
                        type="tel"
                        id="phone-forgot"
                        value={phoneNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setPhoneNumber(value);
                        }}
                        maxLength="10"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                        placeholder="Enter 10-digit number"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                  >
                    {isLoading ? 'Sending OTP...' : 'Send Reset OTP'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone');
                      setAuthType('signin');
                    }}
                    className="w-full text-teal-600 font-semibold hover:text-teal-700"
                  >
                    ← Back to Sign In
                  </button>
                </form>
              )}

              {/* Forgot Password - Reset */}
              {step === 'forgot-password-reset' && (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="otp-reset" className="block text-sm font-medium text-gray-700 mb-1">
                      Reset OTP
                    </label>
                    <input
                      type="text"
                      id="otp-reset"
                      value={otp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtp(value);
                      }}
                      maxLength="6"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                      placeholder="Enter OTP from SMS"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        id="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                        placeholder="At least 6 characters"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-teal-600"
                      >
                        {showNewPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmNewPassword ? "text" : "password"}
                        id="confirm-new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                        placeholder="Confirm new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-teal-600"
                      >
                        {showConfirmNewPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                  >
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </form>
              )}
            </>
          )}

          {/* Admin Login Flow */}
          {mode === 'admin' && (
            <>
              {step === 'phone' && (
                <form onSubmit={handleAdminOtp} className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Enter your registered admin mobile number to sign in.
                  </p>

                  <div>
                    <label htmlFor="admin-phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-600">+91</span>
                      <input
                        type="tel"
                        id="admin-phone"
                        value={phoneNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setPhoneNumber(value);
                        }}
                        maxLength="10"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                        placeholder="Enter 10-digit number"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                  >
                    {isLoading ? 'Sending OTP...' : 'Send OTP'}
                  </button>

                  <p className="text-center text-sm text-gray-600">
                    Not an admin?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('user')}
                      className="text-teal-600 font-semibold hover:text-teal-700"
                    >
                      Login as a user
                    </button>
                  </p>
                </form>
              )}

              {step === 'otp' && (
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <label htmlFor="admin-otp" className="block text-sm font-medium text-gray-700 mb-1">
                      One-Time Password
                    </label>
                    <input
                      type="text"
                      id="admin-otp"
                      value={otp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtp(value);
                      }}
                      maxLength="6"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-center text-2xl tracking-widest"
                      placeholder="000000"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                  >
                    {isLoading ? 'Logging In...' : 'Login as Admin'}
                  </button>

                  <button
                    type="button"
                    onClick={handleBack}
                    className="w-full text-teal-600 font-semibold hover:text-teal-700"
                  >
                    ← Back
                  </button>
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
