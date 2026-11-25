// ==============================================================================
// PRUEBAS DE INTEGRACIÓN: SISTEMA DE AUTENTICACIÓN Y SESIONES (SECUREVAULT)
// ==============================================================================

import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma, pool } from '../../src/config/db.js';

describe('Flujo Completo de Autenticación, Sesiones y Seguridad (Fase 4)', () => {
  const testEmail = `test.user.${Date.now()}@securevault.io`;
  const validPassword = 'SecurePassword!2026';
  const agent = request.agent(app);

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
  });

  afterAll(async () => {
    try {
      // Limpieza de datos de prueba
      await prisma.securityLog.deleteMany({
        where: { user: { email: testEmail } },
      });
      await prisma.user.deleteMany({
        where: { email: testEmail },
      });
    } catch (err) {
      // Ignorar si ya fue eliminado
    }
  });

  it('1. GET /health debe responder 200 con estado ok sin fugar detalles de arquitectura', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).not.toHaveProperty('database');
  });

  it('2. POST /api/auth/register debe rechazar contraseñas débiles que no cumplan la política (OWASP A07)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Usuario Test',
        email: 'debil@securevault.io',
        password: 'password123', // Sin mayúscula ni símbolo especial
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('3. POST /api/auth/register debe registrar exitosamente un usuario con contraseña compleja', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Carlos Arquitecto',
        email: testEmail,
        password: validPassword,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toHaveProperty('id');
    expect(res.body.data.user.email).toBe(testEmail.toLowerCase());
    expect(res.body.data.user.role).toBe('USER');
    // La contraseña hasheada JAMÁS se retorna en el payload
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  it('4. POST /api/auth/register debe rechazar correos duplicados con 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Carlos Duplicado',
        email: testEmail,
        password: validPassword,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('5. POST /api/auth/login debe rechazar contraseñas erróneas con 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'WrongPassword#999',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('6. POST /api/auth/login debe autenticar exitosamente y emitir cookie HttpOnly connect.sid', async () => {
    const res = await agent
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: validPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail.toLowerCase());

    // Validar emisión de cookie de sesión segura
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const connectSidCookie = cookies.find((c) => c.startsWith('connect.sid='));
    expect(connectSidCookie).toBeDefined();
    expect(connectSidCookie).toContain('HttpOnly');
  });

  it('7. GET /api/auth/me debe retornar los datos del usuario cuando se envía la cookie de sesión', async () => {
    const res = await agent.get('/api/auth/me');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail.toLowerCase());
    expect(res.body.data.user.role).toBe('USER');
  });

  it('8. GET /api/auth/me debe rechazar peticiones sin sesión con 401 Unauthorized', async () => {
    const unauthenticatedAgent = request(app);
    const res = await unauthenticatedAgent.get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('9. POST /api/auth/logout debe invalidar la sesión y limpiar la cookie', async () => {
    const res = await agent.post('/api/auth/logout');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Cookie revocada
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
  });

  it('10. GET /api/auth/me después de logout debe denegar el acceso (401)', async () => {
    const res = await agent.get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('11. Debe bloquear temporalmente la cuenta con 403 tras 5 intentos fallidos consecutivos (OWASP A07)', async () => {
    // Realizar 5 intentos fallidos consecutivos
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'WrongPassword#999' });
    }

    // El siguiente intento debe ser rechazado inmediatamente con 403 ACCOUNT_LOCKED incluso con contraseña correcta
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: validPassword });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ACCOUNT_LOCKED');
  });
});
