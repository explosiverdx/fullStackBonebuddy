import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { sendAdminOtp, verifyAdminOtp, loginAdmin } from '../api/auth.js';

const AdminLoginGate = ({ children }) => {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
  const [step, setStep] = useState('phone'); // 'phone' or 'otp' (for OTP method)
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isResendingOtp, setIsResendingOtp] = useState(false);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // Check if user is logged in and is admin
  const isAdmin = user && (user.userType === 'admin' || user.role === 'admin');

  if (!isAdmin) {
    // Not logged in as admin - show admin login page
    const handleAdminOtp = async (e) => {
      e.preventDefault();
      setError('');
      setIsResendingOtp(false);
      try {
        await sendAdminOtp(phoneNumber);
        setStep('otp');
        setError('');
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to send OTP';
        if (errorMessage.includes('Admin not found') || errorMessage.includes('not authorized')) {
          setError('You are not authorized as an admin.');
        } else {
          setError(`Error: ${errorMessage}`);
        }
      }
    };

    const handleResendOtp = async () => {
      setError('');
      setIsResendingOtp(true);
      try {
        await sendAdminOtp(phoneNumber);
        setOtp(''); // Clear the current OTP input
        setError('');
        alert('New OTP sent to your phone');
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to resend OTP';
        if (errorMessage.includes('Admin not found') || errorMessage.includes('not authorized')) {
          setError('You are not authorized as an admin.');
        } else {
          setError(`Error: ${errorMessage}`);
        }
      } finally {
        setIsResendingOtp(false);
      }
    };

    const handleAdminLogin = async (e) => {
      e.preventDefault();
      setError('');
      setIsLoading(true);
      try {
        const response = await verifyAdminOtp(phoneNumber, otp);
        const { user, accessToken, refreshToken } = response.data;
        console.log('Admin login successful');
        login(user, accessToken, refreshToken);
        navigate('/admin', { state: { user: user } });
      } catch (error) {
        // Prevent default error handling that might cause redirect
        const errorMessage = error.response?.data?.message || error.message || 'Failed to verify OTP';
        
        // Clear OTP input on error
        setOtp('');
        
        if (errorMessage.includes('Admin not found') || errorMessage.includes('not authorized')) {
          setError('You are not authorized as an admin.');
        } else if (errorMessage.includes('Invalid OTP') || errorMessage.includes('OTP expired')) {
          setError('Invalid or expired OTP. Please try again or request a new OTP.');
        } else {
          setError(`Error: ${errorMessage}`);
        }
        
        // Prevent the error from propagating to avoid redirect
        return;
      } finally {
        setIsLoading(false);
      }
    };

    const handleBack = () => {
      setStep('phone');
      setOtp('');
      setError('');
    };

    const handlePasswordLogin = async (e) => {
      e.preventDefault();
      if (!username || !password) {
        alert('Please enter both username and password');
        return;
      }

      setIsLoading(true);
      try {
        const response = await loginAdmin(username, password);
        const { user, accessToken, refreshToken } = response.data;
        console.log('Admin login successful');
        login(user, accessToken, refreshToken);
        navigate('/admin', { state: { user: user } });
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to login';
        if (errorMessage.includes('Admin does not exist') || errorMessage.includes('not authorized')) {
          alert('Invalid username or password. You are not authorized as an admin.');
        } else if (errorMessage.includes('Invalid admin credentials')) {
          alert('Invalid username or password.');
        } else {
          alert(`Error: ${errorMessage}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-teal-600">
        <div className="max-w-md w-full m-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {/* Logo and Title */}
            <div className="text-center mb-8">
              <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Portal</h1>
              <p className="text-gray-600">Secure access for administrators only</p>
            </div>

            {/* Login Method Toggle */}
            <div className="mb-6 flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('password');
                  setUsername('');
                  setPassword('');
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loginMethod === 'password'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                Username & Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('otp');
                  setStep('phone');
                  setPhoneNumber('');
                  setOtp('');
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loginMethod === 'otp'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                OTP Login
              </button>
            </div>

            {loginMethod === 'password' ? (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    ← Back to Home
                  </button>
                </div>
              </form>
            ) : step === 'phone' ? (
              <form onSubmit={handleAdminOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-600">
                      +91
                    </span>
                    <input
                      type="tel"
                      placeholder="Enter 10-digit number"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        setError('');
                      }}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      maxLength="10"
                      required
                    />
                  </div>
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Send OTP
                </button>
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    ← Back to Home
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value);
                      setError('');
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                    maxLength="6"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    OTP sent to +91{phoneNumber}
                  </p>
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Verifying...' : 'Verify & Login'}
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isResendingOtp}
                  className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isResendingOtp ? 'Sending...' : 'Resend OTP'}
                </button>
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full text-gray-600 hover:text-gray-800 text-sm"
                >
                  ← Change Phone Number
                </button>
              </form>
            )}

            {/* Security Notice */}
            <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800 text-center">
                🔒 This is a secure admin area. Only authorized personnel can access.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User is admin - show admin dashboard
  return children;
};

export default AdminLoginGate;

