import React, { useState, useEffect } from 'react';
import * as fflate from 'fflate';

const PatientProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Load active tab from localStorage or default to 'overview'
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('patientProfileActiveTab');
    return savedTab || 'overview';
  });
  const [reports, setReports] = useState([]);
  const [nextSession, setNextSession] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [reportFile, setReportFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(null);

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
          // If server didn't include sessions, fetch them explicitly
          if (!data.data.sessions) {
            try {
              const sres = await fetch('/api/v1/sessions/mine', { method: 'GET', credentials: 'include' });
              if (sres.ok) {
                const sdata = await sres.json();
                setProfile(prev => ({ ...prev, sessions: sdata.data }));
              } else {
                setProfile(prev => ({ ...prev, sessions: [] }));
              }
            } catch (err) {
              console.error('Error fetching sessions for profile:', err);
              setProfile(prev => ({ ...prev, sessions: [] }));
            }
          }
          fetchReports(data.data._id);
          fetchPayments();
        } else {
          alert('Failed to fetch profile data');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        alert('Error fetching profile data');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Auto-refresh sessions every 30 seconds when on sessions tab
  useEffect(() => {
    if (activeTab !== 'sessions') return;

    const refreshSessions = async () => {
      try {
        const response = await fetch('/api/v1/users/me', {
          method: 'GET',
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setProfile(prev => ({ ...prev, sessions: data.data.sessions || [] }));
        }
      } catch (error) {
        console.error('Error refreshing sessions:', error);
      }
    };

    // Refresh immediately when switching to sessions tab
    refreshSessions();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(refreshSessions, 30000);

    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchPayments = async () => {
    setPaymentsLoading(true);
    try {
      const response = await fetch('/api/v1/payments', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data?.data?.docs)
          ? data.data.docs
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];

        const sorted = [...list].sort((a, b) => {
          const aDate = new Date(a?.paidAt || a?.updatedAt || a?.createdAt || 0);
          const bDate = new Date(b?.paidAt || b?.updatedAt || b?.createdAt || 0);
          return bDate - aDate;
        });

        setPayments(sorted);
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  };

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      // Check if script already exists
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

  // Handle Razorpay payment
  const handlePayNow = async (payment) => {
    setProcessingPayment(payment._id);
    
    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert('Failed to load payment gateway. Please try again.');
        setProcessingPayment(null);
        return;
      }

      // Create Razorpay order (reusing existing payment to avoid duplicates)
      const orderResponse = await fetch('/api/v1/payments/razorpay/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        credentials: 'include',
        body: JSON.stringify({
          existingPaymentId: payment._id, // Pass existing payment ID to avoid creating duplicates
          appointmentId: payment.appointmentId?._id || payment.appointmentId,
          sessionId: payment.sessionId?._id || payment.sessionId,
          amount: payment.amount,
          description: payment.description,
          paymentType: payment.paymentType
        })
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.message || 'Failed to create payment order');
      }

      const orderData = await orderResponse.json();
      const { orderId, amount, currency, paymentId, key } = orderData.data;

      // Initialize Razorpay checkout
      const options = {
        key: key,
        amount: amount,
        currency: currency,
        name: 'BoneBuddy',
        description: payment.description,
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

            const verifyData = await verifyResponse.json();
            alert('✅ Payment successful!');
            
            // Refresh payments list
            await fetchPayments();
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('❌ Payment verification failed. Please contact support.');
          } finally {
            setProcessingPayment(null);
          }
        },
        prefill: {
          name: profile?.Fullname || '',
          email: profile?.email || '',
          contact: profile?.mobile_number || ''
        },
        theme: {
          color: '#0d9488' // Teal color matching your theme
        },
        modal: {
          ondismiss: function() {
            setProcessingPayment(null);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        alert(`❌ Payment failed: ${response.error.description}`);
        setProcessingPayment(null);
      });

      razorpay.open();
      
    } catch (error) {
      console.error('Payment error:', error);
      alert(`❌ Error: ${error.message}`);
      setProcessingPayment(null);
    }
  };

  const fetchReports = async (userId) => {
    try {
      // Assuming there's an endpoint to fetch reports for a specific user
      const response = await fetch(`/api/v1/reports/user/${userId}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched reports:', data); // Debug log
        setReports(data.data || []); // Assuming the reports are in data.data
      } else {
        console.error('Failed to fetch reports:', response.status, response.statusText);
        setReports([]);
      }
    } catch (error) { 
      console.error('Error fetching reports:', error);
      setReports([]);
    }
  };

  const handleFileChange = (e) => {
    setReportFile(e.target.files[0]);
  };

  const handleReportUpload = async () => {
    if (!reportFile) {
      alert('Please select a file to upload.');
      return;
    }
    if (!profile?._id) {
      alert('Cannot upload report: user profile not loaded.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('report', reportFile);
    formData.append('title', reportFile.name); // Use filename as title
    formData.append('userId', profile._id);

    try {
      const response = await fetch('/api/v1/reports/upload', { 
        method: 'POST', 
        credentials: 'include', 
        body: formData 
      });
      
      if (response.ok) {
        const data = await response.json();
        alert('Report uploaded successfully!');
        document.querySelector('input[type="file"]').value = ''; // Clear file input
        setReportFile(null);
        await fetchReports(profile._id); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(`Upload failed: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload report. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleReportDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/reports/${reportId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        alert('Report deleted successfully.');
        fetchReports(profile._id); // Refresh the list
      } else {
        throw new Error('Failed to delete report.');
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDownloadAllReports = async () => {
    if (!reports || reports.length === 0) {
      alert('No reports to download.');
      return;
    }

    setDownloading(true);
    try {
      const filesToZip = {};

      await Promise.all(
        reports.map(async (report) => {
          try {
            const response = await fetch(report.fileUrl);
            if (!response.ok) throw new Error(`Failed to fetch ${report.title}`);
            const buffer = await response.arrayBuffer();
            filesToZip[report.title] = new Uint8Array(buffer);
          } catch (err) {
            console.error(`Skipping report due to error: ${err.message}`);
          }
        })
      );

      if (Object.keys(filesToZip).length === 0) {
        throw new Error('Could not download any reports.');
      }

      const zipped = fflate.zipSync(filesToZip);
      const blob = new Blob([zipped], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medical-reports-${profile.Fullname.replace(/\s/g, '_')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(`Failed to create ZIP file: ${error.message}`);
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (profile?.sessions) {
        const upcomingSessions = profile.sessions
            .filter(s => new Date(s.sessionDate) > new Date())
            .sort((a, b) => new Date(a.sessionDate) - new Date(b.sessionDate));

        if (upcomingSessions.length > 0) {
            setNextSession(upcomingSessions[0]);
        } else {
            setNextSession(null);
        }
    }
  }, [profile?.sessions]);

  useEffect(() => {
    if (!nextSession) {
        setCountdown('');
        return;
    }

    const interval = setInterval(() => {
        const now = new Date();
        const sessionDate = new Date(nextSession.sessionDate);
        const distance = sessionDate - now;

        if (distance < 0) {
            clearInterval(interval);
            setCountdown('Session has started!');
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [nextSession]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 pt-20">
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-100 pt-20">
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">Profile not found</div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'sessions', label: 'Sessions', icon: '📅' },
    { id: 'reports', label: 'Reports', icon: '📄' },
    { id: 'payments', label: 'Payments', icon: '💳' }
  ];

  const handleEditClick = () => {
    setEditForm({
      name: profile.Fullname || '',
      email: profile.email || '',
      dob: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
      gender: profile.gender || '',
      contact: profile.mobile_number || '',
      surgeryType: profile.surgeryType || '',
      surgeryDate: profile.surgeryDate ? new Date(profile.surgeryDate).toISOString().split('T')[0] : '',
      hospitalName: profile.hospitalName || '',
      status: profile.currentStatus || ''
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      Object.keys(editForm).forEach(key => {
        if (editForm[key]) formData.append(key, editForm[key]);
      });
      formData.append('role', 'patient');

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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        if (isEditing) {
          return (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
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
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">Medical Information</h3>
                  <div>
                    <label className="block text-sm font-medium mb-1">Surgery Type</label>
                    <input
                      type="text"
                      value={editForm.surgeryType}
                      onChange={(e) => setEditForm({...editForm, surgeryType: e.target.value})}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Surgery Date</label>
                    <input
                      type="date"
                      value={editForm.surgeryDate}
                      onChange={(e) => setEditForm({...editForm, surgeryDate: e.target.value})}
                      className="w-full p-2 border rounded"
                    />
                  </div>
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
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                      className="w-full p-2 border rounded"
                    >
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        return (
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h3 className="font-semibold text-gray-800 mb-2">Personal Information</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Patient ID:</strong> {profile._id}</div>
                  <div><strong>Name:</strong> {profile.Fullname}</div>
                  <div><strong>DOB:</strong> {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A'}</div>
                  <div><strong>Gender:</strong> {profile.gender}</div>
                  <div><strong>Contact:</strong> {profile.mobile_number}</div>
                  <div><strong>Email:</strong> {profile.email}</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h3 className="font-semibold text-gray-800 mb-2">Medical Information</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Surgery Type:</strong> {profile.surgeryType || 'N/A'}</div>
                  <div><strong>Surgery Date:</strong> {profile.surgeryDate ? new Date(profile.surgeryDate).toLocaleDateString() : 'N/A'}</div>
                  <div><strong>Hospital/Clinic:</strong> {profile.hospitalName || 'N/A'}</div>
                  <div><strong>Recovery Stage:</strong> {profile.recoveryStage || 'Initial'}</div>
                  <div><strong>Status:</strong> {profile.currentStatus || 'Active'}</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h3 className="font-semibold text-gray-800 mb-2">Assigned Healthcare Team</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Doctor:</strong> {profile.sessions?.[0]?.doctorId?.name || profile.assignedDoctor || 'Not Assigned'}</div>
                  <div><strong>Physiotherapist:</strong> {profile.sessions?.[0]?.physioId?.name || profile.assignedPhysio || 'Not Assigned'}</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border md:col-span-2 lg:col-span-3">
                <h3 className="font-semibold text-gray-800 mb-2">Progress Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-teal-600">{profile.sessionsCompleted || 0}</div>
                    <div className="text-gray-600">Sessions Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{profile.missedSessions || 0}</div>
                    <div className="text-gray-600">Missed Sessions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{profile.recoveryProgress || 0}%</div>
                    <div className="text-gray-600">Recovery Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{profile.lastLogin ? new Date(profile.lastLogin).toLocaleDateString() : 'N/A'}</div>
                    <div className="text-gray-600">Last Login</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'sessions':
        return (
          <div className="space-y-6">
            {/* Countdown Timer */}
            {countdown && nextSession && (
              <div className="bg-teal-50 p-4 rounded-lg shadow-sm border border-teal-200 text-center">
                <h3 className="text-md font-semibold text-teal-700">Next Session In:</h3>
                <p className="text-3xl font-bold text-teal-600 tracking-wider my-2">{countdown}</p>
                <p className="text-sm text-gray-600">
                  Your next session for <strong>{nextSession.surgeryType}</strong> is scheduled for {new Date(nextSession.sessionDate).toLocaleString()}.
                </p>
              </div>
            )}

            {/* Ongoing Sessions */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4 text-green-600">🔴 Live Sessions</h3>
              <div className="space-y-3">
                {Array.isArray(profile.sessions) && profile.sessions.filter(s => {
                  // ONLY show as live if status is actually 'in-progress'
                  // Don't use time-based check if session has been completed/cancelled
                  if (s.status === 'completed' || s.status === 'cancelled') {
                    return false; // Never show completed/cancelled sessions as live
                  }
                  
                  if (s.status === 'in-progress') {
                    return true; // Always show in-progress sessions as live
                  }
                  
                  // For backward compatibility with old sessions without status field
                  // Only use time-based check if status is undefined or 'ongoing'/'scheduled'
                  if (!s.status || s.status === 'ongoing' || s.status === 'scheduled') {
                    const now = new Date();
                    const sessionStart = new Date(s.sessionDate);
                    const sessionEnd = new Date(sessionStart.getTime() + (s.durationMinutes || 60) * 60000);
                    return now >= sessionStart && now <= sessionEnd;
                  }
                  
                  return false;
                }).length > 0 ? (
                  profile.sessions
                    .filter(s => {
                      // ONLY show as live if status is actually 'in-progress'
                      // Don't use time-based check if session has been completed/cancelled
                      if (s.status === 'completed' || s.status === 'cancelled') {
                        return false; // Never show completed/cancelled sessions as live
                      }
                      
                      if (s.status === 'in-progress') {
                        return true; // Always show in-progress sessions as live
                      }
                      
                      // For backward compatibility with old sessions without status field
                      // Only use time-based check if status is undefined or 'ongoing'/'scheduled'
                      if (!s.status || s.status === 'ongoing' || s.status === 'scheduled') {
                        const now = new Date();
                        const sessionStart = new Date(s.sessionDate);
                        const sessionEnd = new Date(sessionStart.getTime() + (s.durationMinutes || 60) * 60000);
                        return now >= sessionStart && now <= sessionEnd;
                      }
                      
                      return false;
                    })
                    .map((session) => (
                      <div key={session._id} className="border-l-4 border-green-500 p-4 rounded-r-lg bg-green-50 shadow-sm animate-pulse-slow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-base text-gray-800">{session.surgeryType || 'Physiotherapy Session'}</h4>
                            <p className="text-sm text-gray-600 mt-1"><strong>Date:</strong> {new Date(session.sessionDate).toLocaleString()}</p>
                            <p className="text-sm text-gray-600"><strong>Duration:</strong> {session.durationMinutes} minutes</p>
                            <p className="text-sm text-gray-600"><strong>Doctor:</strong> {session.doctorId?.name || 'N/A'}</p>
                            <p className="text-sm text-gray-600"><strong>Physiotherapist:</strong> {session.physioId?.name || 'N/A'}</p>
                            {session.startTime && (
                              <p className="text-sm text-green-600 mt-2"><strong>🟢 Started at:</strong> {new Date(session.startTime).toLocaleTimeString()}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse mb-2">
                              🔴 LIVE NOW
                            </span>
                            {session.status === 'in-progress' && (
                              <span className="text-xs text-green-600">In Progress</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-sm text-gray-500 text-center py-4">No sessions are currently ongoing.</div>
                )}
              </div>
            </div>

            {/* Upcoming Sessions */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Upcoming Sessions</h3>
              <div className="space-y-3">
                {Array.isArray(profile.sessions) && profile.sessions.filter(s => new Date(s.sessionDate) > new Date()).length > 0 ? (
                  profile.sessions.filter(s => new Date(s.sessionDate) > new Date()).map((session,idx) => (
                    <div key={session._id} className="border p-4 rounded-lg bg-gray-50 shadow-sm">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-base text-gray-800">{session.surgeryType || 'Physiotherapy Session'}</h4>
                        <p className="text-xs text-gray-500">{session.sessionDate ? new Date(session.sessionDate).toLocaleString() : 'No Date'}</p>
                      </div>
                       <p className="text-sm text-gray-600 mt-1"><strong>Duration:</strong> {session.durationMinutes} minutes</p>

                      <p className="text-sm text-gray-600 mt-1"><strong>Doctor:</strong> {session.doctorId?.name || 'N/A'}</p>
                      <p className="text-sm text-gray-600"><strong>Physiotherapist:</strong> {session.physioId?.name || 'N/A'}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No upcoming sessions scheduled.</div>
                )}
              </div>
            </div>

            {/* Session History */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Session History</h3>
              <div className="space-y-3">
                {Array.isArray(profile.sessions) && profile.sessions.filter(s => s.status === 'completed' || new Date(s.sessionDate) <= new Date()).length > 0 ? (
                  profile.sessions.filter(s => s.status === 'completed' || new Date(s.sessionDate) <= new Date()).map((session) => (
                    <div key={session._id} className="border p-4 rounded-lg bg-gray-50 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-base text-gray-800">{session.surgeryType || 'Physiotherapy Session'}</h4>
                            {session.status === 'completed' && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">✅ Completed</span>
                            )}
                            {session.status === 'missed' && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">⚠️ Missed</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{session.sessionDate ? new Date(session.sessionDate).toLocaleString() : 'No Date'}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600"><strong>Doctor:</strong> {session.doctorId?.name || 'N/A'}</p>
                        <p className="text-sm text-gray-600"><strong>Physiotherapist:</strong> {session.physioId?.name || 'N/A'}</p>
                        <p className="text-sm text-gray-600"><strong>Duration:</strong> {session.durationMinutes} minutes</p>
                        {session.actualDuration && (
                          <p className="text-sm text-green-600"><strong>Actual Duration:</strong> {session.actualDuration} minutes</p>
                        )}
                        {session.notes && (
                          <p className="mt-2 text-sm text-gray-700 bg-gray-100 p-2 rounded"><strong>Notes:</strong> {session.notes}</p>
                        )}
                      </div>

                      {/* Session Video */}
                      {session.sessionVideo && session.sessionVideo.url && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="bg-white p-3 rounded">
                            <p className="font-semibold text-sm text-gray-900 mb-2">📹 {session.sessionVideo.title}</p>
                            {session.sessionVideo.description && (
                              <p className="text-xs text-gray-600 mb-2">{session.sessionVideo.description}</p>
                            )}
                            <video controls className="w-full rounded" style={{maxHeight: '300px'}}>
                              <source src={session.sessionVideo.url} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                            <p className="text-xs text-gray-500 mt-2">
                              Uploaded: {new Date(session.sessionVideo.uploadedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No session history available.</div>
                )}
              </div>
            </div>
          </div>
        );

      case 'reports':
        return (
          <div className="space-y-4" >
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Medical Reports</h3>
              <div className="space-y-3">
                {reports && reports.length > 0 ? (
                  reports.map((report) => (
                    <div key={report._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div className="flex-1">
                        <div className="font-medium">{report.title || 'Medical Report'}</div>                        
                        <div className="text-sm text-gray-500">
                          Uploaded by: {report.uploadedBy?.Fullname || 'N/A'} on {new Date(report.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a href={report.fileUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">Download</a>
                        <button onClick={() => handleReportDelete(report._id)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">Delete</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No reports available.</div>
                )}
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Manage Reports</h3>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold mb-4 mt-6">Upload New Report</h3>
                <button
                  onClick={handleDownloadAllReports}
                  disabled={downloading || reports.length === 0}
                  className="w-full mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                >{downloading ? 'Zipping...' : 'Download All Reports as ZIP'}</button>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full p-2 border rounded"
                  accept=".pdf,.doc,.docx,.jpg,.png"
                />
                <button
                  onClick={handleReportUpload}
                  disabled={uploading || !reportFile}
                  className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 disabled:bg-gray-400"
                >
                  {uploading ? 'Uploading...' : 'Upload Report'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'payments':
        return (
          <div className="space-y-4">
            {/* Test Mode Notice */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Test Mode Active:</strong> Use test cards for payments. UPI won't work in test mode.
                    <br />
                    <span className="text-xs font-semibold">Indian Test Card: 5267 3181 8797 5449 | CVV: 123 | Expiry: 12/25 | OTP: 0000</span>
                    <br />
                    <span className="text-xs">Or use: 6521 5499 3903 6232 (RuPay)</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Payment Requests</h3>
              
              {paymentsLoading ? (
                <div className="text-center py-8">Loading payments...</div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No payment requests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div
                      key={payment._id}
                      className={`p-4 border rounded-lg ${
                        payment.status === 'pending' ? 'border-yellow-300 bg-yellow-50' :
                        payment.status === 'completed' ? 'border-green-300 bg-green-50' :
                        'border-gray-300 bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{payment.description}</h4>
                          <p className="text-sm text-gray-600 mt-1">Amount: <span className="font-bold text-lg">₹{payment.amount}</span></p>
                          <p className="text-xs text-gray-500 mt-1">Type: {payment.paymentType}</p>
                          {payment.dueDate && (
                            <p className="text-xs text-gray-500">Due: {new Date(payment.dueDate).toLocaleDateString()}</p>
                          )}
                          {payment.notes && (
                            <p className="text-sm text-gray-600 mt-2 italic">{payment.notes}</p>
                          )}
                          {payment.paidAt && (
                            <p className="text-xs text-green-600 mt-1">Paid on: {new Date(payment.paidAt).toLocaleDateString()}</p>
                          )}
                        </div>
                        <div className="ml-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {payment.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      {payment.status === 'pending' && (
                        <div className="mt-3 pt-3 border-t border-gray-300">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handlePayNow(payment)}
                              disabled={processingPayment === payment._id}
                              className="flex-1 bg-teal-600 text-white px-4 py-2 rounded text-sm hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
                            >
                              {processingPayment === payment._id ? (
                                <span className="flex items-center justify-center gap-2">
                                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                  Processing...
                                </span>
                              ) : (
                                '💳 Pay Now'
                              )}
                            </button>
                            <a
                              href={`tel:+918881119890`}
                              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center justify-center"
                              title="Contact Admin for help"
                            >
                              📞
                            </a>
                          </div>
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Pay securely with Razorpay or contact admin for assistance
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Subscription Status</h3>
              <div className="text-center py-8 text-gray-500">
                <p>No active subscriptions.</p>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Select a tab to view content</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-teal-600 mb-4">🧑‍⚕️ Patient Profile</h1>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  // Save active tab to localStorage so it persists on refresh
                  localStorage.setItem('patientProfileActiveTab', tab.id);
                }}
                className={`px-4 py-2 rounded-t-lg font-medium flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-96">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
