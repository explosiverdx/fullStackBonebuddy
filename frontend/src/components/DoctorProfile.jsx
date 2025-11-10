import React, { useState, useEffect } from 'react';

const DoctorProfile = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [patients, setPatients] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);

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
      fetchPatientsAndSessions();
    }
  }, [activeTab]);

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
        setPatients(data.data.patients || []);
        setSessions(data.data.sessions || []);
        setStats(data.data.stats || null);
      }
    } catch (error) {
      console.error('Error fetching patients and sessions:', error);
    } finally {
      setDataLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'patients', label: 'Patients' },
    { id: 'schedule', label: 'Schedule' },
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
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-teal-600 mb-4">👨‍⚕️ Doctor Profile</h1>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-t-lg font-medium ${
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
              <div className="space-y-6">
                {isEditing ? (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">Edit Profile</h2>
                      <div className="space-x-2">
                        <button
                          onClick={handleSave}
                          className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold text-gray-800">Personal Information</h3>
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
                          <div className="grid grid-cols-2 gap-2">
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                              <label key={day} className="flex items-center">
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
                  <div className="space-y-6">
                    <div className="flex justify-end">
                      <button
                        onClick={handleEditClick}
                        className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 flex items-center space-x-2"
                      >
                        <span>✏️</span>
                        <span>Edit Profile</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <img src={profile.avatar} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
                          ) : (
                            <p className="text-gray-700">No photo uploaded</p>
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
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">Assigned Patients</h3>
                  {stats && (
                    <div className="text-sm text-gray-600">
                      Total: {stats.totalPatients} patients
                    </div>
                  )}
                </div>

                {dataLoading ? (
                  <div className="text-center py-8">Loading patients...</div>
                ) : patients.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No patients assigned yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {patients.map((patient) => (
                      <div key={patient._id} className="border p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-lg text-gray-900">
                              {patient.name || patient.userId?.Fullname || 'N/A'}
                            </h4>
                            <p className="text-sm text-gray-500">Patient ID: {patient._id.toString().substring(0, 8)}...</p>
                          </div>
                          <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-full">
                            {patient.totalSessions} sessions
                          </span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p><strong>Phone:</strong> {patient.userId?.mobile_number || patient.mobile_number || 'N/A'}</p>
                          <p><strong>Email:</strong> {patient.userId?.email || patient.email || 'N/A'}</p>
                          <p><strong>Surgery:</strong> {patient.surgeryType || 'N/A'}</p>
                          <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-2 text-center">
                            <div>
                              <div className="font-semibold text-teal-600">{patient.totalSessions}</div>
                              <div className="text-xs text-gray-500">Total</div>
                            </div>
                            <div>
                              <div className="font-semibold text-green-600">{patient.completedSessions}</div>
                              <div className="text-xs text-gray-500">Completed</div>
                            </div>
                            <div>
                              <div className="font-semibold text-blue-600">{patient.upcomingSessions}</div>
                              <div className="text-xs text-gray-500">Upcoming</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">Your Sessions Schedule</h3>
                  {stats && (
                    <div className="flex gap-4 text-sm">
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
                      <h4 className="font-semibold text-lg mb-3 text-blue-600">Upcoming Sessions ({sessions.filter(s => new Date(s.sessionDate) > new Date()).length})</h4>
                      <div className="space-y-3">
                        {sessions.filter(s => new Date(s.sessionDate) > new Date()).length > 0 ? (
                          sessions.filter(s => new Date(s.sessionDate) > new Date()).map((session) => (
                            <div key={session._id} className="border-l-4 border-blue-500 p-4 rounded-r-lg bg-blue-50 shadow-sm">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900">
                                    {session.patientId?.name || 'N/A'}
                                  </p>
                                  <p className="text-sm text-gray-600"><strong>Date:</strong> {new Date(session.sessionDate).toLocaleString()}</p>
                                  <p className="text-sm text-gray-600"><strong>Surgery/Condition:</strong> {session.surgeryType}</p>
                                  <p className="text-sm text-gray-600"><strong>Duration:</strong> {session.durationMinutes} minutes</p>
                                  <p className="text-sm text-gray-600"><strong>Physiotherapist:</strong> {session.physioId?.name || 'N/A'}</p>
                                  <p className="text-sm text-gray-600"><strong>Patient Contact:</strong> {session.patientId?.mobile_number || 'N/A'}</p>
                                </div>
                                <div className="text-right">
                                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                    {session.completedSessions || 0}/{session.totalSessions} completed
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No upcoming sessions.</p>
                        )}
                      </div>
                    </div>

                    {/* Past Sessions */}
                    <div>
                      <h4 className="font-semibold text-lg mb-3 text-gray-600">Past Sessions ({sessions.filter(s => new Date(s.sessionDate) <= new Date()).length})</h4>
                      <div className="space-y-3">
                        {sessions.filter(s => new Date(s.sessionDate) <= new Date()).length > 0 ? (
                          sessions.filter(s => new Date(s.sessionDate) <= new Date()).map((session) => (
                            <div key={session._id} className="border p-4 rounded-lg bg-gray-50 shadow-sm">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900">
                                    {session.patientId?.name || 'N/A'}
                                  </p>
                                  <p className="text-sm text-gray-600"><strong>Date:</strong> {new Date(session.sessionDate).toLocaleString()}</p>
                                  <p className="text-sm text-gray-600"><strong>Surgery/Condition:</strong> {session.surgeryType}</p>
                                  <p className="text-sm text-gray-600"><strong>Planned Duration:</strong> {session.durationMinutes} minutes</p>
                                  {session.actualDuration && (
                                    <p className="text-sm text-green-600"><strong>Actual Duration:</strong> {session.actualDuration} minutes</p>
                                  )}
                                  <p className="text-sm text-gray-600"><strong>Physiotherapist:</strong> {session.physioId?.name || 'N/A'}</p>
                                  {session.notes && (
                                    <p className="text-sm text-gray-600 mt-2 italic bg-gray-100 p-2 rounded"><strong>Notes:</strong> {session.notes}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                    {session.status === 'completed' ? '✅ Completed' : 'Ongoing'}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
