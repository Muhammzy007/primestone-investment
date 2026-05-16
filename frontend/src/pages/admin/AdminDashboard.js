import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { HiOutlineUsers, HiOutlineCash, HiOutlineCreditCard, HiOutlineClock, HiOutlineRefresh } from 'react-icons/hi';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { admin, logout } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalInvestments: 0,
    pendingWithdrawals: 0,
    totalReceived: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (admin) {
      fetchStats();
    }
  }, [admin]);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/dashboard/stats');
      console.log('Stats response:', response.data);
      
      if (response.data.success) {
        setStats(response.data.data.statistics || {});
      } else {
        setError('Failed to load statistics');
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primestone-900">Admin Dashboard</h1>
            <p className="text-neutral-600">Welcome back, {admin?.username || 'Administrator'}</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={fetchStats} 
              className="bg-primestone-100 text-primestone-700 px-4 py-2 rounded-lg hover:bg-primestone-200 flex items-center gap-2"
            >
              <HiOutlineRefresh className="w-5 h-5" /> Refresh
            </button>
            <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={fetchStats} className="bg-red-700 text-white px-3 py-1 rounded text-sm">Retry</button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-neutral-500">Total Users</p>
                <p className="text-3xl font-bold text-primestone-900">{stats.totalUsers || 0}</p>
              </div>
              <HiOutlineUsers className="w-10 h-10 text-primestone-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-neutral-500">Total Investments</p>
                <p className="text-3xl font-bold text-primestone-900">{stats.totalInvestments || 0}</p>
              </div>
              <HiOutlineCreditCard className="w-10 h-10 text-primestone-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-neutral-500">Total Received</p>
                <p className="text-3xl font-bold text-green-600">${(stats.totalReceived || 0).toLocaleString()}</p>
              </div>
              <HiOutlineCash className="w-10 h-10 text-primestone-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-neutral-500">Pending Withdrawals</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingWithdrawals || 0}</p>
              </div>
              <HiOutlineClock className="w-10 h-10 text-primestone-600" />
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/admin/users" className="bg-gradient-to-r from-primestone-500 to-primestone-600 text-white rounded-xl p-6 hover:shadow-lg transition-all">
            <HiOutlineUsers className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold">Manage Users</h3>
            <p className="text-sm text-primestone-100 mt-1">View, activate, or deactivate users</p>
          </Link>

          <Link to="/admin/withdrawals" className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl p-6 hover:shadow-lg transition-all">
            <HiOutlineCash className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold">Withdrawals</h3>
            <p className="text-sm text-yellow-100 mt-1">Approve or reject withdrawal requests</p>
          </Link>

          <Link to="/admin/transactions" className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6 hover:shadow-lg transition-all">
            <HiOutlineCreditCard className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold">Transactions</h3>
            <p className="text-sm text-green-100 mt-1">View all payment transactions</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
