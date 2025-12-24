import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

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
    assignedPhysiotherapist: '',
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

  useEffect(() => {
    // Auto-fill contact from location state or user context
    const phoneNumber = location.state?.phoneNumber || user?.mobile_number;
    if (phoneNumber) {
      setFormData(prev => ({ ...prev, contact: phoneNumber }));
    }
  }, [user, location.state]);

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

    // Validate patient required fields
    if (selectedRole === 'patient') {
      const requiredPatientFields = [
        { field: 'age', label: 'Age' },
        { field: 'emergencyContactNumber', label: 'Emergency Contact Number' },
        { field: 'surgeryType', label: 'Surgery Type' },
        { field: 'surgeryDate', label: 'Surgery Date' },
        { field: 'currentCondition', label: 'Current Condition' }
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
      submitData.append('assignedPhysiotherapist', formData.assignedPhysiotherapist || '');
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
        headers: { 'Content-Type': 'multipart/form-data' },
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
    <div className="max-w-md mx-auto p-4 sm:p-6 md:p-8 bg-white rounded-lg shadow-md mt-10 mb-10">
      <h2 className="text-2xl font-bold mb-6 text-center">Complete Your Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
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

        {/* Common Fields */}
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name || ''}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <input
          type="email"
          name="email"
          placeholder="Email (optional)"
          value={formData.email || ''}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <input
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
          className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500 ${formData.contact ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
        <label htmlFor="dob" className="block font-semibold mb-1 -mt-2">Date of Birth</label>
        <input
          id="dob"
          type="date"
          name="dob"
          value={formData.dob || ''}
          min={getMinBirthDate()}
          max={getMaxBirthDate()}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <select
          name="gender"
          value={formData.gender || ''}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        <textarea
          name="address"
          placeholder="Address"
          value={formData.address || ''}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
          rows="3"
        />

        {/* Patient Fields */}
        <div style={{ display: selectedRole === 'patient' ? 'block' : 'none' }}>
          {selectedRole === 'patient' && (
          <div className="space-y-4">
            <div>
              <label className="block font-semibold mb-1">Age <span className="text-red-500">*</span></label>
              <input
                type="number"
                name="age"
                placeholder="Age (auto-calculated)"
                value={formData.age}
                readOnly
                min="0"
                max="150"
                required={selectedRole === 'patient'}
                className="w-full px-3 py-2 border rounded bg-gray-100 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-500"
                title="Age is automatically calculated from Date of Birth"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Emergency Contact Number <span className="text-red-500">*</span></label>
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
                required={selectedRole === 'patient'}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Surgery Type <span className="text-red-500">*</span></label>
              <select
                name="surgeryType"
                value={formData.surgeryType}
                onChange={handleChange}
                required={selectedRole === 'patient'}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">-- Select Surgery Type --</option>
                <option value="Fracture">Fracture</option>
                <option value="Knee Replacement">Knee Replacement</option>
                <option value="Hip Replacement">Hip Replacement</option>
                <option value="Spine Surgery">Spine Surgery</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="surgeryDate" className="block font-semibold mb-1">Surgery Date <span className="text-red-500">*</span></label>
              <input
                id="surgeryDate"
                type="date"
                name="surgeryDate"
                value={formData.surgeryDate || ''}
                onChange={handleChange}
                required={selectedRole === 'patient'}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Current Condition <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="currentCondition"
                placeholder="Describe your current condition"
                value={formData.currentCondition}
                onChange={handleChange}
                required={selectedRole === 'patient'}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <input
              type="text"
              name="doctorName"
              placeholder="Doctor Name (optional)"
              value={formData.doctorName}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            />

            <input
              type="text"
              name="hospitalName"
              placeholder="Hospital/Clinic Name (optional)"
              value={formData.hospitalName || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            />

            <input
              type="text"
              name="assignedPhysiotherapist"
              placeholder="Assigned Physiotherapist (optional)"
              value={formData.assignedPhysiotherapist || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            />

            <div>
              <label className="block font-semibold mb-1">Medical History</label>
              <textarea
                name="medicalHistory"
                placeholder="Describe your medical history (optional)"
                value={formData.medicalHistory || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                rows="3"
              />
            </div>

            <input
              type="text"
              name="allergies"
              placeholder="Allergies (optional)"
              value={formData.allergies || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            />

            <input
              type="text"
              name="bloodGroup"
              placeholder="Blood Group (optional, e.g., A+, O-)"
              value={formData.bloodGroup || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            />

            <input
              type="text"
              name="medicalInsurance"
              placeholder="Medical Insurance (optional)"
              value={formData.medicalInsurance || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            />

            <div>
              <label className="block font-semibold mb-1">Medical Report (optional)</label>
              <input
                type="file"
                name="medicalReport"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          )}
        </div>

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
              placeholder="Registration Number / License ID"
              value={formData.registrationNumber}
              onChange={handleChange}
              required
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
              placeholder="Registration / License Number"
              value={formData.physioRegistrationNumber}
              onChange={handleChange}
              required
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

        <div className="flex justify-between items-center mt-6">
          {selectedRole === 'patient' && (
            <button
              type="button"
              onClick={handleSkip}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
            >
              Skip for now
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientSignup;
