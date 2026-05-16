import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { HiOutlineUsers, HiOutlineCash, HiOutlineCreditCard, HiOutlineClock, HiOutlineRefresh } from 'react-icons/hi';

const AdminDashboard = () => {
  const { admin, logout } = useAuth();
  const [stats, setStats] = useState({ totalUsers: 0, newUsers7d: 0, totalInvestments: 0, activeInvestments: 0, pendingWithdrawals: 0, totalReceived: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (admin) fetchStats(); }, [admin]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/dashboard/stats');
      if (response.data?.success) setStats(response.data.data.statistics || {});
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner"></div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div><h1 className="text-3xl font-bold text-primestone-900">Admin Dashboard</h1><p className="text-neutral-600">Welcome, {admin?.username}</p></div>
          <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded-lg">Logout</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex justify-between"><div><p className="text-neutral-500">Total Users</p><p className="text-3xl font-bold">{stats.totalUsers}</p><p className="text-xs text-green-600">+{stats.newUsers7d} this week</p></div><HiOutlineUsers className="w-10 h-10 text-primestone-600" /></div></div>
          <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex justify-between"><div><p className="text-neutral-500">Total Investments</p><p className="text-3xl font-bold">{stats.totalInvestments}</p><p className="text-xs text-green-600">{stats.activeInvestments} active</p></div><HiOutlineCreditCard className="w-10 h-10 text-primestone-600" /></div></div>
          <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex justify-between"><div><p className="text-neutral-500">Total Received</p><p className="text-3xl font-bold text-green-600">${(stats.totalReceived || 0).toLocaleString()}</p></div><HiOutlineCash className="w-10 h-10 text-primestone-600" /></div></div>
          <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex justify-between"><div><p className="text-neutral-500">Pending Withdrawals</p><p className="text-3xl font-bold text-yellow-600">{stats.pendingWithdrawals}</p></div><HiOutlineClock className="w-10 h-10 text-primestone-600" /></div></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/admin/users" className="bg-gradient-to-r from-primestone-500 to-primestone-600 text-white rounded-xl p-6"><HiOutlineUsers className="w-8 h-8 mb-3" /><h3 className="text-lg font-semibold">Manage Users</h3></Link>
          <Link to="/admin/withdrawals" className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl p-6"><HiOutlineCash className="w-8 h-8 mb-3" /><h3 className="text-lg font-semibold">Withdrawals</h3></Link>
          <Link to="/admin/transactions" className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6"><HiOutlineCreditCard className="w-8 h-8 mb-3" /><h3 className="text-lg font-semibold">Transactions</h3></Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
