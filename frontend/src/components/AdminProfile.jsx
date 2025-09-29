import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    userType: 'admin',
    avatar: null
  });
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
          phoneNumber: data.data.mobile_number || '',
          email: data.data.email || `${data.data.username}@default.com`,
          userType: data.data.userType || 'admin',
          avatar: data.data.avatar || null
        });
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

      setSuccess('Profile updated successfully!');
      fetchUserProfile(); // Refresh
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancel = () => {
    navigate('/'); // Or dashboard/home
  };

  if (loading) return <div>Loading profile...</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-8 pt-20">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-center">Personal Information</h2>
        <form onSubmit={handleSave}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="e.g., bone buddy"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Phone Number</label>
            <input
              type="tel"
              value={formData.phoneNumber}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              readOnly
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="e.g., admin@default.com"
              required
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

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Your Photo</label>
            <p className="text-xs text-gray-500 mb-2">Note: Image must be 512x250 pixels (2.05:1 ratio, landscape)</p>
            {formData.avatar && (
              <img src={URL.createObjectURL(formData.avatar)} alt="Preview" className="w-32 h-16 object-cover mb-2 rounded" />
            )}
            <input
              type="file"
              name="avatar"
              onChange={handleFileChange}
              accept="image/*"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
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
