import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';  // ADD THIS IMPORT
import YieldHistoryModal from '../components/YieldHistoryModal';
import {
  HiOutlineCash,
  HiOutlineChartBar,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineArrowRight,
  HiOutlineExclamationCircle,
  HiOutlineTrendingUp,
  HiOutlineRefresh,
  HiOutlineCreditCard,
  HiOutlineEye
} from 'react-icons/hi';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalInvested: 0,
    activeInvestments: 0,
    totalReturns: 0,
    currentValue: 0,
    totalPaid: 0,
    investmentsMeetingMinimum: 0
  });
  const [recentInvestments, setRecentInvestments] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [showYieldModal, setShowYieldModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data for user:', user?.id);
      
      const [statsRes, investmentsRes, packagesRes] = await Promise.all([
        api.get('/investments/stats/summary'),
        api.get('/investments/my-investments'),
        api.get('/investments/packages')
      ]);

      console.log('Stats Response:', statsRes.data);
      
      if (statsRes.data && statsRes.data.success) {
        const summary = statsRes.data.data.summary || {};
        setStats({
          totalInvested: summary.total_invested || 0,
          activeInvestments: summary.active_investments || 0,
          totalReturns: summary.total_returns || 0,
          currentValue: summary.current_value || 0,
          totalPaid: summary.total_paid || 0,
          investmentsMeetingMinimum: summary.investments_meeting_minimum || 0
        });
      }
      
      setRecentInvestments(investmentsRes?.data?.data || []);
      setPackages(packagesRes?.data?.data || []);

    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleYieldCardClick = () => {
    // Find the first active investment to show yield history
    const activeInvestment = recentInvestments.find(inv => inv.status === 'active');
    if (activeInvestment) {
      setSelectedInvestment(activeInvestment);
      setShowYieldModal(true);
    } else {
      toast.error('No active investments to show yield history');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-neutral-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-primestone-900">
            Welcome back, {user?.username || 'Investor'}!
          </h1>
          <p className="text-neutral-600 mt-1">
            Track your investments and watch your wealth grow
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-primestone-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Total Invested</p>
                <p className="text-2xl font-bold text-primestone-900">
                  ${stats.totalInvested.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-primestone-100 rounded-lg flex items-center justify-center">
                <HiOutlineCash className="w-6 h-6 text-primestone-600" />
              </div>
            </div>
          </div>

          {/* Clickable Current Value Card */}
          <div 
            onClick={handleYieldCardClick}
            className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-neutral-500">Current Value</p>
                  <HiOutlineEye className="w-4 h-4 text-green-500" title="Click to view yield history" />
                </div>
                <p className="text-2xl font-bold text-green-600">
                  ${stats.currentValue.toLocaleString()}
                </p>
                <p className="text-xs text-green-500 mt-1 flex items-center">
                  <HiOutlineTrendingUp className="w-3 h-3 mr-1" />
                  Click to see daily breakdown
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <HiOutlineTrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Expected Returns</p>
                <p className="text-2xl font-bold text-yellow-600">
                  ${stats.totalReturns.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <HiOutlineRefresh className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Active Investments</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.activeInvestments}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <HiOutlineChartBar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link to="/investments/new" className="bg-gradient-to-r from-primestone-500 to-primestone-600 text-white rounded-xl p-6 hover:from-primestone-600 hover:to-primestone-700 transition-all duration-300">
            <HiOutlineCreditCard className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold mb-1">New Investment</h3>
            <p className="text-sm text-primestone-100">Start growing your wealth today</p>
          </Link>

          <Link to="/payments" className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6 hover:from-green-600 hover:to-green-700 transition-all duration-300">
            <HiOutlineCash className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold mb-1">Make Payment</h3>
            <p className="text-sm text-green-100">Pay towards your investments</p>
          </Link>

          <Link to="/withdrawals" className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl p-6 hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300">
            <HiOutlineRefresh className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold mb-1">Withdraw Funds</h3>
            <p className="text-sm text-yellow-100">Request withdrawal of matured funds</p>
          </Link>
        </div>

        {/* Recent Investments */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-primestone-900">
              My Recent Investments
            </h2>
            <Link to="/investments" className="text-primestone-600 hover:text-primestone-700 text-sm font-medium">
              View all
            </Link>
          </div>

          {recentInvestments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Package</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Paid</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {recentInvestments.map((inv) => (
                    <tr key={inv.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{inv.package_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">${inv.investment_amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-success">${inv.paid_amount || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          inv.status === 'active' ? 'bg-green-100 text-green-800' :
                          inv.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-800' :
                          inv.status === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {inv.status?.replace('_', ' ') || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/investments/${inv.id}`} className="text-primestone-600 hover:text-primestone-700 font-medium">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <HiOutlineExclamationCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-600">You haven't made any investments yet</p>
              <Link to="/investments/new" className="btn-primary mt-4 inline-block">
                Start Investing
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Yield History Modal */}
      {showYieldModal && selectedInvestment && (
        <YieldHistoryModal
          isOpen={showYieldModal}
          onClose={() => setShowYieldModal(false)}
          investmentId={selectedInvestment.id}
          investmentAmount={selectedInvestment.investment_amount}
          packageName={selectedInvestment.package_name}
        />
      )}
    </div>
  );
};

export default Dashboard;
