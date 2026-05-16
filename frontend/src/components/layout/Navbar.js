import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineMenu, HiOutlineX, HiOutlineUser, HiOutlineChartBar, HiOutlineCash, HiOutlineRefresh, HiOutlineLogout } from 'react-icons/hi';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-gradient-to-r from-primestone-800 to-primestone-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-lg flex items-center justify-center">
                <span className="text-primestone-900 font-bold text-lg">P</span>
              </div>
              <span className="text-white font-bold text-xl">PrimeStone</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/dashboard" className="text-primestone-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Dashboard</Link>
                <Link to="/investments" className="text-primestone-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Investments</Link>
                <Link to="/payments" className="text-primestone-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Payments</Link>
                <Link to="/withdrawals" className="text-primestone-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Withdrawals</Link>
                <Link to="/profile" className="text-primestone-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Profile</Link>
                <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center">
                  <HiOutlineLogout className="w-4 h-4 mr-1" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-primestone-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Login</Link>
                <Link to="/register" className="bg-[#FFD700] text-primestone-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-[#FFD700]/90">Sign Up</Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-white focus:outline-none">
              {isOpen ? <HiOutlineX className="w-6 h-6" /> : <HiOutlineMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4">
            {user ? (
              <div className="flex flex-col space-y-2">
                <Link to="/dashboard" className="text-primestone-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium" onClick={() => setIsOpen(false)}>Dashboard</Link>
                <Link to="/investments" className="text-primestone-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium" onClick={() => setIsOpen(false)}>Investments</Link>
                <Link to="/payments" className="text-primestone-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium" onClick={() => setIsOpen(false)}>Payments</Link>
                <Link to="/withdrawals" className="text-primestone-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium" onClick={() => setIsOpen(false)}>Withdrawals</Link>
                <Link to="/profile" className="text-primestone-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium" onClick={() => setIsOpen(false)}>Profile</Link>
                <button onClick={handleLogout} className="bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium text-left">Logout</button>
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                <Link to="/login" className="text-primestone-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium" onClick={() => setIsOpen(false)}>Login</Link>
                <Link to="/register" className="bg-[#FFD700] text-primestone-900 px-3 py-2 rounded-md text-sm font-medium text-center" onClick={() => setIsOpen(false)}>Sign Up</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
