// ==============================================================================
// SECUREVAULT - SERVICIO DE DATO SENSIBLE DE PERFIL (RF-05, AES-256-GCM, MASKING)
// ==============================================================================

import { sensitiveDataRepository } from '../repositories/sensitiveData.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { encrypt, decrypt } from '../security/crypto.js';
import { maskSensitiveData } from '../security/masking.js';
import { verifyPassword } from '../security/argon2.js';
import { AuthError } from './auth.service.js';

export const profileService = {
  /**
   * Consulta el dato sensible del perfil del usuario.
   * Regla de seguridad (RF-05): Por defecto se entrega ÚNICAMENTE en formato enmascarado.
   */
  async getSensitiveData({ userId }) {
    const record = await sensitiveDataRepository.findByUserId(userId);

    if (!record) {
      return {
        hasSensitiveData: false,
        data: null,
      };
    }

    return {
      hasSensitiveData: true,
      data: {
        dataType: record.dataType,
        maskedPreview: record.maskedPreview,
        updatedAt: record.updatedAt,
      },
    };
  },

  /**
   * Registra o actualiza el dato sensible de perfil.
   * Cifra el valor con AES-256-GCM y calcula la máscara determinística.
   */
  async saveSensitiveData({ userId, dataType, value, ipAddress, userAgent }) {
    const trimmedValue = value.trim();

    // 1. Calcular máscara determinística para visualización en UI
    const maskedPreview = maskSensitiveData(trimmedValue, dataType);

    // 2. Cifrar con AES-256-GCM y nuevo IV
    const { encryptedPayload, iv, authTag, keyVersion } = encrypt(trimmedValue);

    // 3. Persistir en la tabla user_sensitive_data
    const record = await sensitiveDataRepository.upsert({
      userId,
      dataType,
      encryptedPayload,
      iv,
      authTag,
      keyVersion,
      maskedPreview,
    });

    // 4. Auditoría de seguridad
    await auditRepository.createLog({
      eventType: 'SENSITIVE_DATA_UPDATED',
      userId,
      ipAddress,
      userAgent,
      status: 'SUCCESS',
      details: { dataType },
    });

    return {
      dataType: record.dataType,
      maskedPreview: record.maskedPreview,
      updatedAt: record.updatedAt,
    };
  },

  /**
   * Revelado seguro del dato sensible en texto plano.
   * Requiere confirmación obligatoria de la contraseña actual del usuario autenticado.
   */
  async revealSensitiveData({ userId, password, ipAddress, userAgent }) {
    // 1. Obtener usuario y su hash Argon2id
    const user = await userRepository.findByIdWithPassword(userId);

    if (!user) {
      throw new AuthError('USER_NOT_FOUND', 'Usuario no encontrado.', 404);
    }

    // 2. Verificar contraseña actual con Argon2id
    const isPasswordValid = await verifyPassword(user.passwordHash, password);

    if (!isPasswordValid) {
      await auditRepository.createLog({
        eventType: 'SENSITIVE_DATA_REVEAL_DENIED_WRONG_PASSWORD',
        userId,
        ipAddress,
        userAgent,
        status: 'FAILURE',
      });
      throw new AuthError('INVALID_PASSWORD', 'Contraseña incorrecta. Confirmación de identidad fallida.', 401);
    }

    // 3. Obtener el dato sensible cifrado
    const record = await sensitiveDataRepository.findByUserId(userId);

    if (!record) {
      throw new AuthError('NO_SENSITIVE_DATA', 'No existe ningún dato sensible registrado en este perfil.', 404);
    }

    // 4. Descifrar el dato con AES-256-GCM
    const decryptedValue = decrypt({
      encryptedPayload: record.encryptedPayload,
      iv: record.iv,
      authTag: record.authTag,
      keyVersion: record.keyVersion,
    });

    // 5. Auditoría del evento de revelado
    await auditRepository.createLog({
      eventType: 'SENSITIVE_DATA_REVEALED',
      userId,
      ipAddress,
      userAgent,
      status: 'SUCCESS',
      details: { dataType: record.dataType },
    });

    return {
      dataType: record.dataType,
      value: decryptedValue,
      maskedPreview: record.maskedPreview,
    };
  },
};
