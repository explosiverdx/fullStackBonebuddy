import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useLocation, Routes, Route } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import PatientRecord from './PatientRecord'; // Assuming these components exist
import { useAuth } from '../hooks/useAuth';
import DoctorTable from './DoctorTable'; // Assuming these components exist
import ContactSubmissions from './ContactSubmissions';
import PhysiotherapistTable from './PhysiotherapistTable'; // Assuming these components exist
import Payments from './AdminDashboard/Payments';
import Referrals from './AdminDashboard/Referrals';
import ImageCropper from './ImageCropper';

// Dashboard component to display stats
const Dashboard = ({ stats }) => {
  const [chartView, setChartView] = useState('daily'); // 'daily' or 'monthly'
  const { authHeaders } = useAuth();

  const processChartData = (data, view) => {
    if (!data || data.length === 0) return [];

    if (view === 'daily') {
      return data.map(item => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Patient: item.users.patient || 0,
        Doctor: item.users.doctor || 0,
        Physiotherapist: item.users.physio || 0, // Corrected from item.users.Physiotherapist
      }));
    }

    if (view === 'monthly') {
      const monthlyData = data.reduce((acc, item) => {
        const month = new Date(item.date).toLocaleString('en-US', { year: 'numeric', month: 'short' });
        if (!acc[month]) {
          acc[month] = { date: month, Patient: 0, Doctor: 0, Physiotherapist: 0 };
        }
        acc[month].Patient += item.users.patient || 0;
        acc[month].Doctor += item.users.doctor || 0;
        acc[month].Physiotherapist += item.users.physio || 0; // Corrected from item.users.Physiotherapist
        return acc;
      }, {});
      return Object.values(monthlyData);
    }

    return [];
  };

  const chartData = processChartData(stats.daily, chartView);

  const handleExport = async (format) => {
    try {
      // Export the dashboard stats data (daily registrations)
      const data = stats.daily || [];

      if (data.length === 0) {
        alert('No data available to export.');
        return;
      }

      if (format === 'pdf') {
        const doc = new jsPDF();
        doc.text('Dashboard Registration Stats', 10, 10);
        let y = 20;

        // Add headers
        doc.text('Date, Patients, Doctors, Physiotherapists', 10, y);
        y += 10;

        data.forEach((item) => {
          if (y > 280) { // New page
            doc.addPage();
            y = 10;
          }
          const line = `${item.date}, ${item.users.patient || 0}, ${item.users.doctor || 0}, ${item.users.physio || 0}`;
          doc.text(line, 10, y);
          y += 10;
        });
        doc.save('dashboard-stats.pdf');
      } else if (format === 'excel') {
        // Prepare data for Excel
        const excelData = data.map(item => ({
          Date: item.date,
          Patients: item.users.patient || 0,
          Doctors: item.users.doctor || 0,
          Physiotherapists: item.users.physio || 0
        }));

        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Dashboard Stats');
        XLSX.writeFile(wb, 'dashboard-stats.xlsx');
      }
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export data. ' + err.message);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => setChartView('daily')} className={`px-3 py-1 rounded text-sm ${chartView === 'daily' ? 'bg-teal-500 text-white' : 'bg-gray-200'}`}>Daily</button>
        <button onClick={() => setChartView('monthly')} className={`px-3 py-1 rounded text-sm ${chartView === 'monthly' ? 'bg-teal-500 text-white' : 'bg-gray-200'}`}>Monthly</button>
        <div className="flex-grow"></div>
        <button onClick={() => handleExport('pdf')} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">Export PDF</button>
        <button onClick={() => handleExport('excel')} className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">Export Excel</button>
      </div>
      <div className="grid grid-cols-1 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">User Registrations ({chartView === 'daily' ? 'Daily' : 'Monthly'})</h2>
          <div style={{ width: '100%', height: 300, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Patient" fill="#8884d8" name="Patients" />
                <Bar dataKey="Doctor" fill="#82ca9d" name="Doctors" />
                <Bar dataKey="Physiotherapist" fill="#ffc658" name="Physiotherapists" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

// RouteWrapper component to pass props to routed components
const RouteWrapper = ({ component, componentProps }) => {
  const Component = component;
  return <Component {...componentProps} />;
};

const PendingSessions = ({ authHeaders }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPendingAppointments();
  }, []);

  const fetchPendingAppointments = async () => {
    try {
      // Replace with your actual API endpoint
      const response = await fetch('/api/v1/appointments/admin/pending', { 
        headers: authHeaders
      });
      if (response.ok) {
        const responseData = await response.json();
        setAppointments(responseData.data?.docs || responseData.data || []);
      } else {
        setAppointments([]);
        setError('Failed to fetch appointments. Please try again later.');
      }
    } catch (err) {
      setAppointments([]);
      setError(`Error fetching appointments: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (appointmentId, action, newData = {}) => {
    setError('');
    try {
      const body = { ...newData };
      if (action === 'approve') body.status = 'scheduled';
      else if (action === 'cancel') body.status = 'canceled';
      else if (action === 'reschedule') body.appointmentDate = newData.appointmentDate;
      else if (action === 'assign') body.physioId = newData.physioId;

      const response = await fetch(`/api/v1/appointments/admin/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        fetchPendingAppointments();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update appointment');
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
      <h2 className="text-xl md:text-2xl font-bold mb-4">Pending Sessions</h2>
      {error && <p className="text-red-500 mb-4 p-2 bg-red-100 rounded border border-red-300 text-sm">{error}</p>}

      {/* Container allows horizontal scrolling on small screens */}
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full table-auto bg-white border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Created At</th>
              <th className="px-2 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Patient</th>
              <th className="px-2 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Therapist</th>
              <th className="px-2 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Date & Time</th>
              <th className="px-2 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Type</th>
              <th className="px-2 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-2 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px] md:min-w-[320px]">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {appointments.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-2 md:px-6 py-4 text-center text-gray-500 text-sm">No pending sessions.</td>
              </tr>
            ) : (
              appointments.map((appt) => (
                <tr key={appt._id} className={`${isUpcoming(appt.appointmentDate) ? 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100' : 'hover:bg-gray-50'} flex flex-col md:table-row border-b md:border-b-0`}>
                  <td className="px-2 md:px-6 py-4 text-sm text-gray-500 md:table-cell">
                    <span className="md:hidden font-medium">Created At: </span>
                    {new Date(appt.createdAt).toLocaleString()}
                  </td>
                  <td className="px-2 md:px-6 py-4 text-sm font-medium text-gray-900 md:table-cell">
                    <span className="md:hidden font-medium">Patient: </span>
                    {appt.patient?.name || 'N/A'}
                  </td>
                  <td className="px-2 md:px-6 py-4 text-sm text-gray-500 md:table-cell">
                    <span className="md:hidden font-medium">Therapist: </span>
                    {appt.physio?.name || 'Unassigned'}
                  </td>
                  <td className="px-2 md:px-6 py-4 text-sm text-gray-500 md:table-cell">
                    <span className="md:hidden font-medium">Date & Time: </span>
                    {new Date(appt.appointmentDate).toLocaleString()}
                  </td>
                  <td className="px-2 md:px-6 py-4 text-sm text-gray-500 md:table-cell">
                    <span className="md:hidden font-medium">Type: </span>
                    {appt.sessionType}
                  </td>
                  <td className="px-2 md:px-6 py-4 text-sm text-gray-500 md:table-cell">
                    <span className="md:hidden font-medium">Status: </span>
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      {appt.status}
                    </span>
                  </td>
                  <td className="px-2 md:px-6 py-4 text-sm font-medium md:table-cell">
                    {isUpcoming(appt.appointmentDate) && (
                      <span className="text-yellow-700 block mb-2 text-xs font-semibold">⚠️ Upcoming (24h)</span>
                    )}
                    <div className="flex flex-wrap gap-1 md:flex-nowrap">
                      <button
                        onClick={() => handleAction(appt._id, 'approve')}
                        className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 min-w-max flex-1 md:flex-none"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          const newDate = prompt('Enter new date (YYYY-MM-DDTHH:MM):', new Date(appt.appointmentDate).toISOString().slice(0, 16));
                          if (newDate) handleAction(appt._id, 'reschedule', { appointmentDate: new Date(newDate).toISOString() });
                        }}
                        className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 min-w-max flex-1 md:flex-none"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => {
                          const newPhysioId = prompt('Enter new Physio ID:');
                          if (newPhysioId) handleAction(appt._id, 'assign', { physioId: newPhysioId });
                        }}
                        className="bg-purple-500 text-white px-2 py-1 rounded text-xs hover:bg-purple-600 min-w-max flex-1 md:flex-none"
                      >
                        Assign
                      </button>
                      <button
                        onClick={() => handleAction(appt._id, 'cancel')}
                        className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 min-w-max flex-1 md:flex-none"
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

const AllocateSession = ({ authHeaders, user: userProp }) => {
  const { user: userFromAuth } = useAuth();
  const user = userProp || userFromAuth;
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    physioId: '',
    surgeryType: '',
    totalSessions: '',
    durationHours: 1,
    durationMinutes: 0,
    startDate: '',
    endDate: '',
    sessionTime: '',
    isRecurring: false,
    frequency: 'daily'
  });

  const [displayNames, setDisplayNames] = useState({ patient: '', doctor: '', physio: '' });
  const [suggestions, setSuggestions] = useState({ patients: [], doctors: [], physios: [] });
  const [showDropdown, setShowDropdown] = useState({ patient: false, doctor: false, physio: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentCredits, setPaymentCredits] = useState([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState('');
  const [creditLoading, setCreditLoading] = useState(false);
  const [creditError, setCreditError] = useState('');
  const [scheduleWarning, setScheduleWarning] = useState('');
  const clientTimezone = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';

  const selectedPayment = useMemo(() => {
    if (!selectedPaymentId) return null;
    return paymentCredits.find((p) => p?._id === selectedPaymentId) || null;
  }, [paymentCredits, selectedPaymentId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDisplayChange = async (field, value) => {
    setDisplayNames(prev => ({ ...prev, [field]: value }));
    setFormData(prev => ({ ...prev, [`${field}Id`]: '' }));
    if (field === 'patient') {
      setPaymentCredits([]);
      setSelectedPaymentId('');
      setCreditError('');
    }

    if (value.trim().length > 1) {
      try {
        const response = await fetch(`/api/v1/admin/quick-search?query=${encodeURIComponent(value)}&limit=5`, { headers: authHeaders });
        if (response.ok) {
          const data = await response.json();
          setSuggestions(prev => ({
            ...prev,
            patients: field === 'patient' ? data.data.patients : prev.patients,
            doctors: field === 'doctor' ? data.data.doctors : prev.doctors,
            physios: field === 'physio' ? data.data.physios : prev.physios
          }));
          setShowDropdown(prev => ({ ...prev, [field]: true }));
        }
      } catch (err) {
        console.error('Search error:', err);
      }
    } else {
      setSuggestions(prev => ({ ...prev, patients: field === 'patient' ? [] : prev.patients, doctors: field === 'doctor' ? [] : prev.doctors, physios: field === 'physio' ? [] : prev.physios }));
      setShowDropdown(prev => ({ ...prev, [field]: false }));
    }
  };

  const selectSuggestion = (field, suggestion) => {
    setDisplayNames(prev => ({ ...prev, [field]: suggestion.name }));
    // Quick-search returns the actual document IDs in different properties:
    // - patients: suggestion.patientId (actual Patient._id)
    // - doctors: suggestion._id (actual Doctor._id)
    // - physios: suggestion._id (actual Physio._id)
    if (field === 'patient') {
      const patientDocId = suggestion.patientId || suggestion._id;
      setFormData(prev => ({ ...prev, patientId: patientDocId }));
      setScheduleWarning('');
      fetchPaymentCredits(patientDocId);
    } else {
      // For doctors and physios, always use suggestion._id which is the correct profile document ID
      setFormData(prev => ({ ...prev, [`${field}Id`]: suggestion._id }));
    }
    setSuggestions(prev => ({ ...prev, patients: field === 'patient' ? [] : prev.patients, doctors: field === 'doctor' ? [] : prev.doctors, physios: field === 'physio' ? [] : prev.physios }));
    setShowDropdown(prev => ({ ...prev, [field]: false }));
  };

  const fetchPaymentCredits = async (patientDocId) => {
    if (!patientDocId) return;
    setCreditLoading(true);
    setCreditError('');
    setPaymentCredits([]);
    setSelectedPaymentId('');
    try {
      const response = await fetch(`/api/v1/admin/patients/${patientDocId}/payment-credits`, { headers: authHeaders });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load payment credits');
      }
      const credits = data.data || [];
      setPaymentCredits(credits);
      if (credits.length === 1) {
        setSelectedPaymentId(credits[0]._id);
      }
      if (credits.length === 0) {
        setCreditError('No completed payments with remaining sessions were found for this patient.');
      }
    } catch (err) {
      setCreditError(err.message || 'Unable to load payment credits');
    } finally {
      setCreditLoading(false);
    }
  };

  const getRemainingForPayment = (payment) => {
    if (!payment) return 0;
    const total = Number(payment.sessionCount || 0);
    const allocated = Number(payment.sessionsAllocated || 0);
    const stored = typeof payment.sessionsRemaining === 'number' ? Number(payment.sessionsRemaining) : null;
    const computed = total - allocated;
    const candidates = [computed];
    if (stored !== null) candidates.push(stored);
    return Math.max(...candidates, 0);
  };
  const remainingSessions = getRemainingForPayment(selectedPayment);
  const paymentHasCredits = !!selectedPayment && remainingSessions > 0;
  const scheduleInputsDisabled = !!selectedPayment && !paymentHasCredits;

  const addDaysSkippingWeekend = (date, days) => {
    const result = new Date(date);
    while (days > 0) {
      result.setDate(result.getDate() + 1);
      const day = result.getDay();
      if (day !== 0 && day !== 6) {
        days--;
      }
    }
    return result;
  };

  const getMaxAllowedEndDate = (startStr, frequency, remaining) => {
    const start = new Date(startStr);
    if (Number.isNaN(start.getTime()) || remaining <= 0) return start;
    const sessionsToAdd = Math.max(remaining - 1, 0);
    let maxDate = new Date(start);

    switch (frequency) {
      case 'weekly':
        maxDate.setDate(maxDate.getDate() + sessionsToAdd * 7);
        break;
      case 'weekdays':
        maxDate = addDaysSkippingWeekend(start, sessionsToAdd);
        break;
      case 'daily':
      default:
        maxDate.setDate(maxDate.getDate() + sessionsToAdd);
    }
    return maxDate;
  };

  const formatDateInput = (dateObj) => {
    if (!dateObj) return '';
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getPaymentById = (id) => paymentCredits.find((p) => p._id === id);
  const maxRecurringEndDate = useMemo(() => {
    if (!formData.isRecurring || !selectedPayment || !formData.startDate) return null;
    if (!remainingSessions) return new Date(formData.startDate);
    const frequency = formData.frequency || 'daily';
    return getMaxAllowedEndDate(formData.startDate, frequency, remainingSessions);
  }, [formData.isRecurring, formData.startDate, formData.frequency, selectedPayment, remainingSessions]);
  const maxEndDateString = formData.isRecurring && maxRecurringEndDate
    ? formatDateInput(maxRecurringEndDate)
    : undefined;

  useEffect(() => {
    if (!formData.isRecurring) {
      setScheduleWarning('');
      return;
    }
    if (!selectedPayment || !formData.startDate) {
      setScheduleWarning('');
      return;
    }

    if (!remainingSessions) {
      setScheduleWarning('No sessions remaining for the selected payment.');
      return;
    }

    if (formData.endDate && maxRecurringEndDate) {
      const currentEnd = new Date(formData.endDate);
      if (currentEnd > maxRecurringEndDate) {
        const adjusted = formatDateInput(maxRecurringEndDate);
        if (adjusted !== formData.endDate) {
          setFormData(prev => ({ ...prev, endDate: adjusted }));
        }
        setScheduleWarning(`Only ${remainingSessions} session(s) available; end date adjusted to include ${remainingSessions} day(s).`);
        return;
      }
    }

    setScheduleWarning('');
  }, [formData.isRecurring, formData.startDate, formData.endDate, selectedPayment, remainingSessions, maxRecurringEndDate]);

  // Helper: generate session datetime slots between start and end dates
  const generateSessions = (startStr, endStr, timeStr, frequency, meta = {}) => {
    const sessions = [];
    if (!startStr || !timeStr) return sessions;
    const [hour, minute] = timeStr.split(':').map(n => parseInt(n, 10));
    const start = new Date(startStr);
    const end = endStr ? new Date(endStr) : new Date(startStr);

    if (isNaN(start) || isNaN(end) || isNaN(hour)) return sessions;

    let cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    while (cursor <= end) {
      const day = cursor.getDay();
        if (
          frequency === 'daily' ||
          (frequency === 'weekdays' && day !== 0 && day !== 6) ||
          frequency === 'weekly'
        ) {
          // build datetime using local components (treat input time as local time), then convert to ISO (UTC) for payload
          const localDt = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), hour, minute || 0, 0);
          // include duration in each session (minutes)
          const duration = meta.durationMinutes || 60;
          sessions.push({ appointmentDate: localDt.toISOString(), durationMinutes: duration, timezone: clientTimezone, ...meta });
        }

      if (frequency === 'weekly') {
        cursor.setDate(cursor.getDate() + 7);
      } else {
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    return sessions.filter(s => new Date(s.appointmentDate) <= end);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    console.log('Submitting form data:', formData); // Debug log
    console.log('Patient ID:', formData.patientId);
    console.log('Selected patient name:', displayNames.patient);

    if (!formData.patientId || !formData.doctorId || !formData.physioId || !formData.startDate || !formData.sessionTime) {
      setError('Please fill all required fields');
      setLoading(false);
      return;
    }

    if (!selectedPayment || !paymentHasCredits) {
      setError('Please select a payment package with available sessions before scheduling.');
      setLoading(false);
      return;
    }

    if (formData.isRecurring) {
      if (!formData.endDate || !formData.frequency) {
        setError('Please fill recurring details');
        setLoading(false);
        return;
      }
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        setError('End date must be after start date');
        setLoading(false);
        return;
      }
      // calculate sessions count
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      let sessionsCount = 0;
      switch(formData.frequency) {
        case 'daily': sessionsCount = days; break;
        case 'weekdays':
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) if (d.getDay() !== 0 && d.getDay() !== 6) sessionsCount++;
          break;
        case 'weekly': sessionsCount = Math.ceil(days / 7); break;
        default: sessionsCount = days;
      }
      formData.totalSessions = sessionsCount;
    }

    let sessions = [];
  // compute total duration in minutes from hours + minutes inputs
  const totalDurationMinutes = (Number(formData.durationHours || 0) * 60) + Number(formData.durationMinutes || 0);
  const meta = { doctorId: formData.doctorId, physioId: formData.physioId, surgeryType: formData.surgeryType, durationMinutes: totalDurationMinutes };
    if (totalDurationMinutes <= 0) {
      setError('Duration must be greater than 0 minutes');
      setLoading(false);
      return;
    }

    try {
      if (formData.isRecurring) {
        sessions = generateSessions(formData.startDate, formData.endDate, formData.sessionTime, formData.frequency, meta);
      } else {
  // Treat the provided date/time as local and convert to ISO (UTC) for the payload
  const [y, m, d] = formData.startDate.split('-').map(n => parseInt(n, 10));
  const [hour, minute] = formData.sessionTime.split(':').map(n => parseInt(n, 10));
  const localDt = new Date(y, (m || 1) - 1, d || 1, hour || 0, minute || 0, 0);
  sessions = [{ appointmentDate: localDt.toISOString(), durationMinutes: totalDurationMinutes, timezone: clientTimezone, ...meta }];
      }

      const remainingSessions = getRemainingForPayment(selectedPayment);
      if (sessions.length > remainingSessions) {
        setError(`Selected payment only has ${remainingSessions} session(s) remaining. Please reduce the count or choose another payment.`);
        setLoading(false);
        return;
      }

      const payload = {
        patientId: formData.patientId,
        doctorId: formData.doctorId,
        physioId: formData.physioId,
        surgeryType: formData.surgeryType,
        totalSessions: sessions.length,
        sessions,
        paymentId: selectedPaymentId
      };

      console.log('Sending API request with payload:', payload);
      
      const response = await fetch('/api/v1/admin/allocate-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const responseData = await response.json();
      console.log('API Response:', { status: response.status, data: responseData });
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to allocate session');
      }

      setSuccess('Session(s) allocated successfully');
      setFormData({
        patientId: '',
        doctorId: '',
        physioId: '',
        surgeryType: '',
        totalSessions: '',
        startDate: '',
        endDate: '',
        sessionTime: '',
        isRecurring: false,
        frequency: 'daily'
      });
      setDisplayNames({ patient: '', doctor: '', physio: '' });
      setPaymentCredits([]);
      setSelectedPaymentId('');
      setCreditError('');
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to allocate session');
    } finally {
      setLoading(false);
    }
  };

  // Preview sessions (derived from current form data)
  const previewSessions = (() => {
    if (!formData.startDate || !formData.sessionTime) return [];
    const meta = { doctorId: formData.doctorId, physioId: formData.physioId, surgeryType: formData.surgeryType };
    if (formData.isRecurring) return generateSessions(formData.startDate, formData.endDate, formData.sessionTime, formData.frequency, meta);
    const [y, m, d] = formData.startDate.split('-').map(n => parseInt(n, 10));
    const [hour, minute] = formData.sessionTime.split(':').map(n => parseInt(n, 10));
    // Treat input date/time as local time and convert to ISO for display/payload
    const localDt = new Date(y, (m || 1) - 1, d || 1, hour || 0, minute || 0, 0);
    return [{ appointmentDate: localDt.toISOString(), timezone: clientTimezone, ...meta }];
  })();

  // Render form
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Allocate Session</h2>
      {isSectionReadOnly(user, 'sessions') && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
          This section is read-only. You cannot allocate sessions.
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Patient */}
        <div className="relative">
          <label className="block text-gray-700 text-sm font-bold mb-2">Patient</label>
          <input
            type="text"
            value={displayNames.patient}
            onChange={(e) => handleDisplayChange('patient', e.target.value)}
            onBlur={() => setTimeout(() => setShowDropdown(prev => ({ ...prev, patient: false })), 200)}
            onFocus={() => displayNames.patient.trim().length > 1 && suggestions.patients.length > 0 && setShowDropdown(prev => ({ ...prev, patient: true }))}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Enter Patient ID or Name"
          />
          {showDropdown.patient && suggestions.patients.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-40 overflow-y-auto mt-1">
              {suggestions.patients.map(s => (
                <div key={s._id} onMouseDown={() => selectSuggestion('patient', s)} className="px-4 py-2 hover:bg-gray-50 cursor-pointer">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-sm text-gray-500">{s.contact} • ID: {s.shortId}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Credits */}
        {formData.patientId && (
          <div className="border border-teal-100 rounded-md p-3 bg-teal-50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-teal-900">Available Paid Sessions</h4>
              {creditLoading && <span className="text-xs text-gray-600">Checking credits...</span>}
            </div>
            {creditError && <p className="text-sm text-red-600 mb-2">{creditError}</p>}
            {!creditLoading && paymentCredits.length === 0 && !creditError && (
              <p className="text-sm text-gray-600">No credits detected. Ask the client to complete a payment request with session count.</p>
            )}
            {paymentCredits.length > 0 && (
              <div className="space-y-2">
                {paymentCredits.map((credit) => {
                  const remaining = getRemainingForPayment(credit);
                  return (
                    <label key={credit._id} className="flex items-start gap-3 p-2 border rounded-md bg-white cursor-pointer">
                      <input
                        type="radio"
                        name="paymentCredit"
                        value={credit._id}
                        checked={selectedPaymentId === credit._id}
                        onChange={() => setSelectedPaymentId(credit._id)}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-semibold text-gray-900">
                          ₹{credit.amount} • {credit.description || credit.paymentType}
                        </div>
                        <div className="text-xs text-gray-600">
                          {credit.sessionCount} sessions paid • {remaining} remaining
                          {credit.paidAt && ` • Paid on ${new Date(credit.paidAt).toLocaleDateString()}`}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {scheduleInputsDisabled && (
          <div className="border border-yellow-300 rounded-md p-3 bg-yellow-50 text-sm text-yellow-900">
            No sessions remaining for the selected payment. Please choose another payment or request additional sessions.
          </div>
        )}

        {/* Doctor */}
        <div className="relative">
          <label className="block text-gray-700 text-sm font-bold mb-2">Doctor</label>
          <input type="text" value={displayNames.doctor} onChange={(e) => handleDisplayChange('doctor', e.target.value)} onBlur={() => setTimeout(() => setShowDropdown(prev => ({ ...prev, doctor: false })), 200)} onFocus={() => displayNames.doctor.trim().length > 1 && suggestions.doctors.length > 0 && setShowDropdown(prev => ({ ...prev, doctor: true }))} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Enter Doctor ID or Name" />
          {showDropdown.doctor && suggestions.doctors.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-40 overflow-y-auto mt-1">
              {suggestions.doctors.map(s => (
                <div key={s._id} onMouseDown={() => selectSuggestion('doctor', s)} className="px-4 py-2 hover:bg-gray-50 cursor-pointer">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-sm text-gray-500">{s.contact} • ID: {s.shortId}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Physio */}
        <div className="relative">
          <label className="block text-gray-700 text-sm font-bold mb-2">Physiotherapist</label>
          <input type="text" value={displayNames.physio} onChange={(e) => handleDisplayChange('physio', e.target.value)} onBlur={() => setTimeout(() => setShowDropdown(prev => ({ ...prev, physio: false })), 200)} onFocus={() => displayNames.physio.trim().length > 1 && suggestions.physios.length > 0 && setShowDropdown(prev => ({ ...prev, physio: true }))} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Enter Physiotherapist ID or Name" />
          {showDropdown.physio && suggestions.physios.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-40 overflow-y-auto mt-1">
              {suggestions.physios.map(s => (
                <div key={s._id} onMouseDown={() => selectSuggestion('physio', s)} className="px-4 py-2 hover:bg-gray-50 cursor-pointer">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-sm text-gray-500">{s.contact} • ID: {s.shortId}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Surgery Type */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">Surgery Type</label>
          <input type="text" name="surgeryType" value={formData.surgeryType} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g., Knee Surgery" />
        </div>

        {/* Recurring toggle */}
        <div>
          <label className="flex items-center space-x-2 text-gray-700 text-sm font-bold mb-2">
            <input type="checkbox" name="isRecurring" checked={formData.isRecurring} onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
            <span>Recurring Sessions</span>
          </label>
        </div>

        {formData.isRecurring ? (
          <>
            {scheduleWarning && (
              <div className="p-3 border border-yellow-300 rounded bg-yellow-50 text-sm text-yellow-900">
                {scheduleWarning}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                  disabled={scheduleInputsDisabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                  min={formData.startDate || ''}
                  max={maxEndDateString}
                  disabled={scheduleInputsDisabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Daily Session Time</label>
                <input
                  type="time"
                  name="sessionTime"
                  value={formData.sessionTime}
                  onChange={handleInputChange}
                  required
                  disabled={scheduleInputsDisabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Duration</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="durationHours"
                    value={formData.durationHours}
                    onChange={handleInputChange}
                    min="0"
                    max="24"
                    disabled={scheduleInputsDisabled}
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                  />
                  <input
                    type="number"
                    name="durationMinutes"
                    value={formData.durationMinutes}
                    onChange={handleInputChange}
                    min="0"
                    max="59"
                    disabled={scheduleInputsDisabled}
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">Hours • Minutes (e.g. 1 and 30 = 1h30m)</p>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Frequency</label>
                <select
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleInputChange}
                  required
                  disabled={scheduleInputsDisabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                >
                  <option value="daily">Daily</option>
                  <option value="weekdays">Weekdays Only</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Session Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
                disabled={scheduleInputsDisabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Session Time</label>
              <input
                type="time"
                name="sessionTime"
                value={formData.sessionTime}
                onChange={handleInputChange}
                required
                disabled={scheduleInputsDisabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Duration</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="durationHours"
                  value={formData.durationHours}
                  onChange={handleInputChange}
                  min="0"
                  max="24"
                  disabled={scheduleInputsDisabled}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                />
                <input
                  type="number"
                  name="durationMinutes"
                  value={formData.durationMinutes}
                  onChange={handleInputChange}
                  min="0"
                  max="59"
                  disabled={scheduleInputsDisabled}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">Hours • Minutes (e.g. 0 and 45 = 45 minutes)</p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">Total Sessions</label>
          <input
            type="number"
            name="totalSessions"
            value={formData.totalSessions}
            onChange={handleInputChange}
            min="1"
            max={!formData.isRecurring && paymentHasCredits ? remainingSessions : undefined}
            readOnly={formData.isRecurring}
            disabled={scheduleInputsDisabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
            placeholder={
              formData.isRecurring
                ? 'Calculated from schedule'
                : selectedPayment
                ? `Max ${remainingSessions} session(s)`
                : 'Enter number of sessions'
            }
          />
          {formData.isRecurring && <p className="text-sm text-gray-500 mt-1">Total sessions will be calculated based on the date range and frequency</p>}
        </div>

        {/* Preview generated sessions */}
        {previewSessions.length > 0 && (
          <div className="bg-gray-50 p-3 rounded border border-gray-200">
            <h4 className="font-medium mb-2">Preview ({previewSessions.length})</h4>
            <ul className="list-disc list-inside text-sm max-h-40 overflow-y-auto">
              {previewSessions.map((s, idx) => {
                const start = new Date(s.appointmentDate);
                // compute duration: prefer per-session value, else use form inputs
                const formDuration = (Number(formData.durationHours || 0) * 60) + Number(formData.durationMinutes || 0);
                const duration = s.durationMinutes != null ? s.durationMinutes : (formDuration || 60);
                const end = new Date(start.getTime() + duration * 60000);
                return (
                  <li key={idx}>{`${start.toLocaleString()} — ${end.toLocaleTimeString()}`}</li>
                );
              })}
            </ul>
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-500 text-sm">{success}</p>}

        <button
          type="submit"
          disabled={loading || !formData.patientId || !formData.doctorId || !formData.physioId || scheduleInputsDisabled || isSectionReadOnly(user, 'sessions')}
          className="bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600 disabled:opacity-50"
        >
          {loading ? 'Allocating...' : 'Allocate Session'}
        </button>
      </form>
    </div>
  );
};

// Helper function to check if a section is read-only for the current admin
const isSectionReadOnly = (user, sectionKey) => {
  if (!user || !user.adminPermissions) return false;
  const isRohitKumar = user.Fullname === 'Rohit kumar' || user.Fullname === 'Rohit Kumar';
  if (isRohitKumar) return false; // Rohit Kumar has full access
  
  const sectionPerm = user.adminPermissions.sectionPermissions?.[sectionKey];
  return sectionPerm?.readOnly === true;
};

// Session History (admin) - list, edit, delete
const SessionHistory = ({ authHeaders, user: userProp }) => {
  const { user: userFromAuth } = useAuth();
  const user = userProp || userFromAuth;
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // session being edited
  const [initialLoad, setInitialLoad] = useState(true);
  const [viewingVideo, setViewingVideo] = useState(null); // session video being viewed
  const [editingVideo, setEditingVideo] = useState(null); // video being edited
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [reuploadingVideo, setReuploadingVideo] = useState(null); // session for reuploading video
  const [reuploadVideoFile, setReuploadVideoFile] = useState(null);
  const [reuploadTitle, setReuploadTitle] = useState('');
  const [reuploadDescription, setReuploadDescription] = useState('');

  const fetchSessions = async (pg = 1, isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setSearching(true);
    }
    setError('');
    try {
      const query = new URLSearchParams({ page: pg, limit, search });
      const res = await fetch(`/api/v1/sessions/admin?${query.toString()}`, { headers: authHeaders });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch sessions');
      // aggregatePaginate returns object with docs
      setSessions(data.data?.docs || data.data || []);
    } catch (err) {
      console.error('fetchSessions error', err);
      setError(err.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
      setSearching(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchSessions(1, initialLoad);
    }, 300); // Debounce search input
    return () => clearTimeout(debounce);
  }, [search]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this session? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/v1/sessions/admin/${id}`, { method: 'DELETE', headers: { ...authHeaders } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      fetchSessions(page);
    } catch (err) {
      alert(err.message || 'Failed to delete');
    }
  };

  const startEdit = (s) => {
    setEditing({
      _id: s._id,
      sessionDate: new Date(s.sessionDate).toISOString().slice(0,16), // local datetime-like string
      durationHours: Math.floor((s.durationMinutes||60)/60),
      durationMinutes: (s.durationMinutes||60) % 60,
      surgeryType: s.surgeryType,
      status: s.status || 'ongoing'
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      const total = (Number(editing.durationHours||0)*60) + Number(editing.durationMinutes||0);
      const payload = {
        sessionDate: new Date(editing.sessionDate).toISOString(),
        durationMinutes: total,
        surgeryType: editing.surgeryType,
        status: editing.status
      };
      const res = await fetch(`/api/v1/sessions/admin/${editing._id}`, { method: 'PATCH', headers: { 'Content-Type':'application/json', ...authHeaders }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      setEditing(null);
      fetchSessions(page);
    } catch (err) {
      alert(err.message || 'Failed to save');
    }
  };

  const handleViewVideo = (session) => {
    setViewingVideo(session);
  };

  const handleEditVideo = (session) => {
    setEditingVideo(session);
    setVideoTitle(session.sessionVideo?.title || '');
    setVideoDescription(session.sessionVideo?.description || '');
  };

  const handleDeleteVideo = async (sessionId) => {
    if (!confirm('Delete this session video? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/v1/sessions/${sessionId}/video`, { 
        method: 'DELETE', 
        headers: authHeaders 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      alert('✅ Video deleted successfully');
      fetchSessions(page);
      setViewingVideo(null);
    } catch (err) {
      alert(`❌ Error: ${err.message || 'Failed to delete video'}`);
    }
  };

  const handleUpdateVideo = async (sessionId) => {
    try {
      const res = await fetch(`/api/v1/sessions/${sessionId}/video`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify({
          title: videoTitle,
          description: videoDescription
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      alert('✅ Video updated successfully');
      setEditingVideo(null);
      fetchSessions(page);
    } catch (err) {
      alert(`❌ Error: ${err.message || 'Failed to update video'}`);
    }
  };

  const handleReuploadVideo = async (sessionId) => {
    if (!reuploadVideoFile) {
      alert('Please select a video file');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('video', reuploadVideoFile);
      formData.append('sessionId', sessionId);
      formData.append('title', reuploadTitle || 'Session Video');
      formData.append('description', reuploadDescription || '');

      const res = await fetch('/api/v1/sessions/upload-video', {
        method: 'POST',
        headers: authHeaders,
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reupload failed');
      
      alert('✅ Video reuploaded successfully');
      setReuploadingVideo(null);
      setReuploadVideoFile(null);
      setReuploadTitle('');
      setReuploadDescription('');
      fetchSessions(page);
    } catch (err) {
      alert(`❌ Error: ${err.message || 'Failed to reupload video'}`);
    }
  };

  const getSessionStatus = (session) => {
    const normalizedStatus = (session.status || '').toLowerCase();

    if (normalizedStatus === 'completed') {
      return { text: 'Completed', className: 'bg-gray-100 text-gray-800' };
    }
    if (normalizedStatus === 'missed') {
      return { text: 'Missed', className: 'bg-orange-100 text-orange-800' };
    }
    if (normalizedStatus === 'in-progress' || normalizedStatus === 'ongoing') {
      return { text: 'Ongoing', className: 'bg-green-100 text-green-800 animate-pulse' };
    }
    if (normalizedStatus === 'scheduled' || normalizedStatus === 'upcoming') {
      return { text: 'Upcoming', className: 'bg-blue-100 text-blue-800' };
    }
    if (normalizedStatus === 'cancelled' || normalizedStatus === 'canceled') {
      return { text: 'Canceled', className: 'bg-red-100 text-red-800' };
    }

    // Fallback to time-based status if backend status missing
    const now = new Date();
    const sessionStart = new Date(session.sessionDate);
    const duration = session.durationMinutes || 60;
    const sessionEnd = new Date(sessionStart.getTime() + duration * 60000);

    // Check if session should be marked as missed (no startTime and past end time)
    if (!session.startTime && now > sessionEnd) {
      return { text: 'Missed', className: 'bg-orange-100 text-orange-800' };
    }

    if (now >= sessionStart && now <= sessionEnd) {
      return { text: 'Ongoing', className: 'bg-green-100 text-green-800 animate-pulse' };
    }
    if (now < sessionStart) {
      return { text: 'Upcoming', className: 'bg-blue-100 text-blue-800' };
    }

    return { text: 'Past', className: 'bg-red-100 text-red-800' };
  };

  if (loading && initialLoad) return <div>Loading session history...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Session</h2>
      {error && <p className="text-red-500">{error}</p>}
      <div className="mb-4 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by patient name or mobile number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        {searching && <span className="text-sm text-gray-500">Searching...</span>}
      </div>
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Date & Time</th>
              <th className="px-3 py-2 text-left">Patient</th>
              <th className="px-3 py-2 text-left">Mobile Number</th>
              <th className="px-3 py-2 text-left">Doctor</th>
              <th className="px-3 py-2 text-left">Physio</th>
              <th className="px-3 py-2 text-left">Duration</th>
              <th className="px-3 py-2 text-left">Surgery</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Video</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr><td colSpan="10" className="p-4 text-center">No sessions found.</td></tr>
            ) : sessions.map(s => (
              <tr key={s._id} className="border-t">
                <td className="px-3 py-2">{new Date(s.sessionDate).toLocaleString()}</td>
                <td className="px-3 py-2">{s.patient?.name || 'N/A'}</td>
                <td className="px-3 py-2">{s.patient?.mobileNumber || 'N/A'}</td>
                <td className="px-3 py-2">{s.doctor?.name || 'N/A'}</td>
                <td className="px-3 py-2">{s.physio?.name || 'N/A'}</td>
                <td className="px-3 py-2">{(s.durationMinutes||60) >= 60 ? `${Math.floor((s.durationMinutes||60)/60)}h ${(s.durationMinutes||60)%60}m` : `${s.durationMinutes||60}m`}</td>
                <td className="px-3 py-2">{s.surgeryType}</td>                
                <td className="px-3 py-2">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSessionStatus(s).className}`}>{getSessionStatus(s).text}</span>
                </td>
                <td className="px-3 py-2 align-middle" style={{ position: 'relative', padding: '8px 12px' }}>
                  {s.sessionVideo && s.sessionVideo.url ? (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleViewVideo(s);
                      }}
                      className="bg-purple-500 text-white px-3 py-2 rounded text-xs hover:bg-purple-600 cursor-pointer border-0 relative z-10"
                      style={{ 
                        display: 'block', 
                        width: '100%', 
                        minHeight: '32px',
                        lineHeight: 'normal',
                        position: 'relative',
                        pointerEvents: 'auto',
                        userSelect: 'none',
                        verticalAlign: 'middle'
                      }}
                    >
                      📹 View
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">No video</span>
                  )}
                </td>
                <td className="px-3 py-2 align-middle" style={{ position: 'relative', padding: '8px 12px' }}>
                  {s.status === 'completed' ? (
                    <div className="flex gap-2 flex-col" style={{ position: 'relative', zIndex: 10 }}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleDeleteVideo(s._id);
                        }}
                        className={`px-3 py-2 rounded text-xs text-center cursor-pointer border-0 relative ${
                          s.sessionVideo?.url 
                            ? 'bg-red-500 text-white hover:bg-red-600' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                        }`}
                        style={{ 
                          display: 'block', 
                          width: '100%', 
                          minHeight: '32px',
                          lineHeight: 'normal',
                          pointerEvents: s.sessionVideo?.url ? 'auto' : 'none',
                          userSelect: 'none',
                          verticalAlign: 'middle'
                        }}
                        disabled={!s.sessionVideo?.url}
                      >
                        🗑️ Delete Video
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setReuploadingVideo(s);
                          setReuploadTitle(s.sessionVideo?.title || '');
                          setReuploadDescription(s.sessionVideo?.description || '');
                        }}
                        className="bg-purple-500 text-white px-3 py-2 rounded text-xs hover:bg-purple-600 text-center cursor-pointer border-0 relative"
                        style={{ 
                          display: 'block', 
                          width: '100%', 
                          minHeight: '32px',
                          lineHeight: 'normal',
                          pointerEvents: 'auto',
                          userSelect: 'none',
                          verticalAlign: 'middle'
                        }}
                      >
                        📤 Reupload Video
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2" style={{ position: 'relative', zIndex: 10 }}>
                      {!isSectionReadOnly(user, 'sessions') && (
                        <>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              startEdit(s);
                            }}
                            className="bg-yellow-500 text-white px-3 py-2 rounded text-xs hover:bg-yellow-600 cursor-pointer border-0 relative"
                            style={{ 
                              display: 'inline-block', 
                              minHeight: '32px',
                              lineHeight: 'normal',
                              pointerEvents: 'auto',
                              userSelect: 'none',
                              verticalAlign: 'middle'
                            }}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleDelete(s._id);
                            }}
                            className="bg-red-500 text-white px-3 py-2 rounded text-xs hover:bg-red-600 cursor-pointer border-0 relative"
                            style={{ 
                              display: 'inline-block', 
                              minHeight: '32px',
                              lineHeight: 'normal',
                              pointerEvents: 'auto',
                              userSelect: 'none',
                              verticalAlign: 'middle'
                            }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {isSectionReadOnly(user, 'sessions') && (
                        <span className="text-xs text-gray-500">Read-only</span>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit modal area */}
      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded w-full max-w-md">
            <h3 className="font-semibold mb-2">Edit Session</h3>
            <label className="block text-sm">Date & Time</label>
            <input type="datetime-local" value={editing.sessionDate} onChange={(e) => setEditing(prev => ({...prev, sessionDate: e.target.value}))} className="w-full p-2 border rounded mb-2" />
            <label className="block text-sm">Duration (hours)</label>
            <div className="flex gap-2 mb-2">
              <input type="number" min="0" max="24" value={editing.durationHours} onChange={(e) => setEditing(prev => ({...prev, durationHours: e.target.value}))} className="w-1/2 p-2 border rounded" />
              <input type="number" min="0" max="59" value={editing.durationMinutes} onChange={(e) => setEditing(prev => ({...prev, durationMinutes: e.target.value}))} className="w-1/2 p-2 border rounded" />
            </div>
            <label className="block text-sm">Surgery Type</label>
            <input type="text" value={editing.surgeryType} onChange={(e) => setEditing(prev => ({...prev, surgeryType: e.target.value}))} className="w-full p-2 border rounded mb-2" />
            <label className="block text-sm">Status</label>
            <select value={editing.status} onChange={(e) => setEditing(prev => ({...prev, status: e.target.value}))} className="w-full p-2 border rounded mb-4">
              <option value="scheduled">Scheduled</option>
              <option value="in-progress">In Progress</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-3 py-1 border rounded">Cancel</button>
              <button onClick={saveEdit} className="px-3 py-1 bg-teal-500 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Video Viewing Modal */}
      {viewingVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">📹 Session Video</h3>
                  <p className="text-sm text-gray-600">{viewingVideo.patient?.name} - {viewingVideo.surgeryType}</p>
                  <p className="text-xs text-gray-500">Date: {new Date(viewingVideo.sessionDate).toLocaleString()}</p>
                </div>
                <button 
                  onClick={() => setViewingVideo(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {viewingVideo.sessionVideo && viewingVideo.sessionVideo.url && (
                <div>
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900">{viewingVideo.sessionVideo.title}</h4>
                    <p className="text-sm text-gray-600">{viewingVideo.sessionVideo.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Uploaded: {new Date(viewingVideo.sessionVideo.uploadedAt).toLocaleString()}
                    </p>
                  </div>

                  <video controls className="w-full rounded mb-4" style={{maxHeight: '500px'}}>
                    <source src={viewingVideo.sessionVideo.url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>

                  {/* Admin Actions */}
                  <div className="flex gap-2 justify-end border-t pt-4">
                    <button
                      onClick={() => handleEditVideo(viewingVideo)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      ✏️ Edit Details
                    </button>
                    <button
                      onClick={() => handleDeleteVideo(viewingVideo._id)}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                      🗑️ Delete Video
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Edit Modal */}
      {editingVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Edit Video Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Video title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  className="w-full p-2 border rounded"
                  rows="3"
                  placeholder="Video description"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <button
                  onClick={() => {
                    setEditingVideo(null);
                    setVideoTitle('');
                    setVideoDescription('');
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateVideo(editingVideo._id)}
                  className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reupload Video Modal */}
      {reuploadingVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Reupload Session Video</h3>
            <p className="text-sm text-gray-600 mb-4">
              Patient: {reuploadingVideo.patient?.name || 'N/A'} - {reuploadingVideo.surgeryType}
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Video File *</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setReuploadVideoFile(e.target.files[0])}
                  className="w-full p-2 border rounded"
                  required
                />
                {reuploadVideoFile && (
                  <p className="text-xs text-gray-500 mt-1">Selected: {reuploadVideoFile.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={reuploadTitle}
                  onChange={(e) => setReuploadTitle(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Video title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={reuploadDescription}
                  onChange={(e) => setReuploadDescription(e.target.value)}
                  className="w-full p-2 border rounded"
                  rows="3"
                  placeholder="Video description"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <button
                  onClick={() => {
                    setReuploadingVideo(null);
                    setReuploadVideoFile(null);
                    setReuploadTitle('');
                    setReuploadDescription('');
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReuploadVideo(reuploadingVideo._id)}
                  disabled={!reuploadVideoFile}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Upload Video
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Blog Management Component
const BlogManagement = ({ authHeaders }) => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentBlog, setCurrentBlog] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'Other',
    tags: '',
    status: 'draft',
    metaTitle: '',
    metaDescription: ''
  });
  const [featuredImage, setFeaturedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState(null);
  const [showBlogList, setShowBlogList] = useState(true); // Changed to true to show by default

  useEffect(() => {
    fetchBlogs();
    fetchStats();
  }, [page]);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/blogs/admin/all?page=${page}&limit=10`, {
        headers: authHeaders
      });
      if (response.ok) {
        const data = await response.json();
        console.log('📚 Blogs fetched:', data.data);
        console.log('📚 Full data structure:', data);
        console.log('📚 Docs array:', data.data.docs);
        
        const blogsArray = data.data.docs || data.data || [];
        setBlogs(blogsArray);
        console.log('📝 Blog count:', blogsArray.length);
        console.log('📝 Blogs array:', blogsArray);
      } else {
        console.error('❌ Failed to fetch blogs, status:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/v1/blogs/admin/stats', {
        headers: authHeaders
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('excerpt', formData.excerpt);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('tags', formData.tags);
      formDataToSend.append('status', formData.status);
      formDataToSend.append('metaTitle', formData.metaTitle || formData.title);
      formDataToSend.append('metaDescription', formData.metaDescription || formData.excerpt);
      
      if (featuredImage) {
        formDataToSend.append('featuredImage', featuredImage);
      }

      const response = await fetch('/api/v1/blogs/admin/create', {
        method: 'POST',
        headers: {
          'Authorization': authHeaders.Authorization
        },
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create blog post');
      }

      alert('✅ Blog post created successfully!');
      setShowCreateModal(false);
      resetForm();
      fetchBlogs();
      fetchStats();
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('excerpt', formData.excerpt);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('tags', formData.tags);
      formDataToSend.append('status', formData.status);
      formDataToSend.append('metaTitle', formData.metaTitle || formData.title);
      formDataToSend.append('metaDescription', formData.metaDescription || formData.excerpt);
      
      if (featuredImage) {
        formDataToSend.append('featuredImage', featuredImage);
      }

      const response = await fetch(`/api/v1/blogs/admin/${currentBlog._id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': authHeaders.Authorization
        },
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update blog post');
      }

      alert('✅ Blog post updated successfully!');
      setShowEditModal(false);
      resetForm();
      fetchBlogs();
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;

    try {
      const response = await fetch(`/api/v1/blogs/admin/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });

      if (!response.ok) {
        throw new Error('Failed to delete blog post');
      }

      alert('✅ Blog post deleted successfully!');
      fetchBlogs();
      fetchStats();
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  const openEditModal = (blog) => {
    setCurrentBlog(blog);
    setFormData({
      title: blog.title,
      content: blog.content,
      excerpt: blog.excerpt || '',
      category: blog.category,
      tags: blog.tags.join(', '),
      status: blog.status,
      metaTitle: blog.metaTitle || '',
      metaDescription: blog.metaDescription || ''
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      category: 'Other',
      tags: '',
      status: 'draft',
      metaTitle: '',
      metaDescription: ''
    });
    setFeaturedImage(null);
    setImagePreview(null);
    setShowCropper(false);
    setCurrentBlog(null);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedFile) => {
    setFeaturedImage(croppedFile);
    setShowCropper(false);
    // Create preview for the cropped image
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(croppedFile);
  };

  const handleUseFullPhoto = () => {
    // Use the original image without cropping
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput && fileInput.files[0]) {
      setFeaturedImage(fileInput.files[0]);
      setShowCropper(false);
      // Create preview for the full image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(fileInput.files[0]);
    }
  };

  const handleCancelCrop = () => {
    setShowCropper(false);
    setImagePreview(null);
    setFeaturedImage(null);
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const categories = ['Physiotherapy', 'Recovery Tips', 'Success Stories', 'News', 'Health & Wellness', 'Exercise', 'Other'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Blog Management</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
        >
          ✍️ Create New Post
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Total Posts</p>
            <p className="text-2xl font-bold text-teal-600">
              {stats.statusStats.reduce((sum, s) => sum + s.count, 0)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Published</p>
            <p className="text-2xl font-bold text-green-600">
              {stats.statusStats.find(s => s._id === 'published')?.count || 0}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Total Views</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalViews}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Total Likes</p>
            <p className="text-2xl font-bold text-purple-600">{stats.totalLikes}</p>
          </div>
        </div>
      )}

      {/* Blog Posts List - Simplified and Always Visible */}
      <div className="bg-white rounded-lg shadow">
        <div className="bg-teal-50 px-4 py-3 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-teal-900">
            📋 All Blog Posts ({blogs.length})
          </h3>
          <span className="text-xs text-gray-600">
            <span className="hidden md:inline">Desktop View</span>
            <span className="md:hidden">Mobile View</span>
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
            <p className="text-gray-600">Loading blog posts...</p>
          </div>
        ) : blogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Blog Posts Yet</h3>
            <p className="text-gray-600 text-center mb-4">Create your first blog post to get started!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-teal-600 text-white px-6 py-2 rounded hover:bg-teal-700"
            >
              ✍️ Create First Post
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View - Shows on all screens */}
            <div className="overflow-auto" style={{maxHeight: '500px'}}>
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Views</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Published</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {blogs.map(blog => (
                    <tr key={blog._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {blog.featuredImage?.url && (
                            <img src={blog.featuredImage.url} alt="" className="w-12 h-12 rounded object-cover mr-3 flex-shrink-0" />
                          )}
                          <div className="max-w-xs">
                            <p className="font-medium text-gray-900 truncate">{blog.title}</p>
                            <p className="text-sm text-gray-500 truncate">{blog.excerpt?.substring(0, 50)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{blog.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          blog.status === 'published' ? 'bg-green-100 text-green-800' :
                          blog.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {blog.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{blog.views || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(blog)}
                            className="bg-blue-500 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-600 transition-colors"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(blog._id)}
                            className="bg-red-500 text-white px-3 py-1.5 rounded text-sm hover:bg-red-600 transition-colors"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {blogs.map(blog => (
                <div key={blog._id} className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    {blog.featuredImage?.url && (
                      <img src={blog.featuredImage.url} alt="" className="w-16 h-16 rounded object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{blog.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{blog.category}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{blog.excerpt}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-1 rounded-full ${
                      blog.status === 'published' ? 'bg-green-100 text-green-800' :
                      blog.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {blog.status}
                    </span>
                    <span className="text-gray-600">{blog.views || 0} views</span>
                    <span className="text-gray-600">
                      {blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) : '-'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(blog)}
                      className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(blog._id)}
                      className="flex-1 bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Image Cropper Modal */}
      {showCropper && imagePreview && (
        <ImageCropper
          image={imagePreview}
          onCropComplete={handleCropComplete}
          onCancel={handleCancelCrop}
          onUseFullPhoto={handleUseFullPhoto}
          aspectRatio={null}
        />
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && !showCropper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-4xl my-4 sm:my-8 max-h-[95vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-xl sm:text-2xl font-bold">
                  {showCreateModal ? '✍️ Create New Blog Post' : '📝 Edit Blog Post'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={showCreateModal ? handleCreate : handleUpdate} className="space-y-3 sm:space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full p-2 border rounded text-sm sm:text-base"
                    placeholder="Enter blog post title"
                    required
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium mb-1">Content *</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    className="w-full p-2 border rounded text-sm sm:text-base"
                    rows="8"
                    placeholder="Write your blog content here..."
                    required
                  />
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-sm font-medium mb-1">Excerpt</label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                    className="w-full p-2 border rounded text-sm sm:text-base"
                    rows="2"
                    placeholder="Brief summary (max 300 characters)"
                    maxLength="300"
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.excerpt.length}/300</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full p-2 border rounded text-sm sm:text-base"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full p-2 border rounded text-sm sm:text-base"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium mb-1">Tags</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    className="w-full p-2 border rounded text-sm sm:text-base"
                    placeholder="knee, therapy, recovery"
                  />
                </div>

                {/* Featured Image */}
                <div>
                  <label className="block text-sm font-medium mb-1">Featured Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="w-full p-2 border rounded text-sm"
                  />
                  {featuredImage && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-2 truncate">Selected: {featuredImage.name}</p>
                      {imagePreview && (
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full max-w-md h-48 object-cover rounded border border-gray-300" 
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setFeaturedImage(null);
                          setImagePreview(null);
                          const fileInput = document.querySelector('input[type="file"]');
                          if (fileInput) fileInput.value = '';
                        }}
                        className="mt-2 text-sm text-red-600 hover:text-red-700"
                      >
                        Remove Image
                      </button>
                    </div>
                  )}
                  {currentBlog?.featuredImage?.url && !featuredImage && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-2">Current Image:</p>
                      <img 
                        src={currentBlog.featuredImage.url} 
                        alt="Current" 
                        className="w-full max-w-md h-48 object-cover rounded border border-gray-300" 
                      />
                    </div>
                  )}
                </div>

                {/* SEO Fields - Collapsible on mobile */}
                <details className="border-t pt-3 sm:pt-4">
                  <summary className="font-semibold mb-3 cursor-pointer text-sm sm:text-base">SEO Settings (Optional)</summary>
                  <div className="space-y-3 mt-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Meta Title</label>
                      <input
                        type="text"
                        value={formData.metaTitle}
                        onChange={(e) => setFormData({...formData, metaTitle: e.target.value})}
                        className="w-full p-2 border rounded text-sm sm:text-base"
                        placeholder="SEO title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Meta Description</label>
                      <textarea
                        value={formData.metaDescription}
                        onChange={(e) => setFormData({...formData, metaDescription: e.target.value})}
                        className="w-full p-2 border rounded text-sm sm:text-base"
                        rows="2"
                        placeholder="SEO description"
                        maxLength="160"
                      />
                      <p className="text-xs text-gray-500 mt-1">{formData.metaDescription.length}/160</p>
                    </div>
                  </div>
                </details>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 justify-end pt-3 sm:pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="w-full sm:w-auto px-4 py-2 border rounded hover:bg-gray-100 text-sm sm:text-base order-2 sm:order-1"
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full sm:w-auto px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:bg-gray-400 text-sm sm:text-base order-1 sm:order-2"
                  >
                    {uploading ? '⏳ Saving...' : (showCreateModal ? '✅ Create' : '✅ Update')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Admin List Component
const AdminList = ({ authHeaders }) => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    Fullname: '',
    email: '',
    mobile_number: '',
    adminPermissions: {
      visibleSections: ['dashboard', 'patients', 'doctors', 'physiotherapists', 'sessions', 'payments', 'referrals', 'contact', 'blog'],
      sectionPermissions: {
        patients: { visible: true, readOnly: false },
        doctors: { visible: true, readOnly: false },
        physiotherapists: { visible: true, readOnly: false },
        sessions: { visible: true, readOnly: false },
        payments: { visible: true, readOnly: false }
      },
      fieldPermissions: {
        username: { visible: true, readOnly: false },
        email: { visible: true, readOnly: false },
        Fullname: { visible: true, readOnly: false },
        mobile_number: { visible: true, readOnly: true }
      }
    }
  });

  const isRohitKumar = user?.Fullname === 'Rohit kumar' || user?.Fullname === 'Rohit Kumar';

  useEffect(() => {
    if (isRohitKumar) {
      fetchAdmins();
    }
  }, [isRohitKumar]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/admin/admins?limit=100`, {
        headers: authHeaders,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setAdmins(data.data.admins || []);
      } else {
        throw new Error(data.message || 'Failed to fetch admins');
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      alert('Failed to fetch admins: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/v1/admin/admins`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        alert('Admin created successfully!');
        setShowCreateModal(false);
        resetForm();
        fetchAdmins();
      } else {
        alert(data.message || 'Failed to create admin');
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      alert('Failed to create admin: ' + (error.message || 'Unknown error'));
    }
  };

  const handleEditAdmin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/v1/admin/admins/${editingAdmin._id}`, {
        method: 'PATCH',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          Fullname: formData.Fullname,
          email: formData.email,
          mobile_number: formData.mobile_number,
          adminPermissions: formData.adminPermissions
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        alert('Admin updated successfully!');
        setShowEditModal(false);
        setEditingAdmin(null);
        resetForm();
        fetchAdmins();
      } else {
        alert(data.message || 'Failed to update admin');
      }
    } catch (error) {
      console.error('Error updating admin:', error);
      alert('Failed to update admin: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!confirm('Are you sure you want to delete this admin? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await fetch(`/api/v1/admin/admins/${adminId}`, {
        method: 'DELETE',
        headers: authHeaders,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        alert('Admin deleted successfully!');
        fetchAdmins();
      } else {
        alert(data.message || 'Failed to delete admin');
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      alert('Failed to delete admin: ' + (error.message || 'Unknown error'));
    }
  };

  const openEditModal = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      username: admin.username || '',
      password: '', // Don't show password
      Fullname: admin.Fullname || '',
      email: admin.email || '',
      mobile_number: admin.mobile_number || '',
      adminPermissions: admin.adminPermissions || {
        visibleSections: ['dashboard', 'patients', 'doctors', 'physiotherapists', 'sessions', 'payments', 'referrals', 'contact', 'blog'],
        sectionPermissions: {
          patients: { visible: true, readOnly: false },
          doctors: { visible: true, readOnly: false },
          physiotherapists: { visible: true, readOnly: false },
          sessions: { visible: true, readOnly: false },
          payments: { visible: true, readOnly: false }
        },
        fieldPermissions: {
          username: { visible: true, readOnly: false },
          email: { visible: true, readOnly: false },
          Fullname: { visible: true, readOnly: false },
          mobile_number: { visible: true, readOnly: true }
        }
      }
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      Fullname: '',
      email: '',
      mobile_number: '',
      adminPermissions: {
        visibleSections: ['dashboard', 'patients', 'doctors', 'physiotherapists', 'sessions', 'payments', 'referrals', 'contact', 'blog'],
        sectionPermissions: {
          patients: { visible: true, readOnly: false },
          doctors: { visible: true, readOnly: false },
          physiotherapists: { visible: true, readOnly: false },
          sessions: { visible: true, readOnly: false },
          payments: { visible: true, readOnly: false }
        },
        fieldPermissions: {
          username: { visible: true, readOnly: false },
          email: { visible: true, readOnly: false },
          Fullname: { visible: true, readOnly: false },
          mobile_number: { visible: true, readOnly: true }
        }
      }
    });
  };

  if (!isRohitKumar) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Access Denied:</strong> Only "Rohit kumar" can access this page.
        </div>
      </div>
    );
  }

  const filteredAdmins = admins.filter(admin => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (admin.username || '').toLowerCase().includes(search) ||
      (admin.Fullname || '').toLowerCase().includes(search) ||
      (admin.email || '').toLowerCase().includes(search) ||
      (admin.mobile_number || '').toLowerCase().includes(search)
    );
  });

  if (loading) {
    return <div className="p-4">Loading admins...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">All Admins</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search admins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            + Create Admin
          </button>
          <button
            onClick={fetchAdmins}
            className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead className="bg-teal-600 text-white">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Username</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Full Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Mobile</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Permissions</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Created At</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Last Login</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdmins.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                  {searchTerm ? 'No admins found matching your search.' : 'No admins found.'}
                </td>
              </tr>
            ) : (
              filteredAdmins.map((admin, index) => {
                const visibleSections = admin.adminPermissions?.visibleSections || [];
                const readOnlySections = admin.adminPermissions?.sectionPermissions 
                  ? Object.entries(admin.adminPermissions.sectionPermissions)
                      .filter(([_, perm]) => perm.readOnly)
                      .map(([section, _]) => section)
                  : [];
                const readOnlyFields = admin.adminPermissions?.fieldPermissions 
                  ? Object.entries(admin.adminPermissions.fieldPermissions)
                      .filter(([_, perm]) => perm.readOnly)
                      .map(([field, _]) => field)
                  : [];
                
                return (
                  <tr key={admin._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium">{admin.username || '(not set)'}</td>
                    <td className="px-4 py-3 text-sm">{admin.Fullname || '(not set)'}</td>
                    <td className="px-4 py-3 text-sm">{admin.email || '(not set)'}</td>
                    <td className="px-4 py-3 text-sm">{admin.mobile_number || '(not set)'}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="space-y-1">
                        <div className="text-xs">
                          <span className="font-medium">Sections:</span> {visibleSections.length > 0 ? visibleSections.length : 'All'}
                        </div>
                        {readOnlySections.length > 0 && (
                          <div className="text-xs text-blue-600">
                            <span className="font-medium">Read-only sections:</span> {readOnlySections.join(', ')}
                          </div>
                        )}
                        {readOnlyFields.length > 0 && (
                          <div className="text-xs text-orange-600">
                            <span className="font-medium">Read-only fields:</span> {readOnlyFields.join(', ')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {admin.createdAt ? new Date(admin.createdAt).toLocaleString() : '(unknown)'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(admin)}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAdmin(admin._id)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Showing {filteredAdmins.length} of {admins.length} admin(s)
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] overflow-y-auto p-2 sm:p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-2xl my-4 sm:my-8 max-h-[95vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Create New Admin</h2>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.Fullname}
                  onChange={(e) => setFormData({...formData, Fullname: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  value={formData.mobile_number}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({...formData, mobile_number: value});
                  }}
                  maxLength="10"
                  pattern="[0-9]{10}"
                  className="w-full px-3 py-2 border rounded"
                  required
                  placeholder="10 digits only"
                />
              </div>

              {/* Admin Permissions Section */}
              <div className="border-t pt-4 mt-4">
                <details className="cursor-pointer">
                  <summary className="text-lg font-semibold mb-3">Admin Permissions & Visibility Settings</summary>
                  
                  <div className="mt-4 space-y-4">
                    {/* Visible Dashboard Sections */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Visible Dashboard Sections</label>
                      <div className="space-y-2">
                        {[
                          { key: 'dashboard', label: 'Dashboard', canBeReadOnly: false },
                          { key: 'patients', label: 'Patients', canBeReadOnly: true },
                          { key: 'doctors', label: 'Doctors', canBeReadOnly: true },
                          { key: 'physiotherapists', label: 'Physiotherapists', canBeReadOnly: true },
                          { key: 'sessions', label: 'Sessions', canBeReadOnly: true },
                          { key: 'payments', label: 'Payments', canBeReadOnly: true },
                          { key: 'referrals', label: 'Referrals', canBeReadOnly: false },
                          { key: 'contact', label: 'Contact', canBeReadOnly: false },
                          { key: 'blog', label: 'Blog', canBeReadOnly: false }
                        ].map((section) => (
                          <div key={section.key} className="flex items-center justify-between p-2 border rounded">
                            <label className="flex items-center space-x-2 cursor-pointer flex-1">
                              <input
                                type="checkbox"
                                checked={formData.adminPermissions.visibleSections.includes(section.key)}
                                onChange={(e) => {
                                  const sections = e.target.checked
                                    ? [...formData.adminPermissions.visibleSections, section.key]
                                    : formData.adminPermissions.visibleSections.filter(s => s !== section.key);
                                  setFormData({
                                    ...formData,
                                    adminPermissions: {
                                      ...formData.adminPermissions,
                                      visibleSections: sections,
                                      // Remove section permission if section is unchecked
                                      sectionPermissions: e.target.checked 
                                        ? formData.adminPermissions.sectionPermissions
                                        : Object.fromEntries(
                                            Object.entries(formData.adminPermissions.sectionPermissions || {}).filter(([key]) => key !== section.key)
                                          )
                                    }
                                  });
                                }}
                                className="rounded"
                              />
                              <span className="text-sm font-medium">{section.label}</span>
                            </label>
                            {section.canBeReadOnly && formData.adminPermissions.visibleSections.includes(section.key) && (
                              <label className="flex items-center space-x-2 cursor-pointer ml-4">
                                <input
                                  type="checkbox"
                                  checked={formData.adminPermissions.sectionPermissions?.[section.key]?.readOnly || false}
                                  onChange={(e) => {
                                    setFormData({
                                      ...formData,
                                      adminPermissions: {
                                        ...formData.adminPermissions,
                                        sectionPermissions: {
                                          ...formData.adminPermissions.sectionPermissions,
                                          [section.key]: {
                                            visible: true,
                                            readOnly: e.target.checked
                                          }
                                        }
                                      }
                                    });
                                  }}
                                  className="rounded"
                                />
                                <span className="text-xs text-gray-600">Read-Only</span>
                              </label>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Field Permissions */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Field Permissions (Read-Only Settings)</label>
                      <div className="space-y-2">
                        {[
                          { key: 'username', label: 'Username' },
                          { key: 'email', label: 'Email' },
                          { key: 'Fullname', label: 'Full Name' },
                          { key: 'mobile_number', label: 'Mobile Number' }
                        ].map((field) => (
                          <div key={field.key} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm font-medium">{field.label}</span>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.adminPermissions.fieldPermissions[field.key]?.readOnly || false}
                                onChange={(e) => {
                                  setFormData({
                                    ...formData,
                                    adminPermissions: {
                                      ...formData.adminPermissions,
                                      fieldPermissions: {
                                        ...formData.adminPermissions.fieldPermissions,
                                        [field.key]: {
                                          visible: true,
                                          readOnly: e.target.checked
                                        }
                                      }
                                    }
                                  });
                                }}
                                className="rounded"
                              />
                              <span className="text-xs text-gray-600">Read-Only</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </details>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditModal && editingAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] overflow-y-auto p-2 sm:p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-2xl my-4 sm:my-8 max-h-[95vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Edit Admin</h2>
            <form onSubmit={handleEditAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.Fullname}
                  onChange={(e) => setFormData({...formData, Fullname: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  value={formData.mobile_number}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({...formData, mobile_number: value});
                  }}
                  maxLength="10"
                  pattern="[0-9]{10}"
                  className="w-full px-3 py-2 border rounded"
                  required
                  placeholder="10 digits only"
                />
              </div>

              {/* Admin Permissions Section */}
              <div className="border-t pt-4 mt-4">
                <details className="cursor-pointer" open>
                  <summary className="text-lg font-semibold mb-3">Admin Permissions & Visibility Settings</summary>
                  
                  <div className="mt-4 space-y-4">
                    {/* Visible Dashboard Sections */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Visible Dashboard Sections</label>
                      <div className="space-y-2">
                        {[
                          { key: 'dashboard', label: 'Dashboard', canBeReadOnly: false },
                          { key: 'patients', label: 'Patients', canBeReadOnly: true },
                          { key: 'doctors', label: 'Doctors', canBeReadOnly: true },
                          { key: 'physiotherapists', label: 'Physiotherapists', canBeReadOnly: true },
                          { key: 'sessions', label: 'Sessions', canBeReadOnly: true },
                          { key: 'payments', label: 'Payments', canBeReadOnly: true },
                          { key: 'referrals', label: 'Referrals', canBeReadOnly: false },
                          { key: 'contact', label: 'Contact', canBeReadOnly: false },
                          { key: 'blog', label: 'Blog', canBeReadOnly: false }
                        ].map((section) => (
                          <div key={section.key} className="flex items-center justify-between p-2 border rounded">
                            <label className="flex items-center space-x-2 cursor-pointer flex-1">
                              <input
                                type="checkbox"
                                checked={formData.adminPermissions?.visibleSections?.includes(section.key) || false}
                                onChange={(e) => {
                                  const sections = e.target.checked
                                    ? [...(formData.adminPermissions?.visibleSections || []), section.key]
                                    : (formData.adminPermissions?.visibleSections || []).filter(s => s !== section.key);
                                  setFormData({
                                    ...formData,
                                    adminPermissions: {
                                      ...formData.adminPermissions,
                                      visibleSections: sections,
                                      // Remove section permission if section is unchecked
                                      sectionPermissions: e.target.checked 
                                        ? formData.adminPermissions?.sectionPermissions
                                        : Object.fromEntries(
                                            Object.entries(formData.adminPermissions?.sectionPermissions || {}).filter(([key]) => key !== section.key)
                                          )
                                    }
                                  });
                                }}
                                className="rounded"
                              />
                              <span className="text-sm font-medium">{section.label}</span>
                            </label>
                            {section.canBeReadOnly && formData.adminPermissions?.visibleSections?.includes(section.key) && (
                              <label className="flex items-center space-x-2 cursor-pointer ml-4">
                                <input
                                  type="checkbox"
                                  checked={formData.adminPermissions?.sectionPermissions?.[section.key]?.readOnly || false}
                                  onChange={(e) => {
                                    setFormData({
                                      ...formData,
                                      adminPermissions: {
                                        ...formData.adminPermissions,
                                        sectionPermissions: {
                                          ...formData.adminPermissions?.sectionPermissions,
                                          [section.key]: {
                                            visible: true,
                                            readOnly: e.target.checked
                                          }
                                        }
                                      }
                                    });
                                  }}
                                  className="rounded"
                                />
                                <span className="text-xs text-gray-600">Read-Only</span>
                              </label>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Field Permissions */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Field Permissions (Read-Only Settings)</label>
                      <div className="space-y-2">
                        {[
                          { key: 'username', label: 'Username' },
                          { key: 'email', label: 'Email' },
                          { key: 'Fullname', label: 'Full Name' },
                          { key: 'mobile_number', label: 'Mobile Number' }
                        ].map((field) => (
                          <div key={field.key} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm font-medium">{field.label}</span>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.adminPermissions?.fieldPermissions?.[field.key]?.readOnly || false}
                                onChange={(e) => {
                                  setFormData({
                                    ...formData,
                                    adminPermissions: {
                                      ...formData.adminPermissions,
                                      fieldPermissions: {
                                        ...formData.adminPermissions?.fieldPermissions,
                                        [field.key]: {
                                          visible: true,
                                          readOnly: e.target.checked
                                        }
                                      }
                                    }
                                  });
                                }}
                                className="rounded"
                              />
                              <span className="text-xs text-gray-600">Read-Only</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </details>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingAdmin(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Admin Dashboard Component ---
const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const { logout, user } = useAuth();
  const authHeaders = { Authorization: `Bearer ${localStorage.getItem('accessToken')}` };
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ patients: [], doctors: [], physios: [], sessions: [], payments: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    total: 0,
    incomplete: 0,
    active: 0,
    inactive: 0,
    daily: [] // Add daily for date-wise stats
  });

  useEffect(() => {
    fetchUserProfile();
    // Fetch initial dashboard stats without a specific date range,
    // or with the default dateRange state if it's initialized with values.
    // The backend should handle the default (e.g., last 30 days) if no dates are provided.
    fetchDashboardStats(dateRange.startDate, dateRange.endDate);
  }, []); // Empty dependency array means this runs once on mount

  const handleDateChange = (e) => {
    setDateRange({ ...dateRange, [e.target.name]: e.target.value });
  };

  const handleFilter = () => {
    fetchDashboardStats(dateRange.startDate, dateRange.endDate);
  };

  const fetchDashboardStats = async (startDate, endDate) => { // Consolidated function
    try {
      const url = new URL('/api/v1/admin/patients/stats', window.location.origin);
      if (startDate) url.searchParams.append('startDate', startDate);
      if (endDate) url.searchParams.append('endDate', endDate);
      const response = await fetch(url, { headers: authHeaders });
      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      performSearch(searchQuery);
    }, 300); 
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/v1/users/me', {
        headers: authHeaders
      });
      if (response.ok) {
        const profileData = await response.json();
        setFormData({
          fullName: profileData.data.Fullname || '',
          username: profileData.data.username || '',
          email: profileData.data.email || '',
          phoneNumber: profileData.data.mobile_number || '',
          userType: profileData.data.userType || 'admin',
          avatar: null
        });
        setCurrentAvatar(profileData.data.avatar || null);
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
      // Update text fields (fullName, username, email)
      const updateResponse = await fetch('/api/v1/users/me', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': authHeaders.Authorization
        },
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
          headers: { 
            'Authorization': authHeaders.Authorization
          },
          credentials: 'include',
          body: formDataUpload
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.message || 'Failed to upload avatar');
        }
      }

      await fetchUserProfile();
      setFormData(prev => ({ ...prev, avatar: null }));
      setSuccess('✅ Profile updated successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancel = () => {
    navigate(-1); // Go back to the previous page
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/');
      setSidebarOpen(false);
      setProfileDropdownOpen(false);
    }
  };

  const performSearch = async (query) => {
    if (query.trim().length < 2) {
      setSearchResults({ patients: [], doctors: [], physios: [], sessions: [], payments: [] });
      setShowSearchDropdown(false);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(`/api/v1/admin/quick-search?query=${encodeURIComponent(query)}&limit=8`, {
        headers: authHeaders
      });
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.data);
        setShowSearchDropdown(true);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchResultClick = (result) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    setSearchResults({ patients: [], doctors: [], physios: [], sessions: [], payments: [] });

    if (result.type === 'patient') {
      navigate(`/admin/patients/${result._id}`);
    } else if (result.type === 'doctor') {
      navigate(`/admin/doctors/${result._id}`);
    } else if (result.type === 'physio') {
      navigate(`/admin/physiotherapists/${result._id}`);
    } else if (result.type === 'session') {
      navigate('/admin/sessions');
    } else if (result.type === 'payment') {
      navigate('/admin/payments');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading profile...</div>;
  const avatarSrc = currentAvatar;

  const renderAdminProfile = () => {
    return (
      <>
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Profile Settings</h1>
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
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Username <span className="text-red-500">*</span>
                {(() => {
                  const isReadOnly = (user?.userType === 'admin' && user?.Fullname !== 'Rohit kumar' && user?.Fullname !== 'Rohit Kumar') ||
                    (user?.adminPermissions?.fieldPermissions?.username?.readOnly === true);
                  return isReadOnly ? <span className="text-gray-500 text-xs ml-2">(Read-only)</span> : null;
                })()}
              </label>
              <input
                type="text"
                name="username"
                value={formData.username || ''}
                onChange={handleInputChange}
                required
                readOnly={(user?.userType === 'admin' && user?.Fullname !== 'Rohit kumar' && user?.Fullname !== 'Rohit Kumar') ||
                  (user?.adminPermissions?.fieldPermissions?.username?.readOnly === true)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  ((user?.userType === 'admin' && user?.Fullname !== 'Rohit kumar' && user?.Fullname !== 'Rohit Kumar') ||
                  (user?.adminPermissions?.fieldPermissions?.username?.readOnly === true))
                    ? 'bg-gray-100 cursor-not-allowed'
                    : ''
                }`}
                title={((user?.userType === 'admin' && user?.Fullname !== 'Rohit kumar' && user?.Fullname !== 'Rohit Kumar') ||
                  (user?.adminPermissions?.fieldPermissions?.username?.readOnly === true))
                  ? 'Username cannot be changed. Only Rohit kumar can change this.'
                  : ''}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Email <span className="text-red-500">*</span>
                {(() => {
                  const isReadOnly = (user?.userType === 'admin' && user?.Fullname !== 'Rohit kumar' && user?.Fullname !== 'Rohit Kumar') ||
                    (user?.adminPermissions?.fieldPermissions?.email?.readOnly === true);
                  return isReadOnly ? <span className="text-gray-500 text-xs ml-2">(Read-only)</span> : null;
                })()}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleInputChange}
                required
                readOnly={(user?.userType === 'admin' && user?.Fullname !== 'Rohit kumar' && user?.Fullname !== 'Rohit Kumar') ||
                  (user?.adminPermissions?.fieldPermissions?.email?.readOnly === true)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  ((user?.userType === 'admin' && user?.Fullname !== 'Rohit kumar' && user?.Fullname !== 'Rohit Kumar') ||
                  (user?.adminPermissions?.fieldPermissions?.email?.readOnly === true))
                    ? 'bg-gray-100 cursor-not-allowed'
                    : ''
                }`}
                title={((user?.userType === 'admin' && user?.Fullname !== 'Rohit kumar' && user?.Fullname !== 'Rohit Kumar') ||
                  (user?.adminPermissions?.fieldPermissions?.email?.readOnly === true))
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
                name="phoneNumber"
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
          </div>

          <div className="flex flex-col justify-start items-center">
            <div className="mb-4 text-center">
              <label className="block text-gray-700 text-sm font-bold mb-2">Your Photo</label>
              <div className="flex justify-center items-center gap-4 mb-3">
                {/* Current Avatar */}
                {avatarSrc ? (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Current:</p>
                    <img
                      src={avatarSrc}
                      alt="Current Avatar"
                      className="w-20 h-20 rounded-full object-cover border-2 border-teal-500"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-teal-600 flex items-center justify-center text-white text-2xl font-bold">
                    {formData.fullName?.charAt(0) || 'A'}
                  </div>
                )}
                {/* New Avatar Preview */}
                {formData.avatar && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">New:</p>
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
                className="block w-full text-sm text-gray-500
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-full file:border-0
                         file:text-sm file:font-semibold
                         file:bg-teal-50 file:text-teal-700
                         hover:file:bg-teal-100"
              />
              {/* <p className="text-xs text-gray-500 mt-2">Recommended: Square image (512x512 pixels)</p> */}
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
            onClick={handleSave}
            className="bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600"
          >
            Update Profile
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100 relative">
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setSidebarOpen(false)}></div>}
      
      {/* Sidebar */}
      <aside className={`w-64 bg-slate-600 text-white p-4 flex flex-col fixed inset-y-0 left-0 z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:z-auto`}>
        <div className="mb-4 flex items-center space-x-2">
          <img src="/assets/BoneBuddy_Logo-modified.webp" alt="BoneBuddy" className="w-12 h-12 rounded-full object-cover" />
          <h2 className="text-xl font-bold">BoneBuddy</h2>
        </div>
        <nav className="flex-1 overflow-y-auto"> {/* Added overflow-y-auto to sidebar nav */}
          <ul className="space-y-2">
            {/* Get visible sections from user permissions, or show all for Rohit Kumar */}
            {(() => {
              const isRohitKumar = user?.Fullname === 'Rohit kumar' || user?.Fullname === 'Rohit Kumar';
              const visibleSections = isRohitKumar 
                ? ['dashboard', 'patients', 'doctors', 'physiotherapists', 'sessions', 'payments', 'referrals', 'contact', 'blog', 'admins']
                : (user?.adminPermissions?.visibleSections || ['dashboard', 'patients', 'doctors', 'physiotherapists', 'sessions', 'payments', 'referrals', 'contact', 'blog']);
              
              const navigationItems = [
                { key: 'dashboard', path: '/admin', label: 'Dashboard', exact: true },
                { key: 'patients', path: '/admin/patients', label: 'Patient Record', startsWith: true },
                { key: 'sessions', path: '/admin/session-history', label: 'Session', exact: true },
                { key: 'sessions', path: '/admin/allocate-session', label: 'Allocate Session', exact: true },
                { key: 'doctors', path: '/admin/doctors', label: 'Doctors', startsWith: true },
                { key: 'physiotherapists', path: '/admin/physiotherapists', label: 'Physiotherapists', startsWith: true },
                { key: 'payments', path: '/admin/payments', label: 'Payments', exact: true },
                { key: 'referrals', path: '/admin/referrals', label: 'Referrals', exact: true },
                { key: 'contact', path: '/admin/contact', label: 'Contact Form', exact: true },
                { key: 'blog', path: '/admin/blog', label: 'Blog', exact: true }
              ];

              return navigationItems
                .filter(item => visibleSections.includes(item.key))
                .map((item) => {
                  const isActive = item.startsWith 
                    ? pathname.startsWith(item.path)
                    : item.exact
                    ? pathname === item.path
                    : pathname.startsWith(item.path);
                  
                  return (
                    <li key={item.path}>
                      <Link 
                        to={item.path} 
                        className={isActive ? 'block py-2 px-4 rounded bg-teal-600' : 'block py-2 px-4 rounded hover:bg-teal-600'} 
                        onClick={() => setSidebarOpen(false)}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                });
            })()}
            
            {/* Always show these */}
            <li><Link to="/admin/profile" className={pathname === '/admin/profile' ? 'block py-2 px-4 rounded bg-teal-600' : 'block py-2 px-4 rounded hover:bg-teal-600'} onClick={() => setSidebarOpen(false)}>Profile</Link></li>
            <li><Link to="/admin/change-usertype" className={pathname === '/admin/change-usertype' ? 'block py-2 px-4 rounded bg-teal-600' : 'block py-2 px-4 rounded hover:bg-teal-600'} onClick={() => setSidebarOpen(false)}>Change Role</Link></li>
            <li><Link to="/admin/support" className={pathname === '/admin/support' ? 'block py-2 px-4 rounded bg-teal-600' : 'block py-2 px-4 rounded hover:bg-teal-600'} onClick={() => setSidebarOpen(false)}>Support</Link></li>
            
            {/* Only show for Rohit Kumar */}
            {user?.Fullname === 'Rohit kumar' || user?.Fullname === 'Rohit Kumar' ? (
              <li><Link to="/admin/admins" className={pathname === '/admin/admins' ? 'block py-2 px-4 rounded bg-teal-600' : 'block py-2 px-4 rounded hover:bg-teal-600'} onClick={() => setSidebarOpen(false)}>All Admins</Link></li>
            ) : null}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      {/* Fixed: Changed overflow-y-hidden to overflow-y-auto to allow scrolling */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto md:ml-0"> 
        {/* Topbar */}
        <div className="bg-white rounded-lg shadow-md p-2 md:p-4 mb-4 md:mb-6 flex justify-between items-center sticky top-0 z-30 mx-2 md:mx-0 mt-2 md:mt-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden mr-4 text-gray-600 hover:text-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex-1 max-w-md relative">
            <input
              type="text"
              placeholder="Quick search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim().length >= 2 && setShowSearchDropdown(true)}
              onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {searchLoading && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-500"></div>
              </div>
            )}
            {showSearchDropdown && (searchResults.patients.length > 0 || searchResults.doctors.length > 0 || searchResults.physios.length > 0 || searchResults.sessions.length > 0 || searchResults.payments.length > 0) && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto mt-1">
                {searchResults.patients.map((patient) => (
                  <div
                    key={`patient-${patient._id}`}
                    onClick={() => handleSearchResultClick({ type: 'patient', _id: patient._id })}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium">Patient: {patient.name}</div>
                    <div className="text-sm text-gray-500">{patient.contact}</div>
                  </div>
                ))}
                {searchResults.doctors.map((doctor) => (
                  <div
                    key={`doctor-${doctor._id}`}
                    onClick={() => handleSearchResultClick({ type: 'doctor', _id: doctor._id })}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium">Doctor: {doctor.name}</div>
                    <div className="text-sm text-gray-500">{doctor.contact}</div>
                  </div>
                ))}
                {searchResults.physios.map((physio) => (
                  <div
                    key={`physio-${physio._id}`}
                    onClick={() => handleSearchResultClick({ type: 'physio', _id: physio._id })}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium">Physio: {physio.name}</div>
                    <div className="text-sm text-gray-500">{physio.contact}</div>
                  </div>
                ))}
                {searchResults.sessions.map((session) => (
                  <div
                    key={`session-${session._id}`}
                    onClick={() => handleSearchResultClick({ type: 'session', _id: session._id })}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium">Session: {session.type}</div>
                    <div className="text-sm text-gray-500">{session.date}</div>
                  </div>
                ))}
                {searchResults.payments.map((payment) => (
                  <div
                    key={`payment-${payment._id}`}
                    onClick={() => handleSearchResultClick({ type: 'payment', _id: payment._id })}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium">Payment: {payment.amount}</div>
                    <div className="text-sm text-gray-500">{payment.date}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {/* Notifications and Profile Dropdown logic */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="text-gray-600 hover:text-gray-800"
              >
                🔔
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-300 rounded-md shadow-lg z-50">
                  <div className="p-4">
                    <p className="text-sm text-gray-600">No new notifications</p>
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <div
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <img src={avatarSrc} alt="Admin" className="w-8 h-8 rounded-full object-cover" />
                <span className="text-sm text-gray-800">{formData.fullName || 'Admin'}</span>
              </div>
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-50">
                  <div className="py-1">
                    <Link to="/admin/profile" onClick={() => setProfileDropdownOpen(false)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Main Content Area */}
        {/* FIX 2: Added flex-1 to make this container take all remaining height and overflow-y-auto to make it scroll */}
        <div className="w-full bg-white rounded-lg shadow-md p-2 md:p-6 flex-1 overflow-y-auto mx-2 md:mx-0"> 
          {pathname === '/admin' && (
            <div className="mb-4 p-4 border rounded-lg bg-gray-50 flex flex-wrap items-center gap-4">
              <div>
                <label htmlFor="startDate" className="text-sm font-medium text-gray-700 mr-2">Start Date:</label>
                <input type="date" id="startDate" name="startDate" value={dateRange.startDate} onChange={handleDateChange} className="border-gray-300 rounded-md shadow-sm text-sm p-1"/>
              </div>
              <div>
                <label htmlFor="endDate" className="text-sm font-medium text-gray-700 mr-2">End Date:</label>
                <input type="date" id="endDate" name="endDate" value={dateRange.endDate} onChange={handleDateChange} className="border-gray-300 rounded-md shadow-sm text-sm p-1"/>
              </div>
              <button
                onClick={handleFilter}
                className="bg-teal-500 text-white px-4 py-1 rounded-md text-sm hover:bg-teal-600"
              >
                Filter
              </button>
            </div>
          )}
          <Routes>
            <Route path="logout" element={<button onClick={handleLogout} className="bg-red-500 text-white p-2 rounded">Confirm Logout</button>} />

            <Route index element={<Dashboard stats={dashboardStats} />} />
            
            <Route path="patients" element={<PatientRecord authHeaders={authHeaders} user={user} />} />
            <Route path="patients/:patientId" element={<RouteWrapper component={PatientRecord} componentProps={{ authHeaders: authHeaders, user: user }} />} />

            <Route path="doctors" element={<DoctorTable authHeaders={authHeaders} user={user} />} />
            <Route path="doctors/:doctorId" element={<RouteWrapper component={DoctorTable} componentProps={{ authHeaders: authHeaders, user: user }} />} />

            <Route path="physiotherapists" element={<PhysiotherapistTable authHeaders={authHeaders} user={user} />} />
            <Route path="physiotherapists/:physioId" element={<RouteWrapper component={PhysiotherapistTable} componentProps={{ authHeaders: authHeaders, user: user }} />} />
            
            <Route path="sessions" element={<PendingSessions authHeaders={authHeaders} user={user} />} />
            <Route path="session-history" element={<SessionHistory authHeaders={authHeaders} user={user} />} />
            <Route path="allocate-session" element={<AllocateSession authHeaders={authHeaders} user={user} />} />
            <Route path="profile" element={renderAdminProfile()} />
            
            <Route path="contact" element={<ContactSubmissions />} />
            <Route path="payments" element={<Payments user={user} />} />
            <Route path="referrals" element={<Referrals />} />
            {/* <Route path="services" element={<p>Content for Services will be added later.</p>} /> */}
            <Route path="change-usertype" element={<p></p>} />
            {/* <Route path="report" element={<p>Content for Report will be added later.</p>} /> */}
            <Route path="support" element={<p></p>} />
            <Route path="blog" element={<BlogManagement authHeaders={authHeaders} />} />
            <Route path="admins" element={<AdminList authHeaders={authHeaders} />} />
            
            <Route path="*" element={<p>404: Page not found. Content for **{pathname.split('/').pop().replace('-', ' ')}** will be added later.</p>} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;