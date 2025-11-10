import React, { useState, useEffect } from 'react';

const PendingSessions = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const authHeaders = { Authorization: `Bearer ${localStorage.getItem('accessToken')}` };

  useEffect(() => {
    fetchPendingAppointments();
  }, []);

  const fetchPendingAppointments = async () => {
    try {
      const response = await fetch('/api/v1/appointments/admin/pending', {
        headers: authHeaders
      });
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.data.docs || []);
      } else {
        setError('Failed to fetch pending appointments');
      }
    } catch (err) {
      setError(`Error fetching appointments: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (appointmentId, action, newData = {}) => {
    try {
      const body = { ...newData };
      if (action === 'approve') body.status = 'scheduled';
      else if (action === 'cancel') body.status = 'canceled';
      else if (action === 'reschedule') body.appointmentDate = newData.appointmentDate;
      else if (action === 'assign') {
        body.physioId = newData.physioId;
        body.appointmentDate = newData.appointmentDate;
      }

      const response = await fetch(`/api/v1/appointments/admin/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        fetchPendingAppointments(); // Refresh list
      } else {
        setError('Failed to update appointment');
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

  const [assigningAppointmentId, setAssigningAppointmentId] = useState(null);
  const [physioId, setPhysioId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');

  const handleAssignClick = (appointmentId) => {
    setAssigningAppointmentId(appointmentId);
  };

  const handleAssignSubmit = () => {
    if (physioId && appointmentDate) {
      handleAction(assigningAppointmentId, 'assign', { physioId, appointmentDate: new Date(appointmentDate).toISOString() });
      setAssigningAppointmentId(null);
      setPhysioId('');
      setAppointmentDate('');
    }
  };

  if (loading) return <div className="text-center">Loading pending sessions...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Pending Sessions</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Therapist</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {appointments.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">No pending sessions.</td>
              </tr>
            ) : (
              appointments.map((appt) => (
                <tr key={appt._id} className={isUpcoming(appt.appointmentDate) ? 'bg-yellow-50 border-yellow-300' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(appt.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{appt.patient.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{appt.physio.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(appt.appointmentDate).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{appt.sessionType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      {appt.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {isUpcoming(appt.appointmentDate) && (
                      <span className="text-yellow-700 mr-2">⚠️ Upcoming</span>
                    )}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAction(appt._id, 'approve')}
                        className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          const newDate = prompt('Enter new date (YYYY-MM-DDTHH:MM):', new Date(appt.appointmentDate).toISOString().slice(0, 16));
                          if (newDate) handleAction(appt._id, 'reschedule', { appointmentDate: new Date(newDate).toISOString() });
                        }}
                        className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => handleAssignClick(appt._id)}
                        className="bg-purple-500 text-white px-2 py-1 rounded text-xs hover:bg-purple-600"
                      >
                        Assign
                      </button>

                      {assigningAppointmentId === appt._id && (
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
                          <div className="bg-white p-8 rounded-lg shadow-xl">
                            <h3 className="text-lg font-bold mb-4">Assign Session</h3>
                            <div className="mb-4">
                              <label htmlFor="physioId" className="block text-sm font-medium text-gray-700">Physio ID</label>
                              <input
                                type="text"
                                id="physioId"
                                value={physioId}
                                onChange={(e) => setPhysioId(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              />
                            </div>
                            <div className="mb-4">
                              <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700">Appointment Date</label>
                              <input
                                type="datetime-local"
                                id="appointmentDate"
                                value={appointmentDate}
                                onChange={(e) => setAppointmentDate(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              />
                            </div>
                            <div className="flex justify-end space-x-4">
                              <button
                                onClick={() => setAssigningAppointmentId(null)}
                                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleAssignSubmit}
                                className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600"
                              >
                                Assign
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => handleAction(appt._id, 'cancel')}
                        className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
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

export default PendingSessions;
