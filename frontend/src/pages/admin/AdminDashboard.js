import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  HiOutlineUsers,
  HiOutlineCash,
  HiOutlineCreditCard,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineRefresh,
  HiOutlineChartBar,
  HiOutlineArrowRight,
  HiOutlineShieldCheck
} from 'react-icons/hi';

const AdminDashboard = () => {
  const { admin } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsers7d: 0,
    totalInvestments: 0,
    activeInvestments: 0,
    pendingWithdrawals: 0,
    pendingFees: 0,
    totalReceived: 0,
    totalPaidOut: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (admin) {
      fetchDashboardData();
    }
  }, [admin]);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      setLoading(true);

      console.log('Fetching admin dashboard data...');
      
      const [statsRes, withdrawalsRes] = await Promise.all([
        api.get('/admin/dashboard/stats'),
        api.get('/admin/withdrawals/pending')
      ]);

      console.log('Stats Response:', statsRes.data);
      console.log('Withdrawals Response:', withdrawalsRes.data);

      // FIXED: Access the data correctly based on your API response structure
      if (statsRes.data && statsRes.data.success) {
        // The stats are in data.statistics based on your adminRoutes.js
        const statistics = statsRes.data.data.statistics || {};
        
        setStats({
          totalUsers: statistics.total_users || 0,
          newUsers7d: statistics.new_users_7d || 0,
          totalInvestments: statistics.total_investments || 0,
          activeInvestments: statistics.active_investments || 0,
          pendingWithdrawals: statistics.pending_withdrawals || 0,
          pendingFees: statistics.pending_fees || 0,
          totalReceived: statistics.total_received || 0,
          totalPaidOut: statistics.total_paid_out || 0
        });
        
        setRecentActivity(statsRes.data.data.recentActivities || []);
      }
      
      setPendingWithdrawals(withdrawalsRes.data.data || []);
      
    } catch (error) {
      console.error('Error fetching admin data:', error);
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        setError('Admin access required.');
      } else {
        setError('Failed to load admin data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproveWithdrawal = async (requestId) => {
    if (!window.confirm('Approve this withdrawal request?')) return;

    try {
      await api.post(`/admin/withdrawals/${requestId}/approve`, {
        notes: 'Approved by admin'
      });
      fetchDashboardData();
    } catch (error) {
      console.error('Error approving withdrawal:', error);
    }
  };

  const handleRejectWithdrawal = async (requestId) => {
    const reason = window.prompt('Reason for rejection:');
    if (!reason) return;

    try {
      await api.post(`/admin/withdrawals/${requestId}/reject`, {
        reason
      });
      fetchDashboardData();
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-neutral-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-primestone-900">
              Admin Dashboard
            </h1>
            <p className="text-neutral-600 mt-1">
              Welcome back, {admin?.username || 'Administrator'}
            </p>
            {error && (
              <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}
          </div>
          <div className="bg-primestone-100 px-4 py-2 rounded-lg">
            <span className="text-sm font-semibold text-primestone-700 flex items-center">
              <HiOutlineShieldCheck className="w-5 h-5 mr-2" />
              Administrator Access
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-primestone-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Total Users</p>
                <p className="text-2xl font-bold text-primestone-900">{stats.totalUsers}</p>
                <p className="text-xs text-success mt-1">+{stats.newUsers7d} this week</p>
              </div>
              <div className="w-12 h-12 bg-primestone-100 rounded-lg flex items-center justify-center">
                <HiOutlineUsers className="w-6 h-6 text-primestone-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Total Investments</p>
                <p className="text-2xl font-bold text-primestone-900">{stats.totalInvestments}</p>
                <p className="text-xs text-success mt-1">{stats.activeInvestments} active</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <HiOutlineChartBar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Pending Withdrawals</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingWithdrawals}</p>
                <p className="text-xs text-yellow-600 mt-1">{stats.pendingFees} pending fees</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <HiOutlineClock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Total Received</p>
                <p className="text-2xl font-bold text-purple-600">${stats.totalReceived.toLocaleString()}</p>
                <p className="text-xs text-purple-600 mt-1">Paid out: ${stats.totalPaidOut.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <HiOutlineCash className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Admin Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link to="/admin/users" className="bg-gradient-to-r from-primestone-500 to-primestone-600 text-white rounded-xl p-6 hover:from-primestone-600 hover:to-primestone-700 transition-all duration-300">
            <HiOutlineUsers className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold mb-1">Manage Users</h3>
            <p className="text-sm text-primestone-100">View, edit, and manage user accounts</p>
          </Link>

          <Link to="/admin/withdrawals" className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl p-6 hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300">
            <HiOutlineCreditCard className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold mb-1">Withdrawals</h3>
            <p className="text-sm text-yellow-100">Approve or reject withdrawal requests</p>
          </Link>

          <Link to="/admin/settings" className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6 hover:from-purple-600 hover:to-purple-700 transition-all duration-300">
            <HiOutlineRefresh className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold mb-1">System Settings</h3>
            <p className="text-sm text-purple-100">Configure platform settings</p>
          </Link>
        </div>

        {/* Pending Withdrawals */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-primestone-900 mb-6">Pending Withdrawals</h2>

          {pendingWithdrawals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Fee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Requested</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {pendingWithdrawals.slice(0, 5).map((withdrawal) => (
                    <tr key={withdrawal.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium">{withdrawal.username}</div>
                          <div className="text-sm text-neutral-500">{withdrawal.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-primestone-600">
                        ${withdrawal.requested_amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {withdrawal.fee_paid ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Paid</span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(withdrawal.requested_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproveWithdrawal(withdrawal.id)}
                            className="text-green-600 hover:text-green-700"
                            title="Approve"
                          >
                            <HiOutlineCheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleRejectWithdrawal(withdrawal.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Reject"
                          >
                            <HiOutlineXCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <HiOutlineCheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
              <p className="text-neutral-600">No pending withdrawal requests</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
