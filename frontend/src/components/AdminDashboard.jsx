import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import PatientRecord from './PatientRecord';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    userType: 'admin',
    avatar: null
  });
  const [currentAvatar, setCurrentAvatar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/v1/users/me', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setFormData({
          fullName: data.data.Fullname || '',
          phoneNumber: data.data.mobile_number || '',
          userType: data.data.userType || 'admin'
        });
        setCurrentAvatar(data.data.avatar || null);
      } else {
        setError('Failed to fetch profile');
      }
    } catch (err) {
      setError(`Error fetching profile: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, avatar: e.target.files[0] }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('fullName', formData.fullName);
      formDataUpload.append('phoneNumber', formData.phoneNumber);
      if (formData.avatar) {
        formDataUpload.append('avatar', formData.avatar);
      }

      const uploadResponse = await fetch('/api/v1/users', {
        method: 'PATCH',
        credentials: 'include',
        body: formDataUpload
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      // Refresh profile
      await fetchUserProfile();
      setFormData(prev => ({ ...prev, avatar: null })); // Clear selected file
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  const handleProfileClick = () => {
    navigate('/admin/profile');
  };

  const renderContent = () => {
    if (pathname === '/admin') {
      return <p>Welcome to BoneBuddy Dashboard</p>;
    } else if (pathname === '/admin/patient-record') {
      return <PatientRecord />;
    } else if (pathname === '/admin/pending-sessions') {
      return <PendingSessions />;
    } else if (pathname === '/admin/profile') {
      return (
        <>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">User Type</label>
                <input
                  type="text"
                  value={formData.userType}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  readOnly
                />
              </div>
            </div>

            <div className="flex flex-col justify-center items-center">
              <div className="mb-4 text-center">
                <label className="block text-gray-700 text-sm font-bold mb-2">Your Photo</label>
                <img
                  src={avatarSrc}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-300 mx-auto mb-2"
                />
                <input
                  type="file"
                  name="avatar"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <p className="text-xs text-gray-500 mt-2">Note: Image must be 512x250 pixels</p>
              </div>
            </div>
          </form>

          {error && <p className="text-red-500 text-sm mb-4 mt-4">{error}</p>}
          {success && <p className="text-green-500 text-sm mb-4 mt-4">{success}</p>}

          <div className="flex space-x-4 mt-6 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600"
            >
              Update Profile
            </button>
          </div>
        </>
      );
    } else {
      const section = pathname.split('/').pop().replace('-', ' ');
      return <p>Content for {section} will be added later.</p>;
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading profile...</div>;

  const avatarSrc = currentAvatar ? currentAvatar : 'https://via.placeholder.com/80x80/6B7280/FFFFFF?text=Admin';

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-600 text-white p-4 flex flex-col">
        <div className="mb-4 flex items-center space-x-2">
          <img src="/assets/BoneBuddy_Logo-modified.webp" alt="BoneBuddy" className="w-12 h-12 rounded-full object-cover" />
          <h2 className="text-xl font-bold">BoneBuddy</h2>
        </div>
        <nav className="flex-1">
          <ul className="space-y-2">
            <li><Link to="/admin" className={pathname === '/admin' ? 'block py-2 px-4 rounded bg-teal-600' : 'block py-2 px-4 rounded hover:bg-teal-600'}>Dashboard</Link></li>
            <li><Link to="/admin/patient-record" className={pathname === '/admin/patient-record' ? 'block py-2 px-4 rounded bg-teal-600' : 'block py-2 px-4 rounded hover:bg-teal-600'}>Patient Record</Link></li>
            <li><Link to="/admin/pending-sessions" className={pathname === '/admin/pending-sessions' ? 'block py-2 px-4 rounded bg-teal-600' : 'block py-2 px-4 rounded hover:bg-teal-600'}>Pending Sessions</Link></li>
            <li><Link to="/admin/missed-sessions" className={pathname === '/admin/missed-sessions' ? 'block py-2 px-4 rounded bg-teal-600' : 'block py-2 px-4 rounded hover:bg-teal-600'}>Missed Sessions</Link></li>
            <li><Link to="/admin/completed-sessions" className={pathname === '/admin/completed-sessions' ? 'block py-2 px-4 rounded bg-teal-600' : 'block py-2 px-4 rounded hover:bg-teal-600'}>Completed Sessions</Link></li>
            <li><Link to="/admin/payment" className={pathname === '/admin/payments' ? 'block py-2 px-4 rounded bg-teal-600' : 'block py-2 px-4 rounded hover:bg-teal-600'}>Payments</Link></li>
            <li><Link to="/admin/services" className={pathname === '/admin/services' ? 'block py-2 px-4 rounded bg-teal-600' : 'block py-2 px-4 rounded hover:bg-teal-600'}>Services</Link></li>
            <li><Link to="/admin/change-usertype" className={pathname === '/admin/change-usertype' ? 'block py-2 px-4 rounded bg-teal-600' : 'block py-2 px-4 rounded hover:bg-teal-600'}>Change UserType</Link></li>
            <li><Link to="/admin/report" className={pathname === '/admin/report' ? 'block py-2 px-4 rounded bg-teal-600' : 'block py-2 px-4 rounded hover:bg-teal-600'}>Report</Link></li>
            <li><Link to="/admin/profile" className={pathname === '/admin/profile' ? 'block py-2 px-4 rounded bg-teal-600' : 'block py-2 px-4 rounded hover:bg-teal-600'}>Profile</Link></li>
            <li><Link to="/admin/support" className={pathname === '/admin/support' ? 'block py-2 px-4 rounded bg-teal-600' : 'block py-2 px-4 rounded hover:bg-teal-600'}>Support</Link></li>
            <li><Link to="/admin/common-resource" className={pathname === '/admin/common-resource' ? 'block py-2 px-4 rounded bg-teal-600' : 'block py-2 px-4 rounded hover:bg-teal-600'}>Common Resource</Link></li>
          </ul>
        </nav>
        <div className="mt-auto">
          <Link to="/signIn" className="block py-2 px-4 rounded hover:bg-teal-600">Logout</Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Header with Profile */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex justify-end items-center">
          <div className="flex items-center space-x-4 cursor-pointer" onClick={handleProfileClick}>
            <img
              src={avatarSrc}
              alt="Profile"
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-300"
            />
            <div>
              <h3 className="text-lg font-bold text-gray-800">{formData.fullName || 'Admin'}</h3>
              <p className="text-sm text-gray-600">Admin</p>
              <p className="text-sm text-gray-600">{formData.phoneNumber}</p>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

const PendingSessions = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPendingAppointments();
  }, []);

  const fetchPendingAppointments = async () => {
    try {
      const response = await fetch('/api/v1/appointments/admin/pending', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.data.docs || []);
      } else {
        setError('Failed to fetch pending appointments');
      }
    } catch (err) {
      setError(`Error fetching appointments: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (appointmentId, action, newData = {}) => {
    try {
      const body = { ...newData };
      if (action === 'approve') body.status = 'scheduled';
      else if (action === 'cancel') body.status = 'canceled';
      else if (action === 'reschedule') body.appointmentDate = newData.appointmentDate;
      else if (action === 'assign') body.physioId = newData.physioId;

      const response = await fetch(`/api/v1/appointments/admin/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      if (response.ok) {
        fetchPendingAppointments(); // Refresh list
      } else {
        setError('Failed to update appointment');
      }
    } catch (err) {
      setError(`Error updating appointment: ${err.message}`);
    }
  };

  const isUpcoming = (date) => {
    const now = new Date();
    const appointmentDate = new Date(date);
    const diffHours = (appointmentDate - now) / (1000 * 60 * 60);
    return diffHours <= 24 && diffHours > 0;
  };

  if (loading) return <div className="text-center">Loading pending sessions...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Pending Sessions</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Therapist</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {appointments.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No pending sessions.</td>
              </tr>
            ) : (
              appointments.map((appt) => (
                <tr key={appt._id} className={isUpcoming(appt.appointmentDate) ? 'bg-yellow-50 border-yellow-300' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{appt.patient.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{appt.physio.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(appt.appointmentDate).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{appt.sessionType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      {appt.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {isUpcoming(appt.appointmentDate) && (
                      <span className="text-yellow-700 mr-2">⚠️ Upcoming</span>
                    )}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAction(appt._id, 'approve')}
                        className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          const newDate = prompt('Enter new date (YYYY-MM-DDTHH:MM):', new Date(appt.appointmentDate).toISOString().slice(0, 16));
                          if (newDate) handleAction(appt._id, 'reschedule', { appointmentDate: new Date(newDate).toISOString() });
                        }}
                        className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => {
                          const newPhysioId = prompt('Enter new Physio ID:');
                          if (newPhysioId) handleAction(appt._id, 'assign', { physioId: newPhysioId });
                        }}
                        className="bg-purple-500 text-white px-2 py-1 rounded text-xs hover:bg-purple-600"
                      >
                        Assign
                      </button>
                      <button
                        onClick={() => handleAction(appt._id, 'cancel')}
                        className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
