
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../hooks/useAuth';
import { indianStates, getCitiesByState, getAddressFromPincode } from '../utils/locationHelper';

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

// Helper function to check if a section is read-only for the current admin
const isSectionReadOnly = (user, sectionKey) => {
  if (!user || !user.adminPermissions) return false;
  const isRohitKumar = user.Fullname === 'Rohit kumar' || user.Fullname === 'Rohit Kumar';
  if (isRohitKumar) return false; // Rohit Kumar has full access
  
  const sectionPerm = user.adminPermissions.sectionPermissions?.[sectionKey];
  return sectionPerm?.readOnly === true;
};

const normalizeState = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  const t = raw.trim().toLowerCase();
  return indianStates.find(s => s.toLowerCase() === t) || raw.trim();
};

const PatientRecord = ({ user: userProp }) => {
  const { user: userFromAuth } = useAuth();
  const user = userProp || userFromAuth;
  // Load active tab from localStorage or default to 'patients'
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('patientRecordActiveTab');
    return savedTab || 'patients';
  });
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
    state: '',
    city: '',
    pincode: '',
    currentCondition: '',
    assignedPhysiotherapist: '',
    medicalHistory: '',
    allergies: '',
    bloodGroup: '',
    medicalInsurance: '',
    password: '' // Optional password field for new patients
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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '', newMobileNumber: '' });
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [referralData, setReferralData] = useState(null);
  const [isFromReferral, setIsFromReferral] = useState(false);
  const [calculatedAge, setCalculatedAge] = useState({ years: 0, months: 0, days: 0, display: '' });
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [adminReports, setAdminReports] = useState([]);
  const [adminReportsLoading, setAdminReportsLoading] = useState(false);
  const [dynamicCitiesByState, setDynamicCitiesByState] = useState({});
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);

  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const calculateAgeFromDob = (dobString) => {
    if (!dobString) return { years: 0, months: 0, days: 0, display: '' };
    const birthDate = new Date(dobString);
    if (Number.isNaN(birthDate.getTime())) return { years: 0, months: 0, days: 0, display: '' };

    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    // Adjust for negative days
    if (days < 0) {
      months--;
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += lastMonth.getDate();
    }

    // Adjust for negative months
    if (months < 0) {
      years--;
      months += 12;
    }

    // Ensure non-negative values
    years = Math.max(years, 0);
    months = Math.max(months, 0);
    days = Math.max(days, 0);

    // Create display string
    const parts = [];
    if (years > 0) parts.push(`${years} ${years === 1 ? 'Year' : 'Years'}`);
    if (months > 0) parts.push(`${months} ${months === 1 ? 'Month' : 'Months'}`);
    if (days > 0) parts.push(`${days} ${days === 1 ? 'Day' : 'Days'}`);
    
    const display = parts.length > 0 ? parts.join(', ') : '0 Days';
    const totalYears = years; // For backward compatibility with age field

    return { years, months, days, display, totalYears };
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

  // Fetch medical reports when Details modal is open (admin)
  useEffect(() => {
    if (!selectedPatient || showModal || !selectedPatient.patient?._id) {
      setAdminReports([]);
      setAdminReportsLoading(false);
      return;
    }
    let cancelled = false;
    setAdminReportsLoading(true);
    apiClient.get(`/admin/patients/${selectedPatient.patient._id}/reports`)
      .then((res) => { if (!cancelled) setAdminReports(res.data?.data ?? []); })
      .catch(() => { if (!cancelled) setAdminReports([]); })
      .finally(() => { if (!cancelled) setAdminReportsLoading(false); });
    return () => { cancelled = true; };
  }, [selectedPatient, showModal]);

  useEffect(() => {
    fetchStats();
    fetchAvailableUsers();
    fetchDoctors();
    fetchPhysiotherapists();
  }, []);

  // Check for referral data in URL params
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const referralParam = searchParams.get('referral');
    if (referralParam) {
      try {
        const referral = JSON.parse(decodeURIComponent(referralParam));
        setReferralData(referral);
        setIsFromReferral(true);
        // Auto-open the add patient modal with pre-filled data
        setModalMode('add');
        // Wait for doctors to load before setting form data
        if (doctors.length > 0) {
          fillFormFromReferral(referral);
        }
      } catch (error) {
        console.error('Error parsing referral data:', error);
      }
    }
  }, [location.search, doctors]);

  // Fill form when doctors are loaded and referral data exists
  useEffect(() => {
    if (referralData && doctors.length > 0 && isFromReferral) {
      fillFormFromReferral(referralData);
      setShowModal(true);
    }
  }, [doctors, referralData, isFromReferral]);

  const fillFormFromReferral = (referral) => {
    // Normalize phone to 10 digits to avoid "Please match the requested format" when it has +91
    const norm = (v) => ((v || '').replace(/\D/g, '').slice(-10) || '');
    // Find the doctor by ID or name
    let selectedDoctorId = '';
    if (referral.doctorId) {
      const doctor = doctors.find(d => d._id === referral.doctorId || d.userId === referral.doctorId);
      if (doctor) {
        selectedDoctorId = doctor._id;
      }
    }
    // If not found by ID, try to find by name
    if (!selectedDoctorId && referral.doctorName) {
      const doctor = doctors.find(d => d.Fullname === referral.doctorName || d.name === referral.doctorName);
      if (doctor) {
        selectedDoctorId = doctor._id;
      }
    }

    // Calculate date of birth from age if age is provided but DOB is not
    let dobValue = '';
    if (referral.patientAge) {
      const today = new Date();
      const birthYear = today.getFullYear() - parseInt(referral.patientAge);
      // Use a reasonable default month and day (January 1st)
      dobValue = `${birthYear}-01-01`;
    }

    setFormData({
      name: referral.patientName || '',
      email: referral.patientEmail || '',
      dateOfBirth: dobValue,
      gender: referral.patientGender || '',
      mobileNumber: norm(referral.patientPhone) || '',
      surgeryType: referral.surgeryType || '',
      surgeryDate: referral.surgeryDate ? new Date(referral.surgeryDate).toISOString().split('T')[0] : '',
      assignedDoctor: selectedDoctorId || referral.doctorName || '',
      medicalReport: '',
      hospitalClinic: '',
      emergencyContactNumber: norm(referral.patientPhone) || '',
      userId: '',
      age: referral.patientAge ? referral.patientAge.toString() : '',
      address: '',
      currentCondition: referral.condition || '',
      assignedPhysiotherapist: '',
      medicalHistory: referral.notes || '',
      allergies: '',
      bloodGroup: '',
      medicalInsurance: '',
      password: ''
    });
  };

  // Update dateOfBirth when dropdowns change
  useEffect(() => {
    if (dobDay && dobMonth && dobYear) {
      const monthIndex = parseInt(dobMonth) - 1; // JavaScript months are 0-indexed
      const date = new Date(parseInt(dobYear), monthIndex, parseInt(dobDay));
      const formattedDate = `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`;
      setFormData((prev) => ({ ...prev, dateOfBirth: formattedDate }));
    }
  }, [dobDay, dobMonth, dobYear]);

  // Update dropdowns when dateOfBirth changes (from external source)
  useEffect(() => {
    if (formData.dateOfBirth && formData.dateOfBirth.includes('-')) {
      const [year, month, day] = formData.dateOfBirth.split('-');
      if (year && month && day && year.length === 4) {
        // Only update if values are different to avoid unnecessary re-renders
        if (dobYear !== year) setDobYear(year);
        if (dobMonth !== month) setDobMonth(month);
        if (dobDay !== day) setDobDay(day);
      }
    } else if (!formData.dateOfBirth) {
      // Reset dropdowns if dateOfBirth is cleared
      setDobDay('');
      setDobMonth('');
      setDobYear('');
    }
  }, [formData.dateOfBirth]);

  // Calculate age when dateOfBirth changes
  useEffect(() => {
    if (!formData.dateOfBirth) {
      setCalculatedAge({ years: 0, months: 0, days: 0, display: '' });
      return;
    }
    const ageData = calculateAgeFromDob(formData.dateOfBirth);
    setCalculatedAge(ageData);
    // Also update the age field with total years for backward compatibility
    if (ageData.totalYears !== Number(formData.age)) {
      setFormData((prev) => ({ ...prev, age: ageData.totalYears.toString() }));
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
      state: '',
      city: '',
      pincode: '',
      currentCondition: '',
      assignedPhysiotherapist: '',
      medicalHistory: '',
      allergies: '',
      bloodGroup: '',
      medicalInsurance: '',
      password: ''
    });
    setShowModal(true);
  };

  const handleEdit = (patient) => {
    setModalMode('edit');
    const dobValue = patient.dateOfBirth 
      ? (patient.dateOfBirth.includes('T') 
          ? patient.dateOfBirth.split('T')[0] 
          : new Date(patient.dateOfBirth).toISOString().split('T')[0])
      : '';
    
    // Normalize phone numbers to 10 digits so they match pattern [0-9]{10} (avoids "Please match the requested format" for +91 etc.)
    const norm = (v) => ((v || '').replace(/\D/g, '').slice(-10) || '');
    // Resolve assignedDoctor to doctor _id so the dropdown shows the correct selection (stored value can be ID or name)
    let assignedDoctorValue = patient.assignedDoctor || '';
    if (assignedDoctorValue && doctors.length > 0) {
      const byId = doctors.find(d => d._id && String(d._id) === String(assignedDoctorValue));
      if (byId) {
        assignedDoctorValue = byId._id;
      } else {
        const byName = doctors.find(d => (d.Fullname || d.name || '') === assignedDoctorValue);
        if (byName) assignedDoctorValue = byName._id;
      }
    }
    setFormData({
      name: patient.name,
      email: patient.email || '',
      dateOfBirth: dobValue,
      gender: patient.gender || '',
      mobileNumber: norm(patient.mobileNumber) || '',
      surgeryType: patient.surgeryType || '',
      surgeryDate: patient.surgeryDate ? (patient.surgeryDate.includes('T') ? patient.surgeryDate.split('T')[0] : new Date(patient.surgeryDate).toISOString().split('T')[0]) : '',
      assignedDoctor: assignedDoctorValue,
      medicalReport: patient.medicalReport || '',
      hospitalClinic: patient.hospitalClinic || '',
      emergencyContactNumber: norm(patient.emergencyContactNumber) || '',
      userId: patient.userId,
      age: patient.age || '',
      address: (typeof patient.address === 'object' && patient.address != null) ? (patient.address.address || patient.address.street || '') : (patient.address || ''),
      state: normalizeState(patient.state || '') || patient.state || '',
      city: patient.city || '',
      pincode: patient.pincode || patient.areaCode || '',
      currentCondition: patient.currentCondition || '',
      assignedPhysiotherapist: patient.assignedPhysiotherapist || '',
      medicalHistory: patient.medicalHistory || '',
      allergies: patient.allergies || '',
      bloodGroup: patient.bloodGroup || '',
      medicalInsurance: patient.medicalInsurance || ''
    });
    const st = normalizeState(patient.state || '') || patient.state || '';
    const ct = patient.city || '';
    if (st && ct && !(getCitiesByState()[st] || []).includes(ct)) {
      setDynamicCitiesByState(prev => {
        const arr = prev[st] || [];
        return arr.includes(ct) ? prev : { ...prev, [st]: [...arr, ct] };
      });
    }
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
    // Normalize phone to 10 digits to avoid "Please match the requested format" when it has +91
    const norm = (v) => ((v || '').replace(/\D/g, '').slice(-10) || '');
    setModalMode('add');
    setFormData({
      name: user.Fullname || '',
      email: user.email || '',
      dateOfBirth: '',
      gender: '',
      mobileNumber: norm(user.mobile_number) || '',
      surgeryType: '',
      surgeryDate: '',
      assignedDoctor: '',
      medicalReport: '',
      hospitalClinic: '',
      emergencyContactNumber: norm(user.mobile_number) || '',
      userId: user._id,
      age: '',
      address: '',
      state: '',
      city: '',
      pincode: '',
      currentCondition: '',
      assignedPhysiotherapist: '',
      medicalHistory: '',
      allergies: '',
      bloodGroup: '',
      medicalInsurance: ''
    });
    setShowModal(true);
  };

  const handleMarkAsAdded = async (user) => {
    try {
      await apiClient.patch(`/admin/users/${user._id}/mark-as-added`);
      // Refresh the incomplete users list
      fetchAvailableUsers();
      alert(`User "${user.Fullname || user.username}" has been marked as added and will no longer appear in incomplete accounts.`);
      setError('');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to mark user as added.';
      alert(`Error: ${errorMsg}`);
      setError(errorMsg);
    }
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
    if (!dobDay || !dobMonth || !dobYear) {
      missingFields.push('Date of Birth (Day, Month, and Year must be selected)');
    } else if (!formData.dateOfBirth) {
      missingFields.push('Date of Birth');
    }
    // Validate date is valid
    if (dobDay && dobMonth && dobYear) {
      const testDate = new Date(parseInt(dobYear), parseInt(dobMonth) - 1, parseInt(dobDay));
      if (testDate.getDate() !== parseInt(dobDay) || 
          testDate.getMonth() !== parseInt(dobMonth) - 1 || 
          testDate.getFullYear() !== parseInt(dobYear)) {
        alert('Invalid date selected. Please check Day, Month, and Year.');
        return;
      }
      // Check if date is in the future
      if (testDate > new Date()) {
        alert('Date of Birth cannot be in the future.');
        return;
      }
    }
    if (!formData.age) missingFields.push('Age');
    if (!formData.gender) missingFields.push('Gender');
    if (!formData.mobileNumber || formData.mobileNumber.trim() === '') missingFields.push('Mobile Number');
    if (!formData.surgeryType || formData.surgeryType.trim() === '') missingFields.push('Surgery Type');
    if (!formData.surgeryDate) missingFields.push('Surgery Date');
    
    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields:\n\n${missingFields.join('\n')}`);
      console.log('Missing fields:', missingFields);
      return;
    }

    try {
      const payload = { ...formData };
      
      // Ensure medicalInsurance is always Yes or No (Patient model enum)
      if (!payload.medicalInsurance || (payload.medicalInsurance !== 'Yes' && payload.medicalInsurance !== 'No')) {
        payload.medicalInsurance = 'No';
      }
      
      // Convert age to number
      if (payload.age) {
        payload.age = parseInt(payload.age, 10);
      }
      
      // Convert doctor ID to doctor name if needed
      if (payload.assignedDoctor) {
        const selectedDoctor = doctors.find(d => d._id === payload.assignedDoctor);
        if (selectedDoctor) {
          // Store both ID and name - backend might need the name
          payload.assignedDoctor = selectedDoctor.Fullname || selectedDoctor.name || payload.assignedDoctor;
        }
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
          } else if (['state', 'city', 'pincode', 'address'].includes(key)) {
            formDataObj.append(key, payload[key] ?? '');
          } else if (payload[key] !== null && payload[key] !== undefined && payload[key] !== '') {
            // Convert age to string for FormData
            const value = key === 'age' ? String(payload[key]) : payload[key];
            formDataObj.append(key, value);
          }
        });
        dataToSend = formDataObj;
        // Do NOT set Content-Type: let the browser set multipart/form-data; boundary=...
        // Otherwise the server's multer cannot parse the body.
        headers = {};
      }

      console.log('Submitting patient data:', modalMode, dataToSend);

      if (modalMode === 'add') {
        const response = await apiClient.post('/admin/patients', dataToSend, headers);
        console.log('Patient created:', response.data);
        
        // If patient was created from a referral, link the referral to the patient
        if (referralData && referralData.referralId) {
          try {
            const patientUserId = response.data.data?.userId || response.data.data?.patient?.userId;
            if (patientUserId) {
              await apiClient.patch(
                `/api/v1/referrals/${referralData.referralId}/link-patient`,
                { patientId: patientUserId },
                {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                  }
                }
              );
              console.log('Referral linked to patient successfully');
            }
          } catch (linkError) {
            console.error('Error linking referral to patient:', linkError);
            // Don't block the success message, just log the error
          }
        }
        
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
          state: '',
          city: '',
          pincode: '',
          currentCondition: '',
          assignedPhysiotherapist: '',
          medicalHistory: '',
          allergies: '',
          bloodGroup: '',
          medicalInsurance: '',
          password: ''
        });
        setDobDay('');
        setDobMonth('');
        setDobYear('');
        // Clear referral data and reset flag
        setReferralData(null);
        setIsFromReferral(false);
        // Remove referral param from URL
        navigate('/admin/patients', { replace: true });
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
    setDobDay('');
    setDobMonth('');
    setDobYear('');
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

  const handleChangePassword = (patient) => {
    // Get userId from patient object
    const userId = patient.userId?._id || patient.userId || patient._id;
    
    if (!userId) {
      alert('Error: User ID not found for this patient. Cannot change password.');
      return;
    }

    const patientName = patient.name || patient.userId?.Fullname || 'Patient';
    const currentMobileNumber = patient.mobileNumber || patient.userId?.mobile_number || '';

    setSelectedUserForPassword({
      userId,
      name: patientName,
      currentMobileNumber
    });
    setPasswordData({ newPassword: '', confirmPassword: '', newMobileNumber: currentMobileNumber });
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedUserForPassword || !selectedUserForPassword.userId) {
      alert('Error: User ID not found. Cannot change password.');
      return;
    }

    // Validate password if provided
    if (passwordData.newPassword) {
      if (passwordData.newPassword.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        alert('Passwords do not match');
        return;
      }
    }

    // Validate mobile number if provided
    if (passwordData.newMobileNumber) {
      const phoneDigits = passwordData.newMobileNumber.replace(/[^0-9]/g, '');
      if (phoneDigits.length !== 10) {
        alert('Mobile number must be exactly 10 digits');
        return;
      }
    }

    // Check if at least one field is being changed
    if (!passwordData.newPassword && !passwordData.newMobileNumber) {
      alert('Please provide either a new password or a new mobile number');
      return;
    }

    try {
      const updateData = {};
      if (passwordData.newPassword) {
        updateData.newPassword = passwordData.newPassword;
      }
      if (passwordData.newMobileNumber) {
        updateData.newMobileNumber = passwordData.newMobileNumber;
      }

      const response = await apiClient.patch(`/admin/users/${selectedUserForPassword.userId}/change-password`, updateData);

      const changes = [];
      if (passwordData.newPassword) changes.push('password');
      if (passwordData.newMobileNumber) changes.push('mobile number');
      
      alert(`${changes.join(' and ')} changed successfully!`);
      setShowPasswordModal(false);
      setSelectedUserForPassword(null);
      setPasswordData({ newPassword: '', confirmPassword: '', newMobileNumber: '' });
      setError('');
      
      // Refresh patient list to show updated data
      fetchPatients();
    } catch (err) {
      console.error('Error changing password/mobile:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to change password/mobile number';
      alert(`Error: ${errorMessage}`);
      setError(errorMessage);
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    setSelectedUserForPassword(null);
    setPasswordData({ newPassword: '', confirmPassword: '', newMobileNumber: '' });
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
            onClick={() => {
              setActiveTab('patients');
              // Save active tab to localStorage so it persists on refresh
              localStorage.setItem('patientRecordActiveTab', 'patients');
            }}
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
            onClick={() => {
              setActiveTab('incomplete');
              // Save active tab to localStorage so it persists on refresh
              localStorage.setItem('patientRecordActiveTab', 'incomplete');
            }}
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
        {!isSectionReadOnly(user, 'patients') && (
          <button onClick={handleAdd} className="bg-blue-500 text-white px-4 py-2 rounded w-full sm:w-auto">Add Patient</button>
        )}
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
                  <td className="border border-gray-300 px-2 sm:px-4 py-2">
                    {(patient.email && patient.email.trim() !== '') || (patient.userId?.email && patient.userId.email.trim() !== '') 
                      ? (patient.email || patient.userId?.email) 
                      : 'N/A'}
                  </td>
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
                    {[patient.address, patient.city, patient.state, patient.pincode].filter(Boolean).join(', ') || 'N/A'}
                  </td>
                  <td className="border border-gray-300 px-2 sm:px-4 py-2 whitespace-nowrap">
                    {patient.isProfileComplete ? (
                      <>
                        <button onClick={() => { if (!patient.patientId || patient.patientId === 'N/A') { setError('Patient details not available for this user'); return; } handleViewDetails(patient.patientId); }} className="text-blue-500 mr-1 sm:mr-2 text-xs sm:text-sm">View</button>
                        {!isSectionReadOnly(user, 'patients') && (
                          <>
                            <button onClick={() => { if (!patient.patientId || patient.patientId === 'N/A') { setError('Patient details not available for this user'); return; } handleEdit(patient); }} className="text-yellow-500 mr-1 sm:mr-2 text-xs sm:text-sm" title="Edit Patient">Edit</button>
                            <button onClick={() => handleChangePassword(patient)} className="text-blue-500 mr-1 sm:mr-2 text-xs sm:text-sm" title="Change Password">🔑</button>
                            <button onClick={() => { if (!patient.patientId || patient.patientId === 'N/A') { setError('Patient details not available for this user'); return; } handleDelete(patient); }} className="text-red-500 text-xs sm:text-sm" title="Delete Patient">Delete</button>
                          </>
                        )}
                        {isSectionReadOnly(user, 'patients') && (
                          <span className="text-gray-400 text-xs sm:text-sm">Read-only</span>
                        )}
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
                          onClick={() => handleMarkAsAdded(user)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mr-2 transition-colors"
                          title="Mark as Added - Remove from incomplete accounts"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Added
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
              <div className="col-span-2">
                <strong>Medical Reports</strong>
                {adminReportsLoading ? (
                  <p className="text-gray-500">Loading…</p>
                ) : adminReports.length === 0 ? (
                  <p className="text-gray-500">No reports</p>
                ) : (
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {adminReports.map((r) => (
                      <li key={r._id} className="flex items-center gap-2 flex-wrap">
                        <a href={getMedicalReportUrl(r.fileUrl)} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{r.title || 'Medical Report'}</a>
                        {!isSectionReadOnly(user, 'patients') && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (!confirm('Delete this report?')) return;
                              try {
                                await apiClient.delete(`/admin/patients/${selectedPatient.patient._id}/reports/${r._id}`);
                                setAdminReports((prev) => prev.filter((x) => x._id !== r._id));
                              } catch (e) {
                                alert(e.response?.data?.message || 'Failed to delete report.');
                              }
                            }}
                            className="text-red-600 hover:underline text-sm"
                          >
                            Delete
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <p><strong>Last Login:</strong> {selectedPatient.patient.lastLogin ? new Date(selectedPatient.patient.lastLogin).toLocaleDateString() : 'Never'}</p>
              <p><strong>Profile Status:</strong> {selectedPatient.patient.isProfileComplete ? 'Complete' : 'Incomplete'}</p>
              <p><strong>Address:</strong> {selectedPatient.patient.address || 'N/A'}</p>
              <p><strong>City:</strong> {selectedPatient.patient.city || 'N/A'}</p>
              <p><strong>State:</strong> {selectedPatient.patient.state || 'N/A'}</p>
              <p><strong>Pincode:</strong> {selectedPatient.patient.pincode || 'N/A'}</p>
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
              <div className="grid grid-cols-3 gap-2">
                {/* Day Dropdown */}
                <select
                  value={dobDay}
                  onChange={(e) => setDobDay(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none relative z-10 bg-white"
                  required
                >
                  <option value="">Day</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day.toString().padStart(2, '0')}>
                      {day}
                    </option>
                  ))}
                </select>

                {/* Month Dropdown */}
                <select
                  value={dobMonth}
                  onChange={(e) => {
                    setDobMonth(e.target.value);
                    // Reset day if month changes and day is invalid for new month
                    if (dobDay && e.target.value) {
                      const daysInMonth = new Date(parseInt(dobYear || new Date().getFullYear()), parseInt(e.target.value), 0).getDate();
                      if (parseInt(dobDay) > daysInMonth) {
                        setDobDay('');
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none relative z-10 bg-white"
                  required
                >
                  <option value="">Month</option>
                  {[
                    { value: '01', label: 'January' },
                    { value: '02', label: 'February' },
                    { value: '03', label: 'March' },
                    { value: '04', label: 'April' },
                    { value: '05', label: 'May' },
                    { value: '06', label: 'June' },
                    { value: '07', label: 'July' },
                    { value: '08', label: 'August' },
                    { value: '09', label: 'September' },
                    { value: '10', label: 'October' },
                    { value: '11', label: 'November' },
                    { value: '12', label: 'December' }
                  ].map(month => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>

                {/* Year Dropdown */}
                <select
                  value={dobYear}
                  onChange={(e) => {
                    setDobYear(e.target.value);
                    // Reset day if year changes and it's a leap year issue
                    if (dobDay && dobMonth === '02' && e.target.value) {
                      const isLeapYear = (year) => (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
                      const daysInFeb = isLeapYear(parseInt(e.target.value)) ? 29 : 28;
                      if (parseInt(dobDay) > daysInFeb) {
                        setDobDay('');
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none relative z-10 bg-white"
                  required
                >
                  <option value="">Year</option>
                  {Array.from({ length: 120 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <option key={year} value={year.toString()}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
              {dobDay && dobMonth && dobYear && (
                <p className="text-xs text-blue-600 mt-1">
                  Selected: {new Date(parseInt(dobYear), parseInt(dobMonth) - 1, parseInt(dobDay)).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              )}
              {(!dobDay || !dobMonth || !dobYear) && (
                <p className="text-xs text-gray-500 mt-1">
                  Please select Day, Month, and Year
                </p>
              )}
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age <span className="text-red-500">*</span>
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 flex items-center justify-between">
                <div className="flex-1">
                  {calculatedAge.display ? (
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-sm font-semibold text-gray-700">{calculatedAge.display}</span>
                      {calculatedAge.years > 0 && (
                        <span className="text-xs text-gray-500">
                          ({calculatedAge.years} {calculatedAge.years === 1 ? 'year' : 'years'})
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Select date of birth to calculate age</span>
                  )}
                </div>
              </div>
              {/* Hidden input for form submission (stores total years) */}
              <input
                type="hidden"
                value={formData.age}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Age is automatically calculated from the date of birth (Years, Months, Days)
              </p>
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
                placeholder="10 digits (with or without +91)"
                value={formData.mobileNumber}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  const value = raw.length > 10 ? raw.slice(-10) : raw.slice(0, 10);
                  setFormData({ ...formData, mobileNumber: value });
                }}
                maxLength="13"
                pattern="[0-9]{10}"
                title="Enter 10-digit mobile number (e.g. 9236347274 or +919236347274)"
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
                Assigned Doctor {isFromReferral && <span className="text-red-500">*</span>}
              </label>
              <select
                value={formData.assignedDoctor}
                onChange={(e) => setFormData({ ...formData, assignedDoctor: e.target.value })}
                disabled={isFromReferral}
                className={`w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 ${
                  isFromReferral ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                required
              >
                <option value="">Select Doctor</option>
                {doctors.map(doctor => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.Fullname || doctor.name || 'Unknown Doctor'}
                  </option>
                ))}
              </select>
              {isFromReferral && (
                <p className="text-xs text-gray-500 mt-1">
                  Doctor is pre-selected from referral and cannot be changed
                </p>
              )}
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
                Emergency Contact Number <span className="text-gray-500 text-sm">(optional)</span>
              </label>
              <input
                type="tel"
                placeholder="10 digits (with or without +91)"
                value={formData.emergencyContactNumber}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  const value = raw.length > 10 ? raw.slice(-10) : raw.slice(0, 10);
                  setFormData({ ...formData, emergencyContactNumber: value });
                }}
                maxLength="13"
                pattern="^([0-9]{10})?$"
                title="Enter 10-digit number or leave blank"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none relative z-10"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Area Code (Pincode)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="6-digit pincode"
                  value={formData.pincode || ''}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none relative z-10"
                  maxLength={6}
                />
                <button
                  type="button"
                  onClick={async () => {
                    const p = (formData.pincode || '').replace(/\D/g, '').slice(0, 6);
                    if (p.length !== 6) { alert('Enter 6-digit pincode'); return; }
                    setIsFetchingPincode(true);
                    try {
                      const data = await getAddressFromPincode(p);
                      if (data?.state || data?.city) {
                        const st = normalizeState(data.state || '');
                        if (st && data.city) {
                          setDynamicCitiesByState(prev => {
                            const arr = prev[st] || [];
                            return arr.includes(data.city) ? prev : { ...prev, [st]: [...arr, data.city] };
                          });
                        }
                        setFormData(prev => ({ ...prev, state: st || prev.state, city: data.city || prev.city }));
                        alert('State and city fetched from pincode.');
                      } else alert('Could not fetch state and city for this pincode.');
                    } catch (e) { alert('Error fetching. Please try again.'); }
                    finally { setIsFetchingPincode(false); }
                  }}
                  disabled={isFetchingPincode || (formData.pincode || '').replace(/\D/g, '').length !== 6}
                  className="px-3 py-2 border border-gray-300 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 whitespace-nowrap"
                >
                  {isFetchingPincode ? '…' : 'Fetch'}
                </button>
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <select
                value={formData.state || ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setFormData(prev => {
                    const next = { ...prev, state: v };
                    const cities = [...(getCitiesByState()[v] || []), ...(dynamicCitiesByState[v] || [])];
                    if (prev.city && !cities.includes(prev.city)) next.city = '';
                    return next;
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none relative z-10 bg-white"
              >
                <option value="">Select State</option>
                {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                list="city-datalist-admin"
                type="text"
                placeholder="Select or type city name"
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value.trim() })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none relative z-10 bg-white"
              />
              <datalist id="city-datalist-admin">
                {[...new Set([...(getCitiesByState()[formData.state] || []), ...(dynamicCitiesByState[formData.state] || [])])].sort().map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                placeholder="Street address, area, landmark"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none relative z-10 resize-y"
                rows="2"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Condition <span className="text-gray-500 text-sm">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="Describe current condition (optional)"
                value={formData.currentCondition}
                onChange={(e) => setFormData({ ...formData, currentCondition: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none relative z-10"
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
                Medical Insurance (Insured or Not)
              </label>
              <select
                value={formData.medicalInsurance || 'No'}
                onChange={(e) => setFormData({ ...formData, medicalInsurance: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none relative z-10"
              >
                <option value="Yes">Yes (Insured)</option>
                <option value="No">No (Not Insured)</option>
              </select>
            </div>
            {modalMode === 'add' && (
              <>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Set Password (optional)
                  </label>
                  <input
                    type="password"
                    placeholder="Set password for patient login (min 6 characters)"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none relative z-10"
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    If provided, this password will be set for the patient account. If left empty, password can be set later using the Change Password button.
                  </p>
                </div>
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
              </>
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

      {/* Change Password & Mobile Number Modal */}
      {showPasswordModal && selectedUserForPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Change Password & Mobile Number</h3>
            <p className="text-sm text-gray-600 mb-4">Update credentials for: <strong>{selectedUserForPassword.name}</strong></p>
            
            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Mobile Number
                </label>
                <input
                  type="tel"
                  placeholder="Enter new 10-digit mobile number"
                  value={passwordData.newMobileNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setPasswordData({ ...passwordData, newMobileNumber: value });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  maxLength="10"
                  pattern="[0-9]{10}"
                />
                {selectedUserForPassword.currentMobileNumber && (
                  <p className="text-xs text-gray-500 mt-1">
                    Current: {selectedUserForPassword.currentMobileNumber}
                  </p>
                )}
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Enter new password (min 6 characters)"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty if you only want to change mobile number
                </p>
              </div>

              {passwordData.newPassword && (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    minLength={6}
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded w-full sm:w-auto hover:bg-blue-600"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={handlePasswordCancel}
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

export default PatientRecord;
