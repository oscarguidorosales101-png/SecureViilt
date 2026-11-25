// ==============================================================================
// SECUREVAULT - REPOSITORIO DE NOTAS PRIVADAS (PRISMA ORM 7)
// ==============================================================================
// Aislamiento Multi-Tenant estricto para mitigar IDOR (OWASP A01)
// ==============================================================================

import { prisma } from '../config/db.js';

export const noteRepository = {
  /**
   * Crea una nueva nota privada cifrada vinculada al usuario autenticado.
   */
  async create({ userId, title, encryptedContent, iv, authTag, keyVersion }) {
    return prisma.note.create({
      data: {
        userId,
        title,
        encryptedContent,
        iv,
        authTag,
        keyVersion,
      },
    });
  },

  /**
   * Obtiene una nota específica verificando obligatoriamente la propiedad del usuario.
   */
  async findByUserAndId(userId, id) {
    return prisma.note.findFirst({
      where: {
        id,
        userId,
      },
    });
  },

  /**
   * Lista todas las notas pertenecientes al usuario autenticado.
   */
  async findAllByUser(userId, { skip = 0, take = 50 } = {}) {
    return prisma.note.findMany({
      where: { userId },
      skip,
      take,
      orderBy: { updatedAt: 'desc' },
    });
  },

  /**
   * Actualiza el título y/o el contenido cifrado de una nota garantizando propiedad.
   */
  async update(userId, id, data) {
    // Primero verifica que la nota exista y pertenezca al usuario
    const note = await this.findByUserAndId(userId, id);
    if (!note) return null;

    return prisma.note.update({
      where: { id },
      data,
    });
  },

  /**
   * Elimina una nota privada garantizando la propiedad del usuario.
   */
  async delete(userId, id) {
    const note = await this.findByUserAndId(userId, id);
    if (!note) return null;

    return prisma.note.delete({
      where: { id },
    });
  },

  /**
   * Búsqueda global utilizada exclusivamente para auditoría forense o verificación de IDOR.
   */
  async findByIdGlobal(id) {
    return prisma.note.findUnique({
      where: { id },
    });
  },
};
