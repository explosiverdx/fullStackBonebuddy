import React, { useState, useEffect } from 'react';

const PatientRecord = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ age: '', condition: '', doctor: '', progress: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // add or edit
  const [formData, setFormData] = useState({
    name: '',
    diagnosedWith: '',
    address: '',
    age: '',
    bloodGroup: '',
    gender: '',
    contactNumber: '',
    emergencyContactNumber: '',
    userId: ''
  });
  const [stats, setStats] = useState({ total: 0, incomplete: 0, active: 0, inactive: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // complete, incomplete, all
  const [availableUsers, setAvailableUsers] = useState([]);

  useEffect(() => {
    fetchPatients();
  }, [search, filters, statusFilter, page]);

  useEffect(() => {
    fetchStats();
    fetchAvailableUsers();
  }, []);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response = await fetch('/api/v1/admin/patients/stats', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.data || { total: 0, incomplete: 0, active: 0, inactive: 0 });
      } else {
        // Fallback: compute from patients if stats endpoint fails
        console.warn('Stats endpoint failed, using fallback');
        setStats({
          total: patients.length,
          incomplete: patients.filter(p => !p.isProfileComplete).length,
          active: patients.filter(p => p.lastLogin && new Date(p.lastLogin) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
          inactive: patients.length - patients.filter(p => p.lastLogin && new Date(p.lastLogin) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Fallback computation as above
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('/api/v1/admin/users-without-patients', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data.data);
      } else {
        console.error('Failed to fetch available users');
      }
    } catch (err) {
      console.error('Error fetching available users:', err);
    }
  };

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        search,
        ...filters,
        status: statusFilter === 'all' ? '' : statusFilter,
        page,
        limit
      });
      const response = await fetch(`/api/v1/admin/patients?${query}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setPatients(data.data.patients);
        setTotal(data.data.total);
      } else {
        setError('Failed to fetch patients');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  const handleAdd = () => {
    setModalMode('add');
    setFormData({
      name: '',
      diagnosedWith: '',
      address: '',
      age: '',
      bloodGroup: '',
      gender: '',
      contactNumber: '',
      emergencyContactNumber: '',
      userId: ''
    });
    setShowModal(true);
  };

  const handleEdit = (patient) => {
    setModalMode('edit');
    setFormData({
      name: patient.name,
      diagnosedWith: patient.diagnosedWith,
      address: patient.address,
      age: patient.age,
      bloodGroup: patient.bloodGroup,
      gender: patient.gender,
      contactNumber: patient.contactNumber,
      emergencyContactNumber: patient.emergencyContactNumber,
      userId: patient.userId._id
    });
    setSelectedPatient(patient);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this patient?')) return;
    try {
      const response = await fetch(`/api/v1/admin/patients/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        fetchPatients();
      } else {
        setError('Failed to delete patient');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewDetails = async (id) => {
    try {
      const response = await fetch(`/api/v1/admin/patients/${id}/details`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedPatient(data.data);
      } else {
        setError('Failed to fetch patient details');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = modalMode === 'add' ? '/api/v1/admin/patients' : `/api/v1/admin/patients/${selectedPatient._id}`;
      const method = modalMode === 'add' ? 'POST' : 'PATCH';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setShowModal(false);
        fetchPatients();
      } else {
        setError('Failed to save patient');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExportPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const response = await fetch('/api/v1/admin/patients/export', {
        credentials: 'include'
      });
      const data = await response.json();
      const doc = new jsPDF();
      doc.text('Patient Records', 10, 10);
      data.data.forEach((patient, index) => {
        doc.text(`${index + 1}. ${patient.name} - ${patient.diagnosedWith}`, 10, 20 + index * 10);
      });
      doc.save('patients.pdf');
    } catch {
      setError('Failed to export PDF');
    }
  };

  const handleExportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const response = await fetch('/api/v1/admin/patients/export', {
        credentials: 'include'
      });
      const data = await response.json();
      const ws = XLSX.utils.json_to_sheet(data.data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Patients');
      XLSX.writeFile(wb, 'patients.xlsx');
    } catch {
      setError('Failed to export Excel');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Patient Records</h2>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4" 
             dangerouslySetInnerHTML={{ __html: error }} />
      )}

      {/* Quick Insights Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Patients</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Incomplete Profiles</h3>
          <p className="text-2xl font-bold text-orange-600">{stats.incomplete}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Active Patients</h3>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Inactive Patients</h3>
          <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
        </div>
      </div>

      {statsLoading && <p className="text-center mb-4">Loading stats...</p>}

      {/* Search and Filters */}
      <div className="mb-4 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search by name"
          value={search}
          onChange={handleSearch}
          className="px-3 py-2 border border-gray-300 rounded-md"
        />
        <input
          type="number"
          name="age"
          placeholder="Filter by age"
          value={filters.age}
          onChange={handleFilterChange}
          className="px-3 py-2 border border-gray-300 rounded-md"
        />
        <input
          type="text"
          name="condition"
          placeholder="Filter by condition"
          value={filters.condition}
          onChange={handleFilterChange}
          className="px-3 py-2 border border-gray-300 rounded-md"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="all">All Profiles</option>
          <option value="complete">Complete Profiles</option>
          <option value="incomplete">Incomplete Profiles</option>
        </select>
      </div>

      {/* Actions */}
      <div className="mb-4 flex gap-4">
        <button onClick={handleAdd} className="bg-blue-500 text-white px-4 py-2 rounded">Add Patient</button>
        <button onClick={handleExportPDF} className="bg-green-500 text-white px-4 py-2 rounded">Export PDF</button>
        <button onClick={handleExportExcel} className="bg-green-500 text-white px-4 py-2 rounded">Export Excel</button>
      </div>

      {/* Patient List */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full table-auto border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 px-4 py-2">Name</th>
              <th className="border border-gray-300 px-4 py-2">Age</th>
              <th className="border border-gray-300 px-4 py-2">Condition</th>
              <th className="border border-gray-300 px-4 py-2">Contact</th>
              <th className="border border-gray-300 px-4 py-2">Last Login</th>
              <th className="border border-gray-300 px-4 py-2">Status</th>
              <th className="border border-gray-300 px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient._id} className={!patient.isProfileComplete ? 'bg-yellow-50' : ''}>
                <td className="border border-gray-300 px-4 py-2">{patient.name}</td>
                <td className="border border-gray-300 px-4 py-2">{patient.age || 'N/A'}</td>
                <td className="border border-gray-300 px-4 py-2">{patient.diagnosedWith || 'N/A'}</td>
                <td className="border border-gray-300 px-4 py-2">{patient.contactNumber || 'N/A'}</td>
                <td className="border border-gray-300 px-4 py-2">{patient.lastLogin ? new Date(patient.lastLogin).toLocaleDateString() : 'Never'}</td>
                <td className="border border-gray-300 px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs ${patient.isProfileComplete ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                    {patient.isProfileComplete ? 'Complete' : 'Incomplete'}
                  </span>
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  <button onClick={() => handleViewDetails(patient._id)} className="text-blue-500 mr-2">View</button>
                  <button onClick={() => handleEdit(patient)} className="text-yellow-500 mr-2">Edit</button>
                  <button onClick={() => handleDelete(patient._id)} className="text-red-500">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      <div className="mt-4 flex justify-between">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="bg-gray-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>Page {page} of {Math.ceil(total / limit)}</span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page >= Math.ceil(total / limit)}
          className="bg-gray-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Details Modal */}
      {selectedPatient && !showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-4xl w-full max-h-96 overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Patient Details</h3>
            <p><strong>Name:</strong> {selectedPatient.patient.name}</p>
            <p><strong>Age:</strong> {selectedPatient.patient.age}</p>
            <p><strong>Condition:</strong> {selectedPatient.patient.diagnosedWith}</p>
            <p><strong>Last Login:</strong> {selectedPatient.patient.lastLogin ? new Date(selectedPatient.patient.lastLogin).toLocaleDateString() : 'Never'}</p>
            <p><strong>Profile Status:</strong> {selectedPatient.patient.isProfileComplete ? 'Complete' : 'Incomplete'}</p>
            <p><strong>Recovery %:</strong> {selectedPatient.recoveryPercent}%</p>
            <div className="mt-4">
              <h4 className="font-bold">Medical History</h4>
              {selectedPatient.medicalHistory.map((record, idx) => (
                <div key={idx} className="border p-2 mb-2">
                  <p><strong>Diagnosis:</strong> {record.diagnosis}</p>
                  <p><strong>Treatment:</strong> {record.treatment}</p>
                  <p><strong>Surgery:</strong> {record.surgeryDetails}</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <h4 className="font-bold">Progress Reports</h4>
              {selectedPatient.progressReports.map((report, idx) => (
                <div key={idx} className="border p-2 mb-2">
                  <p>{report.content}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setSelectedPatient(null)} className="mt-4 bg-red-500 text-white px-4 py-2 rounded">Close</button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <form onSubmit={handleFormSubmit} className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">{modalMode === 'add' ? 'Add Patient' : 'Edit Patient'}</h3>
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full mb-2 px-3 py-2 border border-gray-300 rounded"
            />
            <input
              type="text"
              placeholder="Diagnosed With"
              value={formData.diagnosedWith}
              onChange={(e) => setFormData({ ...formData, diagnosedWith: e.target.value })}
              required
              className="w-full mb-2 px-3 py-2 border border-gray-300 rounded"
            />
            <input
              type="text"
              placeholder="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              className="w-full mb-2 px-3 py-2 border border-gray-300 rounded"
            />
            <input
              type="number"
              placeholder="Age"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              required
              className="w-full mb-2 px-3 py-2 border border-gray-300 rounded"
            />
            <input
              type="text"
              placeholder="Blood Group"
              value={formData.bloodGroup}
              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
              className="w-full mb-2 px-3 py-2 border border-gray-300 rounded"
            />
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              required
              className="w-full mb-2 px-3 py-2 border border-gray-300 rounded"
            >
              <option value="">Select Gender</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="others">Others</option>
            </select>
            <input
              type="tel"
              placeholder="Contact Number"
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              required
              className="w-full mb-2 px-3 py-2 border border-gray-300 rounded"
            />
            <input
              type="tel"
              placeholder="Emergency Contact"
              value={formData.emergencyContactNumber}
              onChange={(e) => setFormData({ ...formData, emergencyContactNumber: e.target.value })}
              required
              className="w-full mb-2 px-3 py-2 border border-gray-300 rounded"
            />
            {modalMode === 'add' && (
              <select
                value={formData.userId}
                onChange={(e) => {
                  const selectedUser = availableUsers.find(user => user._id === e.target.value);
                  setFormData({
                    ...formData,
                    userId: e.target.value,
                    name: selectedUser ? selectedUser.Fullname : '',
                    contactNumber: selectedUser ? selectedUser.mobile_number : ''
                  });
                }}
                required
                className="w-full mb-2 px-3 py-2 border border-gray-300 rounded"
              >
                <option value="">Select User</option>
                {availableUsers.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.Fullname} ({user.mobile_number})
                  </option>
                ))}
              </select>
            )}
            {modalMode === 'edit' && (
              <input
                type="text"
                placeholder="User ID"
                value={formData.userId}
                readOnly
                className="w-full mb-2 px-3 py-2 border border-gray-300 rounded bg-gray-100"
              />
            )}
            <div className="flex gap-4 mt-4">
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Save</button>
              <button type="button" onClick={() => setShowModal(false)} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PatientRecord;
