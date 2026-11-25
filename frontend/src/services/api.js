// ==============================================================================
// SECUREVAULT - CLIENTE HTTP AXIOS CON MANEJO DE SESIONES
// ==============================================================================

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
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
