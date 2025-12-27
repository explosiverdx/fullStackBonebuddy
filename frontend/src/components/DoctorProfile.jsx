import React, { useState, useEffect } from 'react';

const DoctorProfile = () => {
  // Load active tab from localStorage or default to 'overview'
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('doctorProfileActiveTab');
    return savedTab || 'overview';
  });
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [patients, setPatients] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [showReferModal, setShowReferModal] = useState(false);
  const [referForm, setReferForm] = useState({
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    patientAge: '',
    patientGender: '',
    condition: '',
    surgeryType: '',
    surgeryDate: '',
    notes: '',
  });
  const [referring, setReferring] = useState(false);
  const [myReferrals, setMyReferrals] = useState([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [selectedPatientDetail, setSelectedPatientDetail] = useState(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSurgeryType, setFilterSurgeryType] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/v1/users/me', {
          method: 'GET',
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setProfile(data.data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (activeTab !== 'overview') {
      if (activeTab === 'referrals') {
        fetchMyReferrals();
      } else {
        fetchPatientsAndSessions();
      }
    }
  }, [activeTab]);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Check on mount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchMyReferrals = async () => {
    setLoadingReferrals(true);
    try {
      const response = await fetch('/api/v1/referrals/my-referrals', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setMyReferrals(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setLoadingReferrals(false);
    }
  };

  const fetchPatientsAndSessions = async () => {
    setDataLoading(true);
    try {
      const response = await fetch('/api/v1/doctors/my-patients-sessions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        console.log('[DEBUG] Full API Response:', data);
        console.log('[DEBUG] Response data:', data.data);
        console.log('[DEBUG] Patients array:', data.data?.patients);
        console.log('[DEBUG] Patients count:', data.data?.patients?.length);
        console.log('[DEBUG] Stats:', data.data?.stats);
        console.log('[DEBUG] Sessions count:', data.data?.sessions?.length);
        
        const patientsList = Array.isArray(data.data?.patients) ? data.data.patients : [];
        console.log('[DEBUG] Setting patients list (length):', patientsList.length);
        if (patientsList.length > 0) {
          console.log('[DEBUG] First patient full object:', JSON.stringify(patientsList[0], null, 2));
          console.log('[DEBUG] First patient _id:', patientsList[0]._id);
          console.log('[DEBUG] First patient userId:', patientsList[0].userId);
          console.log('[DEBUG] First patient name:', patientsList[0].name || patientsList[0].userId?.Fullname);
          console.log('[DEBUG] First patient totalSessions:', patientsList[0].totalSessions);
          console.log('[DEBUG] First patient isVirtual:', patientsList[0].isVirtual);
        }
        
        setPatients(patientsList);
        setSessions(data.data?.sessions || []);
        setStats(data.data?.stats || null);
        
        if (patientsList.length === 0) {
          console.warn('[WARNING] No patients returned from API');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('[ERROR] Failed to fetch patients:', response.status, response.statusText, errorData);
        alert(`Failed to load patients: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('[ERROR] Exception fetching patients and sessions:', error);
      alert(`Error loading patients: ${error.message}`);
    } finally {
      setDataLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'patients', label: 'Patients' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'referrals', label: 'Referred Patients' },
  ];

  const handleEditClick = () => {
    setEditForm({
      name: profile.Fullname || '',
      email: profile.email || '',
      dob: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
      gender: profile.gender || '',
      contact: profile.mobile_number || '',
      specialization: profile.specialization || '',
      experience: profile.experience || '',
      qualification: profile.qualification || '',
      registrationNumber: profile.registrationNumber || '',
      hospitalName: profile.hospitalName || '',
      availableDays: profile.availableDays || [],
      availableTimeSlots: profile.availableTimeSlots || '',
      consultationFee: profile.consultationFee || '',
      bio: profile.bio || '',
      status: profile.status || ''
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      Object.keys(editForm).forEach(key => {
        if (editForm[key]) {
          if (Array.isArray(editForm[key])) {
            formData.append(key, JSON.stringify(editForm[key]));
          } else {
            formData.append(key, editForm[key]);
          }
        }
      });
      formData.append('role', 'doctor');

      const response = await fetch('/api/v1/users/profile', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        alert('Profile updated successfully!');
        setIsEditing(false);
        // Refresh profile data
        const profileResponse = await fetch('/api/v1/users/me', {
          method: 'GET',
          credentials: 'include',
        });
        if (profileResponse.ok) {
          const data = await profileResponse.json();
          setProfile(data.data);
        }
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({});
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      alert('Please select an image file');
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const response = await fetch('/api/v1/users/avatar', {
        method: 'PATCH',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        alert('Profile picture updated successfully!');
        // Refresh profile data
        const profileResponse = await fetch('/api/v1/users/me', {
          method: 'GET',
          credentials: 'include',
        });
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setProfile(profileData.data);
        }
        setAvatarFile(null);
        setAvatarPreview(null);
        // Reset file input
        const fileInput = document.getElementById('avatar-upload');
        if (fileInput) fileInput.value = '';
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to upload profile picture');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error uploading profile picture. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleReferSubmit = async (e) => {
    e.preventDefault();
    if (!referForm.patientName || !referForm.patientPhone || !referForm.condition) {
      alert('Please fill in required fields: Patient Name, Phone, and Condition');
      return;
    }

    setReferring(true);
    try {
      const response = await fetch('/api/v1/referrals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        credentials: 'include',
        body: JSON.stringify(referForm),
      });

      if (response.ok) {
        const data = await response.json();
        alert('Patient referred successfully!');
        setShowReferModal(false);
        setReferForm({
          patientName: '',
          patientPhone: '',
          patientEmail: '',
          patientAge: '',
          patientGender: '',
          condition: '',
          surgeryType: '',
          surgeryDate: '',
          notes: '',
        });
        // Refresh referrals if on referrals tab
        if (activeTab === 'referrals') {
          fetchMyReferrals();
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to refer patient');
      }
    } catch (error) {
      console.error('Error referring patient:', error);
      alert('Error referring patient. Please try again.');
    } finally {
      setReferring(false);
    }
  };

  const handleDayChange = (day) => {
    const currentDays = editForm.availableDays || [];
    if (currentDays.includes(day)) {
      setEditForm({...editForm, availableDays: currentDays.filter(d => d !== day)});
    } else {
      setEditForm({...editForm, availableDays: [...currentDays, day]});
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-14 sm:pt-16 md:pt-20">
      <div className="max-w-6xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 py-3 sm:py-4 md:py-6">
        <div className="bg-white rounded-lg shadow-md p-2.5 sm:p-3 md:p-4 lg:p-6 mb-3 sm:mb-4 md:mb-6 overflow-hidden">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-teal-600 mb-2 sm:mb-3 md:mb-4">👨‍⚕️ Doctor Profile</h1>

          {/* Tabs */}
          <div className="flex space-x-0.5 sm:space-x-1 mb-3 sm:mb-4 md:mb-6 overflow-x-auto pb-2 -mx-2.5 sm:-mx-3 md:mx-0 px-2.5 sm:px-3 md:px-0 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  // Save active tab to localStorage so it persists on refresh
                  localStorage.setItem('doctorProfileActiveTab', tab.id);
                }}
                className={`px-2 sm:px-2.5 md:px-3 lg:px-4 py-1 sm:py-1.5 md:py-2 rounded-t-lg font-medium text-[11px] sm:text-xs md:text-sm whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-96">
            {activeTab === 'overview' && (
              <div className="space-y-4 sm:space-y-6">
                {isEditing ? (
                  <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
                      <h2 className="text-xl sm:text-2xl font-bold">Edit Profile</h2>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                        <button
                          onClick={handleSave}
                          className="px-3 sm:px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 text-sm sm:text-base"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-3 sm:px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm sm:text-base"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold text-sm sm:text-base text-gray-800">Personal Information</h3>
                        <div>
                          <label className="block text-sm font-medium mb-1">Full Name</label>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Email</label>
                          <input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Date of Birth</label>
                          <input
                            type="date"
                            value={editForm.dob}
                            onChange={(e) => setEditForm({...editForm, dob: e.target.value})}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Gender</label>
                          <select
                            value={editForm.gender}
                            onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                            className="w-full p-2 border rounded"
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Contact Number</label>
                          <input
                            type="text"
                            value={editForm.contact}
                            onChange={(e) => setEditForm({...editForm, contact: e.target.value})}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Profile Photo</label>
                          <div className="flex flex-col items-start gap-3">
                            {/* Current Avatar */}
                            <div className="flex items-center gap-3">
                              {avatarPreview ? (
                                <img src={avatarPreview} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-gray-300" />
                              ) : profile?.avatar ? (
                                <img src={profile.avatar} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-gray-300" />
                              ) : (
                                <div className="w-20 h-20 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center">
                                  <span className="text-gray-400 text-2xl">👤</span>
                                </div>
                              )}
                            </div>
                            {/* Upload Controls */}
                            <div className="flex flex-col gap-2">
                              <label htmlFor="avatar-upload-edit" className="cursor-pointer">
                                <input
                                  id="avatar-upload-edit"
                                  type="file"
                                  accept="image/*"
                                  onChange={handleAvatarChange}
                                  className="hidden"
                                />
                                <span className="px-4 py-2 bg-teal-600 text-white text-sm rounded hover:bg-teal-700 inline-block">
                                  {avatarFile ? 'Change Photo' : 'Upload Photo'}
                                </span>
                              </label>
                              {avatarFile && (
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={handleAvatarUpload}
                                    disabled={uploadingAvatar}
                                    className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                  >
                                    {uploadingAvatar ? 'Uploading...' : 'Save Photo'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAvatarFile(null);
                                      setAvatarPreview(null);
                                      const fileInput = document.getElementById('avatar-upload-edit');
                                      if (fileInput) fileInput.value = '';
                                    }}
                                    className="px-4 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Specialization</label>
                          <input
                            type="text"
                            value={editForm.specialization}
                            onChange={(e) => setEditForm({...editForm, specialization: e.target.value})}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Experience (years)</label>
                          <input
                            type="number"
                            value={editForm.experience}
                            onChange={(e) => setEditForm({...editForm, experience: e.target.value})}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Qualification</label>
                          <input
                            type="text"
                            value={editForm.qualification}
                            onChange={(e) => setEditForm({...editForm, qualification: e.target.value})}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Registration Number</label>
                          <input
                            type="text"
                            value={editForm.registrationNumber}
                            onChange={(e) => setEditForm({...editForm, registrationNumber: e.target.value})}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-semibold text-gray-800">Professional Information</h3>
                        <div>
                          <label className="block text-sm font-medium mb-1">Hospital/Clinic Name</label>
                          <input
                            type="text"
                            value={editForm.hospitalName}
                            onChange={(e) => setEditForm({...editForm, hospitalName: e.target.value})}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Available Days</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                              <label key={day} className="flex items-center text-sm">
                                <input
                                  type="checkbox"
                                  checked={editForm.availableDays?.includes(day) || false}
                                  onChange={() => handleDayChange(day)}
                                  className="mr-2"
                                />
                                {day}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Available Time Slots</label>
                          <input
                            type="text"
                            value={editForm.availableTimeSlots}
                            onChange={(e) => setEditForm({...editForm, availableTimeSlots: e.target.value})}
                            placeholder="e.g., 9:00 AM - 5:00 PM"
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Consultation Fee (₹)</label>
                          <input
                            type="number"
                            value={editForm.consultationFee}
                            onChange={(e) => setEditForm({...editForm, consultationFee: e.target.value})}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Short Bio</label>
                          <textarea
                            value={editForm.bio}
                            onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                            rows="3"
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Status</label>
                          <select
                            value={editForm.status}
                            onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                            className="w-full p-2 border rounded"
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="On Leave">On Leave</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex flex-col sm:flex-row justify-end gap-2">
                      <button
                        onClick={() => setShowReferModal(true)}
                        className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center space-x-2 text-sm sm:text-base"
                      >
                        <span>📋</span>
                        <span>Refer Patient</span>
                      </button>
                      <button
                        onClick={handleEditClick}
                        className="px-3 sm:px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 flex items-center justify-center space-x-2 text-sm sm:text-base"
                      >
                        <span>✏️</span>
                        <span>Edit Profile</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block font-semibold mb-1">Doctor ID</label>
                          <p className="text-gray-700">{profile?._id || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Full Name</label>
                          <p className="text-gray-700">{profile?.Fullname || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Email</label>
                          <p className="text-gray-700">{profile?.email || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Contact</label>
                          <p className="text-gray-700">{profile?.mobile_number || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Date of Birth</label>
                          <p className="text-gray-700">{profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Gender</label>
                          <p className="text-gray-700">{profile?.gender || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Profile Photo</label>
                          {profile?.avatar ? (
                            <img src={profile.avatar} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-gray-300" />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center">
                              <span className="text-gray-400 text-2xl">👤</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Specialization</label>
                          <p className="text-gray-700">{profile?.specialization || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Experience (years)</label>
                          <p className="text-gray-700">{profile?.experience || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Qualification</label>
                          <p className="text-gray-700">{profile?.qualification || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Registration Number / License ID</label>
                          <p className="text-gray-700">{profile?.registrationNumber || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block font-semibold mb-1">Hospital / Clinic Affiliation</label>
                          <p className="text-gray-700">{profile?.hospitalName || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Available Days</label>
                          <p className="text-gray-700">{profile?.availableDays?.join(', ') || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Available Time Slots</label>
                          <p className="text-gray-700">{profile?.availableTimeSlots || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Consultation Fee</label>
                          <p className="text-gray-700">{profile?.consultationFee ? `₹${profile.consultationFee}` : 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Short Bio / About Doctor</label>
                          <p className="text-gray-700">{profile?.bio || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Assigned Patients List</label>
                          <p className="text-gray-700">Click to open patient profiles</p>
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Consultation Notes / Prescriptions</label>
                          <p className="text-gray-700">Notes and prescriptions will be displayed here</p>
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Status</label>
                          <p className="text-gray-700">{profile?.status || 'Active'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'patients' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-semibold">Assigned Patients</h3>
                  {stats && (
                    <div className="text-xs sm:text-sm text-gray-600">
                      Total: {stats.totalPatients} patients
                    </div>
                  )}
                </div>

                {dataLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                    <p className="mt-2 text-gray-600">Loading patients...</p>
                  </div>
                ) : patients.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-lg mb-2">No patients assigned yet.</p>
                    <p className="text-sm">Patients will appear here once they are assigned to you or registered from referrals.</p>
                  </div>
                ) : (
                  <>
                    {/* Search and Filters */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
                      <div className="space-y-4">
                        {/* Search Bar */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Search Patients</label>
                          <input
                            type="text"
                            placeholder="Search by name, phone, or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                          />
                          </div>
                        
                        {/* Filters */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Surgery Type</label>
                            <select
                              value={filterSurgeryType}
                              onChange={(e) => setFilterSurgeryType(e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                            >
                              <option value="all">All Types</option>
                              <option value="Fracture">Fracture</option>
                              <option value="Knee Replacement">Knee Replacement</option>
                              <option value="Hip Replacement">Hip Replacement</option>
                              <option value="Spine Surgery">Spine Surgery</option>
                              <option value="knee">Knee</option>
                              <option value="Shoulder">Shoulder</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>
                        {/* Date Range Filter */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Date From (Surgery Date)</label>
                            <input
                              type="date"
                              value={filterDateFrom}
                              onChange={(e) => setFilterDateFrom(e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Date To (Surgery Date)</label>
                            <input
                              type="date"
                              value={filterDateTo}
                              onChange={(e) => setFilterDateTo(e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Filtered Patients List */}
                    {(() => {
                      // Filter patients based on search and filters
                      const filteredPatients = patients.filter(patient => {
                        const name = patient.name || patient.userId?.Fullname || '';
                        // Prioritize Patient document's mobileNumber over userId.mobile_number (which might be from referral)
                        const phone = patient.mobileNumber || patient.userId?.mobile_number || '';
                        // Prioritize Patient document's email over userId.email (which might be from referral)
                        const email = patient.email || patient.userId?.email || '';
                        const searchLower = searchQuery.toLowerCase();
                        
                        const matchesSearch = !searchQuery || 
                          name.toLowerCase().includes(searchLower) ||
                          phone.includes(searchQuery) ||
                          email.toLowerCase().includes(searchLower);
                        
                        const matchesSurgery = filterSurgeryType === 'all' || 
                          (patient.surgeryType || '').toLowerCase() === filterSurgeryType.toLowerCase();
                        
                        const matchesDateRange = (() => {
                          if (!filterDateFrom && !filterDateTo) return true; // No date filter applied
                          if (!patient.surgeryDate) return false; // Patient has no surgery date
                          
                          const surgeryDate = new Date(patient.surgeryDate);
                          surgeryDate.setHours(0, 0, 0, 0); // Reset time to start of day
                          
                          if (filterDateFrom && filterDateTo) {
                            // Both dates provided - check if surgery date is within range
                            const fromDate = new Date(filterDateFrom);
                            fromDate.setHours(0, 0, 0, 0);
                            const toDate = new Date(filterDateTo);
                            toDate.setHours(23, 59, 59, 999); // End of day
                            return surgeryDate >= fromDate && surgeryDate <= toDate;
                          } else if (filterDateFrom) {
                            // Only "from" date provided - check if surgery date is on or after
                            const fromDate = new Date(filterDateFrom);
                            fromDate.setHours(0, 0, 0, 0);
                            return surgeryDate >= fromDate;
                          } else if (filterDateTo) {
                            // Only "to" date provided - check if surgery date is on or before
                            const toDate = new Date(filterDateTo);
                            toDate.setHours(23, 59, 59, 999);
                            return surgeryDate <= toDate;
                          }
                          return true;
                        })();
                        
                        return matchesSearch && matchesSurgery && matchesDateRange;
                      });

                      console.log('[DEBUG] Filtered patients for rendering:', filteredPatients.length);
                      
                      return (
                        <>
                          <div className="mb-4 text-sm text-gray-600">
                            Showing {filteredPatients.length} of {patients.length} patient{patients.length !== 1 ? 's' : ''}
                          </div>
                          
                          {filteredPatients.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <p>No patients match your search criteria.</p>
                            </div>
                          ) : (
                            <>
                              {/* Mobile View - Cards */}
                              <div className="md:hidden space-y-4">
                                {filteredPatients.map((patient, index) => {
                                  const patientKey = patient._id?.toString() || patient.userId?._id?.toString() || `patient-${index}`;
                                  const patientUserId = patient.userId?._id?.toString() || patient.userId?.toString();
                                  const patientId = patient._id?.toString();
                                  
                                  const patientSessions = sessions.filter(s => {
                                    if (!s.patientId) return false;
                                    const sessionPatientId = s.patientId?._id?.toString() || s.patientId?.toString();
                                    const sessionPatientUserId = s.patientId?.userId?.toString();
                                    return sessionPatientId === patientId || sessionPatientUserId === patientUserId;
                                  });
                                  
                                  const patientName = patient.name || patient.userId?.Fullname || 'Unknown Patient';
                                  // Prioritize Patient document's mobileNumber over userId.mobile_number (which might be from referral)
                                  const patientPhone = patient.mobileNumber || patient.userId?.mobile_number || 'N/A';
                                  // Prioritize Patient document's email over userId.email (which might be from referral)
                                  const patientEmail = patient.email || patient.userId?.email || 'N/A';
                                  
                                  return (
                                    <div
                                      key={patientKey}
                                      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                                      onClick={() => {
                                        setSelectedPatientDetail({ ...patient, sessions: patientSessions });
                                        setShowPatientModal(true);
                                      }}
                                    >
                                      <div className="flex justify-between items-start mb-3">
                                        <div>
                                          <h4 className="font-semibold text-gray-900">{patientName}</h4>
                                          <p className="text-xs text-gray-500">ID: {(patient._id?.toString() || patient.userId?._id?.toString() || 'N/A').substring(0, 8)}...</p>
                                        </div>
                                        <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-full">
                                          {patient.totalSessions || 0} sessions
                          </span>
                        </div>
                                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                        <div><span className="text-gray-600">Phone:</span> <span className="text-gray-900">{patientPhone}</span></div>
                                        <div><span className="text-gray-600">Surgery:</span> <span className="text-gray-900">{patient.surgeryType || 'N/A'}</span></div>
                                        <div><span className="text-gray-600">Condition:</span> <span className="text-gray-900">{patient.currentCondition || 'N/A'}</span></div>
                                        <div><span className="text-gray-600">Sessions:</span> <span className="text-gray-900">{patient.totalSessions || 0}</span></div>
                                      </div>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedPatientDetail({ ...patient, sessions: patientSessions });
                                          setShowPatientModal(true);
                                        }}
                                        className="w-full px-3 py-1.5 bg-teal-600 text-white text-sm rounded hover:bg-teal-700"
                                      >
                                        View Details
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Desktop View - Table - Hidden on mobile, visible on md+ screens */}
                              {isDesktop && (
                              <div 
                                className="w-full mt-4" 
                                data-testid="desktop-patient-table"
                              >
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                                  <table className="w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Patient Name</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Contact</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Surgery</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Condition</th>
                                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Sessions</th>
                                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredPatients.length > 0 ? filteredPatients.map((patient, index) => {
                                      const patientKey = patient._id?.toString() || patient.userId?._id?.toString() || `patient-${index}`;
                                      const patientUserId = patient.userId?._id?.toString() || patient.userId?.toString();
                                      const patientId = patient._id?.toString();
                                      
                                      const patientSessions = sessions.filter(s => {
                                        if (!s.patientId) return false;
                                        const sessionPatientId = s.patientId?._id?.toString() || s.patientId?.toString();
                                        const sessionPatientUserId = s.patientId?.userId?.toString();
                                        return sessionPatientId === patientId || sessionPatientUserId === patientUserId;
                                      });
                                      
                                      const patientName = patient.name || patient.userId?.Fullname || 'Unknown Patient';
                                      // Prioritize Patient document's mobileNumber over userId.mobile_number (which might be from referral)
                                      const patientPhone = patient.mobileNumber || patient.userId?.mobile_number || 'N/A';
                                      // Prioritize Patient document's email over userId.email (which might be from referral)
                                      const patientEmail = patient.email || patient.userId?.email || 'N/A';
                                      
                                      console.log('[RENDER TABLE] Rendering patient row:', index, patientName);
                                      
                                      return (
                                        <tr
                                          key={patientKey}
                                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                                          onClick={() => {
                                            setSelectedPatientDetail({ ...patient, sessions: patientSessions });
                                            setShowPatientModal(true);
                                          }}
                                        >
                                          <td className="px-4 py-4 whitespace-nowrap">
                            <div>
                                              <p className="font-medium text-gray-900">{patientName}</p>
                                              <p className="text-xs text-gray-500">ID: {(patient._id?.toString() || patient.userId?._id?.toString() || 'N/A').substring(0, 8)}...</p>
                                            </div>
                                          </td>
                                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                                            <p className="text-gray-900">{patientPhone}</p>
                                            <p className="text-xs text-gray-500 truncate max-w-[200px]" title={patientEmail}>{patientEmail || 'N/A'}</p>
                                          </td>
                                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {patient.surgeryType || 'N/A'}
                                          </td>
                                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {patient.currentCondition || 'N/A'}
                                          </td>
                                          <td className="px-4 py-4 whitespace-nowrap text-center">
                                            <div className="flex gap-4 justify-center text-sm">
                                              <div>
                                                <div className="font-semibold text-teal-600">{patient.totalSessions || 0}</div>
                              <div className="text-xs text-gray-500">Total</div>
                            </div>
                            <div>
                                                <div className="font-semibold text-green-600">{patient.completedSessions || 0}</div>
                                                <div className="text-xs text-gray-500">Done</div>
                            </div>
                            <div>
                                                <div className="font-semibold text-blue-600">{patient.upcomingSessions || 0}</div>
                              <div className="text-xs text-gray-500">Upcoming</div>
                            </div>
                          </div>
                                          </td>
                                          <td className="px-4 py-4 whitespace-nowrap text-right">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedPatientDetail({ ...patient, sessions: patientSessions });
                                                setShowPatientModal(true);
                                              }}
                                              className="px-3 py-1.5 bg-teal-600 text-white text-sm rounded hover:bg-teal-700"
                                            >
                                              View
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    }) : (
                                      <tr>
                                        <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                                          No patients match your search criteria.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                  </table>
                                </div>
                              </div>
                              )}
                            </>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-semibold">Your Sessions Schedule</h3>
                  {stats && (
                    <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
                      <span className="text-gray-600">Total: {stats.totalSessions}</span>
                      <span className="text-blue-600">Upcoming: {stats.upcomingSessions}</span>
                      <span className="text-green-600">Completed: {stats.completedSessions}</span>
                    </div>
                  )}
                </div>

                {dataLoading ? (
                  <div className="text-center py-8">Loading sessions...</div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No sessions scheduled yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Upcoming Sessions */}
                    <div>
                      <h4 className="font-semibold text-base sm:text-lg mb-3 text-blue-600">Upcoming Sessions ({sessions.filter(s => new Date(s.sessionDate) > new Date()).length})</h4>
                      <div className="space-y-3">
                        {sessions.filter(s => new Date(s.sessionDate) > new Date()).length > 0 ? (
                          sessions.filter(s => new Date(s.sessionDate) > new Date()).map((session) => (
                            <div key={session._id} className="border-l-4 border-blue-500 p-3 sm:p-4 rounded-r-lg bg-blue-50 shadow-sm">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm sm:text-base text-gray-900">
                                    {session.patientId?.name || 'N/A'}
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-600"><strong>Date:</strong> {new Date(session.sessionDate).toLocaleString()}</p>
                                  <p className="text-xs sm:text-sm text-gray-600"><strong>Surgery/Condition:</strong> {session.surgeryType}</p>
                                  <p className="text-xs sm:text-sm text-gray-600"><strong>Duration:</strong> {session.durationMinutes} minutes</p>
                                  <p className="text-xs sm:text-sm text-gray-600"><strong>Physiotherapist:</strong> {session.physioId?.name || 'N/A'}</p>
                                  <p className="text-xs sm:text-sm text-gray-600"><strong>Patient Contact:</strong> {session.patientId?.mobile_number || 'N/A'}</p>
                                </div>
                                <div className="text-left sm:text-right">
                                  <span className="inline-block px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                    {session.completedSessions || 0}/{session.totalSessions} completed
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs sm:text-sm text-gray-500">No upcoming sessions.</p>
                        )}
                      </div>
                    </div>

                    {/* Past Sessions */}
                    <div>
                      <h4 className="font-semibold text-base sm:text-lg mb-3 text-gray-600">Past Sessions ({sessions.filter(s => new Date(s.sessionDate) <= new Date()).length})</h4>
                      <div className="space-y-3">
                        {sessions.filter(s => new Date(s.sessionDate) <= new Date()).length > 0 ? (
                          sessions.filter(s => new Date(s.sessionDate) <= new Date()).map((session) => (
                            <div key={session._id} className="border p-3 sm:p-4 rounded-lg bg-gray-50 shadow-sm">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-2 mb-3">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm sm:text-base text-gray-900">
                                    {session.patientId?.name || 'N/A'}
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-600"><strong>Date:</strong> {new Date(session.sessionDate).toLocaleString()}</p>
                                  <p className="text-xs sm:text-sm text-gray-600"><strong>Surgery/Condition:</strong> {session.surgeryType}</p>
                                  <p className="text-xs sm:text-sm text-gray-600"><strong>Planned Duration:</strong> {session.durationMinutes} minutes</p>
                                  {session.actualDuration && (
                                    <p className="text-xs sm:text-sm text-green-600"><strong>Actual Duration:</strong> {session.actualDuration} minutes</p>
                                  )}
                                  <p className="text-xs sm:text-sm text-gray-600"><strong>Physiotherapist:</strong> {session.physioId?.name || 'N/A'}</p>
                                  {session.notes && (
                                    <p className="text-xs sm:text-sm text-gray-600 mt-2 italic bg-gray-100 p-2 rounded"><strong>Notes:</strong> {session.notes}</p>
                                  )}
                                </div>
                                <div className="text-left sm:text-right">
                                  <span className={`inline-block px-2 sm:px-3 py-1 text-xs rounded-full ${
                                    session.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    session.status === 'missed' ? 'bg-orange-100 text-orange-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {session.status === 'completed' ? '✅ Completed' : 
                                     session.status === 'missed' ? '⚠️ Missed' :
                                     'Ongoing'}
                                  </span>
                                </div>
                              </div>

                              {/* Video Section */}
                              {session.sessionVideo && session.sessionVideo.url && (
                                <div className="mt-3 pt-3 border-t">
                                  <div className="bg-white p-3 rounded">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <p className="font-semibold text-sm text-gray-900">📹 {session.sessionVideo.title}</p>
                                        {session.sessionVideo.description && (
                                          <p className="text-xs text-gray-600">{session.sessionVideo.description}</p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-1">
                                          Uploaded: {new Date(session.sessionVideo.uploadedAt).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                    <video controls className="w-full rounded mt-2" style={{maxHeight: '300px'}}>
                                      <source src={session.sessionVideo.url} type="video/mp4" />
                                      Your browser does not support the video tag.
                                    </video>
                                  </div>
                                </div>
                              )}

                              {session.status === 'completed' && !session.sessionVideo?.url && (
                                <div className="mt-3 pt-3 border-t">
                                  <p className="text-xs text-gray-500 text-center">Video not uploaded yet by physiotherapist</p>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No past sessions.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'referrals' && (
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Referred Patients</h2>
                  <button
                    onClick={() => setShowReferModal(true)}
                    className="px-3 py-1.5 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm md:text-base w-full sm:w-auto"
                  >
                    <span>📋</span>
                    <span>Refer New Patient</span>
                  </button>
                </div>

                {loadingReferrals ? (
                  <div className="text-center py-8">Loading referrals...</div>
                ) : myReferrals.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 mb-4">No referrals yet.</p>
                    <button
                      onClick={() => setShowReferModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Refer Your First Patient
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-2.5">
                      {myReferrals.map((referral) => (
                        <div key={referral._id} className="bg-white border rounded-lg p-2.5 sm:p-3 shadow-sm">
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm text-gray-900 truncate">{referral.patientName}</h4>
                              {referral.patientAge && referral.patientGender && (
                                <p className="text-[11px] text-gray-500">{referral.patientAge} years, {referral.patientGender}</p>
                              )}
                            </div>
                            <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                              referral.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              referral.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                              referral.status === 'registered' ? 'bg-green-100 text-green-800' :
                              referral.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                            </span>
                          </div>
                          <div className="space-y-1 text-[11px] sm:text-xs">
                            <div className="flex flex-wrap gap-x-2"><strong>Date:</strong> <span>{new Date(referral.createdAt).toLocaleDateString()}</span></div>
                            <div className="flex flex-wrap gap-x-2"><strong>Contact:</strong> <span className="break-all">{referral.patientPhone}</span></div>
                            {referral.patientEmail && (
                              <div className="flex flex-wrap gap-x-2"><strong>Email:</strong> <span className="break-all">{referral.patientEmail}</span></div>
                            )}
                            <div className="flex flex-wrap gap-x-2"><strong>Condition:</strong> <span>{referral.condition}</span></div>
                            {(referral.surgeryType || referral.surgeryDate) && (
                              <div className="flex flex-wrap gap-x-2"><strong>Surgery:</strong> <span>{referral.surgeryType || 'N/A'} {referral.surgeryDate && `(${new Date(referral.surgeryDate).toLocaleDateString()})`}</span></div>
                            )}
                            {referral.contactedAt && (
                              <div className="flex flex-wrap gap-x-2 text-gray-500"><strong>Contacted:</strong> <span>{new Date(referral.contactedAt).toLocaleDateString()}</span></div>
                            )}
                            {referral.notes && (
                              <div>
                                <button
                                  onClick={() => alert(`Notes:\n\n${referral.notes}`)}
                                  className="text-blue-600 hover:text-blue-800 text-[11px] sm:text-xs underline"
                                >
                                  View Notes
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '800px' }}>
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient Name</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Surgery</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                          {myReferrals.map((referral) => (
                            <tr key={referral._id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm whitespace-nowrap">
                                {new Date(referral.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div className="font-medium">{referral.patientName}</div>
                                {referral.patientAge && referral.patientGender && (
                                  <div className="text-xs text-gray-500">
                                    {referral.patientAge} years, {referral.patientGender}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div>{referral.patientPhone}</div>
                                {referral.patientEmail && (
                                  <div className="text-xs text-gray-500 break-all">{referral.patientEmail}</div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div className="font-medium">{referral.condition}</div>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {referral.surgeryType && (
                                  <div>{referral.surgeryType}</div>
                                )}
                                {referral.surgeryDate && (
                                  <div className="text-xs text-gray-500">
                                    {new Date(referral.surgeryDate).toLocaleDateString()}
                                  </div>
                                )}
                                {!referral.surgeryType && !referral.surgeryDate && (
                                  <span className="text-gray-400">N/A</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  referral.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  referral.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                                  referral.status === 'registered' ? 'bg-green-100 text-green-800' :
                                  referral.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                                </span>
                                {referral.contactedAt && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Contacted: {new Date(referral.contactedAt).toLocaleDateString()}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {referral.notes ? (
                                  <button
                                    onClick={() => alert(`Notes:\n\n${referral.notes}`)}
                                    className="text-blue-600 hover:text-blue-800 text-xs underline"
                                  >
                                    View Notes
                                  </button>
                                ) : (
                                  <span className="text-gray-400 text-xs">No notes</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      </div>
                    </div>
                  </>
                )}

                {myReferrals.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3 md:p-4">
                    <div className="text-[10px] sm:text-xs md:text-sm text-blue-800 space-y-1 sm:space-y-0">
                      <div className="flex flex-wrap gap-x-2 gap-y-1 sm:inline">
                        <span><strong>Total:</strong> {myReferrals.length}</span>
                        <span className="hidden sm:inline">|</span>
                        <span><strong>Pending:</strong> {myReferrals.filter(r => r.status === 'pending').length}</span>
                        <span className="hidden sm:inline">|</span>
                        <span><strong>Contacted:</strong> {myReferrals.filter(r => r.status === 'contacted').length}</span>
                        <span className="hidden sm:inline">|</span>
                        <span><strong>Registered:</strong> {myReferrals.filter(r => r.status === 'registered').length}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Refer Patient Modal */}
      {showReferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Refer Patient to BoneBuddy</h2>
              <button
                onClick={() => setShowReferModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleReferSubmit} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Patient Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={referForm.patientName}
                    onChange={(e) => setReferForm({...referForm, patientName: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Patient Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={referForm.patientPhone}
                    onChange={(e) => setReferForm({...referForm, patientPhone: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Patient Email</label>
                  <input
                    type="email"
                    value={referForm.patientEmail}
                    onChange={(e) => setReferForm({...referForm, patientEmail: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Patient Age</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={referForm.patientAge}
                    onChange={(e) => setReferForm({...referForm, patientAge: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Gender</label>
                  <select
                    value={referForm.patientGender}
                    onChange={(e) => setReferForm({...referForm, patientGender: e.target.value})}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Condition <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={referForm.condition}
                    onChange={(e) => setReferForm({...referForm, condition: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., Knee Replacement, Fracture, etc."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Surgery Type</label>
                  <input
                    type="text"
                    value={referForm.surgeryType}
                    onChange={(e) => setReferForm({...referForm, surgeryType: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., Total Knee Replacement"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Surgery Date</label>
                  <input
                    type="date"
                    value={referForm.surgeryDate}
                    onChange={(e) => setReferForm({...referForm, surgeryDate: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Additional Notes</label>
                <textarea
                  value={referForm.notes}
                  onChange={(e) => setReferForm({...referForm, notes: e.target.value})}
                  className="w-full p-2 border rounded"
                  rows="4"
                  placeholder="Any additional information about the patient..."
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 sm:pt-4">
                <button
                  type="button"
                  onClick={() => setShowReferModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm sm:text-base"
                  disabled={referring}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm sm:text-base"
                  disabled={referring}
                >
                  {referring ? 'Submitting...' : 'Submit Referral'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient Detail Modal */}
      {showPatientModal && selectedPatientDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-4 border-b flex justify-between items-center bg-teal-50">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {selectedPatientDetail.name || selectedPatientDetail.userId?.Fullname || 'Patient Details'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Patient ID: {(selectedPatientDetail._id?.toString() || selectedPatientDetail.userId?._id?.toString() || 'N/A').substring(0, 12)}...
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPatientModal(false);
                  setSelectedPatientDetail(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
              {/* Patient Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b pb-2">Patient Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="text-base font-medium text-gray-900">
                      {selectedPatientDetail.name || selectedPatientDetail.userId?.Fullname || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone Number</p>
                    <p className="text-base font-medium text-gray-900">
                      {selectedPatientDetail.userId?.mobile_number || selectedPatientDetail.mobileNumber || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-base font-medium text-gray-900 break-all">
                      {selectedPatientDetail.userId?.email || selectedPatientDetail.email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Gender</p>
                    <p className="text-base font-medium text-gray-900">
                      {selectedPatientDetail.gender || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Age</p>
                    <p className="text-base font-medium text-gray-900">
                      {selectedPatientDetail.age || 'N/A'} {selectedPatientDetail.age ? 'years' : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date of Birth</p>
                    <p className="text-base font-medium text-gray-900">
                      {selectedPatientDetail.dateOfBirth 
                        ? new Date(selectedPatientDetail.dateOfBirth).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Surgery Type</p>
                    <p className="text-base font-medium text-gray-900">
                      {selectedPatientDetail.surgeryType || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Surgery Date</p>
                    <p className="text-base font-medium text-gray-900">
                      {selectedPatientDetail.surgeryDate 
                        ? new Date(selectedPatientDetail.surgeryDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Current Condition</p>
                    <p className="text-base font-medium text-gray-900">
                      {selectedPatientDetail.currentCondition || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sessions Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b pb-2">
                  All Sessions ({selectedPatientDetail.sessions?.length || 0})
                </h3>
                {selectedPatientDetail.sessions && selectedPatientDetail.sessions.length > 0 ? (
                  <div className="space-y-3">
                    {selectedPatientDetail.sessions
                      .sort((a, b) => new Date(b.sessionDate) - new Date(a.sessionDate))
                      .map((session, index) => (
                        <div key={session._id || index} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                            <div>
                              <p className="font-semibold text-gray-900">
                                Session #{selectedPatientDetail.sessions.length - index}
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(session.sessionDate).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              session.status === 'completed' 
                                ? 'bg-green-100 text-green-800'
                                : session.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : new Date(session.sessionDate) > new Date()
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {session.status || 'Scheduled'}
                            </span>
                          </div>
                          {session.physioId && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600">
                                <strong>Physiotherapist:</strong> {session.physioId.name || 'N/A'}
                                {session.physioId.specialization && ` (${session.physioId.specialization})`}
                              </p>
                              {session.physioId.mobile_number && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Contact: {session.physioId.mobile_number}
                                </p>
                              )}
                            </div>
                          )}
                          {session.notes && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="text-sm text-gray-700">
                                <strong>Notes:</strong> {session.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No sessions found for this patient.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-6 py-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => {
                  setShowPatientModal(false);
                  setSelectedPatientDetail(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm sm:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorProfile;
