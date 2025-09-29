import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const SignIn = ({ isOpen, onClose }) => {
  // Mode can be 'user' or 'admin'
  const [mode, setMode] = useState('user');

  // State for User OTP login
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [shareOnWhatsApp, setShareOnWhatsApp] = useState(true);

  // No email/password for admin, OTP only

  const handleUserContinue = async (e) => {
    e.preventDefault();
    console.log('Sending OTP to', phoneNumber);
    // Backend Integration: Send OTP
    try {
            const response = await fetch('/api/v1/users/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phoneNumber: `+91${phoneNumber}` }),
      });
      const data = await response.json();
      if (response.ok) {
        setStep('otp');
        console.log('OTP sent successfully');
      } else {
        console.error('Failed to send OTP:', data.message);
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to send OTP:', error);
      alert(`An error occurred: ${error.message}`);
    }
  };

  const handleUserLogin = async (e) => {
    e.preventDefault();
    // Backend Integration: Verify OTP
    try {
      const response = await fetch('/api/v1/users/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phoneNumber: `+91${phoneNumber}`, otp }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log('User login successful, token:', data.token);
        alert('User login successful!');
        handleClose();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      alert('Failed to verify OTP. Please try again later.');
    }
  };

  const handleAdminOtp = async (e) => {
    e.preventDefault();
    // Backend Integration: Send OTP to admin
    try {
      const response = await fetch('/api/v1/admin/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phoneNumber: `+91${phoneNumber}` }),
      });
      const data = await response.json();
      if (response.ok) {
        setStep('otp');
      } else {
        if (data.message === 'Admin not found') {
          alert('You are not authorized as an admin.');
        } else {
          alert(`Error: ${data.message}`);
        }
      }
    } catch (error) {
      console.error('Failed to send OTP to admin:', error);
      alert('Failed to send OTP to admin. Please try again later.');
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    // Backend Integration: Verify admin OTP
    try {
      const response = await fetch('/api/v1/admin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phoneNumber: `+91${phoneNumber}`, otp }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log('Admin login successful, token:', data.token);
        alert('Admin login successful! Redirecting to admin dashboard...');
        // Redirect to admin profile form
        window.location.href = '/admin';
      } else {
        if (data.message === 'Admin not found') {
          alert('You are not authorized as an admin.');
        } else {
          alert(`Error: ${data.message}`);
        }
      }
    } catch (error) {
      console.error('Failed to verify admin OTP:', error);
      alert('Failed to verify admin OTP. Please try again later.');
    }
  };


  const handleBack = () => {
    setStep('phone');
    setOtp('');
  };

  // Reset state when the slider is closed or mode changes
  const handleClose = () => {
    setMode('user');
    setStep('phone');
    setPhoneNumber('');
    setOtp('');
    onClose();
  };

  const switchMode = (newMode) => {
      setMode(newMode);
      // Reset states to ensure clean forms
      setStep('phone');
      setPhoneNumber('');
      setOtp('');
  }

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={handleClose}
    >
      <div
        className={`fixed top-0 right-0 h-full bg-white w-full max-w-sm shadow-lg transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            {(mode === 'user' && step === 'otp') || mode === 'admin' ? (
              <button onClick={mode === 'user' ? handleBack : () => switchMode('user')} className="text-2xl font-bold text-gray-600">
                &#x2190;
              </button>
            ) : (
              <div/> /* Placeholder for spacing */
            )}
            <button onClick={handleClose} className="text-2xl font-bold text-gray-600">
              &#x2715;
            </button>
          </div>

          {/* User Login Flow */}
          {mode === 'user' && (
            <>
              {step === 'phone' && (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-teal-500">SignIn/SignUp</h2>
                  <form onSubmit={handleUserContinue} className="flex-grow flex flex-col">
                    {/* Phone Number Input */}
                    <div className="mb-4">
                      <label htmlFor="phone" className="text-sm text-gray-600">Phone Number</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-600">+91 </span>
                        <input type="tel" id="phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full p-2 pl-12 border-b-2 border-gray-300 focus:border-teal-500 outline-none" placeholder=" " required />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">OTP will be sent to this number by SMS</p>
                    </div>
                    {/* WhatsApp Checkbox */}
                    <div className="flex items-start my-6">
                      <input type="checkbox" id="whatsapp" checked={shareOnWhatsApp} onChange={() => setShareOnWhatsApp(!shareOnWhatsApp)} className="h-5 w-5 text-teal-500 border-gray-300 rounded focus:ring-teal-500" />
                      <label htmlFor="whatsapp" className="ml-3 text-sm text-gray-700">Share health tips, appointment details and offers with me on <span className="font-bold">Whatsapp</span></label>
                    </div>
                    {/* Bottom Section */}
                    <div className="mt-auto">
                      <p className="text-xs text-gray-500 mb-4">By clicking Continue, you agree to our <a href="#" className="text-teal-500 font-bold">Privacy Policy</a> & <a href="#" className="text-teal-500 font-bold">Terms and Conditions</a></p>
                      <button type="submit" className="w-full bg-teal-500 text-white py-3 rounded-lg font-semibold hover:bg-teal-600 transition-colors">Continue</button>
                      <p className="text-center text-sm mt-4">
                        Login to your <button type="button" onClick={() => switchMode('admin')} className="text-teal-500 font-bold">Admin account here</button>
                      </p>

                    </div>
                  </form>
                </>
              )}
                {step === 'otp' && (
                  <>
                    <h2 className="text-2xl font-bold mb-2 text-teal-500">Enter OTP</h2>
                    <p className="text-sm text-gray-600 mb-6">An OTP has been sent to +91 {phoneNumber}.</p>
                    <form onSubmit={handleUserLogin} className="flex-grow flex flex-col">
                      {/* OTP Input */}
                      <div className="mb-4">
                        <label htmlFor="otp" className="text-sm text-gray-600">One Time Password</label>
                        <input type="text" id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full p-2 border-b-2 border-gray-300 focus:border-teal-500 outline-none" required />
                      </div>
                      <div className="mt-auto">
                        <button type="submit" className="w-full bg-teal-500 text-white py-3 rounded-lg font-semibold hover:bg-teal-600 transition-colors">Login</button>
                      </div>
                    </form>
                  </>
                )}
            </>
          )}

          {/* Admin Login Flow */}
              {mode === 'admin' && (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-teal-500">Admin Sign In</h2>
                  <p className="text-sm text-gray-600 mb-6">Enter your registered admin mobile number to sign in. Only pre-registered admin numbers can access the admin portal.</p>
                  {step === 'phone' && (
                    <form onSubmit={handleAdminOtp} className="flex-grow flex flex-col">
                      {/* Mobile Number Input */}
                      <div className="mb-4">
                        <label htmlFor="admin-mobile" className="text-sm text-gray-600">Mobile Number</label>
                        <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-600">+91 </span>
                        <input type="tel" id="admin-mobile" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full p-2 pl-12 border-b-2 border-gray-300 focus:border-teal-500 outline-none" placeholder=" " required />
                        </div>
                      </div>
                      {/* Bottom Section */}
                      <div className="mt-auto">
                        <button type="submit" className="w-full bg-teal-500 text-white py-3 rounded-lg font-semibold hover:bg-teal-600 transition-colors">Send OTP</button>
                        <p className="text-center text-sm mt-4">
                          Not an admin? <button type="button" onClick={() => switchMode('user')} className="text-teal-500 font-bold">Login as a user</button>
                        </p>
                      </div>
                    </form>
                  )}
              {step === 'otp' && (
                <form onSubmit={handleAdminLogin} className="flex-grow flex flex-col">
                  {/* OTP Input */}
                  <div className="mb-4">
                    <label htmlFor="admin-otp" className="text-sm text-gray-600">One Time Password</label>
                    <input type="text" id="admin-otp" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full p-2 border-b-2 border-gray-300 focus:border-teal-500 outline-none" required />
                  </div>
                  {/* Bottom Section */}
                  <div className="mt-auto">
                    <button type="submit" className="w-full bg-teal-500 text-white py-3 rounded-lg font-semibold hover:bg-teal-600 transition-colors">Login as Admin</button>
                    <p className="text-center text-sm mt-4">
                      Not an admin? <button type="button" onClick={() => switchMode('user')} className="text-teal-500 font-bold">Login as a user</button>
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