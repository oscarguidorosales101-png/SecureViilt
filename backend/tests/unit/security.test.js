// ==============================================================================
// PRUEBAS UNITARIAS DE SEGURIDAD CRIPTOGRÁFICA (SECUREVAULT)
// ==============================================================================

import 'dotenv/config';
import { describe, it, expect, beforeAll } from 'vitest';
import { hashPassword, verifyPassword, dummyVerify, ARGON2_CONFIG } from '../../src/security/argon2.js';
import { encrypt, decrypt, CryptoIntegrityError } from '../../src/security/crypto.js';
import { generateSecureToken, hashToken, timingSafeHashCompare } from '../../src/security/tokens.js';
import { maskPhoneNumber, maskNationalId, maskEmail, maskSensitiveData } from '../../src/security/masking.js';

beforeAll(() => {
  if (!process.env.ENCRYPTION_KEY) {
    process.env.ENCRYPTION_KEY = '3c8a91b2e5f4d7a0c6b8d1e3f5a7c9b2e4f6a8b0d2c4e6f8a1b3c5d7e9f2a4b6';
  }
});

describe('1. Módulo Argon2id (RFC 9106)', () => {
  const samplePassword = 'StrongPassword!2026';

  it('debe configurar los parámetros mínimos de seguridad exigidos (19 MiB, 2 iteraciones, 1 hilo)', () => {
    expect(ARGON2_CONFIG.memoryCost).toBe(19456);
    expect(ARGON2_CONFIG.timeCost).toBe(2);
    expect(ARGON2_CONFIG.parallelism).toBe(1);
  });

  it('debe generar un hash con formato PHC válido para argon2id', async () => {
    const hash = await hashPassword(samplePassword);
    expect(hash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
  });

  it('debe verificar exitosamente una contraseña correcta', async () => {
    const hash = await hashPassword(samplePassword);
    const isValid = await verifyPassword(hash, samplePassword);
    expect(isValid).toBe(true);
  });

  it('debe rechazar una contraseña incorrecta', async () => {
    const hash = await hashPassword(samplePassword);
    const isValid = await verifyPassword(hash, 'WrongPassword#999');
    expect(isValid).toBe(false);
  });

  it('debe ejecutar dummyVerify sin arrojar excepciones (mitigación de timing attacks)', async () => {
    await expect(dummyVerify()).resolves.not.toThrow();
  });
});

describe('2. Módulo AES-256-GCM (Cifrado Autenticado)', () => {
  const secretText = 'Esta es una nota privada altamente confidencial de SecureVault.';

  it('debe cifrar y generar un IV aleatorio único en cada llamada para el mismo texto plano', () => {
    const enc1 = encrypt(secretText);
    const enc2 = encrypt(secretText);

    // Los IVs generados deben ser distintos
    expect(enc1.iv).not.toBe(enc2.iv);
    // Los ciphertexts resultantes deben ser distintos debido al IV único
    expect(enc1.encryptedPayload).not.toBe(enc2.encryptedPayload);
    // Longitud del IV en hexadecimal debe ser 24 caracteres (12 bytes * 2)
    expect(enc1.iv).toHaveLength(24);
    // Longitud del Auth Tag en hexadecimal debe ser 32 caracteres (16 bytes * 2)
    expect(enc1.authTag).toHaveLength(32);
  });

  it('debe descifrar correctamente recuperando el texto plano original', () => {
    const encryptedData = encrypt(secretText);
    const decrypted = decrypt(encryptedData);
    expect(decrypted).toBe(secretText);
  });

  it('debe arrojar CryptoIntegrityError si el texto cifrado es alterado (Tampering)', () => {
    const encryptedData = encrypt(secretText);
    // Alterar el último carácter del ciphertext
    const tamperedPayload = encryptedData.encryptedPayload.slice(0, -1) + (encryptedData.encryptedPayload.endsWith('a') ? 'b' : 'a');

    expect(() => {
      decrypt({
        ...encryptedData,
        encryptedPayload: tamperedPayload,
      });
    }).toThrow(CryptoIntegrityError);
  });

  it('debe arrojar CryptoIntegrityError si el Auth Tag es alterado', () => {
    const encryptedData = encrypt(secretText);
    // Alterar el tag de autenticación
    const tamperedTag = encryptedData.authTag.slice(0, -2) + '00';

    expect(() => {
      decrypt({
        ...encryptedData,
        authTag: tamperedTag,
      });
    }).toThrow(CryptoIntegrityError);
  });
});

describe('3. Módulo Tokens Criptoseguros (CSPRNG + SHA-256)', () => {
  it('debe generar tokens con entropía de 256 bits (32 bytes = 64 caracteres hex)', () => {
    const { token, tokenHash } = generateSecureToken(32);
    expect(token).toHaveLength(64);
    expect(tokenHash).toHaveLength(64);
  });

  it('el hash SHA-256 generado debe ser determinístico para el mismo token', () => {
    const { token, tokenHash } = generateSecureToken();
    const calculatedHash = hashToken(token);
    expect(calculatedHash).toBe(tokenHash);
  });

  it('debe validar la coincidencia en tiempo constante mediante timingSafeHashCompare', () => {
    const { token, tokenHash } = generateSecureToken();
    const calculatedHash = hashToken(token);
    expect(timingSafeHashCompare(calculatedHash, tokenHash)).toBe(true);

    const wrongHash = hashToken('another_different_token_123456');
    expect(timingSafeHashCompare(wrongHash, tokenHash)).toBe(false);
  });
});

describe('4. Módulo de Enmascaramiento Seguro (RF-05)', () => {
  it('debe enmascarar números telefónicos preservando últimos 4 dígitos', () => {
    const masked = maskPhoneNumber('+506 8888-1234');
    expect(masked).toContain('1234');
    expect(masked).toContain('****');
    expect(masked).not.toContain('8888');
  });

  it('debe enmascarar cédulas de identidad ocultando todos menos los últimos 4 dígitos', () => {
    const masked = maskNationalId('117890123');
    expect(masked).toBe('*****0123');
  });

  it('debe enmascarar correos electrónicos ocultando la parte central del usuario', () => {
    const masked = maskEmail('usuario.seguro@gmail.com');
    expect(masked).toMatch(/^u\*\*\*o@gmail\.com$/);
  });
});
