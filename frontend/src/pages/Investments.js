import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlineChartBar,
  HiOutlineCash,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineRefresh,
  HiOutlineCreditCard,
  HiOutlineExclamationCircle,
  HiOutlineArrowLeft
} from 'react-icons/hi';

const Investments = () => {
  const { user } = useAuth();
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);

  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchInvestments = async () => {
    setLoading(true);
    setError(null);
    setErrorDetails(null);
    try {
      console.log('Fetching investments...');
      const response = await api.get('/investments/my-investments');
      console.log('Investments response:', response.data);
      setInvestments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching investments:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      let errorMsg = 'Failed to load investments';
      let details = null;

      if (error.response?.status === 404) {
        errorMsg = 'API endpoint not found';
        details = error.response?.data;
      } else if (error.response?.status === 401) {
        errorMsg = 'Session expired. Please login again.';
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
        details = error.response.data;
      } else if (error.message) {
        details = error.message;
      }

      setError(errorMsg);
      setErrorDetails(details);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending_payment': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      'active': { color: 'bg-green-100 text-green-800', text: 'Active' },
      'completed': { color: 'bg-blue-100 text-blue-800', text: 'Completed' },
      'withdrawn': { color: 'bg-gray-100 text-gray-800', text: 'Withdrawn' }
    };
    const badge = badges[status] || badges.pending_payment;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>{badge.text}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-neutral-600">Loading investments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <HiOutlineExclamationCircle className="w-16 h-16 text-error mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Error Loading Investments</h3>
            <p className="text-neutral-600 mb-4">{error}</p>
            {errorDetails && (
              <div className="bg-neutral-100 p-4 rounded-lg text-left mb-4 overflow-auto max-h-40">
                <pre className="text-xs font-mono text-neutral-700 break-all">
                  {typeof errorDetails === 'object' ? JSON.stringify(errorDetails, null, 2) : errorDetails}
                </pre>
              </div>
            )}
          </div>
          <div className="flex flex-col space-y-3">
            <button
              onClick={fetchInvestments}
              className="btn-primary"
            >
              Retry
            </button>
            <Link
              to="/dashboard"
              className="text-primestone-600 hover:text-primestone-700 text-center flex items-center justify-center"
            >
              <HiOutlineArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-primestone-900">
              My Investments
            </h1>
            <p className="text-neutral-600 mt-1">
              Welcome back, {user?.username}
            </p>
          </div>
          <Link
            to="/investments/new"
            className="btn-primary flex items-center"
          >
            <HiOutlinePlus className="w-5 h-5 mr-2" />
            New Investment
          </Link>
        </div>

        {/* Investments List */}
        {investments.length > 0 ? (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Package</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Paid</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {investments.map((inv) => (
                    <tr key={inv.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{inv.package_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">${inv.investment_amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-success">${inv.paid_amount || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(inv.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/investments/${inv.id}`} className="text-primestone-600 hover:text-primestone-700 font-medium">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <HiOutlineChartBar className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No investments yet</h3>
            <p className="text-neutral-500 mb-6">Start your investment journey today</p>
            <Link to="/investments/new" className="btn-primary inline-flex items-center">
              <HiOutlinePlus className="w-5 h-5 mr-2" />
              Create New Investment
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Investments;
