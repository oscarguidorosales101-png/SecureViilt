// ==============================================================================
// SECUREVAULT - SERVICIO DE NOTAS PRIVADAS CIFRADAS
// ==============================================================================

import api from './api';

export const notesService = {
  async getAll() {
    const response = await api.get('/notes');
    return response.data?.data || response.data;
  },

  async getById(id) {
    const response = await api.get(`/notes/${id}`);
    return response.data?.data || response.data;
  },

  async create(noteData) {
    const response = await api.post('/notes', noteData);
    return response.data?.data || response.data;
  },

  async update(id, noteData) {
    const response = await api.put(`/notes/${id}`, noteData);
    return response.data?.data || response.data;
  },

  async delete(id) {
    const response = await api.delete(`/notes/${id}`);
    return response.data?.data || response.data;
  },
};
