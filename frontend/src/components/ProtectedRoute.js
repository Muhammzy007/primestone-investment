import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const location = useLocation();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const isAdminRoute = location.pathname.startsWith('/admin');

    console.log('ProtectedRoute - Token exists:', !!token);
    console.log('ProtectedRoute - Is admin route:', isAdminRoute);
    console.log('ProtectedRoute - adminOnly prop:', adminOnly);

    if (!token) {
      console.log('No token, redirecting to login');
      window.location.href = isAdminRoute ? '/admin/login' : '/login';
      return;
    }

    try {
      // Decode token to get role
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      
      console.log('Decoded token payload:', payload);
      console.log('User role from token:', payload.role);

      // For admin routes, check if user has admin role
      if (isAdminRoute || adminOnly) {
        if (payload.role === 'admin') {
          console.log('Admin access granted');
          setAuthorized(true);
        } else {
          console.log('Not admin, redirecting to user dashboard');
          window.location.href = '/dashboard';
          return;
        }
      } else {
        // For user routes, allow both user and admin
        console.log('User access granted');
        setAuthorized(true);
      }
    } catch (e) {
      console.error('Token decode error:', e);
      localStorage.removeItem('token');
      window.location.href = '/login';
      return;
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
