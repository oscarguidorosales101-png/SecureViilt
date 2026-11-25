// ==============================================================================
// SECUREVAULT - CLIENTE HTTP AXIOS CON MANEJO DE SESIONES
// ==============================================================================

import axios from 'axios';

// Sanitización de baseURL: Si la variable de entorno no tiene /api o tiene barras al final, se normaliza
const rawBaseURL = import.meta.env.VITE_API_URL || '/api';
const cleanBaseURL = rawBaseURL.replace(/\/+$/, '');
const normalizedBaseURL = (cleanBaseURL.startsWith('http') && !cleanBaseURL.endsWith('/api'))
  ? `${cleanBaseURL}/api`
  : cleanBaseURL;

const api = axios.create({
  baseURL: normalizedBaseURL,
  withCredentials: true, // Envía cookies de sesión HTTP-only automáticamente
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de respuesta para captura uniforme de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si la sesión expiró o fue destruida en el backend (401)
    if (error.response?.status === 401) {
      // Disparar evento personalizado para que AuthContext desactive la sesión sin recargar
      window.dispatchEvent(new CustomEvent('auth:session_expired'));
    }
    return Promise.reject(error);
  }
);

export default api;
