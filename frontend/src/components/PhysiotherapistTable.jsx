import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Helper function to check if a section is read-only for the current admin
const isSectionReadOnly = (user, sectionKey) => {
  if (!user || !user.adminPermissions) {
    console.log('isSectionReadOnly: No user or adminPermissions', { user: !!user, hasAdminPermissions: !!user?.adminPermissions });
    return false;
  }
  const isRohitKumar = user.Fullname === 'Rohit kumar' || user.Fullname === 'Rohit Kumar';
  if (isRohitKumar) return false; // Rohit Kumar has full access
  
  const sectionPerm = user.adminPermissions.sectionPermissions?.[sectionKey];
  const isReadOnly = sectionPerm?.readOnly === true;
  console.log('isSectionReadOnly check:', { sectionKey, sectionPerm, isReadOnly, adminPermissions: user.adminPermissions });
  return isReadOnly;
};

const PhysiotherapistTable = ({ user: userProp }) => {
  const { user: userFromAuth } = useAuth();
  const user = userProp || userFromAuth;
  const [physios, setPhysios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const authHeaders = { Authorization: `Bearer ${localStorage.getItem('accessToken')}` };
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPhysio, setSelectedPhysio] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newPhysio, setNewPhysio] = useState({
    fullName: '',
    mobile_number: '',
    email: '',
    gender: '',
    dateOfBirth: '',
    age: '',
    address: { city: '', state: '', pincode: '' },
    specialization: '',
    experience: '',
    qualification: '',
    availableDays: '',
    availableTimeSlots: '',
    consultationFee: '',
    bio: ''
  });
  const [editPhysio, setEditPhysio] = useState({
    fullName: '',
    mobile_number: '',
    email: '',
    gender: '',
    dateOfBirth: '',
    age: '',
    address: { city: '', state: '', pincode: '' },
    specialization: '',
    experience: '',
    qualification: '',
    availableDays: '',
    availableTimeSlots: '',
    consultationFee: '',
    bio: ''
  });

  const { physioId } = useParams();

  useEffect(() => {
    fetchPhysios();
  }, [search, sortBy, sortOrder, page, statusFilter, dateFilter]);

  useEffect(() => {
    if (physioId) {
      const physioFromList = physios.find(p => p._id === physioId);
      if (physioFromList) {
        handleEdit(physioFromList); // This opens the modal with details
      } else {
        // If not in the current list, you might need a dedicated fetch endpoint
        console.log(`Physio with ID ${physioId} not found in the current list.`);
      }
    }
  }, [physioId, physios]);

  const fetchPhysios = async () => {
    try {
      const params = new URLSearchParams({
        page,
        limit,
        search,
        sortBy,
        sortOrder
      });
      if (statusFilter) params.append('status', statusFilter);
      if (dateFilter) params.append('joinedOn', dateFilter);
      const response = await fetch(`/api/v1/physios/getAllPhysios?${params}`, {
        headers: authHeaders
      });
      if (response.ok) {
        const data = await response.json();
        setPhysios(data.data.docs || []);
        setTotalPages(data.data.totalPages || 1);
      } else {
        setError('Failed to fetch physiotherapists');
      }
    } catch (err) {
      setError(`Error fetching physiotherapists: ${err.message}`);
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

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleDateFilter = (e) => {
    setDateFilter(e.target.value);
    setPage(1);
  };

  const handleView = (physio) => {
    alert(`View details for ${physio.name}`);
  };



  const handleDelete = async (physioId) => {
    if (window.confirm('Are you sure you want to delete this physiotherapist?')) {
      try {
        const response = await fetch(`/api/v1/physios/${physioId}`, {
          method: 'DELETE',
          headers: authHeaders
        });
        if (response.ok) {
          fetchPhysios();
        } else {
          setError('Failed to delete physiotherapist');
        }
      } catch (err) {
        setError(`Error deleting physiotherapist: ${err.message}`);
      }
    }
  };

  const handleExport = () => {
    const csv = [
      ['ID', 'Name', 'Contact', 'Email', 'Specialization', 'Qualification', 'Experience', 'Assigned Doctor', 'Patients Assigned', 'Availability', 'Consultation Fee', 'Joined On', 'Status'],
      ...physios.map(p => [
        p._id.slice(-6),
        p.name,
        p.contact || '',
        p.email || '',
        p.specialization || '',
        p.qualification || '',
        p.experience || '',
        p.assignedDoctor || '',
        p.patientsAssigned || 0,
        p.availableDays && p.availableTimeSlots ? `${p.availableDays.join(', ')} ${p.availableTimeSlots}` : '',
        p.consultationFee ? `₹${p.consultationFee}` : '',
        p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '',
        'Active'
      ])
    ].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'physiotherapists.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddNew = () => {
    setNewPhysio({
      fullName: '',
      mobile_number: '',
      email: '',
      gender: '',
      dateOfBirth: '',
      age: '',
      address: { city: '', state: '', pincode: '' },
      specialization: '',
      experience: '',
      qualification: '',
      availableDays: [],
      availableTimeSlots: '',
      consultationFee: '',
      bio: ''
    });
    setShowAddModal(true);
  };

  const handleEdit = async (physio) => {
    setSelectedPhysio(physio);
    
    // Fetch full physio details including user data
    try {
      const response = await fetch(`/api/v1/admin/physiotherapists/${physio._id || physio.userId}`, {
        headers: authHeaders
      });
      
      let physioData = physio;
      if (response.ok) {
        const data = await response.json();
        physioData = data.data || physio;
      }
      
      // Parse address if it's a string
      let addressObj = { city: '', state: '', pincode: '' };
      if (physioData.address) {
        if (typeof physioData.address === 'string') {
          const parts = physioData.address.split(',').map(p => p.trim());
          addressObj.city = parts[0] || '';
          addressObj.state = parts[1] || '';
          addressObj.pincode = parts[2] || '';
        } else if (typeof physioData.address === 'object') {
          addressObj = physioData.address;
        }
      }
      
      // Format dateOfBirth for date input
      let dateOfBirth = '';
      if (physioData.dateOfBirth) {
        const dob = new Date(physioData.dateOfBirth);
        dateOfBirth = dob.toISOString().split('T')[0];
      }
      
      setEditPhysio({
        fullName: physioData.name || physioData.Fullname || '',
        mobile_number: physioData.mobile_number || physioData.contact || '',
        email: physioData.email || '',
        gender: physioData.gender || '',
        dateOfBirth: dateOfBirth,
        age: physioData.age ? String(physioData.age) : '',
        address: addressObj,
        specialization: physioData.specialization || '',
        experience: physioData.experience ? String(physioData.experience) : '',
        qualification: physioData.qualification || '',
        availableDays: physioData.availableDays ? (Array.isArray(physioData.availableDays) ? physioData.availableDays.join(', ') : physioData.availableDays) : '',
        availableTimeSlots: physioData.availableTimeSlots || '',
        consultationFee: physioData.consultationFee ? String(physioData.consultationFee) : '',
        bio: physioData.bio || ''
      });
    } catch (err) {
      console.error('Error fetching physio details:', err);
      // Fallback to basic data
      setEditPhysio({
        fullName: physio.name || '',
        mobile_number: physio.mobile_number || physio.contact || '',
        email: physio.email || '',
        gender: '',
        dateOfBirth: '',
        age: '',
        address: { city: '', state: '', pincode: '' },
        specialization: physio.specialization || '',
        experience: physio.experience ? String(physio.experience) : '',
        qualification: physio.qualification || '',
        availableDays: physio.availableDays ? (Array.isArray(physio.availableDays) ? physio.availableDays.join(', ') : physio.availableDays) : '',
        availableTimeSlots: physio.availableTimeSlots || '',
        consultationFee: physio.consultationFee ? String(physio.consultationFee) : '',
        bio: physio.bio || ''
      });
    }
    
    setIsEditMode(false);
    setShowEditModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert age to number
      const ageNum = newPhysio.age ? parseInt(newPhysio.age, 10) : null;
      if (!ageNum || isNaN(ageNum)) {
        alert('Please enter a valid date of birth to calculate age.');
        return;
      }

      const payload = {
        ...newPhysio,
        age: ageNum,
        availableDays: newPhysio.availableDays ? newPhysio.availableDays.split(',').map(d => d.trim()) : [],
        experience: newPhysio.experience ? parseInt(newPhysio.experience, 10) : 0,
        consultationFee: newPhysio.consultationFee ? parseInt(newPhysio.consultationFee, 10) : undefined
      };
      const response = await fetch('/api/v1/physios/admin/create', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const contentType = response.headers.get('content-type');
      if (response.ok) {
        let responseData;
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        }
        alert('Physiotherapist added successfully!');
        setShowAddModal(false);
        // Reset form
        setNewPhysio({
          fullName: '',
          mobile_number: '',
          email: '',
          gender: '',
          dateOfBirth: '',
          age: '',
          address: { city: '', state: '', pincode: '' },
          specialization: '',
          experience: '',
          qualification: '',
          availableDays: '',
          availableTimeSlots: '',
          consultationFee: '',
          bio: ''
        });
        fetchPhysios();
        setError('');
      } else {
        let errorMessage = 'Failed to add physiotherapist';
        try {
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = `Server error (${response.status}): ${text.substring(0, 100)}`;
          }
        } catch (parseError) {
          errorMessage = `Server error (${response.status}). Please check your connection and try again.`;
        }
        alert(`Error: ${errorMessage}`);
        setError(errorMessage);
      }
    } catch (err) {
      const errorMessage = `Error adding physiotherapist: ${err.message}`;
      alert(`Error: ${errorMessage}`);
      setError(errorMessage);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert age to number
      const ageNum = editPhysio.age ? parseInt(editPhysio.age, 10) : null;
      
      const payload = {
        fullName: editPhysio.fullName,
        mobile_number: editPhysio.mobile_number,
        email: editPhysio.email || undefined,
        gender: editPhysio.gender || undefined,
        dateOfBirth: editPhysio.dateOfBirth || undefined,
        age: ageNum || undefined,
        address: editPhysio.address,
        specialization: editPhysio.specialization,
        experience: editPhysio.experience ? parseInt(editPhysio.experience, 10) : 0,
        qualification: editPhysio.qualification,
        availableDays: editPhysio.availableDays ? editPhysio.availableDays.split(',').map(d => d.trim()) : [],
        availableTimeSlots: editPhysio.availableTimeSlots || undefined,
        consultationFee: editPhysio.consultationFee ? parseInt(editPhysio.consultationFee, 10) : undefined,
        bio: editPhysio.bio || undefined
      };
      
      const physioId = selectedPhysio._id || selectedPhysio.userId;
      const response = await fetch(`/api/v1/physios/admin/${physioId}`, {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const contentType = response.headers.get('content-type');
      if (response.ok) {
        alert('Physiotherapist updated successfully!');
        setShowEditModal(false);
        setSelectedPhysio(null);
        fetchPhysios();
        setError('');
      } else {
        let errorMessage = 'Failed to update physiotherapist';
        try {
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = `Server error (${response.status}): ${text.substring(0, 100)}`;
          }
        } catch (parseError) {
          errorMessage = `Server error (${response.status}). Please check your connection and try again.`;
        }
        alert(`Error: ${errorMessage}`);
        setError(errorMessage);
      }
    } catch (err) {
      const errorMessage = `Error updating physiotherapist: ${err.message}`;
      alert(`Error: ${errorMessage}`);
      setError(errorMessage);
    }
  };

  // Calculate age from date of birth
  const calculateAgeFromDob = (dateOfBirth) => {
    if (!dateOfBirth) return '';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? age : '';
  };

  // Auto-calculate age when dateOfBirth changes
  useEffect(() => {
    if (newPhysio.dateOfBirth) {
      const calculatedAge = calculateAgeFromDob(newPhysio.dateOfBirth);
      if (calculatedAge !== newPhysio.age) {
        setNewPhysio(prev => ({ ...prev, age: calculatedAge }));
      }
    }
  }, [newPhysio.dateOfBirth]);

  const handleNewPhysioChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if ((name === 'age' || name === 'experience') && parseInt(value, 10) > 100) {
      processedValue = '100';
    }

    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setNewPhysio(prev => ({
        ...prev,
        address: { ...prev.address, [field]: processedValue }
      }));
    } else {
      setNewPhysio(prev => {
        const updated = { ...prev, [name]: processedValue };
        // Auto-calculate age if dateOfBirth is being changed
        if (name === 'dateOfBirth' && processedValue) {
          updated.age = calculateAgeFromDob(processedValue);
        }
        return updated;
      });
    }
  };

  // Calculate age from date of birth for edit form
  const calculateAgeFromDobEdit = (dateOfBirth) => {
    if (!dateOfBirth) return '';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? age : '';
  };

  // Auto-calculate age when dateOfBirth changes in edit form
  useEffect(() => {
    if (editPhysio.dateOfBirth) {
      const calculatedAge = calculateAgeFromDobEdit(editPhysio.dateOfBirth);
      if (calculatedAge !== editPhysio.age) {
        setEditPhysio(prev => ({ ...prev, age: calculatedAge }));
      }
    }
  }, [editPhysio.dateOfBirth]);

  const handleEditPhysioChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if ((name === 'age' || name === 'experience') && parseInt(value, 10) > 100) {
      processedValue = '100';
    }

    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setEditPhysio(prev => ({
        ...prev,
        address: { ...prev.address, [field]: processedValue }
      }));
    } else {
      setEditPhysio(prev => {
        const updated = { ...prev, [name]: processedValue };
        // Auto-calculate age if dateOfBirth is being changed
        if (name === 'dateOfBirth' && processedValue) {
          updated.age = calculateAgeFromDobEdit(processedValue);
        }
        return updated;
      });
    }
  };

  if (loading) return <div className="text-center">Loading physiotherapists...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Physiotherapist Management</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleExport}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Export CSV
          </button>
          {!isSectionReadOnly(user, 'physiotherapists') && (
            <button
              onClick={handleAddNew}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Add New Physiotherapist
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap space-x-4">
        <input
          type="text"
          placeholder="Search by name or specialization..."
          value={search}
          onChange={handleSearch}
          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-64"
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
        <select
          value={statusFilter}
          onChange={handleStatusFilter}
          className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={handleDateFilter}
          className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Filter by Joined Date"
        />
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                Assigned Doctor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patients Assigned
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Availability
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Consultation Fee
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
            {physios.length === 0 ? (
              <tr>
                <td colSpan="15" className="px-6 py-4 text-center text-gray-500">No physiotherapists found.</td>
              </tr>
            ) : (
              physios.map((physio) => (
                <tr key={physio._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(physio.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{physio._id.slice(-6)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{physio.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{physio.contact || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{physio.email || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{physio.specialization}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{physio.qualification}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{physio.experience} years</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{physio.assignedDoctor}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{physio.patientsAssigned}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {physio.availableDays && physio.availableTimeSlots ? (
                      <span>{physio.availableDays.join(', ')} {physio.availableTimeSlots}</span>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {physio.consultationFee ? `₹${physio.consultationFee}` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      🟢 Active
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleView(physio)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        👁️
                      </button>
                      {!isSectionReadOnly(user, 'physiotherapists') && (
                        <>
                          <button
                            onClick={() => handleEdit(physio)}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(physio._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                      {isSectionReadOnly(user, 'physiotherapists') && (
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Add New Physiotherapist</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  value={newPhysio.fullName}
                  onChange={handleNewPhysioChange}
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={newPhysio.email}
                  onChange={handleNewPhysioChange}
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
                <input
                  type="text"
                  name="mobile_number"
                  placeholder="Mobile Number"
                  value={newPhysio.mobile_number}
                  onChange={handleNewPhysioChange}
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
                <select
                  name="gender"
                  value={newPhysio.gender}
                  onChange={handleNewPhysioChange}
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={newPhysio.dateOfBirth}
                  onChange={handleNewPhysioChange}
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
                <input
                  type="number"
                  name="age"
                  placeholder="Age (auto-calculated)"
                  value={newPhysio.age}
                  readOnly
                  className="px-3 py-2 border border-gray-300 rounded bg-gray-100 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                  title="Age is automatically calculated from Date of Birth"
                />
                <input
                  type="text"
                  name="address.city"
                  placeholder="City"
                  value={newPhysio.address.city}
                  onChange={handleNewPhysioChange}
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
                <input
                  type="text"
                  name="address.state"
                  placeholder="State"
                  value={newPhysio.address.state}
                  onChange={handleNewPhysioChange}
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
                <input
                  type="text"
                  name="address.pincode"
                  placeholder="Pincode"
                  value={newPhysio.address.pincode}
                  onChange={handleNewPhysioChange}
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
                <input
                  type="text"
                  name="specialization"
                  placeholder="Specialization"
                  value={newPhysio.specialization}
                  onChange={handleNewPhysioChange}
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
                <input
                  type="text"
                  name="qualification"
                  placeholder="Qualification"
                  value={newPhysio.qualification}
                  onChange={handleNewPhysioChange}
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
                <input
                  type="number"
                  name="experience"
                  placeholder="Experience (years)"
                  value={newPhysio.experience}
                  max="100"
                  onChange={handleNewPhysioChange}
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
                <input
                  type="text"
                  name="availableDays"
                  placeholder="Available Days (comma separated)"
                  value={newPhysio.availableDays}
                  onChange={handleNewPhysioChange}
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <input
                  type="text"
                  name="availableTimeSlots"
                  placeholder="Available Time Slots"
                  value={newPhysio.availableTimeSlots}
                  onChange={handleNewPhysioChange}
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <input
                  type="number"
                  name="consultationFee"
                  placeholder="Consultation Fee"
                  value={newPhysio.consultationFee}
                  onChange={handleNewPhysioChange}
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <textarea
                name="bio"
                placeholder="Bio"
                value={newPhysio.bio}
                onChange={handleNewPhysioChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                rows="3"
              ></textarea>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Add Physiotherapist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedPhysio && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Physiotherapist Details</h3>
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`px-4 py-2 rounded ${isEditMode ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'}`}
              >
                {isEditMode ? 'View Mode' : 'Edit Mode'}
              </button>
            </div>
            {isEditMode ? (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Full Name"
                    value={editPhysio.fullName}
                    onChange={handleEditPhysioChange}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={editPhysio.email}
                    onChange={handleEditPhysioChange}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <input
                    type="text"
                    name="mobile_number"
                    placeholder="Mobile Number"
                    value={editPhysio.mobile_number}
                    onChange={handleEditPhysioChange}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  <select
                    name="gender"
                    value={editPhysio.gender}
                    onChange={handleEditPhysioChange}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={editPhysio.dateOfBirth}
                    onChange={handleEditPhysioChange}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <input
                    type="number"
                    name="age"
                    placeholder="Age (auto-calculated)"
                    value={editPhysio.age}
                    readOnly
                    className="px-3 py-2 border border-gray-300 rounded bg-gray-100 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-500"
                    title="Age is automatically calculated from Date of Birth"
                  />
                  <input
                    type="text"
                    name="address.city"
                    placeholder="City"
                    value={editPhysio.address.city}
                    onChange={handleEditPhysioChange}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <input
                    type="text"
                    name="address.state"
                    placeholder="State"
                    value={editPhysio.address.state}
                    onChange={handleEditPhysioChange}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <input
                    type="text"
                    name="address.pincode"
                    placeholder="Pincode"
                    value={editPhysio.address.pincode}
                    onChange={handleEditPhysioChange}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <input
                    type="text"
                    name="specialization"
                    placeholder="Specialization"
                    value={editPhysio.specialization}
                    onChange={handleEditPhysioChange}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  <input
                    type="text"
                    name="qualification"
                    placeholder="Qualification"
                    value={editPhysio.qualification}
                    onChange={handleEditPhysioChange}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  <input
                    type="number"
                    name="experience"
                    placeholder="Experience (years)"
                    value={editPhysio.experience}
                    max="100"
                    onChange={handleEditPhysioChange}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  <input
                    type="text"
                    name="availableDays"
                    placeholder="Available Days (comma separated)"
                    value={editPhysio.availableDays}
                    onChange={handleEditPhysioChange}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <input
                    type="text"
                    name="availableTimeSlots"
                    placeholder="Available Time Slots"
                    value={editPhysio.availableTimeSlots}
                    onChange={handleEditPhysioChange}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <input
                    type="number"
                    name="consultationFee"
                    placeholder="Consultation Fee"
                    value={editPhysio.consultationFee}
                    onChange={handleEditPhysioChange}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <textarea
                  name="bio"
                  placeholder="Bio"
                  value={editPhysio.bio}
                  onChange={handleEditPhysioChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  rows="3"
                ></textarea>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Update Physiotherapist
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2">
                <p><strong>Name:</strong> {selectedPhysio.name}</p>
                <p><strong>Contact:</strong> {selectedPhysio.contact}</p>
                <p><strong>Email:</strong> {selectedPhysio.email}</p>
                <p><strong>Specialization:</strong> {selectedPhysio.specialization}</p>
                <p><strong>Qualification:</strong> {selectedPhysio.qualification}</p>
                <p><strong>Experience:</strong> {selectedPhysio.experience} years</p>
                <p><strong>Assigned Doctor:</strong> {selectedPhysio.assignedDoctor}</p>
                <p><strong>Patients Assigned:</strong> {selectedPhysio.patientsAssigned}</p>
                <p><strong>Availability:</strong> {selectedPhysio.availableDays && selectedPhysio.availableTimeSlots ? `${selectedPhysio.availableDays.join(', ')} ${selectedPhysio.availableTimeSlots}` : 'N/A'}</p>
                <p><strong>Consultation Fee:</strong> {selectedPhysio.consultationFee ? `₹${selectedPhysio.consultationFee}` : 'N/A'}</p>
                <p><strong>Joined:</strong> {new Date(selectedPhysio.createdAt).toLocaleString()}</p>
                <p><strong>Bio:</strong> {selectedPhysio.bio}</p>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="mt-4 bg-gray-500 text-white px-4 py-2 rounded"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhysiotherapistTable;
