// ==============================================================================
// SECUREVAULT - SERVICIO DE AUTENTICACIÓN Y GESTIÓN DE SESIONES (RF-01, RF-02, RF-03)
// ==============================================================================

import { userRepository } from '../repositories/user.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { hashPassword, verifyPassword, dummyVerify } from '../security/argon2.js';

export class AuthError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const authService = {
  /**
   * Registro de un nuevo usuario con validación de duplicados y hash Argon2id.
   */
  async register({ name, email, password, ipAddress, userAgent }) {
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await userRepository.findByEmail(normalizedEmail);

    if (existingUser) {
      await auditRepository.createLog({
        eventType: 'REGISTRATION_FAILED_DUPLICATE',
        ipAddress,
        userAgent,
        status: 'FAILURE',
        details: { emailDomain: normalizedEmail.split('@')[1] },
      });
      throw new AuthError('EMAIL_ALREADY_EXISTS', 'El correo electrónico ya se encuentra registrado en el sistema.', 409);
    }

    const passwordHash = await hashPassword(password);

    const newUser = await userRepository.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role: 'USER',
    });

    await auditRepository.createLog({
      eventType: 'REGISTRATION_SUCCESS',
      userId: newUser.id,
      ipAddress,
      userAgent,
      status: 'SUCCESS',
    });

    return newUser;
  },

  /**
   * Inicio de sesión con mitigación de timing attacks, bloqueo preventivo y regeneración de sesión.
   */
  async login({ email, password, req, ipAddress, userAgent }) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await userRepository.findByEmail(normalizedEmail);

    // 1. Mitigación de timing attack: usuario no existe
    if (!user) {
      await dummyVerify();
      await auditRepository.createLog({
        eventType: 'LOGIN_FAILED_UNKNOWN_USER',
        ipAddress,
        userAgent,
        status: 'FAILURE',
      });
      throw new AuthError('INVALID_CREDENTIALS', 'Credenciales de acceso inválidas.', 401);
    }

    // 2. Comprobar si la cuenta está desactivada administrativamente
    if (!user.isActive) {
      await auditRepository.createLog({
        eventType: 'LOGIN_FAILED_INACTIVE_USER',
        userId: user.id,
        ipAddress,
        userAgent,
        status: 'BLOCKED',
      });
      throw new AuthError('ACCOUNT_INACTIVE', 'La cuenta ha sido desactivada por un administrador.', 403);
    }

    // 3. Comprobar si la cuenta está temporalmente bloqueada por intentos fallidos
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
      await auditRepository.createLog({
        eventType: 'LOGIN_FAILED_LOCKED_ACCOUNT',
        userId: user.id,
        ipAddress,
        userAgent,
        status: 'BLOCKED',
      });
      throw new AuthError(
        'ACCOUNT_LOCKED',
        `Cuenta temporalmente bloqueada por múltiples intentos fallidos. Intente nuevamente en ${remainingMinutes} minuto(s).`,
        403
      );
    }

    // 4. Verificar contraseña con Argon2id
    const isPasswordValid = await verifyPassword(user.passwordHash, password);

    if (!isPasswordValid) {
      await userRepository.incrementFailedAttempts(user.id);
      await auditRepository.createLog({
        eventType: 'LOGIN_FAILED_WRONG_PASSWORD',
        userId: user.id,
        ipAddress,
        userAgent,
        status: 'FAILURE',
      });
      throw new AuthError('INVALID_CREDENTIALS', 'Credenciales de acceso inválidas.', 401);
    }

    // 5. Credenciales válidas: resetear contador de fallos
    await userRepository.resetFailedAttempts(user.id);

    // 6. Regenerar sesión para erradicar Session Fixation (OWASP A07)
    await new Promise((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) return reject(new AuthError('SESSION_REGENERATE_ERROR', 'Error al regenerar sesión segura.', 500));

        // 7. Persistir datos mínimos de identidad en la NUEVA sesión regenerada
        req.session.userId = user.id;
        req.session.role = user.role;
        req.session.authenticated = true;

        req.session.save((saveErr) => {
          if (saveErr) return reject(new AuthError('SESSION_SAVE_ERROR', 'Error al persistir sesión.', 500));
          resolve();
        });
      });
    });

    await auditRepository.createLog({
      eventType: 'LOGIN_SUCCESS',
      userId: user.id,
      ipAddress,
      userAgent,
      status: 'SUCCESS',
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  },

  /**
   * Cierre de sesión seguro con destrucción en base de datos.
   */
  async logout({ req, userId, ipAddress, userAgent }) {
    if (userId) {
      await auditRepository.createLog({
        eventType: 'LOGOUT',
        userId,
        ipAddress,
        userAgent,
        status: 'SUCCESS',
      });
    }

    return new Promise((resolve, reject) => {
      if (!req.session) return resolve();
      req.session.destroy((err) => {
        if (err) return reject(new AuthError('LOGOUT_ERROR', 'Error al cerrar sesión.', 500));
        resolve();
      });
    });
  },

  /**
   * Obtiene la identidad del usuario actualmente autenticado.
   */
  async getCurrentUser(userId) {
    const user = await userRepository.findById(userId);
    if (!user || !user.isActive) {
      throw new AuthError('USER_NOT_FOUND', 'Usuario no encontrado o inactivo.', 404);
    }
    return user;
  },
};
