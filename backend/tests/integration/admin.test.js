// ==============================================================================
// PRUEBAS DE INTEGRACIÓN: PANEL ADMINISTRATIVO Y RBAC (FASE 7)
// ==============================================================================

import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/db.js';

describe('Panel Administrativo, RBAC y Auditoría Forense (Fase 7)', () => {
  const adminEmail = `admin.${Date.now()}@securevault.io`;
  const regularEmail = `regular.${Date.now()}@securevault.io`;
  const adminPassword = 'AdminPassword!2026';
  const regularPassword = 'RegularPassword!2026';

  const adminAgent = request.agent(app);
  const regularAgent = request.agent(app);

  let adminUserId = '';
  let regularUserId = '';

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    // 1. Registrar y autenticar al usuario Administrador
    await request(app).post('/api/auth/register').send({
      name: 'Super Administrador',
      email: adminEmail,
      password: adminPassword,
    });

    // Promover formalmente en base de datos al rol ADMIN
    const adminRecord = await prisma.user.update({
      where: { email: adminEmail.toLowerCase() },
      data: { role: 'ADMIN' },
    });
    adminUserId = adminRecord.id;

    await adminAgent.post('/api/auth/login').send({
      email: adminEmail,
      password: adminPassword,
    });

    // 2. Registrar y autenticar al usuario regular (USER)
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Usuario Regular',
      email: regularEmail,
      password: regularPassword,
    });
    regularUserId = regRes.body.data.user.id;

    await regularAgent.post('/api/auth/login').send({
      email: regularEmail,
      password: regularPassword,
    });
  });

  afterAll(async () => {
    try {
      await prisma.securityLog.deleteMany({
        where: { user: { email: { in: [adminEmail, regularEmail] } } },
      });
      await prisma.user.deleteMany({
        where: { email: { in: [adminEmail, regularEmail] } },
      });
    } catch (err) {
      // Ignorar errores en limpieza
    }
  });

  // ----------------------------------------------------------------------------
  // BLOQUE 1: VERIFICACIÓN ESTRICTA DE RBAC (OWASP A01)
  // ----------------------------------------------------------------------------
  describe('1. Control de Acceso Basado en Roles (RBAC)', () => {
    it('un usuario con rol USER debe recibir 403 Forbidden al intentar listar usuarios', async () => {
      const res = await regularAgent.get('/api/admin/users');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('un usuario con rol USER debe recibir 403 Forbidden al intentar ver la bitácora de auditoría', async () => {
      const res = await regularAgent.get('/api/admin/audit-logs');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('un usuario con rol USER debe recibir 403 Forbidden al intentar modificar el estado de un usuario', async () => {
      const res = await regularAgent.patch(`/api/admin/users/${regularUserId}/status`).send({
        isActive: false,
      });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('un visitante no autenticado debe recibir 401 Unauthorized en endpoints administrativos', async () => {
      const unauth = request(app);
      const res = await unauth.get('/api/admin/users');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  // ----------------------------------------------------------------------------
  // BLOQUE 2: CONSULTAS Y ACCIONES DEL ROL ADMIN (RF-07, OWASP A09)
  // ----------------------------------------------------------------------------
  describe('2. Operaciones Administrativas y Bitácora Forense', () => {
    it('un usuario con rol ADMIN debe poder consultar la lista de usuarios del sistema', async () => {
      const res = await adminAgent.get('/api/admin/users');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.users)).toBe(true);
      expect(res.body.data.users.length).toBeGreaterThanOrEqual(2);

      // Regla de seguridad: JAMÁS deben exponerse los hashes de contraseñas
      res.body.data.users.forEach((u) => {
        expect(u).not.toHaveProperty('passwordHash');
        expect(u).not.toHaveProperty('password');
      });
    });

    it('un usuario con rol ADMIN debe poder consultar la bitácora de auditoría forense', async () => {
      const res = await adminAgent.get('/api/admin/audit-logs');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.logs)).toBe(true);
      expect(res.body.data.logs.length).toBeGreaterThan(0);

      // Comprobar estructura de log forense
      const sampleLog = res.body.data.logs[0];
      expect(sampleLog).toHaveProperty('eventType');
      expect(sampleLog).toHaveProperty('ipAddress');
      expect(sampleLog).toHaveProperty('status');
      expect(sampleLog).toHaveProperty('createdAt');
    });

    it('el administrador no debe poder desactivar su propia cuenta (Regla de Seguridad)', async () => {
      const res = await adminAgent.patch(`/api/admin/users/${adminUserId}/status`).send({
        isActive: false,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CANNOT_DEACTIVATE_OWN_ACCOUNT');
    });
  });

  // ----------------------------------------------------------------------------
  // BLOQUE 3: GESTIÓN DE ESTADO Y REVOCACIÓN INMEDIATA DE SESIÓN
  // ----------------------------------------------------------------------------
  describe('3. Desactivación de Cuenta y Revocación Inmediata de Sesión', () => {
    it('el administrador desactiva la cuenta del usuario regular exitosamente', async () => {
      const res = await adminAgent.patch(`/api/admin/users/${regularUserId}/status`).send({
        isActive: false,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.isActive).toBe(false);

      // Comprobar en BD
      const userInDb = await prisma.user.findUnique({ where: { id: regularUserId } });
      expect(userInDb.isActive).toBe(false);
    });

    it('la sesión activa del usuario desactivado debe ser rechazada inmediatamente (401 o 403)', async () => {
      // Como la sesión fue destruida físicamente en PostgreSQL por invalidateAllSessions,
      // la petición subsecuente es denegada inmediatamente
      const res = await regularAgent.get('/api/auth/me');

      expect([401, 403]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('el usuario desactivado no debe poder iniciar sesión (403)', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: regularEmail,
        password: regularPassword,
      });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ACCOUNT_INACTIVE');
    });

    it('el administrador reactiva la cuenta del usuario regular exitosamente', async () => {
      const res = await adminAgent.patch(`/api/admin/users/${regularUserId}/status`).send({
        isActive: true,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.isActive).toBe(true);
    });

    it('tras la reactivación, el usuario regular puede volver a iniciar sesión (200)', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: regularEmail,
        password: regularPassword,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(regularEmail.toLowerCase());
    });
  });
});
