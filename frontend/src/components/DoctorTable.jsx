import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from '../hooks/useAuth';

// Helper function to check if a section is read-only for the current admin
const isSectionReadOnly = (user, sectionKey) => {
  if (!user || !user.adminPermissions) return false;
  const isRohitKumar = user.Fullname === 'Rohit kumar' || user.Fullname === 'Rohit Kumar';
  if (isRohitKumar) return false; // Rohit Kumar has full access
  
  const sectionPerm = user.adminPermissions.sectionPermissions?.[sectionKey];
  return sectionPerm?.readOnly === true;
};

const DoctorTable = ({ selectedItem, user: userProp }) => {
  const { user: userFromAuth } = useAuth();
  const user = userProp || userFromAuth;
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    specialization: '',
    qualification: '',
    experience: '',
    hospitalAffiliation: '',
    userId: ''
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    specialization: '',
    qualification: '',
    experience: '',
    hospitalAffiliation: ''
  });

  useEffect(() => {
    fetchDoctors();
  }, [search, sortBy, sortOrder, page]);

  useEffect(() => {
    if (selectedItem && selectedItem.type === 'doctor') {
      setSelectedDoctor(selectedItem);
      setShowEditModal(true); // Reuse edit modal for details
    }
  }, [selectedItem]);

  const fetchDoctors = async () => {
    try {
      const params = new URLSearchParams({
        page,
        limit,
        search,
        sortBy,
        sortOrder
      });
      const response = await apiClient.get(`/admin/doctors?${params}`);
      const doctorsList = response.data.data.doctors || [];
      const total = response.data.data.total || 0;
      console.log('Fetched doctors:', doctorsList.map(d => ({
        id: d.doctorId || d._id,
        name: d.name,
        specialization: d.specialization,
        qualification: d.qualification
      })));
      setDoctors(doctorsList);
      setTotalPages(Math.ceil(total / limit) || 1);
      setError('');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch doctors';
      setError(errorMsg);
      console.error('Error fetching doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleView = (doctor) => {
    // Navigate to doctor detail page or show modal
    alert(`View details for ${doctor.name}`);
  };

  const handleEdit = (doctor) => {
    // Check if doctor has a valid doctorId
    const doctorId = doctor.doctorId || doctor._id;
    
    if (!doctorId || doctorId === 'N/A' || doctorId === 'undefined') {
      alert('Error: This doctor does not have a valid profile. Cannot edit.');
      return;
    }

    console.log('Editing doctor:', doctor);
    console.log('Doctor ID:', doctorId);
    
    setSelectedDoctor(doctor);
    setEditFormData({
      name: doctor.name || '',
      email: doctor.email || '',
      mobileNumber: doctor.contact || '',
      specialization: doctor.specialization || '',
      qualification: doctor.qualification || '',
      experience: doctor.experience || '',
      hospitalAffiliation: doctor.hospitalAffiliation || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!editFormData.name || !editFormData.specialization || !editFormData.qualification || !editFormData.hospitalAffiliation) {
      alert('Please fill in all required fields: Name, Specialization, Qualification, and Hospital/Clinic');
      return;
    }

    try {
      const payload = { ...editFormData };
      
      // Convert experience to number
      if (payload.experience) {
        payload.experience = parseInt(payload.experience, 10);
      }

      // Use doctorId if available, otherwise fall back to _id
      const doctorId = selectedDoctor.doctorId || selectedDoctor._id;
      
      console.log('Updating doctor with ID:', doctorId, 'Selected doctor:', selectedDoctor);
      
      if (!doctorId || doctorId === 'N/A') {
        alert('Error: Doctor ID not found. Please refresh the page and try again.');
        return;
      }

      const response = await apiClient.patch(`/admin/doctors/${doctorId}`, payload);
      
      console.log('Doctor updated:', response.data);
      alert('Doctor updated successfully!');
      setShowEditModal(false);
      setSelectedDoctor(null);
      
      // Force refresh the doctors list after a short delay to ensure database is updated
      setTimeout(() => {
        fetchDoctors();
      }, 500);
      
      setError('');
    } catch (err) {
      console.error('Error updating doctor:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update doctor. Please check the console for details.';
      alert(`Error: ${errorMessage}`);
      setError(errorMessage);
    }
  };

  const handleEditCancel = () => {
    setShowEditModal(false);
    setSelectedDoctor(null);
    setEditFormData({
      name: '',
      email: '',
      mobileNumber: '',
      specialization: '',
      qualification: '',
      experience: '',
      hospitalAffiliation: ''
    });
  };

  const handleDelete = async (doctorId) => {
    if (!doctorId || doctorId === 'N/A') {
      alert('Error: Doctor ID not found. Please refresh the page and try again.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        await apiClient.delete(`/admin/doctors/${doctorId}`);
        fetchDoctors();
        setError('');
        alert('Doctor deleted successfully!');
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'Failed to delete doctor';
        setError(errorMsg);
        alert(`Error: ${errorMsg}`);
      }
    }
  };

  const handleExport = () => {
    // Simple CSV export
    const csv = [
      ['ID', 'Name', 'Contact', 'Email', 'Specialization', 'Qualification', 'Experience', 'Hospital', 'Status'],
      ...doctors.map(d => [
        d._id,
        d.name,
        d.contact || '',
        d.email || '',
        d.specialization || '',
        d.qualification || '',
        d.experience || '',
        d.hospitalAffiliation || '',
        d.status || 'Active'
      ])
    ].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'doctors.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddNew = () => {
    setFormData({
      name: '',
      email: '',
      mobileNumber: '',
      specialization: '',
      qualification: '',
      experience: '',
      hospitalAffiliation: '',
      userId: ''
    });
    setShowAddModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.specialization || !formData.qualification || !formData.hospitalAffiliation) {
      alert('Please fill in all required fields: Name, Specialization, Qualification, and Hospital/Clinic');
      return;
    }

    if (!formData.mobileNumber) {
      alert('Mobile number is required to create a doctor account.');
      return;
    }

    try {
      const payload = { ...formData };
      
      // Convert experience to number
      if (payload.experience) {
        payload.experience = parseInt(payload.experience, 10);
      }
      
      // Remove userId if empty
      if (!payload.userId || payload.userId === '' || payload.userId === 'undefined' || payload.userId === 'null') {
        delete payload.userId;
      }

      const response = await apiClient.post('/admin/doctors', payload);
      
      console.log('Doctor created:', response.data);
      alert('Doctor created successfully!');
      setShowAddModal(false);
      fetchDoctors();
      setFormData({
        name: '',
        email: '',
        mobileNumber: '',
        specialization: '',
        qualification: '',
        experience: '',
        hospitalAffiliation: '',
        userId: ''
      });
      setError('');
    } catch (err) {
      console.error('Error creating doctor:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create doctor. Please check the console for details.';
      alert(`Error: ${errorMessage}`);
      setError(errorMessage);
    }
  };

  const handleFormCancel = () => {
    setShowAddModal(false);
    setFormData({
      name: '',
      email: '',
      mobileNumber: '',
      specialization: '',
      qualification: '',
      experience: '',
      hospitalAffiliation: '',
      userId: ''
    });
  };

  if (loading) return <div className="text-center">Loading doctors...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Doctor Management</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleExport}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Export CSV
          </button>
          {!isSectionReadOnly(user, 'doctors') && (
            <button
              onClick={handleAddNew}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Add New Doctor
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 flex space-x-4">
        <input
          type="text"
          placeholder="Search by name, specialization, or hospital..."
          value={search}
          onChange={handleSearch}
          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <select
          value={sortBy}
          onChange={(e) => handleSort(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="createdAt">Sort by Joined Date</option>
          <option value="name">Sort by Name</option>
          <option value="experience">Sort by Experience</option>
          <option value="specialization">Sort by Specialization</option>
        </select>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('name')}>
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('name')}>
                Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('specialization')}>
                Specialization {sortBy === 'specialization' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Qualification
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('experience')}>
                Experience {sortBy === 'experience' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hospital/Clinic
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {doctors.length === 0 ? (
              <tr>
                <td colSpan="11" className="px-6 py-4 text-center text-gray-500">No doctors found.</td>
              </tr>
            ) : (
              doctors.map((doctor) => (
                <tr key={doctor._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(doctor.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{doctor._id.slice(-6)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{doctor.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doctor.contact || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doctor.email || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doctor.specialization || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doctor.qualification || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doctor.experience ? `${doctor.experience} years` : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doctor.hospitalAffiliation}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleView(doctor)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handleEdit(doctor)}
                        className="text-yellow-600 hover:text-yellow-900"
                        style={{ display: isSectionReadOnly(user, 'doctors') ? 'none' : 'inline-block' }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(doctor.doctorId || doctor._id)}
                        className="text-red-600 hover:text-red-900"
                        style={{ display: isSectionReadOnly(user, 'doctors') ? 'none' : 'inline-block' }}
                      >
                        🗑️
                      </button>
                      {isSectionReadOnly(user, 'doctors') && (
                        <span className="text-gray-400 text-xs">Read-only</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <div>
          Showing page {page} of {totalPages}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Add Doctor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Add New Doctor</h3>
            <p className="text-xs text-gray-600 mb-4">Fields marked with <span className="text-red-500">*</span> are required</p>
            
            <form onSubmit={handleFormSubmit}>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter doctor name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="Enter mobile number"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialization <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Orthopedic, General Physician"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Qualification <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., MBBS, MD, MS"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Experience (Years)
                </label>
                <input
                  type="number"
                  placeholder="Enter years of experience"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  min="0"
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hospital/Clinic <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter hospital or clinic name"
                  value={formData.hospitalAffiliation}
                  onChange={(e) => setFormData({ ...formData, hospitalAffiliation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded w-full sm:w-auto hover:bg-blue-600"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleFormCancel}
                  className="bg-gray-500 text-white px-4 py-2 rounded w-full sm:w-auto hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Doctor Modal */}
      {showEditModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Edit Doctor</h3>
            <p className="text-xs text-gray-600 mb-4">Fields marked with <span className="text-red-500">*</span> are required</p>
            
            <form onSubmit={handleEditSubmit}>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter doctor name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  placeholder="Enter mobile number"
                  value={editFormData.mobileNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, mobileNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialization <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Orthopedic, General Physician"
                  value={editFormData.specialization}
                  onChange={(e) => setEditFormData({ ...editFormData, specialization: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Qualification <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., MBBS, MD, MS"
                  value={editFormData.qualification}
                  onChange={(e) => setEditFormData({ ...editFormData, qualification: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Experience (Years)
                </label>
                <input
                  type="number"
                  placeholder="Enter years of experience"
                  value={editFormData.experience}
                  onChange={(e) => setEditFormData({ ...editFormData, experience: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  min="0"
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hospital/Clinic <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter hospital or clinic name"
                  value={editFormData.hospitalAffiliation}
                  onChange={(e) => setEditFormData({ ...editFormData, hospitalAffiliation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="mb-3 text-xs text-gray-500">
                <p><strong>Joined:</strong> {selectedDoctor.createdAt ? new Date(selectedDoctor.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded w-full sm:w-auto hover:bg-blue-600"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={handleEditCancel}
                  className="bg-gray-500 text-white px-4 py-2 rounded w-full sm:w-auto hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorTable;
