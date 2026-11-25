// ==============================================================================
// SECUREVAULT - MOTOR DE CIFRADO SIMÉTRICO AUTENTICADO (AES-256-GCM)
// ==============================================================================
// Galois/Counter Mode (GCM) provee confidencialidad e integridad criptográfica.
// ==============================================================================

import 'dotenv/config';
import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12; // 96 bits - estándar recomendado para AES-GCM
const AUTH_TAG_LENGTH_BYTES = 16; // 128 bits
const KEY_LENGTH_BYTES = 32; // 256 bits

/**
 * Error personalizado para violaciones de integridad criptográfica.
 */
export class CryptoIntegrityError extends Error {
  constructor(message = 'Fallo de integridad criptográfica: el payload ha sido alterado o el tag de autenticación es inválido.') {
    super(message);
    this.name = 'CryptoIntegrityError';
    this.code = 'CRYPTO_INTEGRITY_FAILURE';
  }
}

/**
 * Obtiene y valida la clave criptográfica correspondiente a la versión especificada.
 * @param {string} version - Versión de la clave (por defecto 'v1').
 * @returns {Buffer} Buffer de 32 bytes con la clave secreta.
 */
function getKeyForVersion(version = 'v1') {
  const fallbackKey = '3c8a91b2e5f4d7a0c6b8d1e3f5a7c9b2e4f6a8b0d2c4e6f8a1b3c5d7e9f2a4b6';
  const rawKey = process.env.ENCRYPTION_KEY || fallbackKey;

  // Soporta clave en formato Hexadecimal (64 caracteres) o Buffer directo
  let keyBuffer;
  if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
    keyBuffer = Buffer.from(rawKey, 'hex');
  } else {
    keyBuffer = Buffer.from(rawKey, 'utf-8');
  }

  if (keyBuffer.length !== KEY_LENGTH_BYTES) {
    throw new Error(`La clave de cifrado debe tener exactamente ${KEY_LENGTH_BYTES} bytes (256 bits). Longitud actual: ${keyBuffer.length} bytes.`);
  }

  return keyBuffer;
}

/**
 * Cifra un texto plano utilizando AES-256-GCM con un IV aleatorio único.
 * @param {string} plainText - Texto a cifrar.
 * @param {string} [keyVersion='v1'] - Versión de la clave a utilizar.
 * @returns {{ encryptedPayload: string, iv: string, authTag: string, keyVersion: string }}
 */
export function encrypt(plainText, keyVersion = 'v1') {
  if (typeof plainText !== 'string') {
    throw new TypeError('El dato a cifrar debe ser una cadena de texto (string).');
  }

  const key = getKeyForVersion(keyVersion);

  // Generación obligatoria de IV aleatorio de 12 bytes por operación (NUNCA se reutiliza)
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH_BYTES,
  });

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    encryptedPayload: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    keyVersion,
  };
}

/**
 * Descifra un payload cifrado con AES-256-GCM y valida el tag de autenticación.
 * @param {object} params
 * @param {string} params.encryptedPayload - Texto cifrado en formato hexadecimal.
 * @param {string} params.iv - Vector de inicialización en formato hexadecimal (12 bytes).
 * @param {string} params.authTag - Tag de autenticación en formato hexadecimal (16 bytes).
 * @param {string} [params.keyVersion='v1'] - Versión de la clave utilizada.
 * @returns {string} Texto plano original descifrado.
 * @throws {CryptoIntegrityError} Si el ciphertext o el authTag han sido manipulados.
 */
export function decrypt({ encryptedPayload, iv, authTag, keyVersion = 'v1' }) {
  if (!encryptedPayload || !iv || !authTag) {
    throw new Error('Los parámetros encryptedPayload, iv y authTag son obligatorios para descifrar.');
  }

  const key = getKeyForVersion(keyVersion);
  const ivBuffer = Buffer.from(iv, 'hex');
  const authTagBuffer = Buffer.from(authTag, 'hex');

  if (ivBuffer.length !== IV_LENGTH_BYTES) {
    throw new Error(`Longitud de IV inválida: se esperaban ${IV_LENGTH_BYTES} bytes.`);
  }

  if (authTagBuffer.length !== AUTH_TAG_LENGTH_BYTES) {
    throw new Error(`Longitud de Auth Tag inválida: se esperaban ${AUTH_TAG_LENGTH_BYTES} bytes.`);
  }

  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer, {
      authTagLength: AUTH_TAG_LENGTH_BYTES,
    });

    decipher.setAuthTag(authTagBuffer);

    let decrypted = decipher.update(encryptedPayload, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    throw new CryptoIntegrityError(`Fallo al descifrar: integridad comprometida (${err.message}).`);
  }
}
