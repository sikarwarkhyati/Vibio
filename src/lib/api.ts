// src/lib/api.ts
import axios from 'axios';

// Base URL for your backend
const BASE_URL = 'http://localhost:5000/api';

// Create a default axios instance
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include JWT token automatically
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage (or wherever you store it)
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Optional: response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // You can handle common errors here, e.g., 401 unauthorized
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized! Redirect to login.');
      // Optionally: redirect to login page
    }
    return Promise.reject(error);
  }
);

export default api;
