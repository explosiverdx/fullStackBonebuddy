import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const ContactSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { authHeaders } = useAuth();

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await fetch('/api/v1/admin/contact-submissions', {
          headers: authHeaders,
        });
        if (!response.ok) {
          throw new Error('Failed to fetch submissions');
        }
        const data = await response.json();
        setSubmissions(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [authHeaders]);

  if (loading) return <div className="text-center p-4">Loading submissions...</div>;
  if (error) return <div className="text-center p-4 text-red-500">Error: {error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Contact Form Submissions</h1>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {submissions.length > 0 ? (
                submissions.map((sub) => (
                  <tr key={sub._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(sub.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sub.firstName} {sub.lastName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{sub.message}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No submissions yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ContactSubmissions;