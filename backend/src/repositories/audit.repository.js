// ==============================================================================
// SECUREVAULT - REPOSITORIO DE AUDITORÍA Y SEGURIDAD (OWASP A09)
// ==============================================================================

import { prisma } from '../config/db.js';

export const auditRepository = {
  async createLog({ eventType, userId = null, ipAddress, userAgent = null, status, details = null }) {
    try {
      return await prisma.securityLog.create({
        data: {
          eventType,
          userId,
          ipAddress: ipAddress || 'unknown',
          userAgent: userAgent ? userAgent.substring(0, 500) : null,
          status,
          details: details ? details : undefined,
        },
      });
    } catch (err) {
      // Los fallos en logging nunca deben tumbar el proceso de negocio principal
      console.error('Error al registrar evento de auditoría:', err.message);
      return null;
    }
  },

  async listLogs({ skip = 0, take = 50, eventType = null } = {}) {
    const where = eventType ? { eventType } : {};
    return prisma.securityLog.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  },
};
