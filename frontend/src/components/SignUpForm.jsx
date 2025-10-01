import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SignUpForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [shareOnWhatsApp, setShareOnWhatsApp] = useState(true);

  const handleContinue = async (e) => {
    e.preventDefault();
    console.log('Sending OTP to', phoneNumber);
    try {
      const response = await fetch('/api/v1/users/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phoneNumber: `+91${phoneNumber}` }),
      });
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        alert('Server returned an invalid response. Please try again later.');
        return;
      }
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

  const handleLogin = async (e) => {
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
        login(data.data.user);
        if (data.data.needsProfile) {
          navigate('/patient-signup', { state: { phoneNumber: `+91${phoneNumber}` } });
        } else {
          navigate('/user');
        }
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      alert('Failed to verify OTP. Please try again later.');
    }
  };

  const handleBack = () => {
    setStep('phone');
    setOtp('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {step === 'phone' ? 'Sign Up' : 'Enter OTP'}
          </h2>
        </div>
        {step === 'phone' && (
          <form className="mt-8 space-y-6" onSubmit={handleContinue}>
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
                    className="appearance-none rounded-none relative block w-full px-3 py-2 pl-12 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Phone Number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
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
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
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
                  onChange={(e) => setOtp(e.target.value)}
                />
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
                Back to Phone Number
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SignUpForm;
