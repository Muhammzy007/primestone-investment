import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { HiOutlineRefresh, HiOutlineCheckCircle, HiOutlineClock, HiOutlineXCircle } from 'react-icons/hi';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/transactions');
      setTransactions(response.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'confirmed': return <span className="text-green-600"><HiOutlineCheckCircle className="inline w-4 h-4 mr-1" /> Confirmed</span>;
      case 'pending': return <span className="text-yellow-600"><HiOutlineClock className="inline w-4 h-4 mr-1" /> Pending</span>;
      case 'failed': return <span className="text-red-600"><HiOutlineXCircle className="inline w-4 h-4 mr-1" /> Failed</span>;
      default: return status;
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner"></div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primestone-900">Transactions</h1>
          <button onClick={fetchTransactions} className="text-primestone-600"><HiOutlineRefresh className="inline w-5 h-5 mr-1" /> Refresh</button>
        </div>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50"><tr><th className="px-6 py-3 text-left">ID</th><th className="px-6 py-3 text-left">User</th><th className="px-6 py-3 text-left">Amount</th><th className="px-6 py-3 text-left">Method</th><th className="px-6 py-3 text-left">Status</th><th className="px-6 py-3 text-left">Date</th></tr></thead>
            <tbody>{transactions.map(tx => (<tr key={tx.id} className="border-b"><td className="px-6 py-4">#{tx.id}</td><td className="px-6 py-4">{tx.users?.username}<br /><span className="text-xs text-neutral-500">{tx.users?.email}</span></td><td className="px-6 py-4 font-semibold">${tx.amount}</td><td className="px-6 py-4">{tx.payment_method || 'BTC'}</td><td className="px-6 py-4">{getStatusBadge(tx.status)}</td><td className="px-6 py-4">{new Date(tx.created_at).toLocaleString()}</td></tr>))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminTransactions;
