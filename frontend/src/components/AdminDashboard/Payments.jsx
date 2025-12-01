import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../hooks/useAuth';

// Helper function to check if a section is read-only for the current admin
const isSectionReadOnly = (user, sectionKey) => {
  if (!user || !user.adminPermissions) return false;
  const isRohitKumar = user.Fullname === 'Rohit kumar' || user.Fullname === 'Rohit Kumar';
  if (isRohitKumar) return false; // Rohit Kumar has full access
  
  const sectionPerm = user.adminPermissions.sectionPermissions?.[sectionKey];
  return sectionPerm?.readOnly === true;
};

const Payments = ({ user: userProp }) => {
  const { user: userFromAuth } = useAuth();
  const user = userProp || userFromAuth;
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const [formData, setFormData] = useState({
    patientId: '',
    userId: '',
    amount: '',
    description: '',
    paymentType: 'session',
    dueDate: '',
    notes: '',
    sessionCount: ''
  });

  useEffect(() => {
    fetchPayments();
    fetchPatients();
  }, [statusFilter, page]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        status: statusFilter === 'all' ? '' : statusFilter,
        page,
        limit
      });
      const response = await apiClient.get(`/admin/payments?${query}`);
      setPayments(response.data.data.payments || []);
      setTotal(response.data.data.total || 0);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await apiClient.get('/admin/patients?limit=1000');
      setPatients(response.data.data.patients || []);
    } catch (err) {
      console.error('Error fetching patients:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.patientId || !formData.userId || !formData.amount || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.paymentType === 'session') {
      const count = Number(formData.sessionCount);
      if (!count || count <= 0) {
        alert('Please specify how many sessions are being covered by this payment');
        return;
      }
    }

    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount),
        sessionCount: formData.paymentType === 'session' ? Number(formData.sessionCount) : 0
      };
      await apiClient.post('/admin/payments', payload);
      alert('Payment request sent successfully!');
      setShowModal(false);
      resetForm();
      fetchPayments();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to create payment request';
      alert(`Error: ${errorMsg}`);
    }
  };

  const handleStatusUpdate = async (paymentId, newStatus) => {
    try {
      await apiClient.patch(`/admin/payments/${paymentId}`, { status: newStatus });
      alert('Payment status updated successfully!');
      fetchPayments();
    } catch (err) {
      alert(`Error: ${err.response?.data?.message || 'Failed to update payment'}`);
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: '',
      userId: '',
      amount: '',
      description: '',
      paymentType: 'session',
      dueDate: '',
      notes: '',
      sessionCount: ''
    });
  };

  const handlePatientSelect = (e) => {
    const selectedPatient = patients.find(p => p.patientId === e.target.value);
    if (selectedPatient) {
      setFormData({
        ...formData,
        patientId: selectedPatient.patientId,
        userId: selectedPatient._id // User ID
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Payment Management</h2>
        {!isSectionReadOnly(user, 'payments') && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Send Payment Request
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Payments Table */}
      {loading ? (
        <p className="text-center py-8">Loading payments...</p>
      ) : payments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No payment requests found</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sessions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{payment.patientName || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{payment.patientMobile}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">₹{payment.amount}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{payment.description}</div>
                    {payment.notes && <div className="text-xs text-gray-500 mt-1">{payment.notes}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">{payment.paymentType}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.sessionCount > 0 ? (
                      <>
                        <div className="font-semibold">{payment.sessionCount} booked</div>
                        <div className="text-xs text-gray-500">{payment.sessionsRemaining ?? Math.max(payment.sessionCount - (payment.sessionsAllocated || 0), 0)} remaining</div>
                      </>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {payment.status === 'pending' && (
                      <>
                        {!isSectionReadOnly(user, 'payments') ? (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(payment._id, 'completed')}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              Mark Paid
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(payment._id, 'cancelled')}
                              className="text-red-600 hover:text-red-900"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs">Read-only</span>
                        )}
                      </>
                    )}
                    {payment.status === 'completed' && (
                      <span className="text-green-600">✓ Paid on {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : 'N/A'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="mt-6 flex justify-between items-center">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>Page {page} of {Math.ceil(total / limit)}</span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page >= Math.ceil(total / limit)}
          className="px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Create Payment Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[95vh]">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="text-lg md:text-xl font-bold text-gray-900">Send Payment Request</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close payment modal"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Select Patient <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.patientId}
                    onChange={handlePatientSelect}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Select Patient --</option>
                    {patients.map((patient) => (
                      <option key={patient.patientId} value={patient.patientId}>
                        {patient.name} - {patient.mobileNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="1"
                    required
                  />
                </div>

                <div className="flex flex-col md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Physiotherapy Session Payment"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Payment Type
                  </label>
                  <select
                    value={formData.paymentType}
                    onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="session">Session Fee</option>
                    <option value="consultation">Consultation Fee</option>
                    <option value="report">Report Fee</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {formData.paymentType === 'session' && (
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">
                      Number of Sessions <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.sessionCount}
                      onChange={(e) => setFormData({ ...formData, sessionCount: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="How many sessions does this payment cover?"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Sessions can only be scheduled up to this amount after payment is completed.
                    </p>
                  </div>
                )}

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  placeholder="Additional notes (optional)"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[90px]"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-center"
                >
                  Send Request
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-500 text-white py-2.5 rounded-lg hover:bg-gray-600 transition-colors text-center"
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

export default Payments;

