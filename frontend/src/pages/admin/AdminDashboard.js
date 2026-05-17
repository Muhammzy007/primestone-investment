import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { HiOutlineUsers, HiOutlineCash, HiOutlineCreditCard, HiOutlineClock, HiOutlineRefresh, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { admin, logout } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalInvestments: 0,
    pendingWithdrawals: 0,
    totalReceived: 0
  });
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (admin) {
      fetchData();
    }
  }, [admin]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching admin data...');
      
      const [statsRes, paymentsRes] = await Promise.all([
        api.get('/admin/dashboard/stats'),
        api.get('/payments/admin/pending')
      ]);
      
      console.log('Stats response:', statsRes.data);
      console.log('Payments response:', paymentsRes.data);
      
      if (statsRes.data.success) {
        setStats(statsRes.data.data.statistics || {});
      }
      if (paymentsRes.data.success) {
        setPendingPayments(paymentsRes.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError('Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const approvePayment = async (paymentId) => {
    if (!window.confirm('Approve this payment?')) return;
    try {
      await api.post(`/payments/admin/approve/${paymentId}`);
      toast.success('Payment approved successfully!');
      fetchData();
    } catch (error) {
      console.error('Error approving payment:', error);
      toast.error('Failed to approve payment');
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
            <p className="text-neutral-600">Welcome back, {admin?.username || 'Administrator'}!</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchData} className="bg-primestone-100 text-primestone-700 px-4 py-2 rounded-lg hover:bg-primestone-200 flex items-center gap-2">
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
            <button onClick={fetchData} className="bg-red-700 text-white px-3 py-1 rounded text-sm">Retry</button>
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

        {/* Pending Payments Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Pending Payments ({pendingPayments.length})</h2>
          {pendingPayments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-500">No pending payments</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">Amount</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPayments.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{payment.users?.username}</div>
                        <div className="text-xs text-neutral-500">{payment.users?.email}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-primestone-600">${payment.amount}</td>
                      <td className="px-4 py-3 text-sm">{new Date(payment.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Pending</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => approvePayment(payment.id)} className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 flex items-center gap-1">
                          <HiOutlineCheckCircle className="w-4 h-4" /> Approve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/admin/users" className="bg-gradient-to-r from-primestone-500 to-primestone-600 text-white rounded-xl p-6 hover:shadow-lg transition-all">
            <HiOutlineUsers className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold">Manage Users</h3>
          </Link>
          <Link to="/admin/withdrawals" className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl p-6 hover:shadow-lg transition-all">
            <HiOutlineCash className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold">Withdrawals</h3>
          </Link>
          <Link to="/admin/transactions" className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6 hover:shadow-lg transition-all">
            <HiOutlineCreditCard className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold">Transactions</h3>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
