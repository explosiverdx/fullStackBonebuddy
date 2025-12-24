import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const SignUpForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState('register'); // 'register', 'otp'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [shareOnWhatsApp, setShareOnWhatsApp] = useState(true);

  const handleRegister = async (e) => {
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
      console.log('Registration response:', response.status, data);
      
      if (response.ok) {
        setStep('otp');
        alert('OTP sent successfully! Please check your phone.');
        console.log('OTP sent successfully');
      } else {
        const errorMessage = data.message || 'Registration failed';
        console.error('Registration error:', errorMessage);
        alert(`Error: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Failed to register:', error);
      alert(`Failed to register: ${error.message || 'Please try again.'}`);
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
        login(data.data.user, data.data.accessToken, data.data.refreshToken);
        navigate('/login-success', { replace: true });
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      alert('Failed to verify OTP. Please try again.');
    }
  };

  const handleBack = () => {
    setStep('register');
    setOtp('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {step === 'register' ? 'Sign In / Sign Up' : 'Enter OTP'}
          </h2>
        </div>
        {step === 'register' && (
          <form className="mt-8 space-y-6" onSubmit={handleRegister} noValidate>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="phone" className="sr-only">Phone Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-600">+91 </span>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    maxLength="10"
                    pattern="[0-9]{10}"
                    className="appearance-none rounded-none relative block w-full px-3 py-2 pl-12 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="10 digits only"
                    value={phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhoneNumber(value);
                    }}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password-login" className="sr-only">Password</label>
                <input
                  id="password-login"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="confirm-password-login" className="sr-only">Confirm Password</label>
                <input
                  id="confirm-password-login"
                  name="confirm-password"
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-start">
              <input
                id="whatsapp"
                name="whatsapp"
                type="checkbox"
                checked={shareOnWhatsApp}
                onChange={() => setShareOnWhatsApp(!shareOnWhatsApp)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="whatsapp" className="ml-2 block text-sm text-gray-900">
                Share health tips, appointment details and offers with me on <span className="font-bold">WhatsApp</span>
              </label>
            </div>
            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Continue
              </button>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600">
                By clicking Continue, you agree to our <a href="#" className="text-indigo-600 font-bold">Privacy Policy</a> & <a href="#" className="text-indigo-600 font-bold">Terms and Conditions</a>
              </p>
            </div>
          </form>
        )}
        {step === 'otp' && (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyOtp}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="otp" className="sr-only">One Time Password</label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Enter OTP"
                  value={otp}
                                      onChange={(e) => setOtp(e.target.value)}                />
              </div>
            </div>
            <div className="text-center text-sm text-gray-600">
              An OTP has been sent to +91 {phoneNumber}.
            </div>
            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Verify OTP
              </button>
            </div>
            <div className="text-center">
              <button
                type="button"
                onClick={handleBack}
                className="text-indigo-600 hover:text-indigo-500"
              >
                Back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SignUpForm;