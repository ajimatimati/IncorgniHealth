import axios from 'axios';

const isDev = import.meta.env.DEV;
const apiUrl = import.meta.env.VITE_API_URL || '';

if (!isDev && !apiUrl) {
  console.error(
    '%c[CONFIGURATION ERROR]',
    'color: red; font-size: 20px; font-weight: bold;',
    '\nVITE_API_URL is not set. The app cannot connect to the backend. Please set VITE_API_URL in your .env file to your Vercel backend URL (e.g. https://your-app-name.vercel.app/api/v1).'
  );
}

if (!isDev && apiUrl.startsWith('http://') && !apiUrl.includes('localhost')) {
  console.error(
    '%c[CRITICAL SECURITY WARNING]', 
    'color: red; font-size: 20px; font-weight: bold;',
    '\nMixed Content Exception: You are attempting to connect a secure production frontend (HTTPS) to an insecure backend (HTTP). Modern browsers will permanently block these requests. Please update your VITE_API_URL to use an HTTPS provider.'
  );
}

const api = axios.create({
  // In dev mode: use relative URL — Vite proxy forwards /api → localhost:3001
  // In production: use the explicit env var or fall back to Render
  baseURL: isDev ? '/api/v1' : apiUrl,
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
    'ngrok-skip-browser-warning': 'true'
  }
});

// Inject auth token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

// Refresh token interceptor — auto-refresh on 401
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refreshToken');

      // If no refresh token, redirect to auth
      if (!refreshToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        if (window.location.pathname !== '/auth') {
          window.location.href = '/auth';
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue requests while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers['x-auth-token'] = token;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));

        api.defaults.headers['x-auth-token'] = data.token;
        originalRequest.headers['x-auth-token'] = data.token;

        processQueue(null, data.token);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        if (window.location.pathname !== '/auth') {
          window.location.href = '/auth';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
