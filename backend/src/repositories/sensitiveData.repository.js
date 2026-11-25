// ==============================================================================
// SECUREVAULT - REPOSITORIO DE DATOS SENSIBLES DE PERFIL (PRISMA ORM 7)
// ==============================================================================

import { prisma } from '../config/db.js';

export const sensitiveDataRepository = {
  /**
   * Inserta o actualiza el dato sensible de perfil (relación 1:1 por usuario).
   */
  async upsert({ userId, dataType, encryptedPayload, iv, authTag, keyVersion, maskedPreview }) {
    return prisma.userSensitiveData.upsert({
      where: { userId },
      create: {
        userId,
        dataType,
        encryptedPayload,
        iv,
        authTag,
        keyVersion,
        maskedPreview,
      },
      update: {
        dataType,
        encryptedPayload,
        iv,
        authTag,
        keyVersion,
        maskedPreview,
      },
    });
  },

  /**
   * Obtiene el registro sensible del perfil de un usuario.
   */
  async findByUserId(userId) {
    return prisma.userSensitiveData.findUnique({
      where: { userId },
    });
  },

  /**
   * Elimina el dato sensible del perfil de un usuario.
   */
  async deleteByUserId(userId) {
    return prisma.userSensitiveData.deleteMany({
      where: { userId },
    });
  },
};
