import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const location = useLocation();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const isAdminRoute = location.pathname.startsWith('/admin');

      // Admin route protection
      if (isAdminRoute) {
        const adminSession = sessionStorage.getItem('admin_session');
        const adminToken = sessionStorage.getItem('admin_access_token');

        if (adminSession && adminToken) {
          try {
            const adminData = JSON.parse(adminSession);
            if (adminData.role === 'admin') {
              setAuthorized(true);
              setLoading(false);
              return;
            }
          } catch (e) {
            sessionStorage.removeItem('admin_session');
            sessionStorage.removeItem('admin_access_token');
            sessionStorage.removeItem('admin_refresh_token');
          }
        }
        // Not authorized as admin
        window.location.href = '/admin/login';
      }
      // User route protection
      else {
        const userSession = sessionStorage.getItem('user_session');
        const userToken = sessionStorage.getItem('user_access_token');

        if (userSession && userToken) {
          try {
            const userData = JSON.parse(userSession);
            if (userData.role === 'user') {
              setAuthorized(true);
              setLoading(false);
              return;
            }
          } catch (e) {
            sessionStorage.removeItem('user_session');
            sessionStorage.removeItem('user_access_token');
            sessionStorage.removeItem('user_refresh_token');
          }
        }
        // Not authorized as user
        window.location.href = '/login';
      }
      setLoading(false);
    };

    checkAuth();
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primestone-200 border-t-primestone-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  return authorized ? children : null;
};

export default ProtectedRoute;
