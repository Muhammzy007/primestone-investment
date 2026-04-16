import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineKey,
  HiOutlineShieldCheck,
  HiOutlineCreditCard,
  HiOutlineRefresh,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineTrash,
  HiOutlineStar
} from 'react-icons/hi';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [wallets, setWallets] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');

  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    phone: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [walletData, setWalletData] = useState({
    address: '',
    chain: 'TRC20',
    isDefault: false
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || ''
      });
      fetchWallets();
    }
  }, [user]);

  const fetchWallets = async () => {
    try {
      const response = await axios.get('/api/user/wallets');
      setWallets(response.data.data || []);
    } catch (error) {
      console.error('Error fetching wallets:', error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.put('/api/user/profile', profileData);
      updateUser(response.data.data);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWallet = async (e) => {
    e.preventDefault();
    if (!walletData.address) {
      toast.error('Please enter wallet address');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/user/wallets', walletData);
      toast.success('Wallet added successfully');
      setWalletData({
        address: '',
        chain: 'TRC20',
        isDefault: false
      });
      fetchWallets();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultWallet = async (walletId) => {
    try {
      await axios.put(`/api/user/wallets/${walletId}/default`);
      toast.success('Default wallet updated');
      fetchWallets();
    } catch (error) {
      toast.error('Failed to update default wallet');
    }
  };

  const handleDeleteWallet = async (walletId) => {
    if (!window.confirm('Are you sure you want to remove this wallet?')) return;
    
    try {
      await axios.delete(`/api/user/wallets/${walletId}`);
      toast.success('Wallet removed');
      fetchWallets();
    } catch (error) {
      toast.error('Failed to remove wallet');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-primestone-900">
            Profile Settings
          </h1>
          <p className="text-neutral-600 mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="border-b border-neutral-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'profile'
                    ? 'border-primestone-500 text-primestone-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('wallets')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'wallets'
                    ? 'border-primestone-500 text-primestone-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                Wallets
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileUpdate}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <HiOutlineUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                      <input
                        type="text"
                        value={profileData.username}
                        onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                        className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primestone-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <HiOutlineMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primestone-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <HiOutlinePhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primestone-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Wallets Tab */}
            {activeTab === 'wallets' && (
              <div className="space-y-6">
                {/* Existing Wallets */}
                {wallets.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-neutral-700 mb-3">Your Wallets</h3>
                    <div className="space-y-3">
                      {wallets.map((wallet, index) => (
                        <div
                          key={wallet.id || index}
                          className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                wallet.chain === 'TRC20' ? 'bg-purple-100 text-purple-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {wallet.chain}
                              </span>
                              {wallet.is_default && (
                                <span className="px-2 py-1 bg-primestone-100 text-primestone-800 rounded-full text-xs flex items-center">
                                  <HiOutlineStar className="w-3 h-3 mr-1" />
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="font-mono text-sm mt-1">{wallet.address}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {!wallet.is_default && (
                              <button
                                onClick={() => handleSetDefaultWallet(wallet.id)}
                                className="text-primestone-600 hover:text-primestone-700 text-sm"
                              >
                                Set Default
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteWallet(wallet.id)}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              <HiOutlineTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Wallet */}
                <div>
                  <h3 className="text-sm font-medium text-neutral-700 mb-3">Add New Wallet</h3>
                  <form onSubmit={handleAddWallet} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Wallet Address
                      </label>
                      <input
                        type="text"
                        value={walletData.address}
                        onChange={(e) => setWalletData({...walletData, address: e.target.value})}
                        placeholder="Enter your wallet address"
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primestone-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Network
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setWalletData({...walletData, chain: 'TRC20'})}
                          className={`p-3 border rounded-lg text-center ${
                            walletData.chain === 'TRC20' 
                              ? 'border-primestone-500 bg-primestone-50 text-primestone-700' 
                              : 'border-neutral-300 hover:bg-neutral-50'
                          }`}
                        >
                          TRC20
                        </button>
                        <button
                          type="button"
                          onClick={() => setWalletData({...walletData, chain: 'BEP20'})}
                          className={`p-3 border rounded-lg text-center ${
                            walletData.chain === 'BEP20' 
                              ? 'border-primestone-500 bg-primestone-50 text-primestone-700' 
                              : 'border-neutral-300 hover:bg-neutral-50'
                          }`}
                        >
                          BEP20
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isDefault"
                        checked={walletData.isDefault}
                        onChange={(e) => setWalletData({...walletData, isDefault: e.target.checked})}
                        className="h-4 w-4 text-primestone-600 focus:ring-primestone-500 border-neutral-300 rounded"
                      />
                      <label htmlFor="isDefault" className="ml-2 block text-sm text-neutral-600">
                        Set as default withdrawal wallet
                      </label>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                      >
                        {loading ? 'Adding...' : 'Add Wallet'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security Note */}
        <div className="bg-primestone-50 rounded-xl p-4 flex items-start">
          <HiOutlineShieldCheck className="w-5 h-5 text-primestone-600 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-sm text-primestone-700">
            Your information is protected by industry-standard encryption. We never share your personal data with third parties.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
