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
    const loadUser = async () => {
      const adminToken = localStorage.getItem('admin_token');
      const userToken = localStorage.getItem('user_token');
      const isAdminRoute = window.location.pathname.startsWith('/admin');

      console.log('Loading user - Admin route:', isAdminRoute);
      console.log('Admin token exists:', !!adminToken);
      console.log('User token exists:', !!userToken);

      if (isAdminRoute && adminToken) {
        try {
          const response = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          if (response.data.success) {
            const userData = response.data.data;
            if (userData.role === 'admin') {
              setAdmin(userData);
              console.log('✅ Admin loaded:', userData.username);
            } else {
              console.log('Token exists but user is not admin, clearing...');
              localStorage.removeItem('admin_token');
              window.location.href = '/admin/login';
            }
          }
        } catch (e) {
          console.error('Failed to load admin:', e);
          localStorage.removeItem('admin_token');
          if (isAdminRoute) window.location.href = '/admin/login';
        }
      } else if (userToken && !isAdminRoute) {
        try {
          const response = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${userToken}` }
          });
          if (response.data.success) {
            setUser(response.data.data);
            console.log('✅ User loaded:', response.data.data.username);
          }
        } catch (e) {
          console.error('Failed to load user:', e);
          localStorage.removeItem('user_token');
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email, password, isAdminLogin = false) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      console.log('Login response:', response.data);
      
      if (response.data?.success) {
        const { token, user: userData } = response.data.data;
        
        if (userData.role === 'admin') {
          localStorage.setItem('admin_token', token);
          localStorage.removeItem('user_token');
          setAdmin(userData);
          toast.success(`Welcome Admin, ${userData.username}!`);
          window.location.href = '/admin';
        } else {
          localStorage.setItem('user_token', token);
          localStorage.removeItem('admin_token');
          setUser(userData);
          toast.success(`Welcome back, ${userData.username}!`);
          window.location.href = '/dashboard';
        }
        return { success: true };
      }
      toast.error(response.data?.error || 'Login failed');
      return { success: false };
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.error || 'Login failed');
      return { success: false };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data?.success) {
        const { token, user: newUser } = response.data.data;
        localStorage.setItem('user_token', token);
        setUser(newUser);
        toast.success(`Welcome ${newUser.username}! Registration successful.`);
        window.location.href = '/dashboard';
        return { success: true };
      }
      toast.error(response.data?.error || 'Registration failed');
      return { success: false };
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.error || 'Registration failed');
      return { success: false };
    }
  };

  const logout = () => {
    const isAdminRoute = window.location.pathname.startsWith('/admin');
    
    if (isAdminRoute) {
      localStorage.removeItem('admin_token');
      setAdmin(null);
      toast.success('Admin logged out');
      window.location.href = '/admin/login';
    } else {
      localStorage.removeItem('user_token');
      setUser(null);
      toast.success('Logged out');
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{ user, admin, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
