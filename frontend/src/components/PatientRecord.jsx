
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

// Helper function to construct medical report URL
const getMedicalReportUrl = (reportPath) => {
  if (!reportPath) return null;
  // If it's already a full URL, return as is
  if (reportPath.startsWith('http://') || reportPath.startsWith('https://')) {
    return reportPath;
  }
  // If it starts with /uploads, it's a relative path from the backend
  // Since backend static files are served from root, use current origin
  return `${window.location.origin}${reportPath.startsWith('/') ? reportPath : '/' + reportPath}`;
};

const PatientRecord = () => {
  const [activeTab, setActiveTab] = useState('patients'); // 'patients' or 'incomplete'
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filters, setFilters] = useState({ age: '', condition: '', doctor: '', progress: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // add or edit
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    mobileNumber: '',
    surgeryType: '',
    surgeryDate: '',
    assignedDoctor: '',
    medicalReport: '',
    hospitalClinic: '',
    emergencyContactNumber: '',
    userId: '',
    age: '',
    address: '',
    currentCondition: '',
    assignedPhysiotherapist: '',
    medicalHistory: '',
    allergies: '',
    bloodGroup: '',
    medicalInsurance: ''
  });
  const [stats, setStats] = useState({ total: 0, incomplete: 0, active: 0, inactive: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // complete, incomplete, all
  const [availableUsers, setAvailableUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [physiotherapists, setPhysiotherapists] = useState([]);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocateFormData, setAllocateFormData] = useState({
    patientId: '',
    doctorId: '',
    physiotherapistId: '',
    surgeryType: '',
    totalSessions: ''
  });
  const [showEditSessionModal, setShowEditSessionModal] = useState(false);
  const [editSessionData, setEditSessionData] = useState({
    _id: '',
    sessionDate: '',
    totalSessions: '',
    completedSessions: '',
    notes: ''
  });

  const { patientId } = useParams();
  const navigate = useNavigate();

  const calculateAgeFromDob = (dobString) => {
    if (!dobString) return '';
    const birthDate = new Date(dobString);
    if (Number.isNaN(birthDate.getTime())) return '';

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age -= 1;
    }

    return Math.max(age, 0);
  };

  useEffect(() => {
    if (activeTab === 'patients') {
      fetchPatients();
    }
  }, [search, sortBy, sortOrder, filters, statusFilter, page, activeTab]);

  useEffect(() => {
    if (patientId && !selectedPatient) {
      handleViewDetails(patientId);
    }
  }, [patientId]);

  useEffect(() => {
    fetchStats();
    fetchAvailableUsers();
    fetchDoctors();
    fetchPhysiotherapists();
  }, []);

  useEffect(() => {
    if (!formData.dateOfBirth) return;
    const autoAge = calculateAgeFromDob(formData.dateOfBirth);
    const currentAge = Number(formData.age);
    if (autoAge !== currentAge && autoAge !== '') {
      setFormData((prev) => ({ ...prev, age: autoAge.toString() }));
    }
  }, [formData.dateOfBirth]);

  const fetchDoctors = async () => {
    try {
      const response = await apiClient.get('/admin/doctors');
      setDoctors(response.data.data.doctors || []);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      // Don't show error to user, just log it - doctors list is optional
    }
  };

  const fetchPhysiotherapists = async () => {
    try {
      const response = await apiClient.get('/admin/physiotherapists');
      setPhysiotherapists(response.data.data.physios || []);
    } catch (err) {
      console.error('Error fetching physiotherapists:', err);
      // Don't show error to user, just log it - physios list is optional
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response = await apiClient.get('/admin/patients/stats');
      setStats(response.data.data || { total: 0, incomplete: 0, active: 0, inactive: 0 });
    } catch (err) {
        // Fallback: compute from patients if stats endpoint fails
        setStats({
          total: patients.length,
          incomplete: patients.filter(p => !p.isProfileComplete).length,
          active: patients.filter(p => p.lastLogin && new Date(p.lastLogin) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
          inactive: patients.length - patients.filter(p => p.lastLogin && new Date(p.lastLogin) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length
        });
      setError('Failed to fetch stats. ' + (err.response?.data?.message || err.message));
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await apiClient.get('/admin/users-without-patients');
      setAvailableUsers(response.data.data);
    } catch (err) {
      console.error('Error fetching available users:', err);
    }
  };

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        search,
        sortBy,
        sortOrder,
        ...filters,
        status: statusFilter === 'all' ? '' : statusFilter,
        page,
        limit
      });
      const response = await apiClient.get(`/admin/patients?${query}`);
      setPatients(response.data.data.patients);
      setTotal(response.data.data.total);
      setError('');
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

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
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
      email: '',
      dateOfBirth: '',
      gender: '',
      mobileNumber: '',
      surgeryType: '',
      surgeryDate: '',
      assignedDoctor: '',
      medicalReport: '',
      hospitalClinic: '',
      emergencyContactNumber: '',
      userId: '',
      age: '',
      address: '',
      currentCondition: '',
      assignedPhysiotherapist: '',
      medicalHistory: '',
      allergies: '',
      bloodGroup: '',
      medicalInsurance: ''
    });
    setShowModal(true);
  };

  const handleEdit = (patient) => {
    setModalMode('edit');
    setFormData({
      name: patient.name,
      email: patient.email || '',
      dateOfBirth: patient.dateOfBirth || '',
      gender: patient.gender || '',
      mobileNumber: patient.mobileNumber || '',
      surgeryType: patient.surgeryType || '',
      surgeryDate: patient.surgeryDate || '',
      assignedDoctor: patient.assignedDoctor || '',
      medicalReport: patient.medicalReport || '',
      hospitalClinic: patient.hospitalClinic || '',
      emergencyContactNumber: patient.emergencyContactNumber || '',
      userId: patient.userId,
      age: patient.age || '',
      address: patient.address ? (typeof patient.address === 'object' ? `${patient.address.city || ''}, ${patient.address.state || ''}` : patient.address) : '',
      currentCondition: patient.currentCondition || '',
      assignedPhysiotherapist: patient.assignedPhysiotherapist || '',
      medicalHistory: patient.medicalHistory || '',
      allergies: patient.allergies || '',
      bloodGroup: patient.bloodGroup || '',
      medicalInsurance: patient.medicalInsurance || ''
    });
    setSelectedPatient(patient);
    setShowModal(true);
  };

  const handleDelete = async (patient) => {
    if (!confirm(`Are you sure you want to delete patient "${patient.name}"? This action cannot be undone.`)) return;

    try {
      await apiClient.delete(`/admin/patients/${patient.patientId}`);
      fetchPatients();
      fetchStats();
      alert('Patient deleted successfully.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateProfileForUser = (user) => {
    // Open the add patient modal with pre-filled user information
    setModalMode('add');
    setFormData({
      name: user.Fullname || '',
      email: user.email || '',
      dateOfBirth: '',
      gender: '',
      mobileNumber: user.mobile_number || '',
      surgeryType: '',
      surgeryDate: '',
      assignedDoctor: '',
      medicalReport: '',
      hospitalClinic: '',
      emergencyContactNumber: user.mobile_number || '',
      userId: user._id,
      age: '',
      address: '',
      currentCondition: '',
      assignedPhysiotherapist: '',
      medicalHistory: '',
      allergies: '',
      bloodGroup: '',
      medicalInsurance: ''
    });
    setShowModal(true);
  };

  const handleDeleteUser = async (user) => {
    if (!confirm(`Are you sure you want to delete the user account for "${user.Fullname || user.username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Delete the user account
      await apiClient.delete(`/admin/users/${user._id}`);
      // Refresh the lists
      fetchAvailableUsers();
      fetchPatients();
      fetchStats();
      alert('User account deleted successfully.');
      setError('');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to delete user account.';
      alert(`Error: ${errorMsg}`);
      setError(errorMsg);
    }
  };

  const handleViewDetails = async (id) => {
    try {
      const response = await apiClient.get(`/admin/patients/${id}/details`);
      setSelectedPatient(response.data.data);
      setError('');
      // Update URL without triggering a full navigation
      if (patientId !== id) {
        navigate(`/admin/patients/${id}`, { replace: false });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Debug: Log form data to see what's being submitted
    console.log('Form data being submitted:', formData);
    
    // Trim values and check for required fields
    const missingFields = [];
    
    if (!formData.name || formData.name.trim() === '') missingFields.push('Name');
    if (!formData.dateOfBirth) missingFields.push('Date of Birth');
    if (!formData.age) missingFields.push('Age');
    if (!formData.gender) missingFields.push('Gender');
    if (!formData.mobileNumber || formData.mobileNumber.trim() === '') missingFields.push('Mobile Number');
    if (!formData.surgeryType || formData.surgeryType.trim() === '') missingFields.push('Surgery Type');
    if (!formData.surgeryDate) missingFields.push('Surgery Date');
    if (!formData.currentCondition || formData.currentCondition.trim() === '') missingFields.push('Current Condition');
    if (!formData.emergencyContactNumber || formData.emergencyContactNumber.trim() === '') missingFields.push('Emergency Contact Number');
    
    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields:\n\n${missingFields.join('\n')}`);
      console.log('Missing fields:', missingFields);
      return;
    }

    try {
      const payload = { ...formData };
      
      // Convert age to number
      if (payload.age) {
        payload.age = parseInt(payload.age, 10);
      }
      
      // Remove userId if it's empty or not selected
      if (!payload.userId || payload.userId === '' || payload.userId === 'undefined' || payload.userId === 'null') {
        delete payload.userId;
      }

      let dataToSend = payload;
      let headers = {};

      // If there's a file (medicalReport is a File object), use FormData
      if (payload.medicalReport instanceof File) {
        const formDataObj = new FormData();
        Object.keys(payload).forEach(key => {
          if (key === 'medicalReport' && payload[key] instanceof File) {
            formDataObj.append(key, payload[key]);
          } else if (payload[key] !== null && payload[key] !== undefined && payload[key] !== '') {
            // Convert age to string for FormData
            const value = key === 'age' ? String(payload[key]) : payload[key];
            formDataObj.append(key, value);
          }
        });
        dataToSend = formDataObj;
        headers = { 'Content-Type': 'multipart/form-data' };
      }

      console.log('Submitting patient data:', modalMode, dataToSend);

      if (modalMode === 'add') {
        const response = await apiClient.post('/admin/patients', dataToSend, headers);
        console.log('Patient created:', response.data);
        alert('Patient added successfully!');
        // Reset form after successful add
        setFormData({
          name: '',
          email: '',
          dateOfBirth: '',
          gender: '',
          mobileNumber: '',
          surgeryType: '',
          surgeryDate: '',
          assignedDoctor: '',
          medicalReport: '',
          hospitalClinic: '',
          emergencyContactNumber: '',
          userId: '',
          age: '',
          address: '',
          currentCondition: '',
          assignedPhysiotherapist: '',
          medicalHistory: '',
          allergies: '',
          bloodGroup: '',
          medicalInsurance: ''
        });
      } else {
        const response = await apiClient.patch(`/admin/patients/${selectedPatient.patientId}`, dataToSend, headers);
        console.log('Patient updated:', response.data);
        alert('Patient updated successfully!');
      }
      
      setShowModal(false);
      setSelectedPatient(null);
      
      // Refresh all data
      await Promise.all([
        fetchPatients(),
        fetchStats(),
        fetchAvailableUsers()
      ]);
      
      setError('');
      
      // If there was a patientId in URL, clear it
      if (patientId) {
        navigate('/admin/patients', { replace: true });
      }
    } catch (err) {
      console.error('Error submitting patient form:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to save patient profile.';
      alert(`Error: ${errorMsg}`);
      setError(errorMsg);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setSelectedPatient(null);
    // Don't navigate, just close modal - stay on current page
  };

  const handleExportPDF = async () => {
    try {
      const response = await apiClient.get('/admin/patients/export');
      const patientsToExport = response.data.data;
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      doc.text('Patient Records', 10, 10);
      patientsToExport.forEach((patient, index) => {
        doc.text(`${index + 1}. ${patient.name} - ${patient.diagnosedWith}`, 10, 20 + index * 10);
      });
      doc.save('patients.pdf');
    } catch (err) {
      setError('Failed to export PDF. ' + (err.response?.data?.message || err.message));
    }
  };

  const handleExportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const response = await apiClient.get('/admin/patients/export');
      const ws = XLSX.utils.json_to_sheet(response.data.data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Patients');
      XLSX.writeFile(wb, 'patients.xlsx');
    } catch {
      setError('Failed to export Excel');
    }
  };

  const handleAllocateSession = () => {
    setAllocateFormData({
      patientId: '',
      doctorId: '',
      physiotherapistId: '',
      surgeryType: '',
      totalSessions: ''
    });
    setShowAllocateModal(true);
  };

  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    if (!allocateFormData.patientId || !allocateFormData.doctorId || !allocateFormData.physiotherapistId || !allocateFormData.surgeryType || !allocateFormData.totalSessions) {
      setError('Please fill all fields.');
      return;
    }

    try {
      await apiClient.post('/admin/sessions/allocate', allocateFormData);
      setShowAllocateModal(false);
      fetchPatients(); // Refresh patient list if sessions affect it
      alert('Session allocated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleAllocateCancel = () => {
    setShowAllocateModal(false);
  };

  const handleEditSession = (session) => {
    setEditSessionData({
      _id: session._id,
      sessionDate: session.sessionDate ? new Date(session.sessionDate).toISOString().split('T')[0] : '',
      totalSessions: session.totalSessions || '',
      completedSessions: session.completedSessions || '',
      notes: session.notes || ''
    });
    setShowEditSessionModal(true);
  };

  const handleEditSessionCancel = () => {
    setShowEditSessionModal(false);
    setEditSessionData({ _id: '', sessionDate: '', totalSessions: '', completedSessions: '', notes: '' });
  };

  const handleEditSessionSubmit = async (e) => {
    e.preventDefault();
    if (!editSessionData._id) {
      setError('Session ID is missing.');
      return;
    }
    try {
      await apiClient.patch(`/admin/sessions/${editSessionData._id}`, editSessionData);
      setShowEditSessionModal(false);
      // Refetch patient details to show updated session info
      if (selectedPatient?.patient?._id) {
        handleViewDetails(selectedPatient.patient._id);
      }
      alert('Session updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.delete(`/admin/sessions/${sessionId}`);
      alert('Session deleted successfully.');
      // Refetch patient details to show updated session list
      if (selectedPatient?.patient?._id) {
        handleViewDetails(selectedPatient.patient._id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete session.');
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

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('patients')}
            className={`${
              activeTab === 'patients'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Patient Records
            <span className={`ml-2 ${activeTab === 'patients' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'} py-0.5 px-2.5 rounded-full text-xs font-medium`}>
              {stats.total}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('incomplete')}
            className={`${
              activeTab === 'incomplete'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors relative`}
          >
            Incomplete User Accounts
            {availableUsers.length > 0 && (
              <span className={`ml-2 ${activeTab === 'incomplete' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'} py-0.5 px-2.5 rounded-full text-xs font-medium`}>
                {availableUsers.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Patient Records Tab Content */}
      {activeTab === 'patients' && (
        <>
          {/* Search and Filters */}
      <div className="mb-4 flex flex-col sm:flex-row flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search by name"
          value={search}
          onChange={handleSearch}
          className="px-3 py-2 border border-gray-300 rounded-md flex-1 min-w-0"
        />
        <input
          type="text"
          name="mobile"
          placeholder="Filter by mobile"
          value={filters.mobile}
          onChange={handleFilterChange}
          className="px-3 py-2 border border-gray-300 rounded-md flex-1 min-w-0"
        />
        <select
          value={sortBy}
          onChange={(e) => handleSort(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md flex-1 min-w-0"
        >
          <option value="createdAt">Sort by Joined Date</option>
          <option value="name">Sort by Name</option>
          <option value="age">Sort by Age</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md flex-1 min-w-0"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Actions */}
      <div className="mb-4 flex flex-col sm:flex-row gap-4 flex-wrap">
        <button onClick={handleAdd} className="bg-blue-500 text-white px-4 py-2 rounded w-full sm:w-auto">Add Patient</button>
        <button onClick={handleExportPDF} className="bg-green-500 text-white px-4 py-2 rounded w-full sm:w-auto">Export PDF</button>
        <button onClick={handleExportExcel} className="bg-green-500 text-white px-4 py-2 rounded w-full sm:w-auto">Export Excel</button>
      </div>

      {/* Patient List */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse border border-gray-300 text-sm sm:text-base">
            <thead>
              <tr>
                <th className="border border-gray-300 px-2 sm:px-4 py-2">Name</th>
                <th className="border border-gray-300 px-2 sm:px-4 py-2">Email</th>
                <th className="border border-gray-300 px-2 sm:px-4 py-2">DOB</th>
                <th className="border border-gray-300 px-2 sm:px-4 py-2">Gender</th>
                <th className="border border-gray-300 px-2 sm:px-4 py-2">Contact</th>
                <th className="border border-gray-300 px-2 sm:px-4 py-2">Surgery Type</th>
                <th className="border border-gray-300 px-2 sm:px-4 py-2">Surgery Date</th>
                <th className="border border-gray-300 px-2 sm:px-4 py-2">Doctor Name</th>
                <th className="border border-gray-300 px-2 sm:px-4 py-2">Medical Report</th>
                <th className="border border-gray-300 px-2 sm:px-4 py-2">Hospital Name</th>
                <th className="border border-gray-300 px-2 sm:px-4 py-2">Address</th>
                <th className="border border-gray-300 px-2 sm:px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient._id} className={!patient.isProfileComplete ? 'bg-yellow-50' : ''}>
                  <td className="border border-gray-300 px-2 sm:px-4 py-2 whitespace-nowrap">{patient.name}</td>
                  <td className="border border-gray-300 px-2 sm:px-4 py-2">{patient.email || patient.userId?.email || 'N/A'}</td>
                  <td className="border border-gray-300 px-2 sm:px-4 py-2">{patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}</td>
                  <td className="border border-gray-300 px-2 sm:px-4 py-2">{patient.gender}</td>
                  <td className="border border-gray-300 px-2 sm:px-4 py-2">{patient.mobileNumber}</td>
                  <td className="border border-gray-300 px-2 sm:px-4 py-2">{patient.surgeryType || 'N/A'}</td>
                  <td className="border border-gray-300 px-2 sm:px-4 py-2">{patient.surgeryDate ? new Date(patient.surgeryDate).toLocaleDateString() : 'N/A'}</td>
                  <td className="border border-gray-300 px-2 sm:px-4 py-2">{patient.assignedDoctor || 'N/A'}</td>
                  <td className="border border-gray-300 px-2 sm:px-4 py-2">
                    {patient.medicalReport ? (
                      <a 
                        href={getMedicalReportUrl(patient.medicalReport)} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-500 hover:underline"
                      >
                        View
                      </a>
                    ) : 'N/A'}
                  </td>
                  <td className="border border-gray-300 px-2 sm:px-4 py-2">{patient.hospitalClinic || 'N/A'}</td>
                  <td className="border border-gray-300 px-2 sm:px-4 py-2">
                    {patient.address ? 
                      (typeof patient.address === 'object' && patient.address !== null ? 
                        `${patient.address.city || 'N/A'}, ${patient.address.state || 'N/A'}` : 
                        patient.address
                      ) : 'N/A'
                    }
                  </td>
                  <td className="border border-gray-300 px-2 sm:px-4 py-2 whitespace-nowrap">
                    {patient.isProfileComplete ? (
                      <>
                        <button onClick={() => { if (!patient.patientId || patient.patientId === 'N/A') { setError('Patient details not available for this user'); return; } handleViewDetails(patient.patientId); }} className="text-blue-500 mr-1 sm:mr-2 text-xs sm:text-sm">View</button>
                        <button onClick={() => { if (!patient.patientId || patient.patientId === 'N/A') { setError('Patient details not available for this user'); return; } handleEdit(patient); }} className="text-yellow-500 mr-1 sm:mr-2 text-xs sm:text-sm">Edit</button>
                        <button onClick={() => { if (!patient.patientId || patient.patientId === 'N/A') { setError('Patient details not available for this user'); return; } handleDelete(patient); }} className="text-red-500 text-xs sm:text-sm">Delete</button>
                      </>
                    ) : (
                      <span className="text-gray-400 italic text-xs sm:text-sm">No actions available</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-2">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="bg-gray-500 text-white px-4 py-2 rounded disabled:opacity-50 w-full sm:w-auto"
        >
          Previous
        </button>
        <span className="text-center">Page {page} of {Math.ceil(total / limit)}</span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page >= Math.ceil(total / limit)}
          className="bg-gray-500 text-white px-4 py-2 rounded disabled:opacity-50 w-full sm:w-auto"
        >
          Next
        </button>
      </div>
        </>
      )}

      {/* Incomplete Users Tab Content */}
      {activeTab === 'incomplete' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Incomplete User Accounts
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Users who have registered but haven't completed their patient profiles
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-4 py-2 rounded-lg bg-orange-100 text-orange-800 text-sm font-medium">
                {availableUsers.length} User{availableUsers.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {availableUsers.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">All Users Have Profiles</h3>
              <p className="text-gray-600">
                Great! All registered users have completed their patient profiles.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Full Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mobile Number
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {availableUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-medium text-sm">
                              {(user.Fullname || user.username || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.Fullname || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.username || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.mobile_number || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleCreateProfileForUser(user)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-2 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Create Profile
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Details Modal */}
      {selectedPatient && !showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={(e) => {
          // Close modal if clicking outside
          if (e.target === e.currentTarget) {
            setSelectedPatient(null);
            navigate('/admin/patients', { replace: true });
          }
        }}>
          <div className="bg-white p-4 sm:p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg sm:text-xl font-bold mb-4">Patient Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <p><strong>Name:</strong> {selectedPatient.patient.name}</p>
              <p><strong>Email:</strong> {selectedPatient.patient.userId?.email || 'N/A'}</p>
              <p><strong>Date of Birth:</strong> {selectedPatient.patient.dateOfBirth ? new Date(selectedPatient.patient.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Age:</strong> {selectedPatient.patient.age}</p>
              <p><strong>Gender:</strong> {selectedPatient.patient.gender}</p>
              <p><strong>Contact:</strong> {selectedPatient.patient.mobileNumber}</p>
              <p><strong>Surgery Type:</strong> {selectedPatient.patient.surgeryType || 'N/A'}</p>
              <p><strong>Surgery Date:</strong> {selectedPatient.patient.surgeryDate ? new Date(selectedPatient.patient.surgeryDate).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Assigned Doctor:</strong> {selectedPatient.patient.assignedDoctor || 'N/A'}</p>
              <p><strong>Hospital/Clinic:</strong> {selectedPatient.patient.hospitalClinic || 'N/A'}</p>
              <p><strong>Medical Report:</strong> {selectedPatient.patient.medicalReport ? (
                <a 
                  href={getMedicalReportUrl(selectedPatient.patient.medicalReport)} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-500 hover:underline"
                >
                  View Report
                </a>
              ) : 'Not Uploaded'}</p>
              <p><strong>Last Login:</strong> {selectedPatient.patient.lastLogin ? new Date(selectedPatient.patient.lastLogin).toLocaleDateString() : 'Never'}</p>
              <p><strong>Profile Status:</strong> {selectedPatient.patient.isProfileComplete ? 'Complete' : 'Incomplete'}</p>
              <p><strong>Address:</strong> {selectedPatient.patient.address ? 
                (typeof selectedPatient.patient.address === 'object' && selectedPatient.patient.address !== null ? 
                  `${selectedPatient.patient.address.city || 'N/A'}, ${selectedPatient.patient.address.state || 'N/A'}` : 
                  selectedPatient.patient.address
                ) : 'N/A'
              }</p>
              <p><strong>Current Condition:</strong> {selectedPatient.patient.currentCondition || 'N/A'}</p>
              <p><strong>Assigned Physiotherapist:</strong> {selectedPatient.patient.assignedPhysiotherapist || 'N/A'}</p>
              <p><strong>Allergies:</strong> {selectedPatient.patient.allergies || 'N/A'}</p>
              <p><strong>Blood Group:</strong> {selectedPatient.patient.bloodGroup || 'N/A'}</p>
              <p><strong>Medical Insurance:</strong> {selectedPatient.patient.medicalInsurance || 'N/A'}</p>
            </div>
            <hr className="my-4"/>
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
            <div className="mt-4">
              <h4 className="font-bold">Sessions</h4>
              {selectedPatient.sessions.map((session, idx) => (
                <div key={idx} className="border p-2 mb-2 rounded-md relative">
                  <p><strong>Surgery Type:</strong> {session.surgeryType}</p>
                  <p><strong>Total Sessions:</strong> {session.totalSessions}</p>
                  <p><strong>Completed Sessions:</strong> {session.completedSessions}</p>
                  <p><strong>Doctor:</strong> {session.doctorId.name}</p>
                  <p><strong>Physio:</strong> {session.physioId.name}</p>
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button onClick={() => handleEditSession(session)} className="bg-yellow-500 text-white px-2 py-1 text-xs rounded hover:bg-yellow-600">
                      Edit
                    </button>
                    <button onClick={() => handleDeleteSession(session._id)} className="bg-red-500 text-white px-2 py-1 text-xs rounded hover:bg-red-600">Delete</button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => {
              setSelectedPatient(null);
              navigate('/admin/patients', { replace: true });
            }} className="mt-4 bg-red-500 text-white px-4 py-2 rounded w-full sm:w-auto">Close</button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]" onClick={(e) => {
          // Close modal if clicking outside the form
          if (e.target === e.currentTarget) {
            handleCancel();
          }
        }}>
          <form onSubmit={handleFormSubmit} className="bg-white p-4 sm:p-6 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto relative z-[70]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg sm:text-xl font-bold mb-4">{modalMode === 'add' ? 'Add Patient' : 'Edit Patient'}</h3>
            <p className="text-xs text-gray-600 mb-3">Fields marked with <span className="text-red-500">*</span> are required</p>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter patient name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none relative z-10"
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
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none relative z-10"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none relative z-10"
                required
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="Auto-calculated from DOB"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none relative z-10"
                min="0"
                max="150"
                readOnly
                required
              />
              <p className="text-xs text-gray-500 mt-1">Age is auto-calculated from the selected date of birth.</p>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none relative z-10"
                required
              >
                <option value="">-- Select Gender --</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
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
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Surgery Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.surgeryType}
                onChange={(e) => setFormData({ ...formData, surgeryType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none relative z-10"
                required
              >
                <option value="">-- Select Surgery Type --</option>
                <option value="Fracture">Fracture</option>
                <option value="Knee Replacement">Knee Replacement</option>
                <option value="Hip Replacement">Hip Replacement</option>
                <option value="Spine Surgery">Spine Surgery</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Surgery Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.surgeryDate}
                onChange={(e) => setFormData({ ...formData, surgeryDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned Doctor
              </label>
              <input
                type="text"
                placeholder="Enter doctor name"
                value={formData.assignedDoctor}
                onChange={(e) => setFormData({ ...formData, assignedDoctor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Medical Report</label>
              {modalMode === 'edit' && formData.medicalReport && typeof formData.medicalReport === 'string' && (
                <p className="text-sm text-blue-600 mb-1">
                  Current: <a 
                    href={getMedicalReportUrl(formData.medicalReport)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="underline hover:text-blue-800"
                  >
                    View Report
                  </a>
                </p>
              )}
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setFormData({ ...formData, medicalReport: e.target.files[0] })}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
              <p className="text-xs text-gray-500 mt-1">Upload medical report (optional)</p>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hospital/Clinic
              </label>
              <input
                type="text"
                placeholder="Enter hospital or clinic name"
                value={formData.hospitalClinic}
                onChange={(e) => setFormData({ ...formData, hospitalClinic: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emergency Contact Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="Enter emergency contact number"
                value={formData.emergencyContactNumber}
                onChange={(e) => setFormData({ ...formData, emergencyContactNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none relative z-10"
                required
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                placeholder="Enter full address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none relative z-10 resize-y"
                rows="3"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Condition <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Describe current condition"
                value={formData.currentCondition}
                onChange={(e) => setFormData({ ...formData, currentCondition: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none relative z-10"
                required
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned Physiotherapist
              </label>
              <input
                type="text"
                placeholder="Enter physiotherapist name (optional)"
                value={formData.assignedPhysiotherapist}
                onChange={(e) => setFormData({ ...formData, assignedPhysiotherapist: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none relative z-10"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medical History
              </label>
              <textarea
                placeholder="Describe medical history (optional)"
                value={formData.medicalHistory}
                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none relative z-10 resize-y"
                rows="3"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allergies
              </label>
              <input
                type="text"
                placeholder="List any allergies (optional)"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none relative z-10"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Blood Group
              </label>
              <input
                type="text"
                placeholder="e.g., A+, O-, AB+ (optional)"
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none relative z-10"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medical Insurance
              </label>
              <input
                type="text"
                placeholder="Insurance provider or policy number (optional)"
                value={formData.medicalInsurance}
                onChange={(e) => setFormData({ ...formData, medicalInsurance: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none relative z-10"
              />
            </div>
            {modalMode === 'add' && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link Existing User Account (optional)
                </label>
                <select
                  value={formData.userId}
                  onChange={(e) => {
                    const selectedUser = availableUsers.find(user => user._id === e.target.value);
                    setFormData({
                      ...formData,
                      userId: e.target.value,
                      name: selectedUser ? selectedUser.Fullname : formData.name,
                      email: selectedUser ? selectedUser.email : formData.email,
                      mobileNumber: selectedUser ? selectedUser.mobile_number : formData.mobileNumber
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="">-- Create new patient account --</option>
                  {availableUsers.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.Fullname || user.username} - {user.mobile_number} ({user.email || 'no email'})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Leave this as default to auto-create a patient user using the details above, or select an existing registration to link.
                </p>
              </div>
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
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded w-full sm:w-auto">Save</button>
              <button type="button" onClick={handleCancel} className="bg-gray-500 text-white px-4 py-2 rounded w-full sm:w-auto">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Allocate Session Modal */}
      {showAllocateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAllocateSubmit} className="bg-white p-4 sm:p-6 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg sm:text-xl font-bold mb-4">Allocate Session</h3>
            <select
              value={allocateFormData.patientId}
              onChange={(e) => setAllocateFormData({ ...allocateFormData, patientId: e.target.value })}
              className="w-full mb-2 px-3 py-2 border border-gray-300 rounded"
            >
              <option value="">Select Patient</option>
              {patients.map(patient => (
                <option key={patient._id} value={patient._id}>
                  {patient.name} ({patient.mobileNumber})
                </option>
              ))}
            </select>
            <select
              value={allocateFormData.doctorId}
              onChange={(e) => setAllocateFormData({ ...allocateFormData, doctorId: e.target.value })}
              className="w-full mb-2 px-3 py-2 border border-gray-300 rounded"
            >
              <option value="">Select Doctor</option>
              {doctors.map(doctor => (
                <option key={doctor._id} value={doctor._id}>
                  {doctor.name || doctor.fullName}
                </option>
              ))}
            </select>
            <select
              value={allocateFormData.physiotherapistId}
              onChange={(e) => setAllocateFormData({ ...allocateFormData, physiotherapistId: e.target.value })}
              className="w-full mb-2 px-3 py-2 border border-gray-300 rounded"
            >
              <option value="">Select Physiotherapist</option>
              {physiotherapists.map(physio => (
                <option key={physio._id} value={physio._id}>
                  {physio.name || physio.fullName}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Surgery Type (e.g., Knee Surgery)"
              value={allocateFormData.surgeryType}
              onChange={(e) => setAllocateFormData({ ...allocateFormData, surgeryType: e.target.value })}
              className="w-full mb-2 px-3 py-2 border border-gray-300 rounded"
            />
            <input
              type="number"
              placeholder="Total Sessions"
              value={allocateFormData.totalSessions}
              onChange={(e) => setAllocateFormData({ ...allocateFormData, totalSessions: e.target.value })}
              className="w-full mb-2 px-3 py-2 border border-gray-300 rounded"
              min="1"
            />
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <button type="submit" className="bg-purple-500 text-white px-4 py-2 rounded w-full sm:w-auto">Allocate Session</button>
              <button type="button" onClick={handleAllocateCancel} className="bg-gray-500 text-white px-4 py-2 rounded w-full sm:w-auto">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Session Modal */}
      {showEditSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleEditSessionSubmit} className="bg-white p-4 sm:p-6 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg sm:text-xl font-bold mb-4">Edit Session</h3>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Date</label>
              <input
                type="date"
                value={editSessionData.sessionDate}
                onChange={(e) => setEditSessionData({ ...editSessionData, sessionDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Sessions</label>
              <input
                type="number"
                placeholder="Total Sessions"
                value={editSessionData.totalSessions}
                onChange={(e) => setEditSessionData({ ...editSessionData, totalSessions: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                min="0"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Completed Sessions</label>
              <input
                type="number"
                placeholder="Completed Sessions"
                value={editSessionData.completedSessions}
                onChange={(e) => setEditSessionData({ ...editSessionData, completedSessions: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                min="0"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
              <textarea
                placeholder="Add any notes for this session"
                value={editSessionData.notes}
                onChange={(e) => setEditSessionData({ ...editSessionData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows="3"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded w-full sm:w-auto">Save Changes</button>
              <button type="button" onClick={handleEditSessionCancel} className="bg-gray-500 text-white px-4 py-2 rounded w-full sm:w-auto">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PatientRecord;
