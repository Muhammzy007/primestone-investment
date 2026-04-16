import React from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineArrowLeft } from 'react-icons/hi';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center text-primestone-600 hover:text-primestone-700 mb-6">
          <HiOutlineArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>
        
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-display font-bold text-primestone-900 mb-6">Privacy Policy</h1>
          <p className="text-neutral-600 mb-4">Last updated: March 8, 2026</p>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-primestone-800 mb-3">1. Information We Collect</h2>
              <p className="text-neutral-600">We collect information you provide directly to us, such as when you create an account, make investments, or contact us for support.</p>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-primestone-800 mb-3">2. How We Use Your Information</h2>
              <p className="text-neutral-600">We use the information we collect to operate, maintain, and provide you with the features and functionality of the platform, as well as to communicate with you.</p>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-primestone-800 mb-3">3. Information Sharing</h2>
              <p className="text-neutral-600">We do not share your personal information with third parties except as necessary to provide our services or as required by law.</p>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-primestone-800 mb-3">4. Data Security</h2>
              <p className="text-neutral-600">We implement reasonable security measures to protect your information from unauthorized access, alteration, or destruction.</p>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-primestone-800 mb-3">5. Contact Us</h2>
              <p className="text-neutral-600">If you have questions about this Privacy Policy, please contact us at privacy@primestone.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
