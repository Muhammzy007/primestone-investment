import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { HiOutlineArrowLeft, HiOutlineClock, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi';

const Payments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await api.get('/payments/my-payments');
      setPayments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'confirmed': return <span className="flex items-center text-green-600"><HiOutlineCheckCircle className="w-4 h-4 mr-1" /> Confirmed</span>;
      case 'pending': return <span className="flex items-center text-yellow-600"><HiOutlineClock className="w-4 h-4 mr-1" /> Pending</span>;
      case 'failed': return <span className="flex items-center text-red-600"><HiOutlineXCircle className="w-4 h-4 mr-1" /> Failed</span>;
      default: return <span className="text-gray-500">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center"><div className="spinner mb-4"></div><p>Loading payments...</p></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <Link to="/dashboard" className="inline-flex items-center text-primestone-600 hover:text-primestone-700 mb-6">
          <HiOutlineArrowLeft className="w-5 h-5 mr-2" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-display font-bold text-primestone-900 mb-6">My Payments</h1>
        
        {payments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-neutral-500">No payments found</p>
            <Link to="/investments/new" className="btn-primary mt-4 inline-block">Start Investing</Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Investment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 text-sm">{new Date(payment.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">#{payment.investment_id}</td>
                    <td className="px-6 py-4 text-sm font-medium">${payment.amount}</td>
                    <td className="px-6 py-4 text-sm">{payment.payment_method || 'BTC'}</td>
                    <td className="px-6 py-4 text-sm">{getStatusBadge(payment.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;
