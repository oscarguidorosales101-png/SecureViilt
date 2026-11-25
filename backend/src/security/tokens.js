// ==============================================================================
// SECUREVAULT - GESTIÓN DE TOKENS CRIPTOGRÁFICOS (CSPRNG + SHA-256)
// ==============================================================================

import crypto from 'node:crypto';

/**
 * Genera un token aleatorio criptográficamente seguro (CSPRNG) y su correspondiente hash SHA-256.
 * El token en claro se envía al usuario (vía correo o enlace temporal).
 * Únicamente el hash se persiste en la base de datos.
 * @param {number} [bytesLength=32] - Longitud en bytes de entropía (32 bytes = 256 bits).
 * @returns {{ token: string, tokenHash: string }}
 */
export function generateSecureToken(bytesLength = 32) {
  const token = crypto.randomBytes(bytesLength).toString('hex');
  const tokenHash = hashToken(token);

  return {
    token,
    tokenHash,
  };
}

/**
 * Calcula el hash SHA-256 de un token en claro.
 * @param {string} token - Token en claro.
 * @returns {string} Hash hexadecimal de 64 caracteres.
 */
export function hashToken(token) {
  if (typeof token !== 'string' || token.length === 0) {
    throw new Error('El token debe ser una cadena de texto no vacía.');
  }

  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Compara dos hashes o tokens en tiempo constante para evitar ataques de canal lateral.
 * @param {string} candidateHash - Hash recibido o calculado.
 * @param {string} storedHash - Hash persistido en base de datos.
 * @returns {boolean} True si coinciden exactamente.
 */
export function timingSafeHashCompare(candidateHash, storedHash) {
  if (typeof candidateHash !== 'string' || typeof storedHash !== 'string') {
    return false;
  }

  const candidateBuf = Buffer.from(candidateHash, 'hex');
  const storedBuf = Buffer.from(storedHash, 'hex');

  if (candidateBuf.length !== storedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(candidateBuf, storedBuf);
}
