import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { HiOutlineRefresh, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineClock } from 'react-icons/hi';
import toast from 'react-hot-toast';

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/withdrawals/pending');
      setWithdrawals(response.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const approveWithdrawal = async (id) => {
    if (!window.confirm('Approve this withdrawal?')) return;
    try {
      await api.post(`/admin/withdrawals/${id}/approve`);
      toast.success('Withdrawal approved');
      fetchWithdrawals();
    } catch (error) {
      toast.error('Failed to approve');
    }
  };

  const rejectWithdrawal = async (id) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    try {
      await api.post(`/admin/withdrawals/${id}/reject`, { reason });
      toast.success('Withdrawal rejected');
      fetchWithdrawals();
    } catch (error) {
      toast.error('Failed to reject');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner"></div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primestone-900">Withdrawal Requests</h1>
          <button onClick={fetchWithdrawals} className="text-primestone-600"><HiOutlineRefresh className="inline w-5 h-5 mr-1" /> Refresh</button>
        </div>
        {withdrawals.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center"><HiOutlineClock className="w-12 h-12 text-neutral-300 mx-auto mb-4" /><p>No pending withdrawals</p></div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50"><tr><th className="px-6 py-3 text-left">User</th><th className="px-6 py-3 text-left">Amount</th><th className="px-6 py-3 text-left">BTC Address</th><th className="px-6 py-3 text-left">Actions</th></tr></thead>
              <tbody>{withdrawals.map(w => (<tr key={w.id} className="border-b"><td className="px-6 py-4">{w.users?.username}<br /><span className="text-xs text-neutral-500">{w.users?.email}</span></td><td className="px-6 py-4 font-semibold">${w.amount}</td><td className="px-6 py-4 font-mono text-sm">{w.btc_address?.substring(0, 30)}...</td><td className="px-6 py-4"><button onClick={() => approveWithdrawal(w.id)} className="bg-green-500 text-white px-3 py-1 rounded mr-2"><HiOutlineCheckCircle className="inline w-4 h-4 mr-1" /> Approve</button><button onClick={() => rejectWithdrawal(w.id)} className="bg-red-500 text-white px-3 py-1 rounded"><HiOutlineXCircle className="inline w-4 h-4 mr-1" /> Reject</button></td></tr>))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWithdrawals;
