import React, { useState, useEffect } from 'react';

const Referrals = () => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchReferrals();
  }, [statusFilter, searchTerm, page]);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/v1/referrals/all?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setReferrals(data.data.docs || data.data || []);
        setTotalPages(data.data.totalPages || 1);
      } else {
        console.error('Failed to fetch referrals');
      }
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (referralId, newStatus) => {
    try {
      const response = await fetch(`/api/v1/referrals/${referralId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchReferrals();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      contacted: 'bg-blue-100 text-blue-800',
      registered: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading referrals...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Doctor Referrals</h1>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search by name, phone, email, condition..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="contacted">Contacted</option>
          <option value="registered">Registered</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Referrals Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {referrals.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  No referrals found
                </td>
              </tr>
            ) : (
              referrals.map((referral) => (
                <tr key={referral._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    {new Date(referral.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium">{referral.doctorName || referral.doctor?.name || 'N/A'}</div>
                    {referral.doctor?.email && (
                      <div className="text-xs text-gray-500">{referral.doctor.email}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium">{referral.patientName}</div>
                    {referral.patientAge && referral.patientGender && (
                      <div className="text-xs text-gray-500">
                        {referral.patientAge} years, {referral.patientGender}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div>{referral.patientPhone}</div>
                    {referral.patientEmail && (
                      <div className="text-xs text-gray-500">{referral.patientEmail}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium">{referral.condition}</div>
                    {referral.surgeryType && (
                      <div className="text-xs text-gray-500">{referral.surgeryType}</div>
                    )}
                    {referral.surgeryDate && (
                      <div className="text-xs text-gray-500">
                        Surgery: {new Date(referral.surgeryDate).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {getStatusBadge(referral.status)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-col gap-1">
                      {referral.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(referral._id, 'contacted')}
                            className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                          >
                            Mark Contacted
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(referral._id, 'rejected')}
                            className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {referral.status === 'contacted' && (
                        <button
                          onClick={() => handleStatusUpdate(referral._id, 'registered')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Mark Registered
                        </button>
                      )}
                      {referral.notes && (
                        <button
                          onClick={() => alert(`Notes: ${referral.notes}`)}
                          className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                        >
                          View Notes
                        </button>
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
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Referrals;

