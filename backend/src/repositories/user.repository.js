// ==============================================================================
// SECUREVAULT - REPOSITORIO DE USUARIOS (PRISMA ORM 7)
// ==============================================================================

import { prisma } from '../config/db.js';

export const userRepository = {
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  },

  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async findByIdWithPassword(id) {
    return prisma.user.findUnique({
      where: { id },
    });
  },

  async create({ name, email, passwordHash, role = 'USER' }) {
    return prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  },

  async incrementFailedAttempts(id, maxAttempts = 5, lockoutMinutes = 15) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { failedLoginAttempts: true },
    });

    if (!user) return null;

    const nextAttempts = user.failedLoginAttempts + 1;
    const shouldLock = nextAttempts >= maxAttempts;
    const lockedUntil = shouldLock
      ? new Date(Date.now() + lockoutMinutes * 60 * 1000)
      : null;

    return prisma.user.update({
      where: { id },
      data: {
        failedLoginAttempts: nextAttempts,
        lockedUntil,
      },
    });
  },

  async resetFailedAttempts(id) {
    return prisma.user.update({
      where: { id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  },

  async updatePassword(id, passwordHash) {
    return prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  },

  /**
   * Invalida todas las sesiones activas en PostgreSQL para un usuario específico.
   * Evita que sesiones concurrentes previas sigan activas tras un cambio de clave.
   */
  async invalidateAllSessions(userId) {
    try {
      await prisma.$executeRaw`
        DELETE FROM "sessions"
        WHERE sess->>'userId' = ${userId}
      `;
      return true;
    } catch (err) {
      console.error('Error al revocar sesiones concurrentes:', err.message);
      return false;
    }
  },

  async updateStatus(id, isActive) {
    return prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });
  },

  async listUsers({ skip = 0, take = 20 } = {}) {
    return prisma.user.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        createdAt: true,
      },
    });
  },
};
