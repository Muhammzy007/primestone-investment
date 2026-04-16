import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineCash,
  HiOutlineCog,
  HiOutlineRefresh,
  HiOutlineSave,
  HiOutlineShieldCheck,
  HiOutlineExclamationCircle,
  HiOutlineCurrencyDollar,
  HiOutlineClock
} from 'react-icons/hi';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState({
    withdrawal_fee: '500',
    minimum_investment: '1000',
    yield_period_days: '180',
    admin_email: 'admin@primestone.com',
    company_name: 'PrimeStone Investment',
    support_email: 'support@primestone.com',
    website_url: 'http://localhost:3000'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/settings');
      console.log('Settings response:', response.data);
      if (response.data.data?.settings) {
        setSettings(prev => ({ ...prev, ...response.data.data.settings }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      if (error.response?.status === 404) {
        setError('Settings endpoint not found');
      } else if (error.response?.status === 403) {
        setError('Admin access required');
      } else {
        setError(error.response?.data?.error || 'Failed to load settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/admin/settings/update', settings);
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-neutral-600">Loading settings...</p>
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
            onClick={fetchSettings}
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-primestone-900">
              System Settings
            </h1>
            <p className="text-neutral-600 mt-1">
              Configure platform settings
            </p>
          </div>
          <button
            onClick={fetchSettings}
            className="p-2 text-primestone-600 hover:text-primestone-700"
          >
            <HiOutlineRefresh className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="space-y-6">
            {/* Withdrawal Fee */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Withdrawal Fee ($)
              </label>
              <div className="relative">
                <HiOutlineCurrencyDollar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="number"
                  value={settings.withdrawal_fee}
                  onChange={(e) => handleChange('withdrawal_fee', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primestone-500"
                  min="0"
                  step="10"
                />
              </div>
            </div>

            {/* Minimum Investment */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Minimum Investment ($)
              </label>
              <div className="relative">
                <HiOutlineCash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="number"
                  value={settings.minimum_investment}
                  onChange={(e) => handleChange('minimum_investment', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primestone-500"
                  min="50"
                  step="50"
                />
              </div>
            </div>

            {/* Yield Period */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Yield Period (days)
              </label>
              <div className="relative">
                <HiOutlineClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="number"
                  value={settings.yield_period_days}
                  onChange={(e) => handleChange('yield_period_days', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primestone-500"
                  min="30"
                  max="365"
                />
              </div>
            </div>

            {/* Admin Email */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Admin Email
              </label>
              <input
                type="email"
                value={settings.admin_email}
                onChange={(e) => handleChange('admin_email', e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primestone-500"
              />
            </div>

            {/* Support Email */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Support Email
              </label>
              <input
                type="email"
                value={settings.support_email}
                onChange={(e) => handleChange('support_email', e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primestone-500"
              />
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={settings.company_name}
                onChange={(e) => handleChange('company_name', e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primestone-500"
              />
            </div>

            {/* Website URL */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Website URL
              </label>
              <input
                type="url"
                value={settings.website_url}
                onChange={(e) => handleChange('website_url', e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primestone-500"
              />
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full btn-primary flex items-center justify-center"
              >
                <HiOutlineSave className="w-5 h-5 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-6 bg-primestone-50 rounded-xl p-4 flex items-start">
          <HiOutlineShieldCheck className="w-5 h-5 text-primestone-600 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-sm text-primestone-700">
            Changes to these settings will affect the entire platform. Please review carefully before saving.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
