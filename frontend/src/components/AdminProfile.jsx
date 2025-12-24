import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
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
        credentials: 'include' // Send cookies with token
      });
      if (response.ok) {
        const data = await response.json();
        setFormData({
          fullName: data.data.Fullname || '',
          username: data.data.username || '',
          email: data.data.email || `${data.data.username}@default.com`,
          phoneNumber: data.data.mobile_number || '',
          userType: data.data.userType || 'admin',
          avatar: null
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
      // Update account details (Fullname, email)
      const updateResponse = await fetch('/api/v1/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          Fullname: formData.fullName,
          username: formData.username,
          email: formData.email
        })
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      // Upload avatar if selected
      if (formData.avatar) {
        const formDataUpload = new FormData();
        formDataUpload.append('avatar', formData.avatar);

        const uploadResponse = await fetch('/api/v1/users/avatar', {
          method: 'PATCH',
          credentials: 'include',
          body: formDataUpload
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.message || 'Failed to upload avatar');
        }
      }

      setSuccess('✅ Profile updated successfully!');
      await fetchUserProfile(); // Refresh
      setFormData(prev => ({ ...prev, avatar: null })); // Clear file input
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancel = () => {
    navigate('/'); // Or dashboard/home
  };

  if (loading) return <div>Loading profile...</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-8 pt-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto bg-white rounded-lg shadow-md p-6 sm:p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Personal Information</h2>
        <form onSubmit={handleSave}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Full Name *</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="e.g., Rohit Kumar"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Username *
              {user?.userType === 'admin' && user?.Fullname !== 'Rohit kumar' && user?.Fullname !== 'Rohit Kumar' && (
                <span className="text-gray-500 text-xs ml-2">(Read-only)</span>
              )}
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              readOnly={user?.userType === 'admin' && user?.Fullname !== 'Rohit kumar' && user?.Fullname !== 'Rohit Kumar'}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                user?.userType === 'admin' && user?.Fullname !== 'Rohit kumar' && user?.Fullname !== 'Rohit Kumar'
                  ? 'bg-gray-100 cursor-not-allowed'
                  : ''
              }`}
              placeholder="e.g., admin_123456"
              required
              title={user?.userType === 'admin' && user?.Fullname !== 'Rohit kumar' && user?.Fullname !== 'Rohit Kumar'
                ? 'Username cannot be changed. Only Rohit kumar can change this.'
                : ''}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email *
              {user?.userType === 'admin' && user?.Fullname !== 'Rohit kumar' && user?.Fullname !== 'Rohit Kumar' && (
                <span className="text-gray-500 text-xs ml-2">(Read-only)</span>
              )}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              readOnly={user?.userType === 'admin' && user?.Fullname !== 'Rohit kumar' && user?.Fullname !== 'Rohit Kumar'}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                user?.userType === 'admin' && user?.Fullname !== 'Rohit kumar' && user?.Fullname !== 'Rohit Kumar'
                  ? 'bg-gray-100 cursor-not-allowed'
                  : ''
              }`}
              placeholder="e.g., admin@bonebuddy.in"
              required
              title={user?.userType === 'admin' && user?.Fullname !== 'Rohit kumar' && user?.Fullname !== 'Rohit Kumar'
                ? 'Email cannot be changed. Only Rohit kumar can change this.'
                : ''}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Phone Number <span className="text-gray-500 text-xs">(Read-only)</span>
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
              readOnly
              title="Phone number cannot be changed"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              User Type <span className="text-gray-500 text-xs">(Read-only)</span>
            </label>
            <input
              type="text"
              value={formData.userType}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
              readOnly
              title="User type cannot be changed"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Your Photo</label>
            <div className="flex items-center gap-4 mb-3">
              {/* Current Avatar */}
              {currentAvatar ? (
                <img 
                  src={currentAvatar} 
                  alt="Current Avatar" 
                  className="w-20 h-20 rounded-full object-cover border-2 border-teal-500"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-teal-600 flex items-center justify-center text-white text-2xl font-bold">
                  {formData.fullName?.charAt(0) || 'A'}
                </div>
              )}
              {/* New Avatar Preview */}
              {formData.avatar && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">New photo:</p>
                  <img 
                    src={URL.createObjectURL(formData.avatar)} 
                    alt="New Preview" 
                    className="w-20 h-20 rounded-full object-cover border-2 border-green-500" 
                  />
                </div>
              )}
            </div>
            <input
              type="file"
              name="avatar"
              onChange={handleFileChange}
              accept="image/*"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <p className="text-xs text-gray-500 mt-1">Recommended: Square image (e.g., 512x512 pixels)</p>
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          {success && <p className="text-green-500 text-sm mb-4">{success}</p>}

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProfile;
