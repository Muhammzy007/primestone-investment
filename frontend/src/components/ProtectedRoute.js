import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const location = useLocation();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isAdminRoute = location.pathname.startsWith('/admin');
    const token = isAdminRoute ? localStorage.getItem('admin_token') : localStorage.getItem('user_token');

    console.log('ProtectedRoute:', { isAdminRoute, hasToken: !!token });

    if (!token) {
      window.location.href = isAdminRoute ? '/admin/login' : '/login';
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Token payload:', payload);

      if (adminOnly || isAdminRoute) {
        if (payload.role === 'admin') {
          setAuthorized(true);
        } else {
          window.location.href = '/dashboard';
          return;
        }
      } else {
        setAuthorized(true);
      }
    } catch (e) {
      console.error('Token decode error:', e);
      if (isAdminRoute) localStorage.removeItem('admin_token');
      else localStorage.removeItem('user_token');
      window.location.href = isAdminRoute ? '/admin/login' : '/login';
      return;
    }
    setLoading(false);
  }, [location.pathname, adminOnly]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="spinner"></div><p className="ml-2">Loading...</p></div>;
  }

  return authorized ? children : null;
};

export default ProtectedRoute;
