import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlineCash, HiOutlineClock, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi';

const Withdrawals = () => {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [btcAddress, setBtcAddress] = useState('');
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [withdrawalsRes, investmentsRes] = await Promise.all([
        api.get('/withdrawals/my-withdrawals'),
        api.get('/investments/my-investments')
      ]);
      setWithdrawals(withdrawalsRes.data.data || []);
      const activeInvestments = (investmentsRes.data.data || []).filter(inv => inv.status === 'active' || inv.status === 'completed');
      setInvestments(activeInvestments);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInvestmentSelect = (investmentId) => {
    const inv = investments.find(i => i.id === parseInt(investmentId));
    setSelectedInvestment(inv);
    if (inv && inv.expected_return) {
      setAmount(inv.expected_return.toString());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvestment) {
      toast.error('Please select an investment');
      return;
    }
    if (!amount || parseFloat(amount) < (selectedInvestment.expected_return || 100)) {
      toast.error(`Minimum withdrawal amount is $${selectedInvestment.expected_return || 100}`);
      return;
    }
    if (!btcAddress) {
      toast.error('Please enter your BTC wallet address');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/withdrawals/request', { 
        amount: parseFloat(amount), 
        btcAddress,
        investmentId: selectedInvestment.id
      });
      toast.success('Withdrawal request submitted! Admin will process shortly.');
      setShowForm(false);
      setAmount('');
      setBtcAddress('');
      setSelectedInvestment(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Withdrawal request failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return <span className="flex items-center text-green-600"><HiOutlineCheckCircle className="w-4 h-4 mr-1" /> Approved</span>;
      case 'pending': return <span className="flex items-center text-yellow-600"><HiOutlineClock className="w-4 h-4 mr-1" /> Pending</span>;
      case 'rejected': return <span className="flex items-center text-red-600"><HiOutlineXCircle className="w-4 h-4 mr-1" /> Rejected</span>;
      default: return <span className="text-gray-500">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center"><div className="spinner mb-4"></div><p>Loading withdrawals...</p></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <Link to="/dashboard" className="inline-flex items-center text-primestone-600 hover:text-primestone-700 mb-6">
          <HiOutlineArrowLeft className="w-5 h-5 mr-2" /> Back to Dashboard
        </Link>
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-primestone-900">Withdrawals</h1>
            <p className="text-neutral-500 text-sm mt-1">Active investments: {investments.length}</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? 'Cancel' : 'Request Withdrawal'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-primestone-900 mb-4">Request Withdrawal</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Select Investment</label>
                <select 
                  className="w-full px-4 py-2 border rounded-lg"
                  onChange={(e) => handleInvestmentSelect(e.target.value)}
                  value={selectedInvestment?.id || ''}
                  required
                >
                  <option value="">Select an investment...</option>
                  {investments.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.investment_packages?.package_name} - Invested: ${inv.investment_amount} | Expected Return: ${inv.expected_return}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Amount (USD)</label>
                <div className="relative">
                  <HiOutlineCash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                  <input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                    placeholder={`Minimum: $${selectedInvestment?.expected_return || 100}`}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg" 
                    min={selectedInvestment?.expected_return || 100}
                    step="0.01" 
                    required 
                  />
                </div>
                {selectedInvestment && (
                  <p className="text-xs text-neutral-500 mt-1">Minimum withdrawal amount: ${selectedInvestment.expected_return} (Your expected return)</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">BTC Wallet Address</label>
                <input 
                  type="text" 
                  value={btcAddress} 
                  onChange={(e) => setBtcAddress(e.target.value)} 
                  placeholder="Enter your BTC address" 
                  className="w-full px-4 py-2 border rounded-lg" 
                  required 
                />
              </div>
              <button type="submit" disabled={submitting} className="w-full bg-primestone-600 text-white py-2 rounded-lg hover:bg-primestone-700 disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        )}

        {withdrawals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-neutral-500">No withdrawal requests found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">BTC Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {withdrawals.map((wd) => (
                  <tr key={wd.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 text-sm">{new Date(wd.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm font-medium">${wd.amount}</td>
                    <td className="px-6 py-4 text-sm font-mono">{wd.btc_address?.substring(0, 20)}...</td>
                    <td className="px-6 py-4 text-sm">{getStatusBadge(wd.status)}</td>
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

export default Withdrawals;
