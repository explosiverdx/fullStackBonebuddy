import React, { useState, useEffect } from 'react';

const PhysiotherapistProfile = () => {
  // Load active tab from localStorage or default to 'overview'
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('physiotherapistProfileActiveTab');
    return savedTab || 'overview';
  });
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [showVideoUpload, setShowVideoUpload] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(null);

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
      const response = await fetch('/api/v1/physios/my-patients-sessions', {
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

  const handleStartSession = async (sessionId) => {
    setActionLoading(sessionId);
    try {
      const response = await fetch('/api/v1/sessions/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        credentials: 'include',
        body: JSON.stringify({ sessionId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start session');
      }

      alert('✅ Session started successfully!');
      await fetchPatientsAndSessions(); // Refresh data
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEndSession = async (sessionId) => {
    const notes = prompt('Add any notes for this session (optional):');
    
    setActionLoading(sessionId);
    try {
      const response = await fetch('/api/v1/sessions/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        credentials: 'include',
        body: JSON.stringify({ sessionId, notes: notes || '' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to end session');
      }

      alert('✅ Session ended successfully! You can now upload a video.');
      setShowVideoUpload(sessionId); // Show video upload form
      await fetchPatientsAndSessions(); // Refresh data
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleVideoUpload = async (sessionId) => {
    if (!videoFile) {
      alert('Please select a video file');
      return;
    }

    setUploadProgress(true);
    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('sessionId', sessionId);
      formData.append('title', videoTitle || 'Session Video');
      formData.append('description', videoDescription || '');

      const response = await fetch('/api/v1/sessions/upload-video', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload video');
      }

      alert('✅ Video uploaded successfully!');
      setShowVideoUpload(null);
      setVideoFile(null);
      setVideoTitle('');
      setVideoDescription('');
      await fetchPatientsAndSessions(); // Refresh data
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setUploadProgress(false);
    }
  };

  const handleCancelUpload = () => {
    setShowVideoUpload(null);
    setVideoFile(null);
    setVideoTitle('');
    setVideoDescription('');
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'patients', label: 'Patients' },
    { id: 'sessions', label: 'Sessions' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-teal-600 mb-4">🏋️ Physiotherapist Profile</h1>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  // Save active tab to localStorage so it persists on refresh
                  localStorage.setItem('physiotherapistProfileActiveTab', tab.id);
                }}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold mb-1">Physiotherapist ID</label>
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
                    <label className="block font-semibold mb-1">Specialization / Focus Area</label>
                    <p className="text-gray-700">{profile?.specialization || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Qualification</label>
                    <p className="text-gray-700">{profile?.qualification || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Experience (years)</label>
                    <p className="text-gray-700">{profile?.experience || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Registration / License Number</label>
                    <p className="text-gray-700">{profile?.registrationNumber || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold mb-1">Clinic / Hospital Affiliation</label>
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
                    <label className="block font-semibold mb-1">Consultation / Session Fee</label>
                    <p className="text-gray-700">{profile?.consultationFee ? `₹${profile.consultationFee}` : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Short Bio / Description</label>
                    <p className="text-gray-700">{profile?.bio || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Assigned Patients List</label>
                    <p className="text-gray-700">List of assigned patients</p>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Session History</label>
                    <p className="text-gray-700">Patients treated, sessions completed</p>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Status</label>
                    <p className="text-gray-700">{profile?.status || 'Active'}</p>
                  </div>
                </div>
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

            {activeTab === 'sessions' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <h3 className="text-xl font-semibold">Your Sessions</h3>
                  {stats && (
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-600">Total: {stats.totalSessions}</span>
                      <span className="text-blue-600">Upcoming: {stats.upcomingSessions}</span>
                      <span className="text-green-600">Completed: {stats.completedSessions}</span>
                    </div>
                  )}
                </div>

                {/* Search Bar */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex gap-3 items-center flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <input
                        type="text"
                        placeholder="Search patient by name, phone, or email..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setSelectedPatientId(null);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    {selectedPatientId && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedPatientId(null);
                        }}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Clear Filter
                      </button>
                    )}
                  </div>
                  
                  {/* Patient Suggestions */}
                  {searchQuery && !selectedPatientId && (
                    <div className="mt-3 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {patients
                        .filter(patient => {
                          const query = searchQuery.toLowerCase();
                          const name = (patient.name || patient.userId?.Fullname || '').toLowerCase();
                          const phone = (patient.userId?.mobile_number || patient.mobile_number || '').toLowerCase();
                          const email = (patient.userId?.email || patient.email || '').toLowerCase();
                          return name.includes(query) || phone.includes(query) || email.includes(query);
                        })
                        .slice(0, 5)
                        .map((patient) => (
                          <div
                            key={patient._id}
                            onClick={() => {
                              setSelectedPatientId(patient._id);
                              setSearchQuery(patient.name || patient.userId?.Fullname || '');
                            }}
                            className="p-3 hover:bg-teal-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="font-semibold text-gray-900">
                              {patient.name || patient.userId?.Fullname || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-600">
                              {patient.userId?.mobile_number || patient.mobile_number || ''} | {patient.userId?.email || patient.email || ''}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {patient.totalSessions} session{patient.totalSessions !== 1 ? 's' : ''}
                            </div>
                          </div>
                        ))}
                      {patients.filter(patient => {
                        const query = searchQuery.toLowerCase();
                        const name = (patient.name || patient.userId?.Fullname || '').toLowerCase();
                        const phone = (patient.userId?.mobile_number || patient.mobile_number || '').toLowerCase();
                        const email = (patient.userId?.email || patient.email || '').toLowerCase();
                        return name.includes(query) || phone.includes(query) || email.includes(query);
                      }).length === 0 && (
                        <div className="p-3 text-gray-500 text-sm">No patients found</div>
                      )}
                    </div>
                  )}

                  {/* Selected Patient Info */}
                  {selectedPatientId && (
                    <div className="mt-3 bg-teal-50 border border-teal-200 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm text-gray-600">Showing sessions for: </span>
                          <span className="font-semibold text-teal-700">
                            {patients.find(p => p._id === selectedPatientId)?.name || 
                             patients.find(p => p._id === selectedPatientId)?.userId?.Fullname || 
                             'Selected Patient'}
                          </span>
                          <span className="text-sm text-gray-600 ml-2">
                            ({sessions.filter(s => s.patientId?._id === selectedPatientId || s.patientId === selectedPatientId).length} sessions)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {dataLoading ? (
                  <div className="text-center py-8">Loading sessions...</div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No sessions scheduled yet.</p>
                  </div>
                ) : (() => {
                  // Filter sessions by selected patient if any
                  const filteredSessions = selectedPatientId 
                    ? sessions.filter(s => s.patientId?._id === selectedPatientId || s.patientId === selectedPatientId)
                    : sessions;
                  
                  if (selectedPatientId && filteredSessions.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <p>No sessions found for this patient.</p>
                      </div>
                    );
                  }
                  
                  return (
                  <div className="space-y-4">
                    {/* Upcoming Sessions */}
                    <div>
                      <h4 className="font-semibold text-lg mb-3 text-blue-600">
                        Upcoming Sessions ({filteredSessions.filter(s => new Date(s.sessionDate) > new Date()).length})
                      </h4>
                      <div className="space-y-3">
                        {filteredSessions.filter(s => new Date(s.sessionDate) > new Date()).length > 0 ? (
                          filteredSessions.filter(s => new Date(s.sessionDate) > new Date()).map((session) => {
                            // Check if session can be started (within 15 minutes of scheduled time)
                            const sessionTime = new Date(session.sessionDate);
                            const now = new Date();
                            const minutesUntilSession = (sessionTime - now) / (1000 * 60);
                            const canStart = minutesUntilSession <= 15 && minutesUntilSession >= -60; // Can start 15min before, up to 60min after
                            
                            // Check if session is active (in-progress or ongoing)
                            const isSessionActive = session.status === 'in-progress' || session.status === 'ongoing';
                            // Normalize status for display - but keep original for logic
                            const displayStatus = session.status === 'ongoing' ? 'in-progress' : session.status;
                            
                            return (
                              <div key={session._id} className="border-l-4 border-blue-500 p-4 rounded-r-lg bg-blue-50 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-900">
                                      {session.patientId?.name || 'N/A'}
                                    </p>
                                    <p className="text-sm text-gray-600"><strong>Date:</strong> {new Date(session.sessionDate).toLocaleString()}</p>
                                    <p className="text-sm text-gray-600"><strong>Surgery/Condition:</strong> {session.surgeryType}</p>
                                    <p className="text-sm text-gray-600"><strong>Duration:</strong> {session.durationMinutes} minutes</p>
                                    <p className="text-sm text-gray-600"><strong>Doctor:</strong> {session.doctorId?.name || 'N/A'}</p>
                                    {session.startTime && (
                                      <p className="text-sm text-green-600"><strong>Started at:</strong> {new Date(session.startTime).toLocaleTimeString()}</p>
                                    )}
                                    {!canStart && !isSessionActive && (
                                      <p className="text-xs text-orange-600 mt-2">
                                        ⏰ Session can be started 15 minutes before scheduled time ({Math.ceil(minutesUntilSession)} minutes remaining)
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <span className={`inline-block px-3 py-1 text-xs rounded-full ${
                                      isSessionActive ? 'bg-yellow-100 text-yellow-800 animate-pulse' :
                                      canStart && displayStatus === 'scheduled' ? 'bg-green-100 text-green-800' :
                                      'bg-blue-100 text-blue-800'
                                    }`}>
                                      {isSessionActive ? '🔴 LIVE' : 
                                       canStart && displayStatus === 'scheduled' ? 'READY' :
                                       'SCHEDULED'}
                                    </span>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 mt-3 pt-3 border-t">
                                  {displayStatus === 'scheduled' && !isSessionActive && (
                                    <button
                                      onClick={() => handleStartSession(session._id)}
                                      disabled={!canStart || actionLoading === session._id}
                                      className={`flex-1 px-4 py-2 rounded text-sm font-semibold transition-colors ${
                                        canStart 
                                          ? 'bg-green-600 text-white hover:bg-green-700' 
                                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                      } disabled:bg-gray-400`}
                                      title={!canStart ? 'Can start 15 minutes before scheduled time' : 'Click to start session'}
                                    >
                                      {actionLoading === session._id ? '⏳ Starting...' : 
                                       canStart ? '▶️ Start Session' : 
                                       `🔒 Starts in ${Math.ceil(minutesUntilSession)} min`}
                                    </button>
                                  )}
                                  {isSessionActive && (
                                    <button
                                      onClick={() => handleEndSession(session._id)}
                                      disabled={actionLoading === session._id}
                                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:bg-gray-400 font-semibold transition-colors"
                                    >
                                      {actionLoading === session._id ? '⏳ Ending...' : '⏹️ End Session'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-sm text-gray-500">No upcoming sessions.</p>
                        )}
                      </div>
                    </div>

                    {/* Past Sessions */}
                    <div>
                      <h4 className="font-semibold text-lg mb-3 text-gray-600">
                        Past Sessions ({filteredSessions.filter(s => new Date(s.sessionDate) <= new Date()).length})
                      </h4>
                      <div className="space-y-3">
                        {filteredSessions.filter(s => new Date(s.sessionDate) <= new Date()).length > 0 ? (
                          filteredSessions.filter(s => new Date(s.sessionDate) <= new Date()).map((session) => {
                            // Check if session is still active (in-progress or ongoing)
                            const isSessionActive = session.status === 'in-progress' || session.status === 'ongoing';
                            
                            return (
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
                                  <p className="text-sm text-gray-600"><strong>Doctor:</strong> {session.doctorId?.name || 'N/A'}</p>
                                  {session.startTime && (
                                    <p className="text-sm text-green-600"><strong>Started at:</strong> {new Date(session.startTime).toLocaleTimeString()}</p>
                                  )}
                                  {session.notes && (
                                    <p className="text-sm text-gray-600 mt-2 italic bg-gray-100 p-2 rounded"><strong>Notes:</strong> {session.notes}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <span className={`inline-block px-3 py-1 text-xs rounded-full mb-2 ${
                                    isSessionActive ? 'bg-yellow-100 text-yellow-800 animate-pulse' : 
                                    session.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    session.status === 'missed' ? 'bg-orange-100 text-orange-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {isSessionActive ? '🔴 LIVE' : 
                                     session.status === 'completed' ? '✅ Completed' : 
                                     session.status === 'missed' ? '⚠️ Missed' :
                                     'Ongoing'}
                                  </span>
                                </div>
                              </div>

                              {/* End Session Button - Always visible for active sessions */}
                              {isSessionActive && (
                                <div className="mt-3 pt-3 border-t">
                                  <button
                                    onClick={() => handleEndSession(session._id)}
                                    disabled={actionLoading === session._id}
                                    className="w-full bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:bg-gray-400 font-semibold transition-colors"
                                  >
                                    {actionLoading === session._id ? '⏳ Ending...' : '⏹️ End Session'}
                                  </button>
                                </div>
                              )}

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

                              {/* Upload Video Button */}
                              {session.status === 'completed' && !session.sessionVideo?.url && (
                                <div className="mt-3 pt-3 border-t">
                                  <button
                                    onClick={() => setShowVideoUpload(session._id)}
                                    className="w-full bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 font-semibold"
                                  >
                                    📹 Upload Session Video
                                  </button>
                                </div>
                              )}

                              {/* Video Upload Form */}
                              {showVideoUpload === session._id && (
                                <div className="mt-3 pt-3 border-t bg-white p-4 rounded">
                                  <h5 className="font-semibold mb-3">Upload Session Video</h5>
                                  <div className="space-y-3">
                                    <div>
                                      <label className="block text-sm font-medium mb-1">Video File *</label>
                                      <input
                                        type="file"
                                        accept="video/*"
                                        onChange={(e) => setVideoFile(e.target.files[0])}
                                        className="w-full p-2 border rounded text-sm"
                                      />
                                      {videoFile && (
                                        <p className="text-xs text-gray-500 mt-1">Selected: {videoFile.name}</p>
                                      )}
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium mb-1">Title</label>
                                      <input
                                        type="text"
                                        value={videoTitle}
                                        onChange={(e) => setVideoTitle(e.target.value)}
                                        placeholder="e.g., Knee therapy session 1"
                                        className="w-full p-2 border rounded text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium mb-1">Description</label>
                                      <textarea
                                        value={videoDescription}
                                        onChange={(e) => setVideoDescription(e.target.value)}
                                        placeholder="Brief description of the session"
                                        rows="2"
                                        className="w-full p-2 border rounded text-sm"
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleVideoUpload(session._id)}
                                        disabled={uploadProgress || !videoFile}
                                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:bg-gray-400"
                                      >
                                        {uploadProgress ? '⏳ Uploading...' : '✅ Upload Video'}
                                      </button>
                                      <button
                                        onClick={handleCancelUpload}
                                        disabled={uploadProgress}
                                        className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600 disabled:bg-gray-400"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            );
                          })
                        ) : (
                          <p className="text-sm text-gray-500">No past sessions.</p>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhysiotherapistProfile;
