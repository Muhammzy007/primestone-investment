import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineDownload,
  HiOutlineExclamationCircle
} from 'react-icons/hi';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    totalAmount: 0
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/transactions');
      console.log('Transactions response:', response.data);
      const txData = response.data.data || [];
      setTransactions(txData);
      
      // Calculate stats
      const stats = txData.reduce((acc, tx) => {
        acc.total++;
        if (tx.status === 'confirmed') acc.confirmed++;
        if (tx.status === 'pending') acc.pending++;
        acc.totalAmount += parseFloat(tx.amount || 0);
        return acc;
      }, { total: 0, confirmed: 0, pending: 0, totalAmount: 0 });
      
      setStats(stats);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      if (error.response?.status === 404) {
        setError('Transactions endpoint not found');
      } else if (error.response?.status === 403) {
        setError('Admin access required');
      } else {
        setError(error.response?.data?.error || 'Failed to load transactions');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'confirmed': return <HiOutlineCheckCircle className="w-5 h-5 text-success" />;
      case 'pending': return <HiOutlineClock className="w-5 h-5 text-warning" />;
      case 'failed': return <HiOutlineXCircle className="w-5 h-5 text-error" />;
      default: return <HiOutlineClock className="w-5 h-5 text-neutral-400" />;
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter !== 'all' && tx.status !== filter) return false;
    if (searchTerm) {
      return (tx.id?.toString() || '').includes(searchTerm) ||
             (tx.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (tx.user_transaction_hash || '').toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const exportToCSV = () => {
    const headers = ['ID', 'Type', 'User', 'Amount', 'Method', 'Status', 'Date', 'Hash'];
    const csvData = filteredTransactions.map(tx => [
      tx.id,
      tx.transaction_type || 'N/A',
      tx.username || 'N/A',
      tx.amount || 0,
      tx.payment_method || 'N/A',
      tx.status || 'N/A',
      tx.payment_date ? new Date(tx.payment_date).toLocaleDateString() : 'N/A',
      tx.user_transaction_hash || ''
    ]);
    
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-neutral-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg">
          <HiOutlineExclamationCircle className="w-16 h-16 text-error mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">Error</h3>
          <p className="text-neutral-600 mb-6">{error}</p>
          <button
            onClick={fetchTransactions}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-primestone-900">
              Transaction Monitoring
            </h1>
            <p className="text-neutral-600 mt-1">
              View all platform transactions
            </p>
          </div>
          <div className="flex space-x-3 mt-4 md:mt-0">
            <button
              onClick={exportToCSV}
              className="flex items-center px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
            >
              <HiOutlineDownload className="w-5 h-5 mr-2" />
              Export CSV
            </button>
            <button
              onClick={fetchTransactions}
              className="flex items-center px-4 py-2 bg-primestone-600 text-white rounded-lg hover:bg-primestone-700"
            >
              <HiOutlineRefresh className="w-5 h-5 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-sm text-neutral-500">Total Transactions</p>
            <p className="text-2xl font-bold text-primestone-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-sm text-neutral-500">Confirmed</p>
            <p className="text-2xl font-bold text-success">{stats.confirmed}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-sm text-neutral-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-sm text-neutral-500">Total Volume</p>
            <p className="text-2xl font-bold text-purple-600">${stats.totalAmount.toLocaleString()}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1 relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by ID, user, or hash..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primestone-500"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primestone-500"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Hash</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        #{tx.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          tx.transaction_type === 'fee' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {tx.transaction_type || 'payment'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium">{tx.username || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-semibold text-primestone-600">
                          ${tx.amount || 0}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {tx.payment_method || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(tx.status)}
                          <span className={`ml-1 text-sm ${
                            tx.status === 'confirmed' ? 'text-success' :
                            tx.status === 'pending' ? 'text-warning' : 'text-error'
                          }`}>
                            {tx.status || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                        {tx.payment_date ? new Date(tx.payment_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        {tx.user_transaction_hash ? (
                          <span className="font-mono text-xs">
                            {tx.user_transaction_hash.substring(0, 10)}...
                          </span>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-neutral-500">
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTransactions;
