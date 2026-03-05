import React, { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import {
  HiOutlineShieldCheck,
  HiOutlineChartBar,
  HiOutlineClock,
  HiOutlineCash,
  HiOutlineArrowRight,
  HiOutlineUserGroup,
  HiOutlineGlobe,
  HiOutlineLockClosed,
  HiOutlineTrendingUp,
  HiOutlineRefresh,
  HiOutlineCreditCard,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineUser,
  HiOutlineChartSquareBar
} from 'react-icons/hi';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

// Import AuthProvider
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Home Page Component
const Home = () => {
  const features = [
    {
      icon: <HiOutlineShieldCheck className="w-8 h-8 text-primestone-600" />,
      title: "Secure & Safe",
      desc: "Bank-level security with blockchain verification"
    },
    {
      icon: <HiOutlineChartBar className="w-8 h-8 text-primestone-600" />,
      title: "High Returns",
      desc: "Earn up to 200% returns on investments"
    },
    {
      icon: <HiOutlineClock className="w-8 h-8 text-primestone-600" />,
      title: "Flexible Terms",
      desc: "Start with as low as $50"
    },
    {
      icon: <HiOutlineRefresh className="w-8 h-8 text-primestone-600" />,
      title: "Daily Yields",
      desc: "Watch your investment grow daily"
    }
  ];

  const packages = [
    { name: "Bronze", min: 1000, max: 3000, return: "100%", color: "from-amber-600 to-amber-700" },
    { name: "Silver", min: 2000, max: 6000, return: "100%", color: "from-gray-400 to-gray-500" },
    { name: "Gold", min: 4000, max: 12000, return: "100%", color: "from-yellow-500 to-yellow-600" },
    { name: "Platinum", min: 8000, max: 24000, return: "200%", color: "from-blue-600 to-blue-700" }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primestone-600 to-primestone-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full opacity-10"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white rounded-full opacity-10"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 fade-in">
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight">
                  <span className="text-white">Grow Your Wealth with</span>{' '}
                  <span className="text-[#FFD700]">PrimeStone</span>
                </h1>
                <p className="text-xl text-primestone-200 mt-2 font-medium tracking-wide">Secure • Transparent • Profitable</p>
              </div>
              <p className="text-xl text-primestone-100">
                Secure, transparent, and profitable investment opportunities.
                Start your journey to financial freedom today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register" className="bg-white text-primestone-600 px-8 py-4 rounded-lg font-semibold hover:bg-primestone-50 transform hover:scale-105 transition-all duration-300 shadow-lg flex items-center justify-center gap-2">
                  Get Started Now <HiOutlineArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/login" className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-primestone-600 transition-all duration-300">
                  Sign In
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <HiOutlineShieldCheck className="w-6 h-6 text-[#FFD700]" />
                  <span className="text-sm">Secured</span>
                </div>
                <div className="flex items-center gap-2">
                  <HiOutlineLockClosed className="w-6 h-6 text-[#FFD700]" />
                  <span className="text-sm">Encrypted</span>
                </div>
                <div className="flex items-center gap-2">
                  <HiOutlineGlobe className="w-6 h-6 text-[#FFD700]" />
                  <span className="text-sm">Global</span>
                </div>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8">
                <div className="text-center">
                  <HiOutlineTrendingUp className="w-16 h-16 mx-auto mb-4 text-[#FFD700]" />
                  <div className="text-5xl font-bold mb-2">200%</div>
                  <p className="text-primestone-200">Maximum Returns</p>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">$10M+</div>
                    <p className="text-sm text-primestone-200">Invested</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">5K+</div>
                    <p className="text-sm text-primestone-200">Investors</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">$5M</div>
                    <p className="text-sm text-primestone-200">Paid Out</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">50+</div>
                    <p className="text-sm text-primestone-200">Countries</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primestone-900 mb-4">
              Why Choose PrimeStone?
            </h2>
            <p className="text-xl text-primestone-400 font-medium tracking-wide">Secure • Transparent • Profitable</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-neutral-100">
                <div className="w-16 h-16 bg-primestone-100 rounded-full flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-neutral-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Packages */}
      <section className="py-20 bg-gradient-to-b from-primestone-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primestone-900 mb-4">
              Investment Packages
            </h2>
            <p className="text-xl text-primestone-400 font-medium tracking-wide">Choose Your Path to Growth</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className={`bg-gradient-to-r ${pkg.color} px-6 py-4`}>
                  <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Min</span>
                      <span className="font-semibold">${pkg.min}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Max</span>
                      <span className="font-semibold">${pkg.max}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Return</span>
                      <span className="font-semibold text-success">{pkg.return}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Duration</span>
                      <span className="font-semibold">6 Months</span>
                    </div>
                  </div>
                  <div className="border-t border-neutral-200 pt-4">
                    <div className="text-center mb-4">
                      <span className="text-2xl font-bold text-primestone-600">
                        ${pkg.min * (pkg.return === '200%' ? 3 : 2)}
                      </span>
                      <span className="text-neutral-500 text-sm block">Expected Return</span>
                    </div>
                    <Link to="/register" className="block w-full text-center bg-primestone-600 text-white px-4 py-2 rounded-lg hover:bg-primestone-700 transition-colors">
                      Invest Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primestone-600 to-primestone-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <HiOutlineCreditCard className="w-16 h-16 text-[#FFD700] mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-primestone-200 mb-8 font-medium tracking-wide">Secure • Transparent • Profitable</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="bg-white text-primestone-600 px-8 py-4 rounded-lg font-semibold hover:bg-primestone-50 transition-all duration-300 flex items-center justify-center gap-2">
              Create Free Account <HiOutlineArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/login" className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-primestone-600 transition-all duration-300">
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

// Main App Component wrapped with AuthProvider
function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white flex flex-col">
        {/* Navigation - Blue Header */}
        <nav className="bg-gradient-to-r from-primestone-600 to-primestone-800 shadow-lg sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              {/* Logo - Gold coin with P inside and website name */}
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-full flex items-center justify-center shadow-lg border-2 border-[#FFD700] relative overflow-hidden flex-shrink-0 animate-float">
                  {/* Coin shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-30 transform rotate-45 animate-shine"></div>
                  <span className="text-primestone-800 font-bold text-lg relative z-10">P</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-lg text-white leading-tight">
                    PrimeStone
                  </span>
                  <span className="text-xs text-primestone-200 font-medium tracking-wide leading-tight">
                    Secure • Transparent • Profitable
                  </span>
                </div>
              </Link>

              {/* Desktop Dropdown Menu - White button on blue */}
              <div className="hidden md:block relative">
                <div className="group relative">
                  <button className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg hover:bg-primestone-50 transition-colors">
                    <HiOutlineUser className="w-5 h-5 text-primestone-600" />
                    <span className="text-primestone-700 font-medium">Menu</span>
                    <svg className="w-4 h-4 text-primestone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown content - NO DASHBOARD HERE */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-neutral-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                    <Link
                      to="/login"
                      className="block px-4 py-3 text-neutral-700 hover:bg-primestone-50 hover:text-primestone-600 transition-colors border-b border-neutral-100"
                    >
                      <div className="flex items-center space-x-2">
                        <HiOutlineUser className="w-5 h-5" />
                        <span>Login</span>
                      </div>
                    </Link>
                    <Link
                      to="/register"
                      className="block px-4 py-3 text-neutral-700 hover:bg-primestone-50 hover:text-primestone-600 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <HiOutlineCreditCard className="w-5 h-5" />
                        <span>Register</span>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Mobile Menu Button - White icon on blue */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-primestone-700 transition-colors"
              >
                {isMenuOpen ? (
                  <HiOutlineX className="w-6 h-6 text-white" />
                ) : (
                  <HiOutlineMenu className="w-6 h-6 text-white" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown - NO DASHBOARD HERE */}
          {isMenuOpen && (
            <div className="md:hidden bg-white border-t border-neutral-200 py-2">
              <div className="px-2 space-y-1">
                <Link
                  to="/login"
                  className="block px-3 py-3 rounded-md text-base font-medium text-neutral-700 hover:bg-primestone-50 hover:text-primestone-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center space-x-3">
                    <HiOutlineUser className="w-5 h-5" />
                    <span>Login</span>
                  </div>
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-3 rounded-md text-base font-medium text-neutral-700 hover:bg-primestone-50 hover:text-primestone-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center space-x-3">
                    <HiOutlineCreditCard className="w-5 h-5" />
                    <span>Register</span>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </nav>

        {/* Main Content - Routes */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-gradient-to-r from-primestone-800 to-primestone-900 text-white mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-3 mb-4 md:mb-0">
                <div className="w-8 h-8 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-full flex items-center justify-center border-2 border-[#FFD700] relative overflow-hidden animate-float">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-30 transform rotate-45 animate-shine"></div>
                  <span className="text-primestone-800 font-bold text-sm relative z-10">P</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-[#FFD700]">PrimeStone Investment</span>
                  <span className="text-xs text-primestone-300 font-medium tracking-wide">Secure • Transparent • Profitable</span>
                </div>
              </div>
              <div className="text-sm text-primestone-300">
                © 2026 PrimeStone. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </AuthProvider>
  );
}

export default App;
