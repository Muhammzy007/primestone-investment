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
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(res => {
          if (res.data.success) {
            const userData = res.data.data;
            if (userData.role === 'admin') {
              setAdmin(userData);
            } else {
              setUser(userData);
            }
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password, isAdminLogin = false) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data && response.data.success === true) {
        const { token, user: userData } = response.data.data;

        // Save token
        localStorage.setItem('token', token);

        if (isAdminLogin || userData.role === 'admin') {
          setAdmin(userData);
          toast.success('Admin login successful!');
          // Force redirect using window.location
          window.location.href = '/admin';
          return { success: true };
        } else {
          setUser(userData);
          toast.success(`Welcome back, ${userData.username}!`);
          // Force redirect using window.location
          window.location.href = '/dashboard';
          return { success: true };
        }
      } else {
        toast.error(response.data?.error || 'Login failed');
        return { success: false, error: response.data?.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data && response.data.success === true) {
        const { token, user: userDataResponse } = response.data.data;
        
        localStorage.setItem('token', token);
        setUser(userDataResponse);
        toast.success('Registration successful!');
        window.location.href = '/dashboard';
        return { success: true };
      } else {
        toast.error(response.data?.error || 'Registration failed');
        return { success: false };
      }
    } catch (error) {
      console.error('Registration error:', error);
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setAdmin(null);
    toast.success('Logged out successfully');
    window.location.href = '/';
  };

  const value = {
    user,
    admin,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!(user || admin),
    isAdmin: !!admin,
    isUser: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
