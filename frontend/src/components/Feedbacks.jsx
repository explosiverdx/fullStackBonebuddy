import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const Feedbacks = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updating, setUpdating] = useState(null);
    const { authHeaders } = useAuth();

    useEffect(() => {
        fetchFeedbacks();
    }, [authHeaders]);

    const fetchFeedbacks = async () => {
        try {
            const response = await fetch('/api/v1/admin/feedbacks', {
                headers: authHeaders,
            });
            if (!response.ok) {
                throw new Error('Failed to fetch feedbacks');
            }
            const data = await response.json();
            setFeedbacks(data.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePublic = async (feedbackId, currentStatus) => {
        setUpdating(feedbackId);
        try {
            const response = await fetch(`/api/v1/admin/feedbacks/${feedbackId}/status`, {
                method: 'PATCH',
                headers: {
                    ...authHeaders,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isPublic: !currentStatus }),
            });
            if (!response.ok) {
                throw new Error('Failed to update feedback status');
            }
            // Refresh the list
            await fetchFeedbacks();
        } catch (err) {
            alert('Error updating feedback: ' + err.message);
        } finally {
            setUpdating(null);
        }
    };

    const handleDelete = async (feedbackId) => {
        if (!window.confirm('Are you sure you want to delete this feedback?')) {
            return;
        }
        setUpdating(feedbackId);
        try {
            const response = await fetch(`/api/v1/admin/feedbacks/${feedbackId}`, {
                method: 'DELETE',
                headers: authHeaders,
            });
            if (!response.ok) {
                throw new Error('Failed to delete feedback');
            }
            // Refresh the list
            await fetchFeedbacks();
        } catch (err) {
            alert('Error deleting feedback: ' + err.message);
        } finally {
            setUpdating(null);
        }
    };

    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, index) => (
            <span
                key={index}
                className={index < rating ? 'text-yellow-400' : 'text-gray-300'}
                style={{ fontSize: '1.2rem' }}
            >
                ★
            </span>
        ));
    };

    if (loading) return <div className="text-center p-4">Loading feedbacks...</div>;
    if (error) return <div className="text-center p-4 text-red-500">Error: {error}</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Feedback Management</h1>
                <button
                    onClick={fetchFeedbacks}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Refresh
                </button>
            </div>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full table-auto">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {feedbacks.length > 0 ? (
                                feedbacks.map((feedback) => (
                                    <tr key={feedback._id} className={feedback.isPublic ? 'bg-green-50' : ''}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(feedback.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {feedback.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {renderStars(feedback.rating)}
                                                <span className="ml-2 text-sm text-gray-600">({feedback.rating}/5)</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                                            <div className="truncate" title={feedback.message}>
                                                {feedback.message}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {feedback.user ? (
                                                <div>
                                                    <div className="font-medium">{feedback.user.Fullname || 'N/A'}</div>
                                                    {feedback.user.email && (
                                                        <div className="text-xs text-gray-400">{feedback.user.email}</div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">Guest</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                    feedback.isPublic
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}
                                            >
                                                {feedback.isPublic ? 'Public' : 'Private'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleTogglePublic(feedback._id, feedback.isPublic)}
                                                    disabled={updating === feedback._id}
                                                    className={`px-3 py-1 rounded text-xs font-semibold ${
                                                        feedback.isPublic
                                                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                                                    } disabled:opacity-50`}
                                                >
                                                    {updating === feedback._id
                                                        ? '...'
                                                        : feedback.isPublic
                                                        ? 'Make Private'
                                                        : 'Make Public'}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(feedback._id)}
                                                    disabled={updating === feedback._id}
                                                    className="px-3 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold hover:bg-red-200 disabled:opacity-50"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                        No feedbacks yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Feedbacks;
