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
              Secure investment platform offering high returns on USDT investments. Start with as low as $500 and watch your money grow.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary text-lg px-8 py-3">
                Get Started
                <HiOutlineArrowRight className="ml-2 w-5 h-5 inline" />
              </Link>
              <Link to="/about" className="btn-secondary text-lg px-8 py-3">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose PrimeStone */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-primestone-900">
            Why Choose PrimeStone
          </h2>
          <p className="mt-4 text-xl text-neutral-600 max-w-2xl mx-auto">
            Start your investment journey with as low as $500 and earn daily yields
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-primestone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlineShieldCheck className="w-8 h-8 text-primestone-600" />
            </div>
            <h3 className="text-xl font-semibold text-primestone-800 mb-2">Secure & Safe</h3>
            <p className="text-neutral-600">Bank-level security with blockchain verification for all transactions</p>
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
            <p className="text-neutral-600">Start investing from just $500 with flexible payment options</p>
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

      {/* Investment Packages Preview */}
      <div className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primestone-900">
              Investment Packages
            </h2>
            <p className="mt-4 text-xl text-neutral-600">
              Choose the package that fits your goals
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Bronze Card */}
            <div className="border border-neutral-200 rounded-xl hover:shadow-lg transition-shadow flex flex-col h-full">
              <div className="p-6 flex flex-col h-full">
                <div className="text-center">
                  <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-amber-700">B</span>
                  </div>
                  <h3 className="text-xl font-bold text-primestone-900">Bronze</h3>
                  <p className="text-3xl font-bold text-primestone-900 mt-2">$500</p>
                  <p className="text-sm text-neutral-500">Minimum to Yield</p>
                </div>
                <div className="flex-1 mt-6">
                  <ul className="space-y-2 text-sm text-neutral-600">
                    <li className="flex items-center justify-between">
                      <span>Returns:</span>
                      <span className="font-semibold text-green-600">100% (2x)</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Daily Yield:</span>
                      <span className="font-semibold text-green-600">6.67%</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Term:</span>
                      <span className="font-semibold">6 Months</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Payments:</span>
                      <span className="font-semibold">Flexible</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-6">
                  <Link to="/register" className="bg-gradient-to-r from-primestone-600 to-primestone-700 text-white py-2 px-4 rounded-lg font-medium hover:from-primestone-700 hover:to-primestone-800 transition-all duration-300 w-full text-center block">
                    Get Started
                  </Link>
                </div>
              </div>
            </div>

            {/* Silver Card */}
            <div className="border border-neutral-200 rounded-xl hover:shadow-lg transition-shadow flex flex-col h-full">
              <div className="p-6 flex flex-col h-full">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-gray-600">S</span>
                  </div>
                  <h3 className="text-xl font-bold text-primestone-900">Silver</h3>
                  <p className="text-3xl font-bold text-primestone-900 mt-2">$2,000</p>
                  <p className="text-sm text-neutral-500">Minimum to Yield</p>
                </div>
                <div className="flex-1 mt-6">
                  <ul className="space-y-2 text-sm text-neutral-600">
                    <li className="flex items-center justify-between">
                      <span>Returns:</span>
                      <span className="font-semibold text-green-600">100% (2x)</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Daily Yield:</span>
                      <span className="font-semibold text-green-600">6.67%</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Term:</span>
                      <span className="font-semibold">6 Months</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Payments:</span>
                      <span className="font-semibold">Flexible</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-6">
                  <Link to="/register" className="bg-gradient-to-r from-primestone-600 to-primestone-700 text-white py-2 px-4 rounded-lg font-medium hover:from-primestone-700 hover:to-primestone-800 transition-all duration-300 w-full text-center block">
                    Get Started
                  </Link>
                </div>
              </div>
            </div>

            {/* Gold Card - Popular */}
            <div className="border-2 border-yellow-400 rounded-xl hover:shadow-lg transition-shadow relative flex flex-col h-full">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                POPULAR
              </div>
              <div className="p-6 flex flex-col h-full">
                <div className="text-center">
                  <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-yellow-700">G</span>
                  </div>
                  <h3 className="text-xl font-bold text-primestone-900">Gold</h3>
                  <p className="text-3xl font-bold text-primestone-900 mt-2">$4,000</p>
                  <p className="text-sm text-neutral-500">Minimum to Yield</p>
                </div>
                <div className="flex-1 mt-6">
                  <ul className="space-y-2 text-sm text-neutral-600">
                    <li className="flex items-center justify-between">
                      <span>Returns:</span>
                      <span className="font-semibold text-green-600">200% (3x)</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Daily Yield:</span>
                      <span className="font-semibold text-green-600">6.67%</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Term:</span>
                      <span className="font-semibold">6 Months</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Payments:</span>
                      <span className="font-semibold">Flexible</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-6">
                  <Link to="/register" className="bg-gradient-to-r from-primestone-600 to-primestone-700 text-white py-2 px-4 rounded-lg font-medium hover:from-primestone-700 hover:to-primestone-800 transition-all duration-300 w-full text-center block">
                    Get Started
                  </Link>
                </div>
              </div>
            </div>

            {/* Platinum Card */}
            <div className="border border-neutral-200 rounded-xl hover:shadow-lg transition-shadow flex flex-col h-full">
              <div className="p-6 flex flex-col h-full">
                <div className="text-center">
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-purple-700">P</span>
                  </div>
                  <h3 className="text-xl font-bold text-primestone-900">Platinum</h3>
                  <p className="text-3xl font-bold text-primestone-900 mt-2">$8,000</p>
                  <p className="text-sm text-neutral-500">Minimum to Yield</p>
                </div>
                <div className="flex-1 mt-6">
                  <ul className="space-y-2 text-sm text-neutral-600">
                    <li className="flex items-center justify-between">
                      <span>Returns:</span>
                      <span className="font-semibold text-green-600">200% (3x)</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Daily Yield:</span>
                      <span className="font-semibold text-green-600">6.67%</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Term:</span>
                      <span className="font-semibold">6 Months</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Payments:</span>
                      <span className="font-semibold">Flexible</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-6">
                  <Link to="/register" className="bg-gradient-to-r from-primestone-600 to-primestone-700 text-white py-2 px-4 rounded-lg font-medium hover:from-primestone-700 hover:to-primestone-800 transition-all duration-300 w-full text-center block">
                    Get Started
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primestone-800 to-primestone-900 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
            Ready to Start Your Journey?
          </h2>
          <p className="mt-4 text-xl text-primestone-200 max-w-2xl mx-auto">
            Join thousands of investors already growing their wealth with PrimeStone
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="bg-[#FFD700] text-primestone-900 px-8 py-3 rounded-lg font-semibold hover:bg-[#FFD700]/90 transition-colors">
              Create Free Account
            </Link>
            <Link to="/about" className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
