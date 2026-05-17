import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const location = useLocation();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isAdminRoute = location.pathname.startsWith('/admin');
    
    // Get the appropriate token based on route
    const token = isAdminRoute 
      ? localStorage.getItem('admin_token') 
      : localStorage.getItem('user_token');

    console.log('🔒 ProtectedRoute - Path:', location.pathname);
    console.log('Is admin route:', isAdminRoute);
    console.log('Token exists:', !!token);

    if (!token) {
      console.log('No token, redirecting to', isAdminRoute ? '/admin/login' : '/login');
      window.location.href = isAdminRoute ? '/admin/login' : '/login';
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Token payload - userId:', payload.userId, 'role:', payload.role);

      if (isAdminRoute || adminOnly) {
        if (payload.role === 'admin') {
          console.log('✅ Admin access granted');
          setAuthorized(true);
        } else {
          console.log('❌ Not admin, redirecting to user dashboard');
          window.location.href = '/dashboard';
          return;
        }
      } else {
        // User routes
        if (payload.role === 'admin') {
          console.log('Admin accessing user route, redirecting to admin');
          window.location.href = '/admin';
          return;
        }
        console.log('✅ User access granted');
        setAuthorized(true);
      }
    } catch (e) {
      console.error('Token decode error:', e);
      // Clear only the relevant token
      if (isAdminRoute) {
        localStorage.removeItem('admin_token');
      } else {
        localStorage.removeItem('user_token');
      }
      window.location.href = isAdminRoute ? '/admin/login' : '/login';
      return;
    }
    
    setLoading(false);
  }, [location.pathname, adminOnly]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primestone-200 border-t-primestone-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  return authorized ? children : null;
};

export default ProtectedRoute;
