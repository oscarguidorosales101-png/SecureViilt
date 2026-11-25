// ==============================================================================
// SECUREVAULT - SERVICIO DE PERFIL Y DATOS SENSIBLES
// ==============================================================================

import api from './api';

export const profileService = {
  async getSensitiveData() {
    const response = await api.get('/profile/sensitive-data');
    return response.data?.data || response.data;
  },

  async saveSensitiveData(payload) {
    const response = await api.post('/profile/sensitive-data', payload);
    return response.data?.data || response.data;
  },

  async revealSensitiveData(password) {
    const response = await api.post('/profile/sensitive-data/reveal', { password });
    return response.data?.data || response.data;
  },
};
