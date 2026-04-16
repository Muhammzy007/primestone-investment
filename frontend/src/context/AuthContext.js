import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = () => {
            try {
                const path = window.location.pathname;
                const isAdminRoute = path.startsWith('/admin');
                
                if (isAdminRoute) {
                    // ADMIN ROUTE - Only check admin session
                    const adminSession = sessionStorage.getItem('admin_session');
                    const adminToken = sessionStorage.getItem('admin_access_token');
                    
                    if (adminSession && adminToken) {
                        try {
                            const adminData = JSON.parse(adminSession);
                            if (adminData.role === 'admin') {
                                setAdmin(adminData);
                                setUser(null);
                                console.log('✅ Admin loaded in admin tab');
                            } else {
                                clearAdminStorage();
                            }
                        } catch (e) {
                            clearAdminStorage();
                        }
                    }
                } else {
                    // USER ROUTE - Only check user session
                    const userSession = sessionStorage.getItem('user_session');
                    const userToken = sessionStorage.getItem('user_access_token');

                    if (userSession && userToken) {
                        try {
                            const userData = JSON.parse(userSession);
                            if (userData.role === 'user') {
                                setUser(userData);
                                setAdmin(null);
                                console.log('✅ User loaded in user tab');
                            } else {
                                clearUserStorage();
                            }
                        } catch (e) {
                            clearUserStorage();
                        }
                    }
                }
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    const clearUserStorage = () => {
        sessionStorage.removeItem('user_session');
        sessionStorage.removeItem('user_access_token');
        sessionStorage.removeItem('user_refresh_token');
    };

    const clearAdminStorage = () => {
        sessionStorage.removeItem('admin_session');
        sessionStorage.removeItem('admin_access_token');
        sessionStorage.removeItem('admin_refresh_token');
    };

    const register = async (userData) => {
        try {
            setLoading(true);
            console.log('Registering user:', { ...userData, password: '***' });
            
            const response = await api.post('/auth/register', userData);
            console.log('Register response:', response.data);

            if (response.data?.success) {
                const { accessToken, refreshToken, user: userDataResponse } = response.data.data;
                
                sessionStorage.setItem('user_session', JSON.stringify(userDataResponse));
                sessionStorage.setItem('user_access_token', accessToken);
                sessionStorage.setItem('user_refresh_token', refreshToken);
                
                setUser(userDataResponse);
                toast.success('Registration successful! Welcome to PrimeStone!');
                
                // Force redirect to dashboard
                window.location.href = '/dashboard';
                return { success: true, user: userDataResponse };
            } else {
                const errorMsg = response.data?.error || 'Registration failed';
                toast.error(errorMsg);
                return { success: false, error: errorMsg };
            }
        } catch (error) {
            console.error('Registration error:', error);
            const message = error.response?.data?.error || 
                           error.response?.data?.errors?.[0]?.msg || 
                           'Registration failed. Please try again.';
            toast.error(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password, isAdminLogin = false) => {
        try {
            console.log('Login attempt:', { email, isAdminLogin });
            
            const response = await api.post('/auth/login', { email, password });
            console.log('Login response:', response.data);

            // Check if response exists and has success true
            if (response.data && response.data.success === true) {
                const { accessToken, refreshToken, user: userData } = response.data.data;

                if (isAdminLogin) {
                    // Admin login
                    if (userData.role !== 'admin') {
                        toast.error('Access denied. Admin privileges required.');
                        return { success: false };
                    }

                    clearAdminStorage();
                    sessionStorage.setItem('admin_session', JSON.stringify(userData));
                    sessionStorage.setItem('admin_access_token', accessToken);
                    sessionStorage.setItem('admin_refresh_token', refreshToken);
                    
                    setAdmin(userData);
                    toast.success('Admin login successful!');
                    
                    // Force redirect to admin dashboard
                    window.location.href = '/admin';
                    return { success: true, user: userData };
                } else {
                    // User login
                    if (userData.role !== 'user') {
                        toast.error('Invalid user account');
                        return { success: false };
                    }

                    clearUserStorage();
                    sessionStorage.setItem('user_session', JSON.stringify(userData));
                    sessionStorage.setItem('user_access_token', accessToken);
                    sessionStorage.setItem('user_refresh_token', refreshToken);
                    
                    setUser(userData);
                    toast.success(`Welcome back, ${userData.username}!`);
                    
                    // Force redirect to user dashboard
                    window.location.href = '/dashboard';
                    return { success: true, user: userData };
                }
            } else {
                // Handle error response
                const errorMsg = response.data?.error || 'Login failed';
                toast.error(errorMsg);
                return { success: false, error: errorMsg };
            }
        } catch (error) {
            console.error('Login error:', error);
            const message = error.response?.data?.error || 'Login failed. Please check your credentials.';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const logout = async () => {
        const path = window.location.pathname;
        const isAdmin = path.startsWith('/admin');
        
        try {
            const refreshToken = sessionStorage.getItem(isAdmin ? 'admin_refresh_token' : 'user_refresh_token');
            if (refreshToken) {
                await api.post('/auth/logout', { refreshToken });
            }
        } catch (error) {
            console.error('Logout error:', error);
        }

        if (isAdmin) {
            clearAdminStorage();
            setAdmin(null);
            toast.success('Admin logged out successfully');
            window.location.href = '/admin/login';
        } else {
            clearUserStorage();
            setUser(null);
            toast.success('Logged out successfully');
            window.location.href = '/';
        }
    };

    const value = {
        user,
        admin,
        loading,
        register,
        login,
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
