// ==============================================================================
// SECUREVAULT - SERVICIO DE NOTAS PRIVADAS (RF-04, AES-256-GCM, ANTI-IDOR)
// ==============================================================================

import { noteRepository } from '../repositories/note.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { encrypt, decrypt } from '../security/crypto.js';
import { AuthError } from './auth.service.js';

export const notesService = {
  /**
   * Crea una nueva nota privada cifrando el contenido con AES-256-GCM.
   */
  async createNote({ userId, title, content, ipAddress, userAgent }) {
    // 1. Cifrado simétrico autenticado con IV aleatorio único de 12 bytes
    const { encryptedPayload, iv, authTag, keyVersion } = encrypt(content);

    // 2. Persistencia en PostgreSQL
    const note = await noteRepository.create({
      userId,
      title: title.trim(),
      encryptedContent: encryptedPayload,
      iv,
      authTag,
      keyVersion,
    });

    // 3. Auditoría de seguridad
    await auditRepository.createLog({
      eventType: 'NOTE_CREATED',
      userId,
      ipAddress,
      userAgent,
      status: 'SUCCESS',
      details: { noteId: note.id },
    });

    // Retorna la nota con su contenido descifrado
    return {
      id: note.id,
      title: note.title,
      content,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  },

  /**
   * Obtiene una nota específica descifrando el contenido al vuelo.
   * Mitigación estricta de IDOR (OWASP A01).
   */
  async getNoteById({ userId, id, ipAddress, userAgent }) {
    const note = await noteRepository.findByUserAndId(userId, id);

    if (!note) {
      // Detección proactiva de IDOR: comprobar si la nota existe en otra cuenta
      const globalNote = await noteRepository.findByIdGlobal(id);
      if (globalNote && globalNote.userId !== userId) {
        await auditRepository.createLog({
          eventType: 'UNAUTHORIZED_IDOR_ATTEMPT',
          userId,
          ipAddress,
          userAgent,
          status: 'BLOCKED',
          details: { targetNoteId: id, attemptedAccessBy: userId },
        });
      }

      throw new AuthError('NOTE_NOT_FOUND', 'La nota solicitada no existe o no tiene permisos para acceder a ella.', 404);
    }

    // Descifrado con verificación de integridad GCM
    const decryptedContent = decrypt({
      encryptedPayload: note.encryptedContent,
      iv: note.iv,
      authTag: note.authTag,
      keyVersion: note.keyVersion,
    });

    return {
      id: note.id,
      title: note.title,
      content: decryptedContent,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  },

  /**
   * Lista todas las notas pertenecientes al usuario autenticado.
   */
  async getUserNotes({ userId, skip = 0, take = 50 }) {
    const notes = await noteRepository.findAllByUser(userId, { skip, take });

    return notes.map((note) => {
      try {
        const decryptedContent = decrypt({
          encryptedPayload: note.encryptedContent,
          iv: note.iv,
          authTag: note.authTag,
          keyVersion: note.keyVersion,
        });

        return {
          id: note.id,
          title: note.title,
          content: decryptedContent,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
        };
      } catch (err) {
        // En caso excepcional de fallo de descifrado, no tumbar todo el listado
        return {
          id: note.id,
          title: note.title,
          content: '[Error de descifrado: integridad no verificada]',
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          corrupted: true,
        };
      }
    });
  },

  /**
   * Actualiza una nota propia recifrando el contenido con un NUEVO IV aleatorio.
   */
  async updateNote({ userId, id, title, content, ipAddress, userAgent }) {
    const existing = await noteRepository.findByUserAndId(userId, id);

    if (!existing) {
      throw new AuthError('NOTE_NOT_FOUND', 'La nota solicitada no existe o no tiene permisos para modificarla.', 404);
    }

    const updateData = {};

    if (title !== undefined) {
      updateData.title = title.trim();
    }

    if (content !== undefined) {
      // Recifrado obligatorio con un NUEVO IV aleatorio independiente
      const { encryptedPayload, iv, authTag, keyVersion } = encrypt(content);
      updateData.encryptedContent = encryptedPayload;
      updateData.iv = iv;
      updateData.authTag = authTag;
      updateData.keyVersion = keyVersion;
    }

    const updatedNote = await noteRepository.update(userId, id, updateData);

    await auditRepository.createLog({
      eventType: 'NOTE_UPDATED',
      userId,
      ipAddress,
      userAgent,
      status: 'SUCCESS',
      details: { noteId: id },
    });

    const decryptedContent = decrypt({
      encryptedPayload: updatedNote.encryptedContent,
      iv: updatedNote.iv,
      authTag: updatedNote.authTag,
      keyVersion: updatedNote.keyVersion,
    });

    return {
      id: updatedNote.id,
      title: updatedNote.title,
      content: decryptedContent,
      createdAt: updatedNote.createdAt,
      updatedAt: updatedNote.updatedAt,
    };
  },

  /**
   * Elimina una nota propia.
   */
  async deleteNote({ userId, id, ipAddress, userAgent }) {
    const existing = await noteRepository.findByUserAndId(userId, id);

    if (!existing) {
      throw new AuthError('NOTE_NOT_FOUND', 'La nota solicitada no existe o no tiene permisos para eliminarla.', 404);
    }

    await noteRepository.delete(userId, id);

    await auditRepository.createLog({
      eventType: 'NOTE_DELETED',
      userId,
      ipAddress,
      userAgent,
      status: 'SUCCESS',
      details: { noteId: id },
    });

    return { success: true, message: 'Nota eliminada exitosamente.' };
  },
};
