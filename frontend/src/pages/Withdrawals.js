import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlineCash, HiOutlineClock, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineRefresh } from 'react-icons/hi';

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

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [withdrawalsRes, investmentsRes] = await Promise.all([
        api.get('/withdrawals/my-withdrawals'),
        api.get('/investments/my-investments')
      ]);
      setWithdrawals(withdrawalsRes.data.data || []);
      const activeInvestments = (investmentsRes.data.data || []).filter(inv => inv.status === 'active');
      setInvestments(activeInvestments);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleInvestmentSelect = (investmentId) => {
    const inv = investments.find(i => i.id === parseInt(investmentId));
    setSelectedInvestment(inv);
    if (inv && inv.expected_return) setAmount(inv.expected_return.toString());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvestment) return toast.error('Select an investment');
    if (!amount || parseFloat(amount) < selectedInvestment.expected_return) return toast.error(`Minimum withdrawal $${selectedInvestment.expected_return}`);
    if (!btcAddress) return toast.error('Enter BTC address');
    setSubmitting(true);
    try {
      await api.post('/withdrawals/request', { amount: parseFloat(amount), btcAddress, investmentId: selectedInvestment.id });
      toast.success('Request submitted!');
      setShowForm(false); setAmount(''); setBtcAddress(''); setSelectedInvestment(null);
      fetchData();
    } catch (error) { toast.error(error.response?.data?.error || 'Request failed'); }
    finally { setSubmitting(false); }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return <span className="text-green-600"><HiOutlineCheckCircle className="inline w-4 h-4 mr-1" /> Approved</span>;
      case 'pending': return <span className="text-yellow-600"><HiOutlineClock className="inline w-4 h-4 mr-1" /> Pending</span>;
      case 'rejected': return <span className="text-red-600"><HiOutlineXCircle className="inline w-4 h-4 mr-1" /> Rejected</span>;
      default: return status;
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner"></div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <Link to="/dashboard" className="inline-flex items-center text-primestone-600 mb-6"><HiOutlineArrowLeft className="mr-2" /> Back</Link>
        <div className="flex justify-between items-center mb-6"><h1 className="text-3xl font-bold">Withdrawals</h1><button onClick={() => setShowForm(!showForm)} className="btn-primary">{showForm ? 'Cancel' : 'Request Withdrawal'}</button></div>
        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Request Withdrawal</h2>
            <form onSubmit={handleSubmit}>
              <select className="w-full p-2 border rounded mb-4" onChange={(e) => handleInvestmentSelect(e.target.value)} value={selectedInvestment?.id || ''} required>
                <option value="">Select investment...</option>
                {investments.map(inv => (<option key={inv.id} value={inv.id}>{inv.investment_packages?.package_name} - Expected: ${inv.expected_return}</option>))}
              </select>
              <div className="relative mb-4"><HiOutlineCash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" /><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Minimum: $${selectedInvestment?.expected_return || 100}`} className="w-full pl-10 p-2 border rounded" min={selectedInvestment?.expected_return || 100} required /></div>
              <input type="text" value={btcAddress} onChange={(e) => setBtcAddress(e.target.value)} placeholder="BTC Wallet Address" className="w-full p-2 border rounded mb-4" required />
              <button type="submit" disabled={submitting} className="w-full bg-primestone-600 text-white p-2 rounded">{submitting ? 'Submitting...' : 'Submit Request'}</button>
            </form>
          </div>
        )}
        {withdrawals.length === 0 ? <div className="bg-white rounded-xl p-12 text-center"><p>No withdrawal requests</p></div> : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden"><table className="min-w-full"><thead className="bg-neutral-50"><tr><th className="px-6 py-3">Date</th><th className="px-6 py-3">Amount</th><th className="px-6 py-3">BTC Address</th><th className="px-6 py-3">Status</th></tr></thead><tbody>{withdrawals.map(w => (<tr key={w.id} className="border-b"><td className="px-6 py-4">{new Date(w.created_at).toLocaleDateString()}</td><td className="px-6 py-4">${w.amount}</td><td className="px-6 py-4 font-mono text-sm">{w.btc_address?.substring(0, 20)}...</td><td className="px-6 py-4">{getStatusBadge(w.status)}</td></tr>))}</tbody></table></div>
        )}
      </div>
    </div>
  );
};

export default Withdrawals;
