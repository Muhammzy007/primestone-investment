import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  HiOutlineShieldCheck, 
  HiOutlineChartBar, 
  HiOutlineClock, 
  HiOutlineCash,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineUserGroup,
  HiOutlineGlobe,
  HiOutlineLockClosed
} from 'react-icons/hi';
import axios from 'axios';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [packages, setPackages] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalInvested: 0,
    totalPaid: 0,
    countries: 0
  });

  useEffect(() => {
    fetchPackages();
    fetchStats();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await axios.get('/api/investments/packages');
      setPackages(response.data.data);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/public/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

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
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight">
                Grow Your Wealth with{' '}
                <span className="text-yellow-300">PrimeStone</span>
              </h1>
              <p className="text-xl text-primestone-100">
                Secure, transparent, and profitable investment opportunities. 
                Start your journey to financial freedom today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {isAuthenticated ? (
                  <Link to="/dashboard" className="btn-primary text-center">
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link to="/register" className="btn-primary text-center">
                      Get Started Now
                    </Link>
                    <Link to="/login" className="btn-secondary text-center">
                      Sign In
                    </Link>
                  </>
                )}
              </div>
              
              {/* Trust badges */}
              <div className="flex items-center space-x-6 pt-4">
                <div className="flex items-center space-x-2">
                  <HiOutlineShieldCheck className="w-6 h-6 text-yellow-300" />
                  <span className="text-sm">Secured</span>
                </div>
                <div className="flex items-center space-x-2">
                  <HiOutlineLockClosed className="w-6 h-6 text-yellow-300" />
                  <span className="text-sm">Encrypted</span>
                </div>
                <div className="flex items-center space-x-2">
                  <HiOutlineGlobe className="w-6 h-6 text-yellow-300" />
                  <span className="text-sm">Global</span>
                </div>
              </div>
            </div>
            
            <div className="hidden md:block">
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8">
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2">200%</div>
                  <p className="text-primestone-200">Average Returns</p>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">${stats.totalInvested}M+</div>
                    <p className="text-sm text-primestone-200">Invested</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.totalUsers}K+</div>
                    <p className="text-sm text-primestone-200">Investors</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">${stats.totalPaid}M</div>
                    <p className="text-sm text-primestone-200">Paid Out</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.countries}+</div>
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
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              We combine security, transparency, and profitability to give you the best investment experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-primestone-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <HiOutlineShieldCheck className="w-8 h-8 text-primestone-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Secure & Safe</h3>
              <p className="text-neutral-600">
                Your investments are protected with bank-level security and blockchain verification.
              </p>
            </div>

            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-primestone-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <HiOutlineChartBar className="w-8 h-8 text-primestone-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">High Returns</h3>
              <p className="text-neutral-600">
                Earn up to 200% returns on your investments with our proven investment strategies.
              </p>
            </div>

            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-primestone-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <HiOutlineClock className="w-8 h-8 text-primestone-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Flexible Terms</h3>
              <p className="text-neutral-600">
                Start with as low as $50 and choose from multiple investment packages.
              </p>
            </div>
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
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              Choose the package that best suits your investment goals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg, index) => (
              <div key={pkg.id} className="package-card fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="mb-4">
                  <span className={`badge badge-${pkg.color_class || 'blue'} mb-2`}>
                    {pkg.package_name}
                  </span>
                  <h3 className="text-2xl font-bold text-primestone-900">{pkg.package_name}</h3>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Min Investment</span>
                    <span className="font-semibold">${pkg.min_investment}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Max Investment</span>
                    <span className="font-semibold">${pkg.max_investment}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Return</span>
                    <span className="font-semibold text-success">200%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Duration</span>
                    <span className="font-semibold">30 Days</span>
                  </div>
                </div>

                <div className="border-t border-neutral-200 pt-4">
                  <div className="text-center mb-4">
                    <span className="text-2xl font-bold text-primestone-600">
                      ${pkg.min_investment * 3}
                    </span>
                    <span className="text-neutral-500 text-sm block">Expected Return</span>
                  </div>
                  
                  <Link
                    to={isAuthenticated ? "/investments" : "/register"}
                    className="btn-primary w-full text-center block"
                  >
                    {isAuthenticated ? 'Invest Now' : 'Get Started'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primestone-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              Three simple steps to start your investment journey
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="text-center">
                <div className="w-16 h-16 bg-primestone-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2">Create Account</h3>
                <p className="text-neutral-600">
                  Sign up for free and verify your email to get started.
                </p>
              </div>
              {index < 2 && (
                <div className="hidden md:block absolute top-8 left-full w-full border-t-2 border-dashed border-primestone-200"></div>
              )}
            </div>

            <div className="relative">
              <div className="text-center">
                <div className="w-16 h-16 bg-primestone-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2">Choose Package</h3>
                <p className="text-neutral-600">
                  Select an investment package that matches your goals.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="text-center">
                <div className="w-16 h-16 bg-primestone-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2">Start Earning</h3>
                <p className="text-neutral-600">
                  Make payments and watch your investment grow daily.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-b from-white to-primestone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primestone-900 mb-4">
              What Our Investors Say
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              Join thousands of satisfied investors who trust PrimeStone
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="card p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primestone-100 rounded-full flex items-center justify-center">
                  <HiOutlineUserGroup className="w-6 h-6 text-primestone-600" />
                </div>
                <div className="ml-3">
                  <h4 className="font-semibold">John Smith</h4>
                  <p className="text-sm text-neutral-500">Investor since 2023</p>
                </div>
              </div>
              <p className="text-neutral-600">
                "PrimeStone has transformed my investment portfolio. The returns are consistent and the platform is incredibly easy to use."
              </p>
              <div className="mt-4 flex text-yellow-400">
                {"★★★★★".split('').map((star, i) => (
                  <span key={i}>{star}</span>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primestone-100 rounded-full flex items-center justify-center">
                  <HiOutlineUserGroup className="w-6 h-6 text-primestone-600" />
                </div>
                <div className="ml-3">
                  <h4 className="font-semibold">Sarah Johnson</h4>
                  <p className="text-sm text-neutral-500">Investor since 2024</p>
                </div>
              </div>
              <p className="text-neutral-600">
                "The transparency and security of this platform is unmatched. I love being able to track my investments in real-time."
              </p>
              <div className="mt-4 flex text-yellow-400">
                {"★★★★★".split('').map((star, i) => (
                  <span key={i}>{star}</span>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primestone-100 rounded-full flex items-center justify-center">
                  <HiOutlineUserGroup className="w-6 h-6 text-primestone-600" />
                </div>
                <div className="ml-3">
                  <h4 className="font-semibold">Michael Chen</h4>
                  <p className="text-sm text-neutral-500">Investor since 2023</p>
                </div>
              </div>
              <p className="text-neutral-600">
                "Great returns and excellent customer support. The withdrawal process is smooth and timely."
              </p>
              <div className="mt-4 flex text-yellow-400">
                {"★★★★★".split('').map((star, i) => (
                  <span key={i}>{star}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primestone-600 to-primestone-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            Ready to Start Your Investment Journey?
          </h2>
          <p className="text-xl text-primestone-100 mb-8">
            Join PrimeStone today and take the first step towards financial freedom.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link to="/investments" className="btn-primary bg-white text-primestone-600 hover:bg-primestone-50">
                Explore Investments
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary bg-white text-primestone-600 hover:bg-primestone-50">
                  Create Free Account
                </Link>
                <Link to="/login" className="btn-secondary border-white text-white hover:bg-white hover:text-primestone-600">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
