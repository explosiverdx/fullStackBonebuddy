import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { indianStates, getCitiesByState, getAddressFromPincode } from '../utils/locationHelper';

const PatientSignup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, verifiedMobile } = useAuth();

  const [selectedRole, setSelectedRole] = useState('patient');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dob: '',
    gender: '',
    address: '',
    state: '',
    city: '',
    areaCode: '',
    contact: verifiedMobile || location.state?.phoneNumber || '',
    // Patient fields
    surgeryType: '',
    surgeryDate: '',
    doctorName: '',
    medicalReport: null,
    hospitalName: '',
    emergencyContactNumber: '',
    age: '',
    currentCondition: '',
    medicalHistory: '',
    allergies: '',
    bloodGroup: '',
    medicalInsurance: '',
    // Doctor fields (these are not patient fields, but were in the formData state)
    profilePhoto: null,
    specialization: '',
    experience: 0,
    qualification: '',
    registrationNumber: '',
    hospitalAffiliation: '',
    availableDays: [],
    availableTimeSlots: '',
    consultationFee: 0,
    bio: '',
    // Physiotherapist fields
    physioProfilePhoto: null,
    physioSpecialization: '',
    physioQualification: '',
    physioExperience: 0,
    physioRegistrationNumber: '',
    physioClinicAffiliation: '',
    physioAvailableDays: [],
    physioAvailableTimeSlots: '',
    physioConsultationFee: 0,
    physioBio: ''
  });

  // Default form data per role
  const defaultFormData = {
    patient: {
      name: '',
      email: '',
      dob: '',
      gender: '',
      address: '',
      state: '',
      city: '',
      areaCode: '',
      contact: '',
      surgeryType: '',
      hospitalName: '',
      surgeryDate: '',
      doctorName: '',
      emergencyContactNumber: '',
      age: '',
      currentCondition: '',
      assignedPhysiotherapist: '',
      medicalHistory: '',
      allergies: '',
      bloodGroup: '',
      medicalInsurance: ''
    },
    doctor: {
      name: '',
      email: '',
      dob: '',
      gender: '',
      address: '',
      state: '',
      city: '',
      areaCode: '',
      contact: '',
      profilePhoto: null,
      specialization: '',
      experience: '',
      qualification: '',
      registrationNumber: '',
      hospitalAffiliation: '',
      availableDays: [],
      availableTimeSlots: '',
      consultationFee: '',
      bio: ''
    },
    physiotherapist: {
      name: '',
      email: '',
      dob: '',
      gender: '',
      address: '',
      state: '',
      city: '',
      areaCode: '',
      contact: '',
      physioProfilePhoto: null,
      physioSpecialization: '',
      physioQualification: '',
      physioExperience: '',
      physioRegistrationNumber: '',
      physioClinicAffiliation: '',
      physioAvailableDays: [],
      physioAvailableTimeSlots: '',
      physioConsultationFee: '',
      physioBio: ''
    }
  };

  // Reset formData to default when selectedRole changes, preserving contact
  useEffect(() => {
    setFormData(prev => {
      const newData = { ...defaultFormData[selectedRole] };
      if (prev.contact) newData.contact = prev.contact;
      return newData;
    });
  }, [selectedRole]);

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [dynamicCitiesByState, setDynamicCitiesByState] = useState({});
  
  // Calculate registration fee based on medical insurance and state
  // Only for insured patients (Medical Insurance = "Yes")
  // Uttar Pradesh (or UP / U.P.) => ₹18,000; other states => ₹35,000
  const calculateRegistrationFee = () => {
    if (selectedRole === 'patient' && formData.medicalInsurance === 'Yes') {
      const s = (formData.state || '').trim();
      if (/Uttar\s*Pradesh|^U\.?P\.?$/i.test(s)) return 18000;
      return 35000;
    }
    return null; // No fee for non-insured patients
  };
  
  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };
  
  // Initiate payment after profile submission
  const initiatePayment = async (amount) => {
    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert('Failed to load payment gateway. Please try again.');
        return;
      }

      // Create Razorpay order
      const orderResponse = await fetch('/api/v1/payments/razorpay/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: amount,
          description: 'Patient Registration Fee',
          paymentType: 'registration'
        })
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.message || 'Failed to create payment order');
      }

      const orderData = await orderResponse.json();
      const { orderId, amount: orderAmount, currency, paymentId, key } = orderData.data;

      // Initialize Razorpay checkout
      const options = {
        key: key,
        amount: orderAmount,
        currency: currency,
        name: 'BoneBuddy',
        description: 'Patient Registration Fee',
        order_id: orderId,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/v1/payments/razorpay/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
              },
              credentials: 'include',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                paymentId: paymentId
              })
            });

            if (!verifyResponse.ok) {
              throw new Error('Payment verification failed');
            }

            alert('✅ Payment successful!');
            // Navigate to patient profile after successful payment
            navigate('/PatientProfile', { replace: true });
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('❌ Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: formData.name || '',
          email: formData.email || '',
          contact: formData.contact || ''
        },
        theme: {
          color: '#0d9488' // Teal color matching your theme
        },
        modal: {
          ondismiss: function() {
            // If payment is cancelled, still navigate to profile
            navigate('/PatientProfile', { replace: true });
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        alert(`❌ Payment failed: ${response.error.description}`);
        navigate('/PatientProfile', { replace: true });
      });
      
      razorpay.open();
    } catch (error) {
      console.error('Payment initiation error:', error);
      alert(`Failed to initiate payment: ${error.message}`);
      // Navigate to profile even if payment fails
      navigate('/PatientProfile', { replace: true });
    }
  };

  useEffect(() => {
    // Auto-fill contact from location state or user context
    const phoneNumber = location.state?.phoneNumber || user?.mobile_number;
    if (phoneNumber) {
      setFormData(prev => ({ ...prev, contact: phoneNumber }));
    }
  }, [user, location.state]);

  // Get cities for selected state
  const getCitiesForSelectedState = (state = formData.state) => {
    if (!state) return [];
    const citiesMap = getCitiesByState();
    const hardcodedCities = citiesMap[state] || [];
    const dynamicCities = dynamicCitiesByState[state] || [];
    
    // Combine and remove duplicates
    const allCities = [...new Set([...hardcodedCities, ...dynamicCities])].sort();
    return allCities;
  };

  // Fetch address from pincode
  const handlePincodeChange = async (e) => {
    const pincode = e.target.value.replace(/\D/g, '').slice(0, 6);
    setFormData(prev => ({ ...prev, areaCode: pincode }));

    if (pincode.length === 6) {
      setIsFetchingAddress(true);
      try {
        const addressData = await getAddressFromPincode(pincode);
        if (addressData) {
          const { state, city } = addressData;
          
          // Add city to dynamic cities list
          if (state && city) {
            setDynamicCitiesByState(prev => {
              const stateCities = prev[state] || [];
              if (!stateCities.includes(city)) {
                return { ...prev, [state]: [...stateCities, city] };
              }
              return prev;
            });
          }

          setFormData(prev => ({
            ...prev,
            state: state || prev.state,
            city: city || prev.city,
            // Do not set address – only state and city from pincode
          }));
          
          alert('State and city fetched from pincode.');
        } else {
          alert('Could not fetch address for this pincode');
        }
      } catch (error) {
        console.error('Error fetching address:', error);
        alert('Error fetching address. Please try again.');
      } finally {
        setIsFetchingAddress(false);
      }
    }
  };


  // Calculate age from date of birth
  const calculateAgeFromDob = (dobValue) => {
    if (!dobValue) return '';
    const birthDate = new Date(dobValue);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? age : '';
  };

  const handleChange = (e) => {
    const { name, value, type, files, checked } = e.target;

    if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
      } else if (type === 'checkbox') {
        // For availableDays arrays
        if (name === 'availableDays') {
          let newDays = [...(formData.availableDays || [])];
          if (checked) {
            newDays.push(value);
          } else {
            newDays = newDays.filter(day => day !== value);
          }
          setFormData(prev => ({ ...prev, availableDays: newDays }));
        } else if (name === 'physioAvailableDays') {
          let newDays = [...(formData.physioAvailableDays || [])];
          if (checked) {
            newDays.push(value);
          } else {
            newDays = newDays.filter(day => day !== value);
          }
          setFormData(prev => ({ ...prev, physioAvailableDays: newDays }));
        }
    } else {
      setFormData(prev => {
        const updated = { ...prev, [name]: value };
        // Auto-calculate age if dob is being changed
        if (name === 'dob' && value) {
          updated.age = calculateAgeFromDob(value);
        }
        return updated;
      });
    }
  };

  // Auto-calculate age when dob changes
  useEffect(() => {
    if (formData.dob) {
      const calculatedAge = calculateAgeFromDob(formData.dob);
      if (calculatedAge !== formData.age) {
        setFormData(prev => ({ ...prev, age: calculatedAge }));
      }
    }
  }, [formData.dob]);

  const validateDOB = (dobValue) => {
    if (!dobValue) return true;
    const birthDate = new Date(dobValue);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age > 100 || age < 18) {
      if (age > 100) {
        alert('Age cannot be more than 100 years.');
      } else {
        alert('Age must be more than 18 years.');
      }
      return false;
    }
    return true;
  };

  const handleDOBBlur = (e) => {
    const dobValue = e.target.value;
    if (!validateDOB(dobValue)) {
      setFormData(prev => ({ ...prev, dob: '', age: '' }));
    } else {
      // Auto-calculate age on blur as well
      const calculatedAge = calculateAgeFromDob(dobValue);
      if (calculatedAge) {
        setFormData(prev => ({ ...prev, age: calculatedAge }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate patient required fields (matching mobile app)
    if (selectedRole === 'patient') {
      const requiredPatientFields = [
        { field: 'age', label: 'Age' },
        { field: 'surgeryType', label: 'Surgery Type' },
        { field: 'surgeryDate', label: 'Surgery Date' },
        { field: 'medicalInsurance', label: 'Medical Insurance' }
      ];

      const missingFields = requiredPatientFields
        .filter(({ field }) => !formData[field] || formData[field].toString().trim() === '')
        .map(({ label }) => label);

      if (missingFields.length > 0) {
        alert(`Please fill in the following required fields:\n\n${missingFields.join('\n')}`);
        return;
      }
    }

    const submitData = new FormData();
    submitData.append('role', selectedRole);
    submitData.append('name', formData.name);
    submitData.append('email', formData.email);
    submitData.append('dob', formData.dob);
    submitData.append('gender', formData.gender);
    submitData.append('address', formData.address);
    submitData.append('state', formData.state || '');
    submitData.append('city', formData.city || '');
    submitData.append('areaCode', formData.areaCode || '');
    submitData.append('pincode', formData.areaCode || '');
    submitData.append('contact', formData.contact);

    if (selectedRole === 'patient') {
      submitData.append('surgeryType', formData.surgeryType);
      submitData.append('surgeryDate', formData.surgeryDate);
      submitData.append('doctorName', formData.doctorName);
      if (formData.medicalReport) submitData.append('medicalReport', formData.medicalReport);
      submitData.append('hospitalName', formData.hospitalName);
      submitData.append('emergencyContactNumber', formData.emergencyContactNumber || formData.contact);
      submitData.append('age', formData.age);
      submitData.append('currentCondition', formData.currentCondition);
      submitData.append('medicalHistory', formData.medicalHistory || '');
      submitData.append('allergies', formData.allergies || '');
      submitData.append('bloodGroup', formData.bloodGroup || '');
      submitData.append('medicalInsurance', formData.medicalInsurance || '');
    } else if (selectedRole === 'doctor') {
      if (formData.profilePhoto) submitData.append('profilePhoto', formData.profilePhoto);
      submitData.append('specialization', formData.specialization);
      submitData.append('experience', formData.experience);
      submitData.append('qualification', formData.qualification);
      submitData.append('registrationNumber', formData.registrationNumber);
      submitData.append('hospitalAffiliation', formData.hospitalAffiliation);
      submitData.append('availableDays', JSON.stringify(formData.availableDays));
      submitData.append('availableTimeSlots', formData.availableTimeSlots);
      submitData.append('consultationFee', formData.consultationFee);
      submitData.append('bio', formData.bio);
    } else if (selectedRole === 'physiotherapist') {
      if (formData.physioProfilePhoto) submitData.append('profilePhoto', formData.physioProfilePhoto);
      submitData.append('specialization', formData.physioSpecialization);
      submitData.append('qualification', formData.physioQualification);
      submitData.append('experience', formData.physioExperience);
      submitData.append('registrationNumber', formData.physioRegistrationNumber);
      submitData.append('clinicAffiliation', formData.physioClinicAffiliation);
      submitData.append('availableDays', JSON.stringify(formData.physioAvailableDays));
      submitData.append('availableTimeSlots', formData.physioAvailableTimeSlots);
      submitData.append('consultationFee', formData.physioConsultationFee);
      submitData.append('bio', formData.physioBio);
    }

    try {
      const response = await axios.post('/api/v1/users/profile', submitData, {
        withCredentials: true
        // Do not set Content-Type: axios leaves it unset for FormData so the browser sets multipart/form-data with the correct boundary
      });
      if (response.status === 200) {
        const updatedUser = response.data.data;
        login(updatedUser);
        
        // For patient registration
        if (selectedRole === 'patient') {
          const registrationFee = calculateRegistrationFee();
          // Only initiate payment for insured patients
          if (registrationFee !== null && formData.medicalInsurance === 'Yes') {
            await initiatePayment(registrationFee);
          } else {
            // Non-insured patient - show message modal
            setShowSuccessModal(true);
          }
        } else {
          // For other roles, navigate to profile
          const profileRoutes = {
            doctor: '/DoctorProfile',
            physiotherapist: '/PhysiotherapistProfile'
          };
          navigate(profileRoutes[selectedRole] || '/PatientProfile', { replace: true });
        }
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleSkip = async () => {
    try {
      const response = await axios.post('/api/v1/users/profile', {}, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      });
      if (response.status === 200) {
        const updatedUser = response.data.data;
        login(updatedUser);
        const profileRoutes = {
          patient: '/PatientProfile',
          doctor: '/DoctorProfile',
          physiotherapist: '/PhysiotherapistProfile'
        };
        navigate(profileRoutes[selectedRole] || '/PatientProfile', { replace: true });
      }
    } catch (error) {
      console.error('Failed to skip profile:', error);
      alert('Failed to skip profile update. Please try again.');
    }
  };

  const getMinBirthDate = () => {
    const today = new Date();
    return new Date(today.getFullYear() - 100, today.getMonth(), today.getDate()).toISOString().split('T')[0];
  };

  const getMaxBirthDate = () => {
    const today = new Date();
    // User must be at least 18 years old
    return new Date(today.getFullYear() - 18, today.getMonth(), today.getDate()).toISOString().split('T')[0];
  };
  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 md:p-8 bg-white rounded-lg shadow-lg mt-10 mb-10">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2 text-gray-800">Complete Your Profile</h2>
        <p className="text-gray-600">Please fill in your details to continue</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
        <div className="mb-6">
          <label className="block font-semibold mb-4 text-center">Select Your Role</label>
          <div className="flex justify-center gap-4">
            {[
              { value: 'patient', label: 'Patient', icon: '🧍' },
              { value: 'doctor', label: 'Doctor', icon: '👨‍⚕️' },
              { value: 'physiotherapist', label: 'Physiotherapist', icon: '🏋️‍♂️' }
            ].map(role => (
              <button
                key={role.value}
                type="button"
                onClick={() => setSelectedRole(role.value)}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                  selectedRole === role.value
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="mr-2">{role.icon}</span>
                {role.label}
              </button>
            ))}
          </div>
        </div>

        {/* Common Fields - Personal Information Section */}
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h3 className="text-xl font-bold mb-4 text-blue-600">Personal Information</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
              <input
                id="name"
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={formData.name || ''}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-500 text-sm">(optional)</span></label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email || ''}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
              />
            </div>

            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
              <input
                id="contact"
                type="tel"
                name="contact"
                placeholder="10 digits only"
                value={formData.contact || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  handleChange({ ...e, target: { ...e.target, value } });
                }}
                maxLength="10"
                pattern="[0-9]{10}"
                required
                disabled={!!formData.contact}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all ${formData.contact ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
            </div>

            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth <span className="text-red-500">*</span></label>
              <input
                id="dob"
                type="date"
                name="dob"
                value={formData.dob || ''}
                min={getMinBirthDate()}
                max={getMaxBirthDate()}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
              />
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender <span className="text-red-500">*</span></label>
              <select
                id="gender"
                name="gender"
                value={formData.gender || ''}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="areaCode" className="block text-sm font-medium text-gray-700 mb-1">Area Code (Pincode) <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  id="areaCode"
                  type="text"
                  name="areaCode"
                  placeholder="Enter 6-digit pincode"
                  value={formData.areaCode || ''}
                  onChange={handlePincodeChange}
                  maxLength="6"
                  required
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                />
                {isFetchingAddress ? (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-500"></div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.areaCode && formData.areaCode.length === 6) {
                        handlePincodeChange({ target: { value: formData.areaCode } });
                      }
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-teal-600 hover:text-teal-700"
                    title="Fetch state and city from pincode"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
              <select
                id="state"
                name="state"
                value={formData.state || ''}
                onChange={(e) => {
                  const newState = e.target.value;
                  handleChange(e);
                  setFormData(prev => {
                    const availableCities = getCitiesForSelectedState(newState);
                    const cityInNewState = availableCities.includes(prev.city);
                    return { ...prev, state: newState, city: cityInNewState ? prev.city : '' };
                  });
                }}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
              >
                <option value="">Select State</option>
                {indianStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
              <input
                id="city"
                name="city"
                list="city-datalist-signup"
                type="text"
                placeholder="Select or type city name"
                value={formData.city || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value.trim() }))}
                required
                disabled={!formData.state}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all ${!formData.state ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
              <datalist id="city-datalist-signup">
                {getCitiesForSelectedState().map(city => <option key={city} value={city} />)}
              </datalist>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address <span className="text-red-500">*</span></label>
              <textarea
                id="address"
                name="address"
                placeholder="Street address, area, landmark"
                value={formData.address || ''}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                rows="3"
              />
            </div>
          </div>
        </div>

        {/* Patient Fields */}
        {selectedRole === 'patient' && (
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h3 className="text-xl font-bold mb-4 text-blue-600">Patient Information</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">Age <span className="text-red-500">*</span></label>
                <input
                  id="age"
                  type="number"
                  name="age"
                  placeholder="Auto-calculated from date of birth"
                  value={formData.age}
                  readOnly
                  min="0"
                  max="150"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed focus:outline-none"
                  title="Age is automatically calculated from Date of Birth"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-calculated from date of birth</p>
              </div>

            <div>
              <label className="block font-semibold mb-1">Emergency Contact Number <span className="text-gray-500 text-sm">(optional)</span></label>
              <input
                type="tel"
                name="emergencyContactNumber"
                placeholder="10 digits only"
                value={formData.emergencyContactNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  handleChange({ ...e, target: { ...e.target, value } });
                }}
                maxLength="10"
                pattern="[0-9]{10}"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

              <div>
                <label htmlFor="surgeryType" className="block text-sm font-medium text-gray-700 mb-1">Surgery Type <span className="text-red-500">*</span></label>
                <select
                  id="surgeryType"
                  name="surgeryType"
                  value={formData.surgeryType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                >
                  <option value="">Select Surgery Type</option>
                  <option value="Fracture">Fracture</option>
                  <option value="Knee Replacement">Knee Replacement</option>
                  <option value="Hip Replacement">Hip Replacement</option>
                  <option value="Spine Surgery">Spine Surgery</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="surgeryDate" className="block text-sm font-medium text-gray-700 mb-1">Surgery Date <span className="text-red-500">*</span></label>
                <input
                  id="surgeryDate"
                  type="date"
                  name="surgeryDate"
                  value={formData.surgeryDate || ''}
                  onChange={handleChange}
                  min="2000-01-01"
                  max={new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString().split('T')[0]}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                />
              </div>

              <div>
                <label htmlFor="medicalInsurance" className="block text-sm font-medium text-gray-700 mb-1">Medical Insurance <span className="text-red-500">*</span></label>
                <select
                  id="medicalInsurance"
                  name="medicalInsurance"
                  value={formData.medicalInsurance || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                >
                  <option value="">Select Medical Insurance</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              {/* Registration Fee Display - Only show for insured patients */}
              {formData.medicalInsurance === 'Yes' && calculateRegistrationFee() !== null && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-lg p-5 shadow-md">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-blue-700">Registration Fee:</span>
                    <span className="text-3xl font-bold text-blue-700">₹{calculateRegistrationFee().toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="doctorName" className="block text-sm font-medium text-gray-700 mb-1">Doctor Name <span className="text-gray-500 text-sm">(optional)</span></label>
                <input
                  id="doctorName"
                  type="text"
                  name="doctorName"
                  placeholder="Enter doctor name"
                  value={formData.doctorName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                />
              </div>

              <div>
                <label htmlFor="hospitalName" className="block text-sm font-medium text-gray-700 mb-1">Hospital/Clinic Name <span className="text-gray-500 text-sm">(optional)</span></label>
                <input
                  id="hospitalName"
                  type="text"
                  name="hospitalName"
                  placeholder="Enter hospital or clinic name"
                  value={formData.hospitalName || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                />
              </div>

              <div>
                <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700 mb-1">Medical History <span className="text-gray-500 text-sm">(optional)</span></label>
                <textarea
                  id="medicalHistory"
                  name="medicalHistory"
                  placeholder="Describe your medical history"
                  value={formData.medicalHistory || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  rows="3"
                />
              </div>

              <div>
                <label htmlFor="allergies" className="block text-sm font-medium text-gray-700 mb-1">Allergies <span className="text-gray-500 text-sm">(optional)</span></label>
                <input
                  id="allergies"
                  type="text"
                  name="allergies"
                  placeholder="Enter any allergies"
                  value={formData.allergies || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                />
              </div>

              <div>
                <label htmlFor="bloodGroup" className="block text-sm font-medium text-gray-700 mb-1">Blood Group <span className="text-gray-500 text-sm">(optional)</span></label>
                <input
                  id="bloodGroup"
                  type="text"
                  name="bloodGroup"
                  placeholder="e.g., A+, O-, B+"
                  value={formData.bloodGroup || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                />
              </div>

              <div>
                <label htmlFor="medicalReport" className="block text-sm font-medium text-gray-700 mb-1">Medical Report <span className="text-gray-500 text-sm">(optional)</span></label>
                <input
                  id="medicalReport"
                  type="file"
                  name="medicalReport"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.heic,.bmp,.doc,.docx"
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* Doctor Fields */}
        <div style={{ display: selectedRole === 'doctor' ? 'block' : 'none' }}>
          {selectedRole === 'doctor' && (
          <>
            <label className="block font-semibold mb-1">Profile Photo</label>
            <input
              type="file"
              name="profilePhoto"
              accept="image/*"
              required
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="text"
              name="specialization"
              placeholder="Specialization"
              value={formData.specialization || ''}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="number"
              name="experience"
              placeholder="Experience (years)"
              value={formData.experience}
              onChange={handleChange}
              max="100"
              required
              min="0"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="text"
              name="qualification"
              placeholder="Qualification"
              value={formData.qualification}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="text"
              name="registrationNumber"
              placeholder="Registration Number / License ID (optional)"
              value={formData.registrationNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="text"
              name="hospitalAffiliation"
              placeholder="Hospital / Clinic Affiliation"
              value={formData.hospitalAffiliation}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <div className="mb-4">
              <label className="block font-semibold mb-1">Available Days</label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map(day => (
                  <label key={day} className="inline-flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="availableDays"
                      value={day}
                    checked={formData.availableDays?.includes(day) ?? false}
                      onChange={handleChange}
                    />
                    <span>{day}</span>
                  </label>
                ))}
              </div>
            </div>
            <input
              type="text"
              name="availableTimeSlots"
              placeholder="Available Time Slots (e.g. 9am - 5pm)"
              required
              value={formData.availableTimeSlots}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="number"
              name="consultationFee"
              placeholder="Consultation Fee (optional)"
              value={formData.consultationFee}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <textarea
              name="bio"
              placeholder="Short Bio / About Doctor (optional)"
              value={formData.bio}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
              rows="3"
            />
          </>
          )}
        </div>

        {/* Physiotherapist Fields */}
        <div style={{ display: selectedRole === 'physiotherapist' ? 'block' : 'none' }}>
          {selectedRole === 'physiotherapist' && (
          <>
            <label className="block font-semibold mb-1">Profile Photo</label>
            <input
              type="file"
              name="physioProfilePhoto"
              accept="image/*"
              required
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="text"
              name="physioSpecialization"
              placeholder="Specialization / Focus Area"
              value={formData.physioSpecialization || ''}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="text"
              name="physioQualification"
              placeholder="Qualification"
              value={formData.physioQualification}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="number"
              name="physioExperience"
              placeholder="Experience (years)"
              value={formData.physioExperience}
              onChange={handleChange}
              max="100"
              required
              min="0"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="text"
              name="physioRegistrationNumber"
              placeholder="Registration / License Number (optional)"
              value={formData.physioRegistrationNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="text"
              name="physioClinicAffiliation"
              placeholder="Clinic / Hospital Affiliation"
              value={formData.physioClinicAffiliation}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <div className="mb-4">
              <label className="block font-semibold mb-1">Available Days</label>
              <div className="flex flex-wrap gap-2">
              {daysOfWeek.map(day => (
                <label key={day} className="inline-flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="physioAvailableDays"
                    value={day}
                    checked={formData.physioAvailableDays?.includes(day) || false}
                    onChange={handleChange}
                  />
                  <span>{day}</span>
                </label>
              ))}
              </div>
            </div>
            <input
              type="text"
              name="physioAvailableTimeSlots"
              placeholder="Available Time Slots (e.g. 9am - 5pm)"
              required
              value={formData.physioAvailableTimeSlots}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="number"
              name="physioConsultationFee"
              placeholder="Consultation / Session Fee (optional)"
              value={formData.physioConsultationFee}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <textarea
              name="physioBio"
              placeholder="Short Bio / Description (optional)"
              value={formData.physioBio}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
              rows="3"
            />
          </>
          )}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="submit"
            className="w-full max-w-md bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-8 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            Submit
          </button>
        </div>
      </form>

      {/* Success Modal for Non-Insured Patients */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Profile Submitted</h3>
              </div>
              <p className="text-gray-700 text-lg mb-6 ml-16">
                Our representative will reach you soon.
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    navigate('/PatientProfile', { replace: true });
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg font-semibold hover:from-teal-700 hover:to-teal-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientSignup;
