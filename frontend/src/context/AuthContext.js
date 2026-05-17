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
    const checkAuth = async () => {
      const adminToken = localStorage.getItem('admin_token');
      const userToken = localStorage.getItem('user_token');
      const isAdminRoute = window.location.pathname.startsWith('/admin');

      console.log('🔐 Auth Check - Admin route:', isAdminRoute);
      console.log('Admin token exists:', !!adminToken);
      console.log('User token exists:', !!userToken);

      // Only load admin if on admin route and admin token exists
      if (isAdminRoute && adminToken) {
        try {
          const response = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          if (response.data.success && response.data.data.role === 'admin') {
            setAdmin(response.data.data);
            console.log('✅ Admin loaded:', response.data.data.username);
          } else {
            console.log('Invalid admin token, clearing');
            localStorage.removeItem('admin_token');
          }
        } catch (e) {
          console.error('Failed to load admin:', e);
          localStorage.removeItem('admin_token');
        }
      } 
      // Only load user if on user route and user token exists
      else if (!isAdminRoute && userToken) {
        try {
          const response = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${userToken}` }
          });
          if (response.data.success && response.data.data.role === 'user') {
            setUser(response.data.data);
            console.log('✅ User loaded:', response.data.data.username);
          } else {
            console.log('Invalid user token, clearing');
            localStorage.removeItem('user_token');
          }
        } catch (e) {
          console.error('Failed to load user:', e);
          localStorage.removeItem('user_token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password, isAdminLogin = false) => {
    try {
      console.log(`Login attempt: ${email}, isAdminLogin: ${isAdminLogin}`);
      
      const response = await api.post('/auth/login', { email, password });
      console.log('Login response:', response.data);
      
      if (response.data?.success) {
        const { token, user: userData } = response.data.data;
        console.log('User role:', userData.role);
        
        if (userData.role === 'admin') {
          // Admin login - ONLY set admin token
          localStorage.setItem('admin_token', token);
          setAdmin(userData);
          toast.success(`Welcome Admin, ${userData.username}!`);
          console.log('Admin token saved, redirecting to /admin');
          window.location.href = '/admin';
        } else {
          // User login - ONLY set user token
          localStorage.setItem('user_token', token);
          setUser(userData);
          toast.success(`Welcome back, ${userData.username}!`);
          console.log('User token saved, redirecting to /dashboard');
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
    console.log('Logout from:', isAdminRoute ? 'admin' : 'user');
    
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
