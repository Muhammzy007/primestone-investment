import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { HiOutlineRefresh, HiOutlineCheckCircle, HiOutlineClock, HiOutlineXCircle } from 'react-icons/hi';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/transactions');
      setTransactions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'confirmed': return <span className="flex items-center text-green-600"><HiOutlineCheckCircle className="w-4 h-4 mr-1" /> Confirmed</span>;
      case 'pending': return <span className="flex items-center text-yellow-600"><HiOutlineClock className="w-4 h-4 mr-1" /> Pending</span>;
      case 'failed': return <span className="flex items-center text-red-600"><HiOutlineXCircle className="w-4 h-4 mr-1" /> Failed</span>;
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center"><div className="spinner mb-4"></div><p>Loading transactions...</p></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-primestone-900">Transactions</h1>
            <p className="text-neutral-600 mt-1">Total: {transactions.length}</p>
          </div>
          <button onClick={fetchTransactions} className="flex items-center text-primestone-600 hover:text-primestone-700">
            <HiOutlineRefresh className="w-5 h-5 mr-1" /> Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">{error}</div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-neutral-500">No transactions found</td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 text-sm">#{tx.id}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{tx.users?.username}</div>
                        <div className="text-xs text-neutral-500">{tx.users?.email}</div>
                       </td>
                      <td className="px-6 py-4 font-semibold text-primestone-600">${tx.amount}</td>
                      <td className="px-6 py-4 text-sm">{tx.payment_method || 'BTC'}</td>
                      <td className="px-6 py-4 text-sm">{getStatusBadge(tx.status)}</td>
                      <td className="px-6 py-4 text-sm">{new Date(tx.created_at).toLocaleString()}</td>
                    </table>
                  ))
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
