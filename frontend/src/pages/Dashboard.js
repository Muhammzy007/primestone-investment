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
      console.log('=== DASHBOARD DEBUG ===');
      console.log('Logged in user:', user);
      console.log('User ID:', user?.id);
      console.log('User token exists:', !!localStorage.getItem('user_token'));
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching investments for user ID:', user?.id);
      
      const [statsRes, investmentsRes] = await Promise.all([
        api.get('/investments/stats/summary'),
        api.get('/investments/my-investments')
      ]);
      
      console.log('Stats response:', statsRes.data);
      console.log('Investments response:', investmentsRes.data);
      
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
          <p className="text-xs text-neutral-400 mt-1">Make sure this User ID matches the investments below</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex justify-between"><div><p className="text-neutral-500">Total Invested</p><p className="text-2xl font-bold">${stats.totalInvested}</p></div><HiOutlineCash className="w-8 h-8 text-primestone-600" /></div></div>
          <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex justify-between"><div><p className="text-neutral-500">Current Value</p><p className="text-2xl font-bold text-green-600">${stats.currentValue}</p></div><HiOutlineCreditCard className="w-8 h-8 text-primestone-600" /></div></div>
          <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex justify-between"><div><p className="text-neutral-500">Expected Returns</p><p className="text-2xl font-bold text-yellow-600">${stats.totalReturns}</p></div><HiOutlineRefresh className="w-8 h-8 text-primestone-600" /></div></div>
          <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex justify-between"><div><p className="text-neutral-500">Active Investments</p><p className="text-2xl font-bold text-purple-600">{stats.activeInvestments}</p></div><HiOutlineChartBar className="w-8 h-8 text-primestone-600" /></div></div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Your Investments</h2>
          {recentInvestments.length === 0 ? (
            <p className="text-neutral-500">No investments yet. <Link to="/investments/new" className="text-primestone-600">Start investing</Link></p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-neutral-50"><tr><th className="px-4 py-2 text-left">Package</th><th className="px-4 py-2 text-left">Amount</th><th className="px-4 py-2 text-left">Status</th><th className="px-4 py-2 text-left">User ID</th></tr></thead>
                <tbody>
                  {recentInvestments.map((inv) => (
                    <tr key={inv.id} className="border-b">
                      <td className="px-4 py-2">{inv.investment_packages?.package_name}</td>
                      <td className="px-4 py-2">${inv.investment_amount}</td>
                      <td className="px-4 py-2">{inv.status}</td>
                      <td className="px-4 py-2 text-xs text-neutral-500">User ID: {inv.user_id}</td>
                    </tr>
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

export default Dashboard;
