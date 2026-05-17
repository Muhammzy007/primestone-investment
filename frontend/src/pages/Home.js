import React from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineShieldCheck, HiOutlineChartBar, HiOutlineCash, HiOutlineRefresh, HiOutlineArrowRight, HiOutlineCreditCard } from 'react-icons/hi';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-display font-bold text-primestone-900 leading-tight">
              Grow Your Wealth with{' '}
              <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
                PrimeStone
              </span>
            </h1>
            <p className="mt-6 text-xl text-neutral-600 max-w-2xl mx-auto">
              Secure investment platform offering high returns on USDT investments. Start with as low as $100 and watch your money grow.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary text-lg px-8 py-3">
                Get Started
                <HiOutlineArrowRight className="ml-2 w-5 h-5 inline" />
              </Link>
              <Link to="/login" className="btn-secondary text-lg px-8 py-3">
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Rest of the component remains the same */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-primestone-900">Why Choose PrimeStone</h2>
          <p className="mt-4 text-xl text-neutral-600 max-w-2xl mx-auto">Start your investment journey with as low as $100 and earn daily yields</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-primestone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlineShieldCheck className="w-8 h-8 text-primestone-600" />
            </div>
            <h3 className="text-xl font-semibold text-primestone-800 mb-2">Secure & Safe</h3>
            <p className="text-neutral-600">Bank-level security with manual payment verification</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-primestone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlineChartBar className="w-8 h-8 text-primestone-600" />
            </div>
            <h3 className="text-xl font-semibold text-primestone-800 mb-2">High Returns</h3>
            <p className="text-neutral-600">Up to 200% returns on your investment over 6 months</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-primestone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlineCash className="w-8 h-8 text-primestone-600" />
            </div>
            <h3 className="text-xl font-semibold text-primestone-800 mb-2">Low Entry</h3>
            <p className="text-neutral-600">Start investing from just $100 with flexible payment options</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-primestone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlineRefresh className="w-8 h-8 text-primestone-600" />
            </div>
            <h3 className="text-xl font-semibold text-primestone-800 mb-2">Daily Yields</h3>
            <p className="text-neutral-600">Earn 6.67% daily yields once you reach minimum investment</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primestone-800 to-primestone-900 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white">Ready to Start Your Journey?</h2>
          <p className="mt-4 text-xl text-primestone-200 max-w-2xl mx-auto">Join thousands of investors already growing their wealth with PrimeStone</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="bg-[#FFD700] text-primestone-900 px-8 py-3 rounded-lg font-semibold hover:bg-[#FFD700]/90 transition-colors">Create Free Account</Link>
            <Link to="/login" className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
