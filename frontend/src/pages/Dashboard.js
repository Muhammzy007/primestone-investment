import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
    HiOutlineCash, 
    HiOutlineChartBar, 
    HiOutlineClock, 
    HiOutlineCheckCircle,
    HiOutlineArrowRight,
    HiOutlineExclamationCircle
} from 'react-icons/hi';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalInvested: 0,
        activeInvestments: 0,
        totalReturns: 0,
        pendingWithdrawals: 0
    });
    const [recentInvestments, setRecentInvestments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, investmentsRes] = await Promise.all([
                axios.get('/api/investments/stats/summary'),
                axios.get('/api/investments/my-investments')
            ]);
            
            setStats(statsRes.data.data.summary);
            setRecentInvestments(investmentsRes.data.data.slice(0, 5));
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
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
                        Welcome back, {user?.username}!
                    </h1>
                    <p className="text-neutral-600 mt-1">
                        Here's what's happening with your investments today.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="stat-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-500">Total Invested</p>
                                <p className="text-2xl font-bold text-primestone-900">
                                    ${stats.totalInvested?.toLocaleString() || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-primestone-100 rounded-lg flex items-center justify-center">
                                <HiOutlineCash className="w-6 h-6 text-primestone-600" />
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-500">Active Investments</p>
                                <p className="text-2xl font-bold text-primestone-900">
                                    {stats.activeInvestments || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-primestone-100 rounded-lg flex items-center justify-center">
                                <HiOutlineChartBar className="w-6 h-6 text-primestone-600" />
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-500">Expected Returns</p>
                                <p className="text-2xl font-bold text-success">
                                    ${stats.totalReturns?.toLocaleString() || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <HiOutlineCheckCircle className="w-6 h-6 text-success" />
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-500">Pending Withdrawals</p>
                                <p className="text-2xl font-bold text-warning">
                                    {stats.pendingWithdrawals || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <HiOutlineClock className="w-6 h-6 text-warning" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="card p-6">
                        <h2 className="text-xl font-semibold text-primestone-900 mb-4">
                            Quick Actions
                        </h2>
                        <div className="space-y-3">
                            <Link
                                to="/investments"
                                className="flex items-center justify-between p-3 bg-primestone-50 rounded-lg hover:bg-primestone-100 transition-colors"
                            >
                                <span className="text-primestone-700">Make a new investment</span>
                                <HiOutlineArrowRight className="w-5 h-5 text-primestone-600" />
                            </Link>
                            <Link
                                to="/payments"
                                className="flex items-center justify-between p-3 bg-primestone-50 rounded-lg hover:bg-primestone-100 transition-colors"
                            >
                                <span className="text-primestone-700">Make a payment</span>
                                <HiOutlineArrowRight className="w-5 h-5 text-primestone-600" />
                            </Link>
                            <Link
                                to="/withdrawals"
                                className="flex items-center justify-between p-3 bg-primestone-50 rounded-lg hover:bg-primestone-100 transition-colors"
                            >
                                <span className="text-primestone-700">Request withdrawal</span>
                                <HiOutlineArrowRight className="w-5 h-5 text-primestone-600" />
                            </Link>
                        </div>
                    </div>

                    <div className="card p-6">
                        <h2 className="text-xl font-semibold text-primestone-900 mb-4">
                            Investment Packages
                        </h2>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-2">
                                <span className="font-medium">Bronze</span>
                                <span className="text-primestone-600">$1,000 - $3,000</span>
                            </div>
                            <div className="flex justify-between items-center p-2">
                                <span className="font-medium">Silver</span>
                                <span className="text-primestone-600">$2,000 - $6,000</span>
                            </div>
                            <div className="flex justify-between items-center p-2">
                                <span className="font-medium">Gold</span>
                                <span className="text-primestone-600">$4,000 - $12,000</span>
                            </div>
                            <div className="flex justify-between items-center p-2">
                                <span className="font-medium">Platinum</span>
                                <span className="text-primestone-600">$8,000 - $24,000</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Investments */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-primestone-900">
                            Recent Investments
                        </h2>
                        <Link to="/investments" className="text-primestone-600 hover:text-primestone-700 text-sm font-medium">
                            View all
                        </Link>
                    </div>

                    {recentInvestments.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Package</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentInvestments.map((inv) => (
                                        <tr key={inv.id}>
                                            <td className="font-medium">{inv.package_name}</td>
                                            <td>${inv.investment_amount}</td>
                                            <td>
                                                <span className={`badge badge-${
                                                    inv.status === 'active' ? 'success' :
                                                    inv.status === 'pending_payment' ? 'warning' :
                                                    inv.status === 'matured' ? 'info' : 'neutral'
                                                }`}>
                                                    {inv.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <Link
                                                    to={`/investments/${inv.id}`}
                                                    className="text-primestone-600 hover:text-primestone-700"
                                                >
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
                            <p className="text-neutral-600">No investments yet</p>
                            <Link to="/investments" className="btn-primary mt-4 inline-block">
                                Start Investing
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
