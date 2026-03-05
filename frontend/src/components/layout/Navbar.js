import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  HiOutlineHome, 
  HiOutlineChartBar, 
  HiOutlineCash, 
  HiOutlineCreditCard, 
  HiOutlineUser,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineBell,
  HiOutlineMoon,
  HiOutlineSun
} from 'react-icons/hi';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: HiOutlineHome, public: true },
    { name: 'Dashboard', path: '/dashboard', icon: HiOutlineChartBar, public: false, admin: false },
    { name: 'Investments', path: '/investments', icon: HiOutlineCash, public: false, admin: false },
    { name: 'Payments', path: '/payments', icon: HiOutlineCreditCard, public: false, admin: false },
    { name: 'Withdrawals', path: '/withdrawals', icon: HiOutlineCash, public: false, admin: false },
  ];

  const adminLinks = [
    { name: 'Admin', path: '/admin', icon: HiOutlineUser, public: false, admin: true },
    { name: 'Users', path: '/admin/users', icon: HiOutlineUser, public: false, admin: true },
    { name: 'Withdrawals', path: '/admin/withdrawals', icon: HiOutlineCash, public: false, admin: true },
  ];

  const filteredLinks = navLinks.filter(link => {
    if (link.public) return true;
    if (!isAuthenticated) return false;
    if (link.admin && !isAdmin) return false;
    return true;
  });

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primestone-600 to-primestone-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <span className="font-display font-bold text-xl text-primestone-900 hidden sm:block">
                PrimeStone
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {filteredLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link flex items-center space-x-1 ${
                  isActivePath(link.path) ? 'nav-link-active' : ''
                }`}
              >
                <link.icon className="w-5 h-5" />
                <span>{link.name}</span>
              </Link>
            ))}

            {isAdmin && (
              <div className="relative group">
                <button className="nav-link flex items-center space-x-1">
                  <HiOutlineUser className="w-5 h-5" />
                  <span>Admin</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl hidden group-hover:block hover:block">
                  {adminLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className="block px-4 py-2 text-sm text-neutral-700 hover:bg-primestone-50 hover:text-primestone-600"
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <link.icon className="w-4 h-4" />
                        <span>{link.name}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Theme toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-primestone-50 transition-colors"
            >
              {darkMode ? (
                <HiOutlineSun className="w-5 h-5 text-yellow-500" />
              ) : (
                <HiOutlineMoon className="w-5 h-5 text-primestone-600" />
              )}
            </button>

            {/* Notifications (if authenticated) */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg hover:bg-primestone-50 transition-colors relative"
                >
                  <HiOutlineBell className="w-5 h-5 text-primestone-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-neutral-200">
                    <div className="p-4 border-b border-neutral-200">
                      <h3 className="font-semibold text-neutral-800">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <div className="p-4 hover:bg-primestone-50 cursor-pointer">
                        <p className="text-sm text-neutral-600">Your investment has matured</p>
                        <p className="text-xs text-neutral-400 mt-1">2 hours ago</p>
                      </div>
                      <div className="p-4 hover:bg-primestone-50 cursor-pointer">
                        <p className="text-sm text-neutral-600">Payment received: $500</p>
                        <p className="text-xs text-neutral-400 mt-1">Yesterday</p>
                      </div>
                    </div>
                    <div className="p-2 border-t border-neutral-200">
                      <button className="text-sm text-primestone-600 hover:text-primestone-800 w-full text-center">
                        View all
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User menu or Auth buttons */}
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-primestone-50 transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-r from-primestone-500 to-primestone-700 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-neutral-700">{user?.username}</span>
                </button>
                
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl hidden group-hover:block hover:block">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-neutral-700 hover:bg-primestone-50 hover:text-primestone-600"
                  >
                    <div className="flex items-center space-x-2">
                      <HiOutlineUser className="w-4 h-4" />
                      <span>Profile</span>
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-primestone-50 hover:text-primestone-600"
                  >
                    <div className="flex items-center space-x-2">
                      <HiOutlineLogout className="w-4 h-4" />
                      <span>Logout</span>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-primestone-600 hover:text-primestone-700 font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-primestone-50 transition-colors"
            >
              {darkMode ? (
                <HiOutlineSun className="w-5 h-5 text-yellow-500" />
              ) : (
                <HiOutlineMoon className="w-5 h-5 text-primestone-600" />
              )}
            </button>
            
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg hover:bg-primestone-50 transition-colors"
            >
              {isOpen ? (
                <HiOutlineX className="w-6 h-6 text-primestone-600" />
              ) : (
                <HiOutlineMenu className="w-6 h-6 text-primestone-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-neutral-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {filteredLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActivePath(link.path)
                    ? 'bg-primestone-50 text-primestone-600'
                    : 'text-neutral-600 hover:bg-primestone-50 hover:text-primestone-600'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <div className="flex items-center space-x-2">
                  <link.icon className="w-5 h-5" />
                  <span>{link.name}</span>
                </div>
              </Link>
            ))}

            {isAdmin && adminLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActivePath(link.path)
                    ? 'bg-primestone-50 text-primestone-600'
                    : 'text-neutral-600 hover:bg-primestone-50 hover:text-primestone-600'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <div className="flex items-center space-x-2">
                  <link.icon className="w-5 h-5" />
                  <span>{link.name}</span>
                </div>
              </Link>
            ))}

            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-neutral-600 hover:bg-primestone-50 hover:text-primestone-600"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <HiOutlineUser className="w-5 h-5" />
                    <span>Profile</span>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-neutral-600 hover:bg-primestone-50 hover:text-primestone-600"
                >
                  <div className="flex items-center space-x-2">
                    <HiOutlineLogout className="w-5 h-5" />
                    <span>Logout</span>
                  </div>
                </button>
              </>
            ) : (
              <div className="px-3 py-2 space-y-2">
                <Link
                  to="/login"
                  className="block w-full text-center px-4 py-2 border border-primestone-600 text-primestone-600 rounded-lg font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block w-full text-center btn-primary"
                  onClick={() => setIsOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
