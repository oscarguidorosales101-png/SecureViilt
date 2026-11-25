// ==============================================================================
// SECUREVAULT - MOTOR DE HASHEO DE CONTRASEÑAS (ARGON2ID)
// ==============================================================================
// Estándar RFC 9106 para contraseñas de alta seguridad
// ==============================================================================

import argon2 from 'argon2';

/**
 * Parámetros obligatorios de seguridad bajo directrices OWASP 2025:
 * - memoryCost: 19456 KiB (19 MiB exactos)
 * - timeCost: 2 iteraciones
 * - parallelism: 1 hilo
 * - type: Argon2id (híbrido resistente a ataques de GPU y canal lateral)
 */
export const ARGON2_CONFIG = {
  type: argon2.argon2id,
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
  hashLength: 32,
};

// Hash pre-calculado con los mismos parámetros para mitigación de timing attacks
const DUMMY_HASH = '$argon2id$v=19$m=19456,t=2,p=1$c29tZXJhbmRvbXNhbHQ$5zM4pUe2w8QvY+3/Q6j1p6v4gG3K8L0v9X1b+Q2w4e8';

/**
 * Genera el hash seguro de una contraseña con Argon2id.
 * @param {string} plainPassword - Contraseña en texto plano.
 * @returns {Promise<string>} Hash en formato estándar modular PHC.
 */
export async function hashPassword(plainPassword) {
  if (typeof plainPassword !== 'string' || plainPassword.length === 0) {
    throw new Error('La contraseña debe ser una cadena de texto no vacía.');
  }

  return argon2.hash(plainPassword, ARGON2_CONFIG);
}

/**
 * Verifica una contraseña en texto plano contra un hash de Argon2id.
 * @param {string} hash - Hash almacenado en base de datos.
 * @param {string} plainPassword - Contraseña candidata enviada por el usuario.
 * @returns {Promise<boolean>} True si coincide, false en caso contrario.
 */
export async function verifyPassword(hash, plainPassword) {
  if (!hash || typeof hash !== 'string' || !plainPassword || typeof plainPassword !== 'string') {
    return false;
  }

  try {
    return await argon2.verify(hash, plainPassword);
  } catch {
    // Si el formato del hash está corrupto, falla de forma segura
    return false;
  }
}

/**
 * Ejecuta una verificación simulada con el mismo costo computacional.
 * Mitiga ataques de sincronización (timing attacks) cuando un usuario no existe.
 * @returns {Promise<void>}
 */
export async function dummyVerify() {
  try {
    await argon2.verify(DUMMY_HASH, 'dummy_simulated_password_123!');
  } catch {
    // Operación muda calculada intencionalmente
  }
}
