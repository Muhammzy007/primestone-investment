import axios from 'axios';

const API_URL = 'https://primestone-api.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - ALWAYS add token
api.interceptors.request.use(
  (config) => {
    // Check which token to use based on the route
    const isAdminRequest = config.url?.startsWith('/admin');
    const token = isAdminRequest 
      ? localStorage.getItem('admin_token') 
      : localStorage.getItem('user_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`🔐 API Request: ${config.method.toUpperCase()} ${config.url} - Token attached`);
    } else {
      console.log(`🔐 API Request: ${config.method.toUpperCase()} ${config.url} - No token`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized - Clearing tokens');
      localStorage.removeItem('user_token');
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
