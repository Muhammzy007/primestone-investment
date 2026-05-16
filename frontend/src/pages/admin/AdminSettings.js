import React from 'react';
import { HiOutlineCog } from 'react-icons/hi';

const AdminSettings = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center mb-6">
          <HiOutlineCog className="w-8 h-8 text-primestone-600 mr-3" />
          <h1 className="text-3xl font-display font-bold text-primestone-900">Settings</h1>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-8">
          <p className="text-neutral-600">System settings coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
