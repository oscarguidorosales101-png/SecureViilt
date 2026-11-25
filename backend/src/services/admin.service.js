// ==============================================================================
// SECUREVAULT - SERVICIO DE ADMINISTRACIÓN Y AUDITORÍA FORENSE (RF-07, OWASP A09)
// ==============================================================================

import { userRepository } from '../repositories/user.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { AuthError } from './auth.service.js';

export const adminService = {
  /**
   * Lista usuarios del sistema paginados para el panel de administración.
   */
  async listUsers({ skip = 0, take = 50 }) {
    const users = await userRepository.listUsers({ skip, take });
    return users;
  },

  /**
   * Modifica el estado activo/inactivo de una cuenta.
   * Si se desactiva un usuario, revoca inmediatamente todas sus sesiones concurrentes.
   */
  async updateUserStatus({ targetUserId, isActive, adminUserId, ipAddress, userAgent }) {
    // 1. Regla de seguridad: un administrador no puede desactivar su propia cuenta
    if (targetUserId === adminUserId && !isActive) {
      throw new AuthError(
        'CANNOT_DEACTIVATE_OWN_ACCOUNT',
        'Por motivos de seguridad, un administrador no puede desactivar su propia cuenta de acceso.',
        400
      );
    }

    const targetUser = await userRepository.findById(targetUserId);

    if (!targetUser) {
      throw new AuthError('USER_NOT_FOUND', 'El usuario especificado no existe.', 404);
    }

    // 2. Actualizar estado en la base de datos
    const updatedUser = await userRepository.updateStatus(targetUserId, isActive);

    // 3. Si se desactiva, invalidar todas sus sesiones en PostgreSQL
    if (!isActive) {
      await userRepository.invalidateAllSessions(targetUserId);
    }

    // 4. Registro de auditoría forense
    await auditRepository.createLog({
      eventType: 'ADMIN_USER_STATUS_UPDATED',
      userId: adminUserId,
      ipAddress,
      userAgent,
      status: 'SUCCESS',
      details: {
        targetUserId,
        targetUserEmail: targetUser.email,
        newStatus: isActive ? 'ACTIVE' : 'DEACTIVATED',
      },
    });

    return updatedUser;
  },

  /**
   * Consulta la bitácora de eventos de seguridad forense con filtros.
   */
  async listAuditLogs({ skip = 0, take = 50, eventType = null, status = null }) {
    const logs = await auditRepository.listLogs({ skip, take, eventType, status });
    return logs;
  },
};
