import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineChartBar, HiOutlineCash, HiOutlineClock, HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineArrowLeft, HiOutlinePlus } from 'react-icons/hi';

const Investments = () => {
  const { user } = useAuth();
  const [investments, setInvestments] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [investmentsRes, packagesRes] = await Promise.all([
        api.get('/investments/my-investments'),
        api.get('/investments/packages')
      ]);
      setInvestments(investmentsRes.data.data || []);
      setPackages(packagesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending_payment': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      'active': { color: 'bg-green-100 text-green-800', text: 'Active' },
      'completed': { color: 'bg-blue-100 text-blue-800', text: 'Completed' },
      'withdrawn': { color: 'bg-gray-100 text-gray-800', text: 'Withdrawn' }
    };
    const badge = badges[status] || badges.pending_payment;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>{badge.text}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <HiOutlineExclamationCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchData} className="btn-primary">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-primestone-900">Investment Packages</h1>
            <p className="text-neutral-600 mt-1">Choose a package to start your investment journey</p>
          </div>
          <Link to="/investments/new" className="btn-primary flex items-center whitespace-nowrap">
            <HiOutlinePlus className="w-5 h-5 mr-2" /> Create Investment
          </Link>
        </div>

        {/* Investment Packages Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {packages.map((pkg) => (
            <div key={pkg.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full">
              <div className={`text-center py-6 px-4 ${
                pkg.package_name === 'Platinum' ? 'bg-gradient-to-r from-purple-600 to-purple-700' :
                pkg.package_name === 'Gold' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                pkg.package_name === 'Silver' ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                'bg-gradient-to-r from-amber-600 to-amber-700'
              }`}>
                <h3 className="text-2xl font-bold text-white">{pkg.package_name}</h3>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="text-center mb-4">
                  <p className="text-3xl font-bold text-primestone-900">${pkg.min_investment.toLocaleString()}</p>
                  <p className="text-sm text-neutral-500">Minimum to Yield</p>
                </div>
                <div className="space-y-3 flex-1">
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
                    <span className="text-neutral-600">Maximum</span>
                    <span className="font-semibold">${pkg.max_investment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
                    <span className="text-neutral-600">Daily Yield</span>
                    <span className="font-semibold text-green-600">{pkg.daily_yield_rate}%</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
                    <span className="text-neutral-600">Return Multiplier</span>
                    <span className="font-semibold text-primestone-600">x{pkg.return_multiplier}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
                    <span className="text-neutral-600">Duration</span>
                    <span className="font-semibold">180 Days</span>
                  </div>
                </div>
                <Link 
                  to={`/investments/new?package=${pkg.id}`}
                  className="mt-6 w-full bg-gradient-to-r from-primestone-600 to-primestone-700 text-white py-3 px-4 rounded-lg font-medium hover:from-primestone-700 hover:to-primestone-800 transition-all duration-300 text-center"
                >
                  Select Package
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* My Investments Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-display font-bold text-primestone-900 mb-6">My Investments</h2>
          {investments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <HiOutlineChartBar className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500">You haven't made any investments yet</p>
              <Link to="/investments/new" className="btn-primary mt-4 inline-block">Start Investing</Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Package</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Paid</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {investments.map((inv) => (
                      <tr key={inv.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{inv.investment_packages?.package_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">${inv.investment_amount?.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-success">${inv.paid_amount?.toLocaleString() || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(inv.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {new Date(inv.created_at).toLocaleDateString()}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Investments;
