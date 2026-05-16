import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlineCash, HiOutlineClock, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineRefresh, HiOutlineCreditCard, HiOutlineChartBar, HiOutlineExclamationCircle } from 'react-icons/hi';

const InvestmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [investment, setInvestment] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInvestmentDetails();
  }, [id]);

  const fetchInvestmentDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Fetching investment details for ID: ${id}`);
      
      const response = await api.get(`/investments/${id}`);
      console.log('Investment response:', response.data);
      
      if (response.data.success) {
        setInvestment(response.data.data);
        
        // Fetch payments separately
        const paymentsRes = await api.get(`/payments/history/${id}`);
        setPayments(paymentsRes.data.data?.payments || []);
      } else {
        setError(response.data.error || 'Failed to load investment');
      }
    } catch (error) {
      console.error('Error fetching investment details:', error);
      setError(error.response?.data?.error || 'Failed to load investment details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending_payment': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending Payment' },
      'active': { color: 'bg-green-100 text-green-800', text: 'Active' },
      'completed': { color: 'bg-blue-100 text-blue-800', text: 'Completed' },
      'withdrawn': { color: 'bg-gray-100 text-gray-800', text: 'Withdrawn' }
    };
    const badge = badges[status] || badges.pending_payment;
    return <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>{badge.text}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-neutral-600">Loading investment details...</p>
        </div>
      </div>
    );
  }

  if (error || !investment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg">
          <HiOutlineExclamationCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">Error</h3>
          <p className="text-neutral-600 mb-6">{error || 'Investment not found'}</p>
          <button onClick={() => navigate('/investments')} className="btn-primary">
            Back to Investments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <button onClick={() => navigate('/investments')} className="flex items-center text-neutral-600 hover:text-primestone-600 mb-6">
          <HiOutlineArrowLeft className="w-5 h-5 mr-2" /> Back to Investments
        </button>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                investment.investment_packages?.package_name === 'Platinum' ? 'bg-purple-100' :
                investment.investment_packages?.package_name === 'Gold' ? 'bg-yellow-100' :
                investment.investment_packages?.package_name === 'Silver' ? 'bg-gray-100' : 'bg-amber-100'
              }`}>
                <HiOutlineChartBar className={`w-8 h-8 ${
                  investment.investment_packages?.package_name === 'Platinum' ? 'text-purple-600' :
                  investment.investment_packages?.package_name === 'Gold' ? 'text-yellow-600' :
                  investment.investment_packages?.package_name === 'Silver' ? 'text-gray-600' : 'text-amber-600'
                }`} />
              </div>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold">{investment.investment_packages?.package_name} Investment</h1>
                  {getStatusBadge(investment.status)}
                </div>
                <p className="text-neutral-500 mt-1">ID: #{investment.id} • Created {new Date(investment.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4"><p className="text-xs text-neutral-500">Invested</p><p className="text-lg font-bold">${investment.investment_amount}</p></div>
          <div className="bg-white rounded-lg shadow p-4"><p className="text-xs text-neutral-500">Paid</p><p className="text-lg font-bold text-green-600">${investment.paid_amount || 0}</p></div>
          <div className="bg-white rounded-lg shadow p-4"><p className="text-xs text-neutral-500">Remaining</p><p className="text-lg font-bold text-yellow-600">${investment.remaining_amount || investment.investment_amount}</p></div>
          <div className="bg-white rounded-lg shadow p-4"><p className="text-xs text-neutral-500">Expected</p><p className="text-lg font-bold text-primestone-600">${investment.expected_return}</p></div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Payment History</h2>
          {payments.length === 0 ? (
            <p className="text-center text-neutral-500 py-8">No payments yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-neutral-50"><tr><th className="px-4 py-2 text-left">Date</th><th className="px-4 py-2 text-left">Amount</th><th className="px-4 py-2 text-left">Method</th><th className="px-4 py-2 text-left">Status</th></tr></thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id} className="border-b"><td className="px-4 py-2">{new Date(p.created_at).toLocaleDateString()}</td><td className="px-4 py-2">${p.amount}</td><td className="px-4 py-2">{p.payment_method || 'BTC'}</td><td className="px-4 py-2"><span className={`px-2 py-1 rounded-full text-xs ${p.status === 'confirmed' ? 'bg-green-100 text-green-800' : p.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{p.status}</span></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvestmentDetail;
