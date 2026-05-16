import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { HiOutlineCash, HiOutlineChartBar, HiOutlineRefresh, HiOutlineCreditCard, HiOutlineExclamationCircle, HiOutlineTrendingUp } from 'react-icons/hi';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalInvested: 0,
    activeInvestments: 0,
    totalReturns: 0,
    currentValue: 0
  });
  const [recentInvestments, setRecentInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const statsResponse = await api.get('/investments/stats/summary');
      const investmentsResponse = await api.get('/investments/my-investments');
      
      if (statsResponse.data?.success) {
        setStats(statsResponse.data.data.summary || {});
      }
      
      if (investmentsResponse.data?.success) {
        setRecentInvestments(investmentsResponse.data.data || []);
      }
    } catch (error) {
      console.error('Dashboard error:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-neutral-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <HiOutlineExclamationCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchDashboardData} className="bg-primestone-600 text-white px-4 py-2 rounded-lg">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primestone-900">Welcome back, {user?.username}!</h1>
          <p className="text-neutral-600 mt-1">Track your investments and watch your wealth grow</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-primestone-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-neutral-500">Total Invested</p>
                <p className="text-2xl font-bold mt-1">${stats.totalInvested?.toLocaleString() || 0}</p>
              </div>
              <HiOutlineCash className="w-8 h-8 text-primestone-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-neutral-500">Current Value</p>
                <p className="text-2xl font-bold mt-1 text-green-600">${stats.currentValue?.toLocaleString() || 0}</p>
              </div>
              <HiOutlineTrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-neutral-500">Expected Returns</p>
                <p className="text-2xl font-bold mt-1 text-yellow-600">${stats.totalReturns?.toLocaleString() || 0}</p>
              </div>
              <HiOutlineRefresh className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-neutral-500">Active Investments</p>
                <p className="text-2xl font-bold mt-1 text-purple-600">{stats.activeInvestments || 0}</p>
              </div>
              <HiOutlineChartBar className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link to="/investments/new" className="bg-gradient-to-r from-primestone-500 to-primestone-600 text-white rounded-xl p-6 text-center hover:shadow-lg transition-all">
            <HiOutlineCreditCard className="w-8 h-8 mx-auto mb-3" />
            <h3 className="text-lg font-semibold">New Investment</h3>
            <p className="text-sm text-primestone-100">Start growing your wealth</p>
          </Link>

          <Link to="/payments" className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6 text-center hover:shadow-lg transition-all">
            <HiOutlineCash className="w-8 h-8 mx-auto mb-3" />
            <h3 className="text-lg font-semibold">Make Payment</h3>
            <p className="text-sm text-green-100">Pay towards investments</p>
          </Link>

          <Link to="/withdrawals" className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl p-6 text-center hover:shadow-lg transition-all">
            <HiOutlineRefresh className="w-8 h-8 mx-auto mb-3" />
            <h3 className="text-lg font-semibold">Withdraw Funds</h3>
            <p className="text-sm text-yellow-100">Request withdrawal</p>
          </Link>
        </div>

        {/* Recent Investments */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Your Investments</h2>
          {recentInvestments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-500">No investments yet.</p>
              <Link to="/investments/new" className="text-primestone-600 mt-2 inline-block">Start investing</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Package</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Paid</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {recentInvestments.map((inv) => (
                    <tr key={inv.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">{inv.investment_packages?.package_name}</td>
                      <td className="px-4 py-3">${inv.investment_amount?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-green-600">${inv.paid_amount?.toLocaleString() || 0}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          inv.status === 'active' ? 'bg-green-100 text-green-800' :
                          inv.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {inv.status === 'pending_payment' ? 'Pending' : inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/investments/${inv.id}`} className="text-primestone-600 hover:text-primestone-700">
                          View
                        </Link>
                      </td>
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
