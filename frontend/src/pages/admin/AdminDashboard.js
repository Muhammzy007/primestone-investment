import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { HiOutlineUsers, HiOutlineCash, HiOutlineCreditCard, HiOutlineClock, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineRefresh } from 'react-icons/hi';

const AdminDashboard = () => {
  const { admin } = useAuth();
  const [pendingPayments, setPendingPayments] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalInvestments: 0, totalReceived: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (admin) {
      fetchData();
    }
  }, [admin]);

  const fetchData = async () => {
    try {
      setError(null);
      
      const [paymentsRes, withdrawalsRes, statsRes] = await Promise.all([
        api.get('/payments/admin/pending'),
        api.get('/withdrawals/admin/pending'),
        api.get('/admin/dashboard/stats')
      ]);
      
      setPendingPayments(paymentsRes.data.data || []);
      setPendingWithdrawals(withdrawalsRes.data.data || []);
      setStats(statsRes.data.data?.statistics || { totalUsers: 0, totalInvestments: 0, totalReceived: 0 });
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async (paymentId) => {
    if (!confirm('Approve this payment?')) return;
    try {
      await api.post(`/payments/admin/approve/${paymentId}`);
      fetchData();
    } catch (err) {
      alert('Failed to approve payment');
    }
  };

  const handleApproveWithdrawal = async (withdrawalId) => {
    if (!confirm('Approve this withdrawal?')) return;
    try {
      await api.post(`/withdrawals/admin/approve/${withdrawalId}`);
      fetchData();
    } catch (err) {
      alert('Failed to approve withdrawal');
    }
  };

  const handleRejectWithdrawal = async (withdrawalId) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    try {
      await api.post(`/withdrawals/admin/reject/${withdrawalId}`, { reason });
      fetchData();
    } catch (err) {
      alert('Failed to reject withdrawal');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="spinner"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-display font-bold text-primestone-900 mb-2">Admin Dashboard</h1>
        <p className="text-neutral-600 mb-8">Welcome back, {admin?.username}</p>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex justify-between"><div><p className="text-neutral-500">Total Users</p><p className="text-2xl font-bold">{stats.totalUsers || 0}</p></div><HiOutlineUsers className="w-8 h-8 text-primestone-600" /></div></div>
          <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex justify-between"><div><p className="text-neutral-500">Total Investments</p><p className="text-2xl font-bold">{stats.totalInvestments || 0}</p></div><HiOutlineCreditCard className="w-8 h-8 text-primestone-600" /></div></div>
          <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex justify-between"><div><p className="text-neutral-500">Total Received</p><p className="text-2xl font-bold">${stats.totalReceived || 0}</p></div><HiOutlineCash className="w-8 h-8 text-primestone-600" /></div></div>
        </div>

        {/* Pending Payments */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Pending Payments ({pendingPayments.length})</h2>
          {pendingPayments.length === 0 ? <p className="text-neutral-500">No pending payments</p> : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-neutral-50"><tr><th className="px-4 py-2 text-left">User</th><th className="px-4 py-2 text-left">Amount</th><th className="px-4 py-2 text-left">Date</th><th className="px-4 py-2 text-left">Action</th></tr></thead>
                <tbody>{pendingPayments.map(p => (<tr key={p.id} className="border-b"><td className="px-4 py-2">{p.users?.username}</td><td className="px-4 py-2">${p.amount}</td><td className="px-4 py-2">{new Date(p.created_at).toLocaleDateString()}</td><td className="px-4 py-2"><button onClick={() => handleApprovePayment(p.id)} className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">Approve</button></td></tr>))}</tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pending Withdrawals */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Pending Withdrawals ({pendingWithdrawals.length})</h2>
          {pendingWithdrawals.length === 0 ? <p className="text-neutral-500">No pending withdrawals</p> : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-neutral-50"><tr><th className="px-4 py-2 text-left">User</th><th className="px-4 py-2 text-left">Amount</th><th className="px-4 py-2 text-left">BTC Address</th><th className="px-4 py-2 text-left">Action</th></tr></thead>
                <tbody>{pendingWithdrawals.map(w => (<tr key={w.id} className="border-b"><td className="px-4 py-2">{w.users?.username}</td><td className="px-4 py-2">${w.amount}</td><td className="px-4 py-2 font-mono text-xs">{w.btc_address?.substring(0, 20)}...</td><td className="px-4 py-2"><button onClick={() => handleApproveWithdrawal(w.id)} className="bg-green-500 text-white px-3 py-1 rounded text-sm mr-2 hover:bg-green-600">Approve</button><button onClick={() => handleRejectWithdrawal(w.id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">Reject</button></td></tr>))}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
