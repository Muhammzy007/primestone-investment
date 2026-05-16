import axios from 'axios';

const API_URL = 'https://primestone-api.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - attach the correct token based on the request URL
api.interceptors.request.use(
  (config) => {
    // Determine if this is an admin request
    const isAdminRequest = config.url?.startsWith('/admin');
    
    // Get the appropriate token
    const token = isAdminRequest 
      ? localStorage.getItem('admin_token') 
      : localStorage.getItem('user_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`🔐 API ${config.method.toUpperCase()} ${config.url} - Using ${isAdminRequest ? 'admin' : 'user'} token`);
    } else {
      console.log(`🔐 API ${config.method.toUpperCase()} ${config.url} - No token`);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized request - Clearing tokens');
      // Clear both tokens on 401
      localStorage.removeItem('user_token');
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
