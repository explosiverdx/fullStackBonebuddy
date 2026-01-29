import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as fflate from 'fflate';

const PatientProfile = () => {
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Load active tab from URL (?tab=payments), then localStorage, then default 'overview'
  const [activeTab, setActiveTab] = useState(() => {
    const tabFromUrl = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab');
    if (tabFromUrl === 'payments' || tabFromUrl === 'overview' || tabFromUrl === 'sessions' || tabFromUrl === 'reports') {
      return tabFromUrl;
    }
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

  // When landing with ?tab=payments (e.g. after insured signup), open Payments tab
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'payments' || tab === 'overview' || tab === 'sessions' || tab === 'reports') {
      setActiveTab(tab);
      localStorage.setItem('patientProfileActiveTab', tab);
    }
  }, [searchParams]);

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

  // Refetch payments when switching to Payments tab (so admin-created registration payments show up)
  useEffect(() => {
    if (activeTab === 'payments') fetchPayments();
  }, [activeTab]);

  // Refetch payments when the page becomes visible again (e.g. patient returns to tab after admin changed non-insured→insured)
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchPayments();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
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
        // Handle paginated { data: { docs } }, plain { data: [] }, or array
        const raw = data?.data;
        const list = Array.isArray(raw?.docs)
          ? raw.docs
          : Array.isArray(raw)
          ? raw
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
      address: (typeof profile.address === 'string' ? profile.address : (profile.address?.address || '')) || '',
      city: profile.city || '',
      state: profile.state || '',
      pincode: profile.pincode || '',
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
      const addressFields = ['address', 'city', 'state', 'pincode'];
      Object.keys(editForm).forEach(key => {
        if (editForm[key] || addressFields.includes(key)) formData.append(key, editForm[key] ?? '');
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
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
                    <label className="block text-sm font-medium mb-1">Area Code (Pincode)</label>
                    <input
                      type="text"
                      value={editForm.pincode || ''}
                      onChange={(e) => setEditForm({...editForm, pincode: e.target.value})}
                      placeholder="6-digit pincode"
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">State</label>
                    <input
                      type="text"
                      value={editForm.state || ''}
                      onChange={(e) => setEditForm({...editForm, state: e.target.value})}
                      placeholder="State"
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">City</label>
                    <input
                      type="text"
                      value={editForm.city || ''}
                      onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                      placeholder="City"
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Address</label>
                    <input
                      type="text"
                      value={editForm.address || ''}
                      onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                      placeholder="Street address, area, landmark"
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

        // Find first pending payment
        const firstPendingPayment = payments.find(p => p.status === 'pending' || p.isPending);

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

            {/* Non-Insured Patient Message (if no pending payment) */}
            {!firstPendingPayment && profile?.medicalInsurance !== 'Yes' && (
              <div className="space-y-5 w-full">
                {/* Informative Message for Non-Insured Patients */}
                <div 
                  className="relative overflow-hidden p-6 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.01]"
                  style={{
                    background: 'linear-gradient(135deg, #dbeafe 0%, #e0f2f1 50%, #cffafe 100%)',
                    boxShadow: '0 10px 25px rgba(59, 130, 246, 0.2), 0 4px 10px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-400 to-teal-400 rounded-full flex items-center justify-center shadow-md transition-transform duration-300 hover:rotate-12 hover:scale-110">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-base text-gray-800 leading-relaxed font-medium mb-2">
                        Our representative will reach you soon.
                      </p>
                      <p className="text-sm text-gray-600 font-medium">
                        Thank you for registering with us!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pending Payment Display */}
            {firstPendingPayment && (
              <div className="space-y-5 w-full">
                {/* Amount to Pay */}
                <div 
                  className="relative overflow-hidden p-8 rounded-2xl w-full transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 50%, #e0f2f1 100%)',
                    boxShadow: '0 20px 40px rgba(13, 148, 136, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1)',
                    border: '2px solid transparent',
                    backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 50%, #e0f2f1 100%), linear-gradient(135deg, #0d9488, #14b8a6)',
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                    width: '100%'
                  }}
                >
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-teal-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-200 rounded-full -ml-12 -mb-12 opacity-30"></div>
                  
                  <div className="relative text-center">
                    <p className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wider">Amount to Pay</p>
                    <p className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-teal-500 to-teal-600">
                      ₹{firstPendingPayment.amount?.toLocaleString('en-IN') || firstPendingPayment.amount}
                    </p>
                  </div>
                </div>

                {/* Informative Message */}
                <div 
                  className="relative overflow-hidden p-6 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.01]"
                  style={{
                    background: 'linear-gradient(135deg, #dbeafe 0%, #e0f2f1 50%, #cffafe 100%)',
                    boxShadow: '0 10px 25px rgba(59, 130, 246, 0.2), 0 4px 10px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-400 to-teal-400 rounded-full flex items-center justify-center shadow-md transition-transform duration-300 hover:rotate-12 hover:scale-110">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-base text-gray-800 leading-relaxed font-medium">
                        Don't worry! Your Physiotherapist will be assigned and session will be allotted soon after the payment. And our representative will be in touch with you for any kind of help.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pay Now Button */}
                <button
                  onClick={() => {
                    setActiveTab('payments');
                    localStorage.setItem('patientProfileActiveTab', 'payments');
                  }}
                  className="w-full bg-gradient-to-r from-teal-600 via-teal-500 to-teal-600 text-white px-8 py-5 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-3xl transform hover:scale-[1.03] hover:-translate-y-1 active:scale-[0.97] transition-all duration-300 flex items-center justify-center space-x-3 group"
                  style={{
                    boxShadow: '0 15px 35px rgba(13, 148, 136, 0.4), 0 5px 15px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  <svg className="w-7 h-7 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">Pay Now</span>
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              <div 
                className="bg-white p-5 sm:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08), 0 4px 10px rgba(0, 0, 0, 0.05)'
                }}
              >
                <h3 className="font-bold text-base sm:text-lg text-gray-800 mb-4 pb-2 border-b-2 border-teal-200">Personal Information</h3>
                <div className="space-y-3 text-sm sm:text-base">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">Patient ID:</span>
                    <span className="text-gray-800 break-all text-right">{profile._id.substring(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">Name:</span>
                    <span className="text-gray-800">{profile.Fullname}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">DOB:</span>
                    <span className="text-gray-800">{profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">Gender:</span>
                    <span className="text-gray-800">{profile.gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">Contact:</span>
                    <span className="text-gray-800">{profile.mobile_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">Email:</span>
                    <span className="text-gray-800 break-all text-right text-xs">{profile.email}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:items-start">
                    <span className="font-semibold text-gray-600 shrink-0">Address:</span>
                    <span className="text-gray-800 text-right break-words">{(typeof profile.address === 'object' && profile.address !== null) ? [profile.address.address, profile.address.city, profile.address.state, profile.address.pincode || profile.address.zipcode].filter(Boolean).join(', ') || 'N/A' : (profile.address || 'N/A')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">City:</span>
                    <span className="text-gray-800 text-right">{profile.city || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">State:</span>
                    <span className="text-gray-800 text-right">{profile.state || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">Pincode / Zipcode:</span>
                    <span className="text-gray-800 text-right">{profile.pincode || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div 
                className="bg-white p-5 sm:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08), 0 4px 10px rgba(0, 0, 0, 0.05)'
                }}
              >
                <h3 className="font-bold text-base sm:text-lg text-gray-800 mb-4 pb-2 border-b-2 border-blue-200">Medical Information</h3>
                <div className="space-y-3 text-sm sm:text-base">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">Surgery Type:</span>
                    <span className="text-gray-800">{profile.surgeryType || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">Surgery Date:</span>
                    <span className="text-gray-800">{profile.surgeryDate ? new Date(profile.surgeryDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">Hospital/Clinic:</span>
                    <span className="text-gray-800 text-right">{profile.hospitalName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">Recovery Stage:</span>
                    <span className="text-gray-800">{profile.recoveryStage || 'Initial'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">Status:</span>
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">{profile.currentStatus || 'Active'}</span>
                  </div>
                </div>
              </div>

              <div 
                className="bg-white p-5 sm:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08), 0 4px 10px rgba(0, 0, 0, 0.05)'
                }}
              >
                <h3 className="font-bold text-base sm:text-lg text-gray-800 mb-4 pb-2 border-b-2 border-purple-200">Assigned Healthcare Team</h3>
                <div className="space-y-3 text-sm sm:text-base">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">Doctor:</span>
                    <span className="text-gray-800 text-right">{profile.sessions?.[0]?.doctorId?.name || profile.assignedDoctor || 'Not Assigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">Physiotherapist:</span>
                    <span className="text-gray-800 text-right">{profile.sessions?.[0]?.physioId?.name || profile.assignedPhysio || 'Not Assigned'}</span>
                  </div>
                </div>
              </div>

              <div 
                className="bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 p-6 sm:p-8 rounded-2xl shadow-xl md:col-span-2 lg:col-span-3"
                style={{
                  boxShadow: '0 15px 35px rgba(13, 148, 136, 0.15), 0 5px 15px rgba(0, 0, 0, 0.1)'
                }}
              >
                <h3 className="font-bold text-lg sm:text-xl text-gray-800 mb-6 pb-3 border-b-2 border-teal-300">Progress Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                  <div className="text-center p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
                    <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-teal-400 mb-2">
                      {profile.sessionsCompleted || 0}
                    </div>
                    <div className="text-sm sm:text-base font-semibold text-gray-700">Sessions Completed</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
                    <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400 mb-2">
                      {profile.missedSessions || 0}
                    </div>
                    <div className="text-sm sm:text-base font-semibold text-gray-700">Missed Sessions</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
                    <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400 mb-2">
                      {profile.recoveryProgress || 0}%
                    </div>
                    <div className="text-sm sm:text-base font-semibold text-gray-700">Recovery Progress</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
                    <div className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-400 mb-2">
                      {profile.lastLogin ? new Date(profile.lastLogin).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="text-sm sm:text-base font-semibold text-gray-700">Last Login</div>
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
                          Uploaded by: {(report.isProfileReport || report.isRegistrationReport || report.isFromMedicalReports) ? (report.uploadedByAdmin ? 'Bonebuddy' : 'Self') : (report.uploadedBy?.userType === 'admin' ? 'Bonebuddy' : (report.uploadedBy?.Fullname || 'N/A'))} on {new Date(report.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a href={report.fileUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">Download</a>
                        {!report.isProfileReport && !report.isRegistrationReport && !report.isFromMedicalReports && (
                          <button onClick={() => handleReportDelete(report._id)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">Delete</button>
                        )}
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
        const pendingPayment = payments.find(p => p.status === 'pending' || p.isPending);
        
        return (
          <div className="space-y-6">
            {/* Test Mode Notice */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-sm">
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

            {paymentsLoading ? (
              <div className="bg-white p-8 rounded-xl shadow-md text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                <p className="mt-4 text-gray-600">Loading payments...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="bg-white p-8 rounded-xl shadow-md text-center text-gray-500">
                <p>No payment requests</p>
                <button
                  type="button"
                  onClick={() => fetchPayments()}
                  className="mt-4 px-4 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors"
                >
                  Refresh
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => {
                  const isPending = payment.status === 'pending' || payment.isPending;
                  
                  return (
                    <div
                      key={payment._id}
                      className={`rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                        isPending 
                          ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 hover:border-yellow-300' 
                          : payment.status === 'completed' 
                          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 hover:border-green-300'
                          : 'bg-white border-2 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* Payment Status Header */}
                      <div className={`p-4 ${
                        isPending 
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-400' 
                          : payment.status === 'completed'
                          ? 'bg-gradient-to-r from-green-400 to-emerald-400'
                          : 'bg-gradient-to-r from-gray-400 to-gray-500'
                      }`}>
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-white text-lg">{payment.description || 'Payment'}</h4>
                          <span className={`px-4 py-1 rounded-full text-xs font-bold ${
                            payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            isPending ? 'bg-yellow-100 text-yellow-800' :
                            payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {payment.status?.toUpperCase() || 'PENDING'}
                          </span>
                        </div>
                      </div>

                      <div className="p-6">
                        {isPending ? (
                          <>
                            {/* Amount Display for Pending */}
                            <div 
                              className="relative overflow-hidden p-8 rounded-2xl mb-5 w-full transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl cursor-pointer"
                              style={{
                                background: 'linear-gradient(135deg, #ffffff 0%, #fff7ed 50%, #ffedd5 100%)',
                                boxShadow: '0 20px 40px rgba(251, 146, 60, 0.2), 0 8px 16px rgba(0, 0, 0, 0.1)',
                                border: '2px solid transparent',
                                backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #fff7ed 50%, #ffedd5 100%), linear-gradient(135deg, #f59e0b, #f97316)',
                                backgroundOrigin: 'border-box',
                                backgroundClip: 'padding-box, border-box',
                                width: '100%'
                              }}
                            >
                              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-200 rounded-full -mr-12 -mt-12 opacity-40"></div>
                              <div className="absolute bottom-0 left-0 w-20 h-20 bg-orange-300 rounded-full -ml-10 -mb-10 opacity-30"></div>
                              <div className="relative text-center">
                                <p className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wider">Amount to Pay</p>
                                <p className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600">
                                  ₹{payment.amount?.toLocaleString('en-IN') || payment.amount}
                                </p>
                              </div>
                            </div>

                            {/* Informative Message */}
                            <div 
                              className="relative overflow-hidden p-6 rounded-2xl shadow-lg mb-5 transition-all duration-300 hover:shadow-xl hover:scale-[1.01]"
                              style={{
                                background: 'linear-gradient(135deg, #dbeafe 0%, #e0f2f1 50%, #cffafe 100%)',
                                boxShadow: '0 10px 25px rgba(59, 130, 246, 0.2), 0 4px 10px rgba(0, 0, 0, 0.1)'
                              }}
                            >
                              <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-400 to-teal-400 rounded-full flex items-center justify-center shadow-md transition-transform duration-300 hover:rotate-12 hover:scale-110">
                                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <p className="text-base text-gray-800 leading-relaxed font-medium">
                                    Don't worry! Your Physiotherapist will be assigned and session will be allotted soon after the payment. And our representative will be in touch with you for any kind of help.
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Payment Actions */}
                            <div className="space-y-3">
                              <button
                                onClick={() => handlePayNow(payment)}
                                disabled={processingPayment === payment._id}
                                className="w-full bg-gradient-to-r from-teal-600 via-teal-500 to-teal-600 text-white px-8 py-5 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-3xl transform hover:scale-[1.03] hover:-translate-y-1 active:scale-[0.97] transition-all duration-300 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                                style={{
                                  boxShadow: '0 15px 35px rgba(13, 148, 136, 0.4), 0 5px 15px rgba(0, 0, 0, 0.15)'
                                }}
                              >
                                {processingPayment === payment._id ? (
                                  <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Processing payment...</span>
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-7 h-7 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                    <span className="transition-transform duration-300 group-hover:translate-x-1">Pay Now</span>
                                  </>
                                )}
                              </button>
                              <a
                                href={`tel:+918881119890`}
                                className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-xl text-center hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 font-semibold group"
                                title="Contact Admin for help"
                                style={{
                                  boxShadow: '0 10px 25px rgba(37, 99, 235, 0.3), 0 4px 10px rgba(0, 0, 0, 0.15)'
                                }}
                              >
                                <span className="inline-block transition-transform duration-300 group-hover:scale-110">📞</span> Contact Support
                              </a>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Full Payment Info for Completed/Failed */}
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600">Amount:</span>
                                <span className="text-xl font-bold text-gray-900">₹{payment.amount?.toLocaleString('en-IN') || payment.amount}</span>
                              </div>
                              {payment.paymentType && (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-600">Type:</span>
                                  <span className="text-sm text-gray-800">{payment.paymentType}</span>
                                </div>
                              )}
                              {payment.transactionId && (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-600">Transaction ID:</span>
                                  <span className="text-sm text-gray-800 font-mono">{payment.transactionId}</span>
                                </div>
                              )}
                              {payment.paidAt && (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-600">Paid On:</span>
                                  <span className="text-sm text-gray-800">{new Date(payment.paidAt).toLocaleString()}</span>
                                </div>
                              )}
                              {payment.dueDate && (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-600">Due Date:</span>
                                  <span className="text-sm text-gray-800">{new Date(payment.dueDate).toLocaleDateString()}</span>
                                </div>
                              )}
                              {payment.notes && (
                                <div className="pt-3 border-t border-gray-200">
                                  <p className="text-sm text-gray-600 italic">{payment.notes}</p>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

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
    <div className="min-h-screen bg-gray-50 pt-16 sm:pt-20">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-teal-600 mb-3 sm:mb-4">🧑‍⚕️ Patient Profile</h1>

          {/* Tabs */}
          <div className="flex space-x-1 mb-4 sm:mb-6 overflow-x-auto pb-2 -mx-3 sm:mx-0 px-3 sm:px-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  // Save active tab to localStorage so it persists on refresh
                  localStorage.setItem('patientProfileActiveTab', tab.id);
                }}
                className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-t-lg font-medium flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm whitespace-nowrap ${
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
