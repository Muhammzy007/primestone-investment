import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  HiOutlineLogout,
  HiOutlineChartSquareBar,
  HiOutlineUsers,
  HiOutlineRefresh,
  HiOutlineCreditCard,
  HiOutlineCog,
  HiOutlineMenu,
  HiOutlineX
} from 'react-icons/hi';

const AdminNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/admin/login');
  };

  const adminNavItems = [
    { name: 'Dashboard', path: '/admin', icon: HiOutlineChartSquareBar },
    { name: 'Users', path: '/admin/users', icon: HiOutlineUsers },
    { name: 'Withdrawals', path: '/admin/withdrawals', icon: HiOutlineRefresh },
    { name: 'Transactions', path: '/admin/transactions', icon: HiOutlineCreditCard },
    { name: 'Settings', path: '/admin/settings', icon: HiOutlineCog },
  ];

  return (
    <nav className="bg-gradient-to-r from-primestone-800 to-primestone-900 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/admin" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-full flex items-center justify-center shadow-lg border-2 border-[#FFD700] relative overflow-hidden animate-float">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-30 transform rotate-45 animate-shine"></div>
              <span className="text-primestone-800 font-bold text-lg relative z-10">P</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg text-white leading-tight">
                PrimeStone Admin
              </span>
              <span className="text-xs text-primestone-300 font-medium tracking-wide">
                Administrator Portal
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {adminNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 transition-colors"
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.name}
              </Link>
            ))}
            
            <div className="ml-4 pl-4 border-l border-white/20">
              <div className="flex items-center space-x-3">
                <span className="text-sm text-white/80">
                  {user?.username || 'Admin'}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <HiOutlineLogout className="w-4 h-4 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
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
        <div className="md:hidden bg-primestone-900 border-t border-primestone-700">
          <div className="px-2 py-3 space-y-1">
            {adminNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center px-3 py-3 rounded-md text-base font-medium text-white/90 hover:bg-white/10 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            ))}
            <div className="border-t border-primestone-700 my-2"></div>
            <div className="px-3 py-2">
              <div className="text-sm text-white/80 mb-2">
                Logged in as: {user?.username || 'Admin'}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-3 rounded-md text-base font-medium text-white/90 hover:bg-white/10 transition-colors"
              >
                <HiOutlineLogout className="w-5 h-5 mr-3" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default AdminNavbar;
