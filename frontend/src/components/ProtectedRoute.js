import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const location = useLocation();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const isAdminRoute = location.pathname.startsWith('/admin');

    if (!token) {
      if (isAdminRoute) {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/login';
      }
      return;
    }

    // Decode token to check role
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userRole = payload.role;
      
      if (adminOnly && userRole !== 'admin') {
        window.location.href = '/dashboard';
        return;
      }
      
      setAuthorized(true);
    } catch (e) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    setLoading(false);
  }, [location.pathname, adminOnly]);

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
