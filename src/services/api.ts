import axios from 'axios';

// Extend AxiosRequestConfig to include skipAuth
declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuth?: boolean;
  }
}

const API_URL = 'http://localhost:4001/api';

console.log('API Service initialized with URL:', API_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 second timeout
  withCredentials: false
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  console.log('Making request to:', config.url, 'with config:', {
    method: config.method,
    headers: config.headers,
    data: config.data
  });
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

// Add response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  (error) => {
    console.error('API Error Details:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        headers: error.config?.headers,
        data: error.config?.data
      },
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      } : 'No response'
    });

    if (error.code === 'ERR_NETWORK') {
      throw new Error('Unable to connect to the server. Please check if the backend is running at http://localhost:4001');
    }
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try again.');
    }
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  register: async (userData: { name: string; email: string; password: string }) => {
    try {
      console.log('Attempting registration with:', { ...userData, password: '[REDACTED]' });
      const response = await api.post('/auth/register', userData);
      console.log('Registration successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  login: async (credentials: { email: string; password: string; username: string }) => {
    try {
      console.log('Attempting login with:', { ...credentials, password: '[REDACTED]' });
      const response = await api.post('/auth/login', credentials);
      console.log('Login successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  getProfile: async () => {
    try {
      console.log('Attempting to get profile');
      const response = await api.get('/auth/profile');
      console.log('Profile retrieved successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },
};

export default api; 