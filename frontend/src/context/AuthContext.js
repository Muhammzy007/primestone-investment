import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing sessions
    const adminToken = localStorage.getItem('admin_token');
    const userToken = localStorage.getItem('user_token');
    const isAdminRoute = window.location.pathname.startsWith('/admin');

    if (isAdminRoute && adminToken) {
      try {
        const payload = JSON.parse(atob(adminToken.split('.')[1]));
        if (payload.role === 'admin') {
          setAdmin({ id: payload.userId, username: payload.username, role: 'admin' });
        }
      } catch (e) {
        localStorage.removeItem('admin_token');
      }
    } else if (userToken && !isAdminRoute) {
      try {
        const payload = JSON.parse(atob(userToken.split('.')[1]));
        setUser({ id: payload.userId, username: payload.username, role: 'user' });
      } catch (e) {
        localStorage.removeItem('user_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password, isAdminLogin = false) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data?.success) {
        const { token, user: userData } = response.data.data;
        
        if (userData.role === 'admin') {
          // Admin login - only set admin token
          localStorage.setItem('admin_token', token);
          // DO NOT remove user_token - keep user session separate
          setAdmin(userData);
          toast.success('Admin login successful!');
          window.location.href = '/admin';
        } else {
          // User login - only set user token
          localStorage.setItem('user_token', token);
          // DO NOT remove admin_token - keep admin session separate
          setUser(userData);
          toast.success(`Welcome back, ${userData.username}!`);
          window.location.href = '/dashboard';
        }
        return { success: true };
      }
      toast.error(response.data?.error || 'Login failed');
      return { success: false };
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
      return { success: false };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data?.success) {
        const { token, user: userDataResponse } = response.data.data;
        localStorage.setItem('user_token', token);
        setUser(userDataResponse);
        toast.success('Registration successful!');
        window.location.href = '/dashboard';
        return { success: true };
      }
      toast.error(response.data?.error || 'Registration failed');
      return { success: false };
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
      return { success: false };
    }
  };

  const logout = () => {
    const isAdminRoute = window.location.pathname.startsWith('/admin');
    
    if (isAdminRoute) {
      // Only clear admin session, keep user session intact
      localStorage.removeItem('admin_token');
      setAdmin(null);
      toast.success('Admin logged out successfully');
      window.location.href = '/admin/login';
    } else {
      // Only clear user session, keep admin session intact
      localStorage.removeItem('user_token');
      setUser(null);
      toast.success('Logged out successfully');
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{ user, admin, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
