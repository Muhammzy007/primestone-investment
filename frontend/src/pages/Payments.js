import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineSearch,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineCreditCard,
  HiOutlineArrowRight,
  HiOutlineRefresh,
  HiOutlineExclamationCircle
} from 'react-icons/hi';

const Payments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/payments/history');
      setPayments(response.data.data.payments || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      if (error.response?.status === 404) {
        setError('Payments endpoint not found');
      } else if (error.response?.status === 401) {
        // Will be handled by interceptor
      } else {
        setError('Failed to load payments');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'confirmed': return <HiOutlineCheckCircle className="w-5 h-5 text-success" />;
      case 'pending': return <HiOutlineClock className="w-5 h-5 text-warning" />;
      case 'failed': return <HiOutlineXCircle className="w-5 h-5 text-error" />;
      default: return null;
    }
  };

  const filteredPayments = payments.filter(payment => {
    if (searchTerm) {
      return (payment.investment_id?.toString() || '').includes(searchTerm) ||
             (payment.transaction_hash || '').toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-neutral-600">Loading payments...</p>
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
            onClick={fetchPayments}
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
            Payments
          </h1>
          <p className="text-neutral-600 mt-1">
            Track and manage all your payment transactions
          </p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by investment ID or transaction hash..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primestone-500"
            />
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Investment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Hash</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/investments/${payment.investment_id}`} className="text-primestone-600 hover:text-primestone-700">
                          #{payment.investment_id}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        ${payment.amount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {payment.payment_method || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(payment.status)}
                          <span className={`ml-1 text-sm ${
                            payment.status === 'confirmed' ? 'text-success' :
                            payment.status === 'pending' ? 'text-warning' : 'text-error'
                          }`}>
                            {payment.status || 'pending'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {payment.user_transaction_hash ? (
                          <span className="font-mono text-xs">
                            {payment.user_transaction_hash.substring(0, 10)}...
                          </span>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-neutral-500">
                      No payments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payments;
