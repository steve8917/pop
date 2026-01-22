import axios from 'axios';

const apiBaseUrl = (() => {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (fromEnv && String(fromEnv).trim().length > 0) {
    return `${String(fromEnv).replace(/\/$/, '')}/api`;
  }
  return '/api';
})();

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor per gestire errori di autenticazione
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = String(error.config?.url || '');
      const isAuthRoute =
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/forgot-password') ||
        url.includes('/auth/reset-password') ||
        url.includes('/auth/verify-email') ||
        url.includes('/auth/resend-verification');

      // Su errori 401 durante login/registrazione vogliamo mostrare il messaggio,
      // non fare redirect che "nasconde" l'Alert.
      if (!isAuthRoute) {
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
