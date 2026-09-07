import axios from 'axios';
import { useAuthStore } from '../store/authStore.js';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send the httpOnly refresh cookie
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

// On a 401, attempt exactly one refresh-and-retry per failing request. If a
// refresh is already in flight (e.g. two requests 401 at once), share the
// same promise instead of hitting /refresh twice.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    if (response?.status !== 401 || config._retried) {
      throw error;
    }
    config._retried = true;

    try {
      if (!refreshPromise) {
        refreshPromise = useAuthStore.getState().refresh();
      }
      const newToken = await refreshPromise;
      refreshPromise = null;
      if (!newToken) throw error;
      config.headers.Authorization = `Bearer ${newToken}`;
      return api.request(config);
    } catch (refreshErr) {
      refreshPromise = null;
      useAuthStore.getState().clearSession();
      throw refreshErr;
    }
  }
);
