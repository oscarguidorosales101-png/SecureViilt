// ==============================================================================
// PRUEBAS DE INTEGRACIÓN: FLUJO DE RECUPERACIÓN DE CONTRASEÑA (RF-06)
// ==============================================================================

import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/db.js';
import { mailService } from '../../src/services/mail.service.js';

describe('Flujo de Recuperación de Contraseña con Gmail SMTP (Fase 5)', () => {
  const testEmail = `reset.user.${Date.now()}@securevault.io`;
  const initialPassword = 'InitialSecurePassword!2026';
  const newPassword = 'NewStrongPassword#2026';
  let extractedToken = '';

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    // Registrar usuario base para las pruebas
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Usuario Recuperación',
        email: testEmail,
        password: initialPassword,
      });
  });

  afterAll(async () => {
    try {
      await prisma.securityLog.deleteMany({
        where: { user: { email: testEmail } },
      });
      await prisma.passwordResetToken.deleteMany({
        where: { user: { email: testEmail } },
      });
      await prisma.user.deleteMany({
        where: { email: testEmail },
      });
    } catch (err) {
      // Ignorar errores en limpieza
    }
  });

  it('1. POST /api/auth/forgot-password para usuario inexistente debe retornar respuesta genérica (Anti-Enumeración)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({
        email: 'inexistente@securevault.io',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Si la dirección de correo electrónico está registrada');
  });

  it('2. POST /api/auth/forgot-password para usuario existente debe retornar la MISMA respuesta genérica', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({
        email: testEmail,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Si la dirección de correo electrónico está registrada');

    // Comprobar que se preparó el correo con el enlace y extraer el token
    expect(mailService.lastSentMail).toBeDefined();
    expect(mailService.lastSentMail.to).toBe(testEmail.toLowerCase());
    const match = mailService.lastSentMail.text.match(/token=([a-f0-9]{64})/);
    expect(match).not.toBeNull();
    extractedToken = match[1];
    expect(extractedToken).toHaveLength(64);
  });

  it('3. Verificar que en la base de datos NUNCA se guardó el token en claro (solo hash SHA-256)', async () => {
    const tokensInDb = await prisma.passwordResetToken.findMany({
      where: { user: { email: testEmail } },
    });

    expect(tokensInDb.length).toBeGreaterThan(0);
    // Ningún token en BD debe coincidir con el token en texto plano enviado por correo
    tokensInDb.forEach((record) => {
      expect(record.tokenHash).not.toBe(extractedToken);
      expect(record.tokenHash).toHaveLength(64); // Longitud del hash SHA-256
      expect(record.usedAt).toBeNull();
    });
  });

  it('4. POST /api/auth/reset-password con token inválido debe fallar con 400', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: '0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff',
        newPassword: newPassword,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_OR_EXPIRED_TOKEN');
  });

  it('5. POST /api/auth/reset-password con contraseña débil debe ser rechazada por Zod (400)', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: extractedToken,
        newPassword: 'weak',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('6. POST /api/auth/reset-password con token válido y contraseña compleja debe tener éxito (200)', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: extractedToken,
        newPassword: newPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Contraseña restablecida exitosamente');
  });

  it('7. Reutilizar el mismo token debe ser rechazado inmediatamente (Garantía de un solo uso)', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: extractedToken,
        newPassword: 'AnotherStrongPassword!2026',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_OR_EXPIRED_TOKEN');
  });

  it('8. Iniciar sesión con la contraseña anterior debe fallar (401)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: initialPassword,
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('9. Iniciar sesión con la nueva contraseña debe ser exitoso (200)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: newPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail.toLowerCase());
  });
});
