// ==============================================================================
// SECUREVAULT - REPOSITORIO DE TOKENS DE RECUPERACIÓN (PRISMA ORM 7)
// ==============================================================================

import { prisma } from '../config/db.js';

export const tokenRepository = {
  /**
   * Crea un registro de token de recuperación utilizando únicamente su hash SHA-256.
   */
  async createToken({ userId, tokenHash, expiresAt }) {
    return prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  },

  /**
   * Busca un token válido (no expirado y no utilizado previamente).
   */
  async findValidToken(tokenHash) {
    return prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });
  },

  /**
   * Marca un token como utilizado para garantizar su naturaleza de un solo uso.
   */
  async markTokenAsUsed(id) {
    return prisma.passwordResetToken.update({
      where: { id },
      data: {
        usedAt: new Date(),
      },
    });
  },

  /**
   * Invalida todos los tokens previos activos de un usuario al solicitar uno nuevo.
   */
  async invalidatePreviousTokens(userId) {
    return prisma.passwordResetToken.updateMany({
      where: {
        userId,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });
  },
};
