import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineLogout, HiOutlineUser, HiOutlineChartBar, HiOutlineCreditCard, HiOutlineCog } from 'react-icons/hi';

const AdminNavbar = () => {
  const { admin, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-gradient-to-r from-primestone-800 to-primestone-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/admin" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-lg flex items-center justify-center">
                <span className="text-primestone-900 font-bold text-lg">P</span>
              </div>
              <span className="text-white font-bold text-xl">PrimeStone Admin</span>
            </Link>
            <div className="hidden md:flex ml-10 space-x-4">
              <Link to="/admin" className="text-primestone-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center">
                <HiOutlineChartBar className="w-4 h-4 mr-1" /> Dashboard
              </Link>
              <Link to="/admin/users" className="text-primestone-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center">
                <HiOutlineUser className="w-4 h-4 mr-1" /> Users
              </Link>
              <Link to="/admin/withdrawals" className="text-primestone-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center">
                <HiOutlineCreditCard className="w-4 h-4 mr-1" /> Withdrawals
              </Link>
              <Link to="/admin/transactions" className="text-primestone-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center">
                <HiOutlineCreditCard className="w-4 h-4 mr-1" /> Transactions
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-primestone-300 text-sm">Welcome, {admin?.username || 'Admin'}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors"
            >
              <HiOutlineLogout className="w-4 h-4 mr-1" /> Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
