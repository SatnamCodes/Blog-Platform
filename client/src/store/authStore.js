import { create } from 'zustand';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// A plain axios instance (not the interceptor-wrapped `api`) to avoid a
// circular import between api.js <-> authStore.js and to avoid the 401
// retry interceptor recursing into itself during refresh.
const raw = axios.create({ baseURL: BASE_URL, withCredentials: true });

// Access token + user live in memory only (never localStorage) so an XSS
// payload reading localStorage cannot steal a long-lived credential; the
// refresh token lives in an httpOnly cookie the client JS can't read at all.
// The tradeoff is that a hard page refresh loses the in-memory token, which
// is why App bootstraps by silently calling /auth/refresh on load.
export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  status: 'idle', // idle | loading | ready
  error: null,

  async register({ email, password, name }) {
    set({ error: null });
    try {
      const { data } = await raw.post('/auth/register', { email, password, name });
      set({ user: data.user, accessToken: data.accessToken });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Registration failed' });
      return false;
    }
  },

  async login({ email, password }) {
    set({ error: null });
    try {
      const { data } = await raw.post('/auth/login', { email, password });
      set({ user: data.user, accessToken: data.accessToken });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Login failed' });
      return false;
    }
  },

  async logout() {
    try {
      await raw.post('/auth/logout');
    } finally {
      set({ user: null, accessToken: null });
    }
  },

  async refresh() {
    try {
      const { data } = await raw.post('/auth/refresh');
      set({ user: data.user, accessToken: data.accessToken });
      return data.accessToken;
    } catch {
      set({ user: null, accessToken: null });
      return null;
    }
  },

  clearSession() {
    set({ user: null, accessToken: null });
  },

  async bootstrap() {
    set({ status: 'loading' });
    await get().refresh();
    set({ status: 'ready' });
  },
}));
