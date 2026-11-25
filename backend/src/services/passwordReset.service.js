// ==============================================================================
// SECUREVAULT - SERVICIO DE RECUPERACIÓN DE CONTRASEÑA (RF-06, GMAIL SMTP)
// ==============================================================================

import { userRepository } from '../repositories/user.repository.js';
import { tokenRepository } from '../repositories/token.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { mailService } from './mail.service.js';
import { generateSecureToken, hashToken } from '../security/tokens.js';
import { hashPassword, dummyVerify } from '../security/argon2.js';
import { AuthError } from './auth.service.js';

const GENERIC_RESPONSE_MESSAGE =
  'Si la dirección de correo electrónico está registrada, se ha enviado un enlace de recuperación válido por 15 minutos.';

export const passwordResetService = {
  /**
   * Solicita el restablecimiento de contraseña.
   * Regla OWASP A07: Respuesta genérica idéntica para prevenir enumeración de usuarios.
   */
  async requestPasswordReset({ email, ipAddress, userAgent }) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await userRepository.findByEmail(normalizedEmail);

    // 1. Si el usuario no existe o está inactivo, realizamos una operación simulada para evitar timing attacks
    if (!user || !user.isActive) {
      await dummyVerify();
      await auditRepository.createLog({
        eventType: 'PASSWORD_RESET_REQUEST_UNKNOWN_USER',
        ipAddress,
        userAgent,
        status: 'FAILURE',
        details: { domain: normalizedEmail.split('@')[1] },
      });
      // Respuesta exactamente idéntica (Anti-Enumeración)
      return { message: GENERIC_RESPONSE_MESSAGE };
    }

    // 2. Invalidar solicitudes de recuperación previas no utilizadas
    await tokenRepository.invalidatePreviousTokens(user.id);

    // 3. Generar token criptográficamente seguro (256 bits) y su hash SHA-256
    const { token, tokenHash } = generateSecureToken(32);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Vencimiento en 15 minutos

    // 4. Guardar ÚNICAMENTE el hash del token en la base de datos (RF-06)
    await tokenRepository.createToken({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    // 5. Enviar enlace temporal por correo electrónico utilizando Gmail SMTP
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    await mailService.sendPasswordResetEmail({
      toEmail: user.email,
      name: user.name,
      resetUrl,
      expiresInMinutes: 15,
    });

    // 6. Registro de auditoría (JAMÁS se registra el token en los logs)
    await auditRepository.createLog({
      eventType: 'PASSWORD_RESET_REQUESTED',
      userId: user.id,
      ipAddress,
      userAgent,
      status: 'SUCCESS',
    });

    return { message: GENERIC_RESPONSE_MESSAGE };
  },

  /**
   * Restablece la contraseña utilizando el token temporal recibido por correo.
   */
  async resetPassword({ token, newPassword, ipAddress, userAgent }) {
    if (!token || typeof token !== 'string') {
      throw new AuthError('INVALID_TOKEN', 'Token de recuperación ausente o inválido.', 400);
    }

    // 1. Calcular el hash SHA-256 del token provisto
    const tokenHash = hashToken(token);

    // 2. Buscar si existe un token válido y no utilizado con ese hash
    const tokenRecord = await tokenRepository.findValidToken(tokenHash);

    if (!tokenRecord) {
      await auditRepository.createLog({
        eventType: 'PASSWORD_RESET_FAILED_INVALID_TOKEN',
        ipAddress,
        userAgent,
        status: 'FAILURE',
      });
      throw new AuthError('INVALID_OR_EXPIRED_TOKEN', 'El enlace de recuperación es inválido o ha expirado.', 400);
    }

    // 3. Generar nuevo hash con Argon2id para la contraseña
    const newPasswordHash = await hashPassword(newPassword);

    // 4. Actualizar contraseña del usuario y resetear bloqueos
    await userRepository.updatePassword(tokenRecord.userId, newPasswordHash);

    // 5. Invalidar el token inmediatamente (garantiza naturaleza de un solo uso)
    await tokenRepository.markTokenAsUsed(tokenRecord.id);

    // 6. Invalidar todas las sesiones concurrentes previas en la base de datos
    await userRepository.invalidateAllSessions(tokenRecord.userId);

    // 7. Registro de auditoría
    await auditRepository.createLog({
      eventType: 'PASSWORD_RESET_SUCCESS',
      userId: tokenRecord.userId,
      ipAddress,
      userAgent,
      status: 'SUCCESS',
    });

    return {
      message: 'Contraseña restablecida exitosamente. Por favor, inicie sesión con su nueva contraseña.',
    };
  },
};
