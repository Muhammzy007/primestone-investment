import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { HiOutlineCash, HiOutlineChartBar, HiOutlineRefresh, HiOutlineCreditCard, HiOutlineExclamationCircle } from 'react-icons/hi';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalInvested: 0, activeInvestments: 0, totalReturns: 0, currentValue: 0 });
  const [recentInvestments, setRecentInvestments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      console.log('Dashboard loading for user:', user);
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, investmentsRes] = await Promise.all([
        api.get('/investments/stats/summary'),
        api.get('/investments/my-investments')
      ]);
      
      if (statsRes.data?.success) {
        setStats(statsRes.data.data.summary || {});
      }
      setRecentInvestments(investmentsRes.data?.data || []);
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="spinner"></div><p className="ml-2">Loading dashboard...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primestone-900">Welcome back, {user?.username}!</h1>
          <p className="text-neutral-600">User ID: {user?.id} | Role: {user?.role}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex justify-between"><div><p className="text-neutral-500">Total Invested</p><p className="text-2xl font-bold">${stats.totalInvested}</p></div><HiOutlineCash className="w-8 h-8 text-primestone-600" /></div></div>
          <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex justify-between"><div><p className="text-neutral-500">Current Value</p><p className="text-2xl font-bold text-green-600">${stats.currentValue}</p></div><HiOutlineCreditCard className="w-8 h-8 text-primestone-600" /></div></div>
          <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex justify-between"><div><p className="text-neutral-500">Expected Returns</p><p className="text-2xl font-bold text-yellow-600">${stats.totalReturns}</p></div><HiOutlineRefresh className="w-8 h-8 text-primestone-600" /></div></div>
          <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex justify-between"><div><p className="text-neutral-500">Active Investments</p><p className="text-2xl font-bold text-purple-600">{stats.activeInvestments}</p></div><HiOutlineChartBar className="w-8 h-8 text-primestone-600" /></div></div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Link to="/investments/new" className="bg-gradient-to-r from-primestone-500 to-primestone-600 text-white rounded-xl p-6 text-center">New Investment</Link>
          <Link to="/payments" className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6 text-center">Make Payment</Link>
          <Link to="/withdrawals" className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl p-6 text-center">Withdraw Funds</Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
