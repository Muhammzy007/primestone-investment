import React from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineArrowLeft } from 'react-icons/hi';

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center text-primestone-600 hover:text-primestone-700 mb-6">
          <HiOutlineArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>
        
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-display font-bold text-primestone-900 mb-6">Terms of Service</h1>
          <p className="text-neutral-600 mb-4">Last updated: 2026</p>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-primestone-800 mb-3">1. Acceptance of Terms</h2>
              <p className="text-neutral-600">By accessing and using PrimeStone Investment platform, you accept and agree to be bound by the terms and provision of this agreement.</p>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-primestone-800 mb-3">2. Investment Terms</h2>
              <p className="text-neutral-600">All investments made through our platform are subject to the specific terms of each investment package. Returns are calculated based on the package terms and paid according to the withdrawal process.</p>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-primestone-800 mb-3">3. User Responsibilities</h2>
              <p className="text-neutral-600">Users are responsible for maintaining the security of their account and wallet addresses. PrimeStone is not liable for any loss due to unauthorized access.</p>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-primestone-800 mb-3">4. Contact</h2>
              <p className="text-neutral-600">For questions about these terms, please contact us at support@primestone.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
