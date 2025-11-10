import React, { useState, useEffect } from 'react';

const DoctorTable = ({ selectedItem }) => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const authHeaders = { Authorization: `Bearer ${localStorage.getItem('accessToken')}` };
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

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
      const response = await fetch(`/api/v1/doctors/getAllDoctors?${params}`, {
        headers: authHeaders
      });
      if (response.ok) {
        const data = await response.json();
        setDoctors(data.data.docs || []);
        setTotalPages(data.data.totalPages || 1);
      } else {
        setError('Failed to fetch doctors');
      }
    } catch (err) {
      setError(`Error fetching doctors: ${err.message}`);
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
    setSelectedDoctor(doctor);
    setShowEditModal(true);
  };

  const handleDelete = async (doctorId) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        const response = await fetch(`/api/v1/doctors/${doctorId}`, {
          method: 'DELETE',
          headers: authHeaders
        });
        if (response.ok) {
          fetchDoctors();
        } else {
          setError('Failed to delete doctor');
        }
      } catch (err) {
        setError(`Error deleting doctor: ${err.message}`);
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
    setShowAddModal(true);
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
          <button
            onClick={handleAddNew}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Add New Doctor
          </button>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doctor.specialization}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doctor.qualification}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doctor.experience} years</td>
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
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(doctor._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        🗑️
                      </button>
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

      {/* Add/Edit Modals - Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Add New Doctor</h3>
            <p>Form to add new doctor will be implemented here.</p>
            <button
              onClick={() => setShowAddModal(false)}
              className="mt-4 bg-gray-500 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showEditModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Doctor Details</h3>
            <div className="space-y-2">
              <p><strong>Name:</strong> {selectedDoctor.name}</p>
              <p><strong>Contact:</strong> {selectedDoctor.contact}</p>
              <p><strong>Email:</strong> {selectedDoctor.email}</p>
              <p><strong>Specialization:</strong> {selectedDoctor.specialization}</p>
              <p><strong>Qualification:</strong> {selectedDoctor.qualification}</p>
              <p><strong>Experience:</strong> {selectedDoctor.experience} years</p>
              <p><strong>Hospital:</strong> {selectedDoctor.hospitalAffiliation}</p>
              <p><strong>Joined:</strong> {new Date(selectedDoctor.createdAt).toLocaleDateString()}</p>
            </div>
            <button
              onClick={() => setShowEditModal(false)}
              className="mt-4 bg-gray-500 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorTable;
