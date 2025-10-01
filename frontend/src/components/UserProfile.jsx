import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const UserProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    if (!Array.isArray(doctors)) {
      setDoctors([]);
    }
  }, [doctors]);
  const [physios, setPhysios] = useState([]);
  const [medicalReports, setMedicalReports] = useState([]);

  useEffect(() => {
    if (user && user.profileCompleted === false) {
      navigate('/patient-signup', { state: { phoneNumber: user.mobile_number } });
      return;
    }

    // Fetch user profile data from backend API
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/v1/users/me', {
          method: 'GET',
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setProfile(data.data);
          setProfileImage(data.data.avatar || null);
          setMedicalReports(data.data.medicalReports || []);
        } else {
          alert('Failed to fetch profile data');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        alert('Error fetching profile data');
      }
    };

    // Fetch doctors list
        const fetchDoctors = async () => {
          try {
            const response = await fetch('/api/v1/doctors/getAllDoctors', {
              method: 'GET',
              credentials: 'include',
            });
            if (response.ok) {
              const data = await response.json();
              setDoctors(data.data || []);
            }
          } catch (error) {
            console.error('Error fetching doctors:', error);
          }
        };

        // Fetch physios list
        const fetchPhysios = async () => {
          try {
            const response = await fetch('/api/v1/physios/getAllPhysios', {
              method: 'GET',
              credentials: 'include',
            });
            if (response.ok) {
              const data = await response.json();
              setPhysios(data.data || []);
            }
          } catch (error) {
            console.error('Error fetching physios:', error);
          }
        };

    fetchProfile();
    fetchDoctors();
    fetchPhysios();
  }, [navigate, user]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/v1/users/avatar', {
        method: 'PATCH',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfileImage(data.data.avatar);
        alert('Profile picture updated successfully');
      } else {
        alert('Failed to upload profile picture');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleMedicalReportUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('medicalReports', files[i]);
    }
    try {
      const response = await fetch('/api/v1/users/medical-reports', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        setMedicalReports(data.data.medicalReports);
        alert('Medical reports uploaded successfully');
      } else {
        alert('Failed to upload medical reports');
      }
    } catch (error) {
      console.error('Error uploading medical reports:', error);
      alert('Error uploading medical reports');
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/v1/users/me', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (response.ok) {
        alert('Profile updated successfully');
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    }
  };

  if (!profile) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-200 rounded shadow space-y-6">
      <h2 className="text-2xl font-bold mb-8">User Profile</h2>
      <div className="flex items-start space-x-12 mt-4">
        <div className="flex-shrink-0">
          <img
            src={profileImage || '/default-avatar.png'}
            alt="Profile"
            className="w-28 h-28 rounded-full object-cover border-4 border-teal-600"
          />
          <label className="block mt-4 mb-2 font-medium text-gray-700">Change Profile Picture</label>
          <input type="file" accept="image/*" onChange={handleImageChange} disabled={uploading} />
        </div>
        <div className="flex-grow bg-white p-6 rounded shadow space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block font-medium mb-1">Full Name</label>
              <input
                type="text"
                name="Fullname"
                value={profile.Fullname || ''}
                readOnly
                placeholder="Full Name"
                className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Nickname</label>
              <input
                type="text"
                name="nickname"
                value={profile.nickname || ''}
                readOnly
                placeholder="Nickname"
                className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Gender</label>
              <input
                type="text"
                name="gender"
                value={profile.gender || ''}
                readOnly
                placeholder="Gender"
                className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Country</label>
              <input
                type="text"
                name="country"
                value={profile.country || ''}
                readOnly
                placeholder="Country"
                className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Language</label>
              <input
                type="text"
                name="language"
                value={profile.language || ''}
                readOnly
                placeholder="Language"
                className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Time Zone</label>
              <input
                type="text"
                name="timeZone"
                value={profile.timeZone || ''}
                readOnly
                placeholder="Time Zone"
                className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Date of Birth</label>
              <input
                type="text"
                name="dateOfBirth"
                value={profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : ''}
                readOnly
                placeholder="Date of Birth"
                className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Mobile Number</label>
              <input
                type="text"
                name="mobile_number"
                value={profile.mobile_number || ''}
                readOnly
                placeholder="Mobile Number"
                className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Email Address</label>
              <input
                type="text"
                name="email"
                value={profile.email || ''}
                readOnly
                placeholder="Email Address"
                className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contact & Location */}
      <div className="bg-blue-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
        <h3 className="text-xl font-semibold mb-4 text-blue-800">Contact & Location</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block font-medium mb-1 text-gray-700">Street</label>
            <input
              type="text"
              name="address.street"
              value={profile.address?.street || ''}
              onChange={handleInputChange}
              placeholder="Street"
              className="w-full border rounded px-3 py-2 bg-white hover:bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block font-medium mb-1 text-gray-700">City</label>
            <input
              type="text"
              name="address.city"
              value={profile.address?.city || ''}
              onChange={handleInputChange}
              placeholder="City"
              className="w-full border rounded px-3 py-2 bg-white hover:bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block font-medium mb-1 text-gray-700">State</label>
            <input
              type="text"
              name="address.state"
              value={profile.address?.state || ''}
              onChange={handleInputChange}
              placeholder="State"
              className="w-full border rounded px-3 py-2 bg-white hover:bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block font-medium mb-1 text-gray-700">Country</label>
            <input
              type="text"
              name="address.country"
              value={profile.address?.country || ''}
              onChange={handleInputChange}
              placeholder="Country"
              className="w-full border rounded px-3 py-2 bg-white hover:bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block font-medium mb-1 text-gray-700">Pin Code</label>
            <input
              type="text"
              name="address.pincode"
              value={profile.address?.pincode || ''}
              onChange={handleInputChange}
              placeholder="Pin Code"
              className="w-full border rounded px-3 py-2 bg-white hover:bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block font-medium mb-1 text-gray-700">Emergency Contact Name</label>
            <input
              type="text"
              name="emergencyContactName"
              value={profile.emergencyContactName || ''}
              onChange={handleInputChange}
              placeholder="Emergency Contact Name"
              className="w-full border rounded px-3 py-2 bg-white hover:bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block font-medium mb-1 text-gray-700">Emergency Contact Phone</label>
            <input
              type="text"
              name="emergencyContactPhone"
              value={profile.emergencyContactPhone || ''}
              onChange={handleInputChange}
              placeholder="Emergency Contact Phone"
              className="w-full border rounded px-3 py-2 bg-white hover:bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block font-medium mb-1 text-gray-700">Emergency Contact Relation</label>
            <input
              type="text"
              name="emergencyContactRelation"
              value={profile.emergencyContactRelation || ''}
              onChange={handleInputChange}
              placeholder="Emergency Contact Relation"
              className="w-full border rounded px-3 py-2 bg-white hover:bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Medical & Recovery Info */}
      <div className="bg-green-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
        <h3 className="text-xl font-semibold mb-4 text-green-800">Medical & Recovery Info</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block font-medium mb-1 text-gray-700">Condition</label>
            <input
              type="text"
              name="condition"
              value={profile.condition || ''}
              onChange={handleInputChange}
              placeholder="Condition"
              className="w-full border rounded px-3 py-2 bg-white hover:bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 transition-colors"
            />
          </div>
          <div>
            <label className="block font-medium mb-1 text-gray-700">Surgery Date</label>
            <input
              type="date"
              name="surgeryDate"
              value={profile.surgeryDate ? profile.surgeryDate.split('T')[0] : ''}
              onChange={handleInputChange}
              className="w-full border rounded px-3 py-2 bg-white hover:bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 transition-colors"
            />
          </div>
          <div>
            <label className="block font-medium mb-1 text-gray-700">Assigned Doctor</label>
            <select
              name="assignedDoctor"
              value={profile.assignedDoctor || ''}
              onChange={handleInputChange}
              className="w-full border rounded px-3 py-2 bg-white hover:bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 transition-colors"
            >
              <option value="">Select Doctor</option>
              {Array.isArray(doctors) && doctors.map((doc) => (
                <option key={doc._id} value={doc._id}>{doc.Fullname}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1 text-gray-700">Assigned Physiotherapist</label>
            <select
              name="assignedPhysio"
              value={profile.assignedPhysio || ''}
              onChange={handleInputChange}
              className="w-full border rounded px-3 py-2 bg-white hover:bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 transition-colors"
            >
              <option value="">Select Physiotherapist</option>
              {Array.isArray(physios) && physios.map((phy) => (
                <option key={phy._id} value={phy._id}>{phy.Fullname}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1 text-gray-700">Current Status</label>
            <select
              name="currentStatus"
              value={profile.currentStatus || ''}
              onChange={handleInputChange}
              className="w-full border rounded px-3 py-2 bg-white hover:bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 transition-colors"
            >
              <option value="">Select Status</option>
              <option value="Active">Active</option>
              <option value="In Recovery">In Recovery</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1 text-gray-700">Upload Medical Reports</label>
            <input
              type="file"
              multiple
              accept=".pdf,image/*"
              onChange={handleMedicalReportUpload}
              className="w-full border rounded px-3 py-2 bg-white hover:bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 transition-colors"
            />
            <ul className="mt-2 list-disc list-inside">
              {medicalReports.map((report, index) => (
                <li key={index}>
                  <a href={report.url} target="_blank" rel="noopener noreferrer">{report.name}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* System & Preferences */}
      <div className="bg-purple-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
        <h3 className="text-xl font-semibold mb-4 text-purple-800">System & Preferences</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block font-medium mb-1 text-gray-700">Language Preference</label>
            <input
              type="text"
              name="languagePreference"
              value={profile.languagePreference || ''}
              onChange={handleInputChange}
              placeholder="Language Preference"
              className="w-full border rounded px-3 py-2 bg-white hover:bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 transition-colors"
            />
          </div>
          <div>
            <label className="block font-medium mb-1 text-gray-700">Time Zone</label>
            <input
              type="text"
              name="timeZone"
              value={profile.timeZone || ''}
              onChange={handleInputChange}
              placeholder="Time Zone"
              className="w-full border rounded px-3 py-2 bg-white hover:bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 transition-colors"
            />
          </div>
          <div>
            <label className="block font-medium mb-1 text-gray-700">Notifications</label>
            <select
              name="notifications"
              value={profile.notifications || ''}
              onChange={handleInputChange}
              className="w-full border rounded px-3 py-2 bg-white hover:bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 transition-colors"
            >
              <option value="">Select Notification Preference</option>
              <option value="SMS">SMS</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Email">Email</option>
            </select>
          </div>
        </div>
      </div>

      {/* Progress & Engagement */}
      <div className="bg-yellow-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
        <h3 className="text-xl font-semibold mb-4 text-yellow-800">Progress & Engagement</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-3 rounded shadow-sm hover:shadow-md transition-shadow">
            <strong className="text-gray-700">Last Login:</strong> {profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'N/A'}
          </div>
          <div className="bg-white p-3 rounded shadow-sm hover:shadow-md transition-shadow">
            <strong className="text-gray-700">Sessions Completed:</strong> {profile.sessionsCompleted || 0}
          </div>
          <div className="bg-white p-3 rounded shadow-sm hover:shadow-md transition-shadow">
            <strong className="text-gray-700">Missed Sessions:</strong> {profile.missedSessions || 0}
          </div>
          <div className="bg-white p-3 rounded shadow-sm hover:shadow-md transition-shadow">
            <strong className="text-gray-700">Recovery Progress:</strong> {profile.recoveryProgress || 'N/A'}
          </div>
        </div>
      </div>

      <div className="flex justify-center space-x-4 mt-8">
        <button
          className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
          onClick={handleSave}
        >
          Save Profile
        </button>
        <button
          className="px-6 py-3 bg-gray-300 text-black rounded-lg hover:bg-gray-400 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
          onClick={() => navigate('/')}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
