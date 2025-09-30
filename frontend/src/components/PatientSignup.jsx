import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const PatientSignup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const phoneNumber = location.state?.phoneNumber || '';

  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    dateOfBirth: '',
    age: '',
    email: '',
    city: '',
    state: '',
    pincode: '',
    surgeryType: '',
    surgeryDate: '',
    hospitalName: '',
    doctorName: '',
    currentCondition: '',
    medicalHistory: '',
    allergies: '',
    emergencyContactNumber: '',
    bloodGroup: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/v1/patient/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        alert('Profile created successfully!');
        navigate('/');
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to create profile:', error);
      alert('Failed to create profile. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please fill in the details below to create your patient profile.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Basic Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900">Basic Details</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  required
                  value={formData.gender}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  required
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700">Age</label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  required
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="Enter your age"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div>
                <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700">Mobile Number</label>
                <input
                  id="mobileNumber"
                  name="mobileNumber"
                  type="text"
                  value={phoneNumber}
                  readOnly
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email (optional)</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter city"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700">State</label>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    required
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Enter state"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">Pincode</label>
                  <input
                    id="pincode"
                    name="pincode"
                    type="text"
                    required
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="Enter pincode"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Medical/Health Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900">Medical/Health Details</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="surgeryType" className="block text-sm font-medium text-gray-700">Surgery Type</label>
                <select
                  id="surgeryType"
                  name="surgeryType"
                  required
                  value={formData.surgeryType}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="">Select surgery type</option>
                  <option value="Fracture">Fracture</option>
                  <option value="Knee Replacement">Knee Replacement</option>
                  <option value="Hip Replacement">Hip Replacement</option>
                  <option value="Spine Surgery">Spine Surgery</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="surgeryDate" className="block text-sm font-medium text-gray-700">Date of Surgery</label>
                <input
                  id="surgeryDate"
                  name="surgeryDate"
                  type="date"
                  required
                  value={formData.surgeryDate}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div>
                <label htmlFor="hospitalName" className="block text-sm font-medium text-gray-700">Hospital/Doctor Name</label>
                <input
                  id="hospitalName"
                  name="hospitalName"
                  type="text"
                  required
                  value={formData.hospitalName}
                  onChange={handleChange}
                  placeholder="Enter hospital or doctor name"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div>
                <label htmlFor="doctorName" className="block text-sm font-medium text-gray-700">Doctor Name</label>
                <input
                  id="doctorName"
                  name="doctorName"
                  type="text"
                  required
                  value={formData.doctorName}
                  onChange={handleChange}
                  placeholder="Enter doctor's name"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div>
                <label htmlFor="currentCondition" className="block text-sm font-medium text-gray-700">Current Condition</label>
                <textarea
                  id="currentCondition"
                  name="currentCondition"
                  required
                  value={formData.currentCondition}
                  onChange={handleChange}
                  placeholder="Describe your current condition (pain level, mobility issues, swelling, etc.)"
                  rows="3"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div>
                <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700">Medical History (optional)</label>
                <textarea
                  id="medicalHistory"
                  name="medicalHistory"
                  value={formData.medicalHistory}
                  onChange={handleChange}
                  placeholder="List any medical history (diabetes, BP, heart conditions, etc.)"
                  rows="3"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div>
                <label htmlFor="allergies" className="block text-sm font-medium text-gray-700">Allergies (optional)</label>
                <textarea
                  id="allergies"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  placeholder="List any allergies"
                  rows="2"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div>
                <label htmlFor="emergencyContactNumber" className="block text-sm font-medium text-gray-700">Emergency Contact Number</label>
                <input
                  id="emergencyContactNumber"
                  name="emergencyContactNumber"
                  type="text"
                  required
                  value={formData.emergencyContactNumber}
                  onChange={handleChange}
                  placeholder="Enter emergency contact number"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div>
                <label htmlFor="bloodGroup" className="block text-sm font-medium text-gray-700">Blood Group (optional)</label>
                <input
                  id="bloodGroup"
                  name="bloodGroup"
                  type="text"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  placeholder="Enter blood group"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              Create Profile
            </button>
            <button
              type="button"
              className="group relative w-full flex justify-center py-2 px-4 border border-teal-600 text-teal-600 text-sm font-medium rounded-md hover:bg-teal-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              onClick={() => navigate('/user')}
            >
              Skip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientSignup;
