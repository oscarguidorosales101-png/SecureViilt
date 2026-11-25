// ==============================================================================
// SECUREVAULT - SERVICIO DE AUTENTICACIÓN
// ==============================================================================

import api from './api';

export const authService = {
  // Registro de usuario (RF-01)
  async register(name, email, password) {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data?.data || response.data;
  },

  // Inicio de sesión seguro con regeneración de sesión (RF-02)
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data?.data || response.data;
  },

  // Cierre de sesión y revocación en servidor (RF-02)
  async logout() {
    const response = await api.post('/auth/logout');
    return response.data?.data || response.data;
  },

  // Perfil del usuario de la sesión activa
  async getMe() {
    const response = await api.get('/auth/me');
    return response.data?.data || response.data;
  },

  // Solicitud de enlace de recuperación (RF-06)
  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Restablecimiento de contraseña con token (RF-06)
  async resetPassword(token, newPassword) {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data?.data || response.data;
  },
};
