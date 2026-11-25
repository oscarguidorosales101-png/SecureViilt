// ==============================================================================
// SECUREVAULT - SERVICIO DE ADMINISTRACIÓN Y AUDITORÍA FORENSE
// ==============================================================================

import api from './api';

export const adminService = {
  async getUsers() {
    const response = await api.get('/admin/users');
    return response.data?.data || response.data;
  },

  async updateUserStatus(userId, isActive) {
    const response = await api.patch(`/admin/users/${userId}/status`, { isActive });
    return response.data?.data || response.data;
  },

  async getAuditLogs(params = {}) {
    const response = await api.get('/admin/audit-logs', { params });
    return response.data?.data || response.data;
  },
};
