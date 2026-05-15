import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { HiOutlineRefresh, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineClock } from 'react-icons/hi';
import toast from 'react-hot-toast';

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/withdrawals/pending');
      console.log('Withdrawals response:', response.data);
      setWithdrawals(response.data.data || []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      setError('Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const approveWithdrawal = async (id) => {
    if (!window.confirm('Approve this withdrawal request?')) return;
    try {
      await api.post(`/admin/withdrawals/${id}/approve`);
      toast.success('Withdrawal approved successfully');
      fetchWithdrawals();
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      toast.error('Failed to approve withdrawal');
    }
  };

  const rejectWithdrawal = async (id) => {
    const reason = window.prompt('Reason for rejection:');
    if (!reason) return;
    try {
      await api.post(`/admin/withdrawals/${id}/reject`, { reason });
      toast.success('Withdrawal rejected');
      fetchWithdrawals();
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      toast.error('Failed to reject withdrawal');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center"><div className="spinner mb-4"></div><p>Loading withdrawals...</p></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-primestone-900">Withdrawal Requests</h1>
            <p className="text-neutral-600 mt-1">Pending: {withdrawals.length}</p>
          </div>
          <button onClick={fetchWithdrawals} className="flex items-center text-primestone-600 hover:text-primestone-700">
            <HiOutlineRefresh className="w-5 h-5 mr-1" /> Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">{error}</div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {withdrawals.length === 0 ? (
            <div className="text-center py-12">
              <HiOutlineClock className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500">No pending withdrawal requests</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">BTC Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Requested</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {withdrawals.map((wd) => (
                    <tr key={wd.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4">
                        <div className="font-medium">{wd.users?.username}</div>
                        <div className="text-sm text-neutral-500">{wd.users?.email}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-primestone-600">${wd.amount}</td>
                      <td className="px-6 py-4 font-mono text-sm">{wd.btc_address?.substring(0, 30)}...</td>
                      <td className="px-6 py-4 text-sm">{new Date(wd.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => approveWithdrawal(wd.id)}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 flex items-center"
                          >
                            <HiOutlineCheckCircle className="w-4 h-4 mr-1" /> Approve
                          </button>
                          <button
                            onClick={() => rejectWithdrawal(wd.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 flex items-center"
                          >
                            <HiOutlineXCircle className="w-4 h-4 mr-1" /> Reject
                          </button>
                        </div>
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

export default AdminWithdrawals;
