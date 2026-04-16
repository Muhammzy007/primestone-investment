import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineSearch,
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineEye,
  HiOutlineRefresh,
  HiOutlineExclamationCircle
} from 'react-icons/hi';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    newToday: 0
  });

  useEffect(() => {
    fetchUsers();
    
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async () => {
    try {
      setError(null);
      const response = await api.get('/admin/users');
      const userData = response.data.data.users || [];
      setUsers(userData);
      
      const today = new Date().toDateString();
      const stats = userData.reduce((acc, user) => {
        acc.total++;
        if (user.is_active) acc.active++;
        if (new Date(user.created_at).toDateString() === today) acc.newToday++;
        return acc;
      }, { total: 0, active: 0, newToday: 0 });
      
      setStats(stats);
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.response?.status === 403) {
        setError('Admin account deactivated. Please login again.');
        setTimeout(() => {
          localStorage.removeItem('admin_session');
          localStorage.removeItem('admin_token');
          window.location.href = '/admin/login';
        }, 3000);
      } else if (error.response?.status !== 401) {
        setError('Failed to load users');
        toast.error('Failed to load users');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    // Don't allow deactivating yourself
    const adminSession = JSON.parse(localStorage.getItem('admin_session') || '{}');
    if (adminSession.id === userId) {
      toast.error('You cannot deactivate your own account');
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/admin/users/${userId}/toggle-status`, {
        isActive: !currentStatus
      });
      
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
      
      // Close modal if open
      if (selectedUser && selectedUser.id === userId) {
        setShowUserModal(false);
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      if (error.response?.status === 403) {
        toast.error('Admin privileges revoked. Please login again.');
        setTimeout(() => {
          localStorage.removeItem('admin_session');
          localStorage.removeItem('admin_token');
          window.location.href = '/admin/login';
        }, 2000);
      } else {
        toast.error(error.response?.data?.error || 'Failed to update user status');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    if (searchTerm) {
      return user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             user.id?.toString().includes(searchTerm);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-neutral-600">Loading users...</p>
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
            onClick={fetchUsers}
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
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-primestone-900">
            User Management
          </h1>
          <p className="text-neutral-600 mt-1">
            View and manage all platform users
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-sm text-neutral-500">Total Users</p>
            <p className="text-2xl font-bold text-primestone-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-sm text-neutral-500">Active Users</p>
            <p className="text-2xl font-bold text-success">{stats.active}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-sm text-neutral-500">New Today</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.newToday}</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1 relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primestone-500"
              />
            </div>
            <button
              onClick={fetchUsers}
              className="flex items-center px-4 py-2 bg-primestone-600 text-white rounded-lg hover:bg-primestone-700"
              disabled={actionLoading}
            >
              <HiOutlineRefresh className="w-5 h-5 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {filteredUsers.map((user) => {
                  const adminSession = JSON.parse(localStorage.getItem('admin_session') || '{}');
                  const isCurrentUser = adminSession.id === user.id;
                  
                  return (
                    <tr key={user.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-primestone-100 rounded-full flex items-center justify-center">
                            <HiOutlineUser className="w-4 h-4 text-primestone-600" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-neutral-900">{user.username}</p>
                            <p className="text-xs text-neutral-500">ID: {user.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="flex items-center text-neutral-600">
                            <HiOutlineMail className="w-3 h-3 mr-1" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center text-neutral-600 mt-1">
                              <HiOutlinePhone className="w-3 h-3 mr-1" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                        <div className="flex items-center">
                          <HiOutlineCalendar className="w-4 h-4 mr-1 text-neutral-400" />
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserModal(true);
                            }}
                            className="text-primestone-600 hover:text-primestone-700"
                            title="View Details"
                          >
                            <HiOutlineEye className="w-5 h-5" />
                          </button>
                          {!isCurrentUser && (
                            <button
                              onClick={() => handleToggleStatus(user.id, user.is_active)}
                              disabled={actionLoading}
                              className={user.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                              title={user.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {user.is_active ? (
                                <HiOutlineXCircle className="w-5 h-5" />
                              ) : (
                                <HiOutlineCheckCircle className="w-5 h-5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-primestone-900">User Details</h2>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <HiOutlineXCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-neutral-500">Username</p>
                    <p className="font-medium">{selectedUser.username}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Email</p>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Status</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedUser.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedUser.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Joined</p>
                    <p className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                  >
                    Close
                  </button>
                  {JSON.parse(localStorage.getItem('admin_session') || '{}').id !== selectedUser.id && (
                    <button
                      onClick={() => {
                        handleToggleStatus(selectedUser.id, selectedUser.is_active);
                      }}
                      disabled={actionLoading}
                      className={`px-4 py-2 rounded-lg text-white ${
                        selectedUser.is_active 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {actionLoading ? 'Processing...' : (selectedUser.is_active ? 'Deactivate User' : 'Activate User')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
