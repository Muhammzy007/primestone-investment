import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { HiOutlineSearch, HiOutlineUser, HiOutlineMail, HiOutlineCalendar, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineRefresh } from 'react-icons/hi';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data.data || []);
    } catch (error) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.post(`/admin/users/${userId}/toggle-status`, { isActive: !currentStatus });
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="spinner"></div><p>Loading users...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primestone-900">Manage Users</h1>
            <p className="text-neutral-600">Total Users: {users.length}</p>
          </div>
          <button onClick={fetchUsers} className="flex items-center text-primestone-600"><HiOutlineRefresh className="w-5 h-5 mr-1" /> Refresh</button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <input type="text" placeholder="Search by username or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr><th className="px-6 py-3 text-left text-xs font-medium text-neutral-500">ID</th><th className="px-6 py-3 text-left text-xs font-medium text-neutral-500">Username</th><th className="px-6 py-3 text-left text-xs font-medium text-neutral-500">Email</th><th className="px-6 py-3 text-left text-xs font-medium text-neutral-500">Role</th><th className="px-6 py-3 text-left text-xs font-medium text-neutral-500">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-neutral-500">Joined</th><th className="px-6 py-3 text-left text-xs font-medium text-neutral-500">Actions</th></tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">#{user.id}</td>
                  <td className="px-6 py-4"><HiOutlineUser className="inline w-4 h-4 mr-1" /> {user.username}</td>
                  <td className="px-6 py-4"><HiOutlineMail className="inline w-4 h-4 mr-1" /> {user.email}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>{user.role}</span></td>
                  <td className="px-6 py-4"><span className={`flex items-center ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>{user.is_active ? <HiOutlineCheckCircle className="w-4 h-4 mr-1" /> : <HiOutlineXCircle className="w-4 h-4 mr-1" />}{user.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-6 py-4"><HiOutlineCalendar className="inline w-4 h-4 mr-1" /> {new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4"><button onClick={() => toggleUserStatus(user.id, user.is_active)} className={`px-3 py-1 rounded text-sm ${user.is_active ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{user.is_active ? 'Deactivate' : 'Activate'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
