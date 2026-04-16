import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineRefresh,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineEye,
  HiOutlineArrowRight,
  HiOutlineExclamationCircle
} from 'react-icons/hi';

const Withdrawals = () => {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/withdrawals/history');
      setWithdrawals(response.data.data || []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      if (error.response?.status === 404) {
        setError('Withdrawals endpoint not found');
      } else if (error.response?.status === 401) {
        // Will be handled by interceptor
      } else {
        setError('Failed to load withdrawals');
      }
    } finally {
      setLoading(false);
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
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-primestone-900">
            Withdrawals
          </h1>
          <p className="text-neutral-600 mt-1">
            Track your withdrawal requests
          </p>
        </div>

        {/* Withdrawals List */}
        {withdrawals.length > 0 ? (
          <div className="space-y-4">
            {withdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div className="flex items-center space-x-3 mb-2 md:mb-0">
                    <div className="w-10 h-10 bg-primestone-100 rounded-lg flex items-center justify-center">
                      <HiOutlineRefresh className="w-5 h-5 text-primestone-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900">
                        Withdrawal Request #{withdrawal.id}
                      </h3>
                      <p className="text-sm text-neutral-500">
                        {new Date(withdrawal.requested_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(withdrawal.status)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-neutral-500">Amount</p>
                    <p className="font-semibold text-primestone-600">${withdrawal.requested_amount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Network</p>
                    <p className="font-semibold">{withdrawal.user_wallet_chain || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Fee</p>
                    <p className="font-semibold text-success">$500</p>
                  </div>
                </div>

                {withdrawal.status === 'approved' && withdrawal.company_transaction_hash && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-blue-700">
                      Transaction: {withdrawal.company_transaction_hash.substring(0, 20)}...
                    </p>
                  </div>
                )}

                {withdrawal.status === 'rejected' && withdrawal.admin_notes && (
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-xs text-red-700">
                      Reason: {withdrawal.admin_notes}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <Link
                    to={`/withdrawals/${withdrawal.id}`}
                    className="text-primestone-600 hover:text-primestone-700 text-sm font-medium flex items-center"
                  >
                    View Details
                    <HiOutlineArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <HiOutlineRefresh className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No withdrawal requests</h3>
            <p className="text-neutral-500">
              When you make a withdrawal request, it will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Withdrawals;
