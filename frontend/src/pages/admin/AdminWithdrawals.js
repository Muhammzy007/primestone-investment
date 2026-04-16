import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineRefresh,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineEye,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineCash
} from 'react-icons/hi';

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/withdrawals/pending');
      setWithdrawals(response.data.data || []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      if (error.response?.status === 404) {
        setError('Withdrawals endpoint not found');
      } else if (error.response?.status === 403) {
        setError('Admin access required');
      } else {
        setError('Failed to load withdrawals');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!transactionHash) {
      toast.error('Please enter transaction hash');
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/admin/withdrawals/${selectedWithdrawal.id}/approve`, {
        transactionHash,
        notes: 'Approved by admin'
      });
      toast.success('Withdrawal approved successfully');
      setShowApproveModal(false);
      setTransactionHash('');
      fetchWithdrawals();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason) {
      toast.error('Please provide a reason');
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/admin/withdrawals/${selectedWithdrawal.id}/reject`, {
        reason: rejectReason
      });
      toast.success('Withdrawal rejected');
      setShowRejectModal(false);
      setRejectReason('');
      fetchWithdrawals();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      'approved': { color: 'bg-green-100 text-green-800', text: 'Approved' },
      'completed': { color: 'bg-blue-100 text-blue-800', text: 'Completed' },
      'rejected': { color: 'bg-red-100 text-red-800', text: 'Rejected' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-neutral-600">Loading withdrawals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg">
          <HiOutlineExclamationCircle className="w-16 h-16 text-error mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">Error</h3>
          <p className="text-neutral-600 mb-6">{error}</p>
          <button
            onClick={fetchWithdrawals}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-primestone-900">
              Withdrawal Requests
            </h1>
            <p className="text-neutral-600 mt-1">
              Review and process withdrawal requests
            </p>
          </div>
          <button
            onClick={fetchWithdrawals}
            className="btn-primary flex items-center"
          >
            <HiOutlineRefresh className="w-5 h-5 mr-2" />
            Refresh
          </button>
        </div>

        {/* Withdrawals Table */}
        {withdrawals.length > 0 ? (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {withdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        #{withdrawal.id}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium">{withdrawal.username}</p>
                          <p className="text-xs text-neutral-500">{withdrawal.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-semibold text-primestone-600">
                          ${withdrawal.requested_amount}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(withdrawal.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                        {new Date(withdrawal.requested_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setShowApproveModal(true);
                            }}
                            className="text-green-600 hover:text-green-700 p-1"
                            title="Approve"
                          >
                            <HiOutlineCheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setShowRejectModal(true);
                            }}
                            className="text-red-600 hover:text-red-700 p-1"
                            title="Reject"
                          >
                            <HiOutlineXCircle className="w-5 h-5" />
                          </button>
                          <button
                            className="text-primestone-600 hover:text-primestone-700 p-1"
                            title="View Details"
                          >
                            <HiOutlineEye className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <HiOutlineCash className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No pending withdrawals</h3>
            <p className="text-neutral-500">
              All withdrawal requests have been processed
            </p>
          </div>
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-primestone-900 mb-4">Approve Withdrawal</h2>
              
              <div className="mb-4">
                <p className="text-sm text-neutral-600 mb-2">
                  Approving withdrawal for <span className="font-semibold">{selectedWithdrawal.username}</span>
                </p>
                <p className="text-sm text-neutral-600 mb-4">
                  Amount: <span className="font-semibold text-primestone-600">${selectedWithdrawal.requested_amount}</span>
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Transaction Hash
                </label>
                <input
                  type="text"
                  value={transactionHash}
                  onChange={(e) => setTransactionHash(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primestone-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setSelectedWithdrawal(null);
                    setTransactionHash('');
                  }}
                  className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-primestone-900 mb-4">Reject Withdrawal</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Reason for Rejection
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primestone-500"
                  placeholder="Please provide a reason..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedWithdrawal(null);
                    setRejectReason('');
                  }}
                  className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWithdrawals;
