import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  HiOutlineUser, 
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineChartSquareBar,
  HiOutlineFolder,
  HiOutlineCreditCard,
  HiOutlineCash,
  HiOutlineHome
} from 'react-icons/hi';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/');
  };

  // Don't show navigation on auth pages
  if (['/login', '/register', '/admin/login'].includes(location.pathname)) {
    return null;
  }

  // User Navigation Items
  const userNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: HiOutlineChartSquareBar },
    { name: 'My Investments', path: '/investments', icon: HiOutlineFolder },
    { name: 'Payments', path: '/payments', icon: HiOutlineCreditCard },
    { name: 'Withdrawals', path: '/withdrawals', icon: HiOutlineCash },
    { name: 'Profile', path: '/profile', icon: HiOutlineUser },
  ];

  // Public Navigation Items
  const publicNavItems = [
    { name: 'Home', path: '/', icon: HiOutlineHome },
  ];

  const navItems = !isAuthenticated ? publicNavItems : userNavItems;

  return (
    <nav className="bg-gradient-to-r from-primestone-600 to-primestone-800 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-full flex items-center justify-center shadow-lg border-2 border-[#FFD700] relative overflow-hidden animate-float">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-30 transform rotate-45 animate-shine"></div>
              <span className="text-primestone-800 font-bold text-lg relative z-10">P</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg text-white leading-tight">
                PrimeStone
              </span>
              <span className="text-xs text-primestone-200 font-medium tracking-wide leading-tight">
                Secure Investment Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-white text-primestone-600'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.name}
              </Link>
            ))}
            
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 ml-2 rounded-lg text-sm font-medium text-white hover:bg-white/10 transition-colors"
              >
                <HiOutlineLogout className="w-4 h-4 mr-2" />
                Logout
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
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

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-primestone-700 border-t border-primestone-600">
          <div className="px-2 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center px-3 py-3 rounded-md text-base font-medium text-white hover:bg-primestone-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            ))}
            
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-3 rounded-md text-base font-medium text-white hover:bg-primestone-600 transition-colors"
              >
                <HiOutlineLogout className="w-5 h-5 mr-3" />
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
