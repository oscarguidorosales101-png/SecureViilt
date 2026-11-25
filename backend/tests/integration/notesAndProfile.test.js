// ==============================================================================
// PRUEBAS DE INTEGRACIÓN: NOTAS PRIVADAS CIFRADAS Y PERFIL SENSIBLE (FASE 6)
// ==============================================================================

import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/db.js';

describe('Notas Privadas (RF-04) y Perfil Sensible Enmascarado (RF-05)', () => {
  const userAEmail = `usera.${Date.now()}@securevault.io`;
  const userBEmail = `userb.${Date.now()}@securevault.io`;
  const passwordA = 'UserAPassword!2026';
  const passwordB = 'UserBPassword!2026';

  const agentA = request.agent(app);
  const agentB = request.agent(app);

  let noteAId = '';
  const initialSecretContent = 'Contenido ultra secreto con credenciales bancarias.';

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    // 1. Registrar y loggear al Usuario A
    await request(app).post('/api/auth/register').send({
      name: 'Usuario A',
      email: userAEmail,
      password: passwordA,
    });
    await agentA.post('/api/auth/login').send({
      email: userAEmail,
      password: passwordA,
    });

    // 2. Registrar y loggear al Usuario B (para probar IDOR)
    await request(app).post('/api/auth/register').send({
      name: 'Usuario B (Atacante IDOR)',
      email: userBEmail,
      password: passwordB,
    });
    await agentB.post('/api/auth/login').send({
      email: userBEmail,
      password: passwordB,
    });
  });

  afterAll(async () => {
    try {
      await prisma.note.deleteMany({
        where: { user: { email: { in: [userAEmail, userBEmail] } } },
      });
      await prisma.userSensitiveData.deleteMany({
        where: { user: { email: { in: [userAEmail, userBEmail] } } },
      });
      await prisma.securityLog.deleteMany({
        where: { user: { email: { in: [userAEmail, userBEmail] } } },
      });
      await prisma.user.deleteMany({
        where: { email: { in: [userAEmail, userBEmail] } },
      });
    } catch (err) {
      // Ignorar errores en limpieza
    }
  });

  // ----------------------------------------------------------------------------
  // BLOQUE 1: CRUD DE NOTAS PRIVADAS CIFRADAS (RF-04)
  // ----------------------------------------------------------------------------
  describe('1. CRUD de Notas Privadas y Cifrado AES-256-GCM', () => {
    it('debe crear una nota y almacenar su contenido cifrado en la base de datos', async () => {
      const res = await agentA.post('/api/notes').send({
        title: 'Mi Nota Bancaria',
        content: initialSecretContent,
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.note).toHaveProperty('id');
      expect(res.body.data.note.title).toBe('Mi Nota Bancaria');
      expect(res.body.data.note.content).toBe(initialSecretContent);

      noteAId = res.body.data.note.id;

      // VERIFICACIÓN FORENSE EN BASE DE DATOS:
      // Comprobar que en PostgreSQL está cifrado y NO en texto plano
      const dbRecord = await prisma.note.findUnique({
        where: { id: noteAId },
      });

      expect(dbRecord).toBeDefined();
      expect(dbRecord.encryptedContent).not.toBe(initialSecretContent);
      expect(dbRecord.encryptedContent).toMatch(/^[0-9a-fA-F]+$/); // Hexadecimal
      expect(dbRecord.iv).toHaveLength(24); // 12 bytes en hex
      expect(dbRecord.authTag).toHaveLength(32); // 16 bytes en hex
      expect(dbRecord.keyVersion).toBe('v1');
    });

    it('debe listar las notas del Usuario A descifrando el contenido al vuelo', async () => {
      const res = await agentA.get('/api/notes');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.notes)).toBe(true);
      expect(res.body.data.notes.length).toBeGreaterThan(0);

      const found = res.body.data.notes.find((n) => n.id === noteAId);
      expect(found).toBeDefined();
      expect(found.content).toBe(initialSecretContent);
    });

    it('debe obtener la nota por su ID descifrando su contenido', async () => {
      const res = await agentA.get(`/api/notes/${noteAId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.note.id).toBe(noteAId);
      expect(res.body.data.note.content).toBe(initialSecretContent);
    });

    it('debe actualizar la nota y recifrar el contenido con un NUEVO IV aleatorio', async () => {
      const dbBefore = await prisma.note.findUnique({ where: { id: noteAId } });
      const updatedContent = 'Contenido actualizado y recifrado.';

      const res = await agentA.put(`/api/notes/${noteAId}`).send({
        title: 'Mi Nota Bancaria (Actualizada)',
        content: updatedContent,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.note.content).toBe(updatedContent);

      // Verificación de recifrado con nuevo IV en BD
      const dbAfter = await prisma.note.findUnique({ where: { id: noteAId } });
      expect(dbAfter.iv).not.toBe(dbBefore.iv); // El IV DEBE ser diferente
      expect(dbAfter.encryptedContent).not.toBe(dbBefore.encryptedContent);
    });
  });

  // ----------------------------------------------------------------------------
  // BLOQUE 2: AISLAMIENTO MULTI-TENANT Y PREVENCIÓN DE IDOR (OWASP A01)
  // ----------------------------------------------------------------------------
  describe('2. Prevención de IDOR (Aislamiento de Notas entre Usuarios)', () => {
    it('Usuario B no debe poder leer la nota privada del Usuario A (404)', async () => {
      const res = await agentB.get(`/api/notes/${noteAId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOTE_NOT_FOUND');
    });

    it('Usuario B no debe poder modificar la nota privada del Usuario A (404)', async () => {
      const res = await agentB.put(`/api/notes/${noteAId}`).send({
        title: 'Título Hackeado por B',
        content: 'Contenido alterado ilegítimamente',
      });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);

      // Comprobar que la nota de A sigue intacta
      const noteA = await prisma.note.findUnique({ where: { id: noteAId } });
      expect(noteA.title).not.toBe('Título Hackeado por B');
    });

    it('Usuario B no debe poder eliminar la nota privada del Usuario A (404)', async () => {
      const res = await agentB.delete(`/api/notes/${noteAId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);

      // La nota no fue borrada
      const exists = await prisma.note.findUnique({ where: { id: noteAId } });
      expect(exists).not.toBeNull();
    });
  });

  // ----------------------------------------------------------------------------
  // BLOQUE 3: DATO SENSIBLE DE PERFIL Y ENMASCARAMIENTO (RF-05)
  // ----------------------------------------------------------------------------
  describe('3. Dato Sensible de Perfil Cifrado y Enmascarado', () => {
    const rawPhoneNumber = '+506 8888-1234';

    it('debe guardar el teléfono cifrado con AES-256-GCM y calcular la máscara', async () => {
      const res = await agentA.post('/api/profile/sensitive-data').send({
        dataType: 'PHONE',
        value: rawPhoneNumber,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.dataType).toBe('PHONE');
      expect(res.body.data.maskedPreview).toBe('+506 ****-1234');

      // Verificación en Base de Datos
      const dbProfile = await prisma.userSensitiveData.findFirst({
        where: { user: { email: userAEmail } },
      });

      expect(dbProfile).toBeDefined();
      expect(dbProfile.encryptedPayload).not.toBe(rawPhoneNumber);
      expect(dbProfile.maskedPreview).toBe('+506 ****-1234');
      expect(dbProfile.iv).toHaveLength(24);
      expect(dbProfile.authTag).toHaveLength(32);
    });

    it('GET /api/profile/sensitive-data debe retornar ÚNICAMENTE el dato enmascarado', async () => {
      const res = await agentA.get('/api/profile/sensitive-data');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hasSensitiveData).toBe(true);
      expect(res.body.data.data.maskedPreview).toBe('+506 ****-1234');
      // JAMÁS debe exponerse el valor en claro ni el ciphertext
      expect(res.body.data.data).not.toHaveProperty('encryptedPayload');
      expect(res.body.data.data).not.toHaveProperty('value');
    });

    it('POST /api/profile/sensitive-data/reveal con contraseña errónea debe ser denegado (401)', async () => {
      const res = await agentA.post('/api/profile/sensitive-data/reveal').send({
        password: 'IncorrectPassword#999',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_PASSWORD');
    });

    it('POST /api/profile/sensitive-data/reveal con contraseña correcta debe revelar el dato descifrado', async () => {
      const res = await agentA.post('/api/profile/sensitive-data/reveal').send({
        password: passwordA,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.value).toBe(rawPhoneNumber);
      expect(res.body.data.maskedPreview).toBe('+506 ****-1234');
    });
  });

  // ----------------------------------------------------------------------------
  // BLOQUE 4: ELIMINACIÓN DE NOTA PROPIA
  // ----------------------------------------------------------------------------
  describe('4. Eliminación de Nota Propia', () => {
    it('Usuario A debe poder eliminar su propia nota exitosamente', async () => {
      const res = await agentA.delete(`/api/notes/${noteAId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Comprobar que ya no existe
      const checkGet = await agentA.get(`/api/notes/${noteAId}`);
      expect(checkGet.status).toBe(404);
    });
  });
});
