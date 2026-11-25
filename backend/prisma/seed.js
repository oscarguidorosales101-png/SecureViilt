// ==============================================================================
// SECUREVAULT - SCRIPT DE SEMILLA (SEED)
// ==============================================================================

import 'dotenv/config';
import { prisma } from '../src/config/db.js';
import { hashPassword } from '../src/security/argon2.js';
import { encrypt } from '../src/security/crypto.js';

async function main() {
  console.log('Iniciando siembra de datos de SecureVault...');

  const adminEmail = 'admin@securevault.io';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  let adminUser = existingAdmin;

  if (!existingAdmin) {
    const passwordHash = await hashPassword('AdminPassword123!');
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Enterprise Admin',
        passwordHash,
        role: 'ADMIN',
        isActive: true,
      },
    });
    console.log(`Usuario administrador creado: ${adminEmail}`);
  } else {
    console.log(`El usuario administrador ya existe: ${adminEmail}`);
  }

  // Crear una nota de bienvenida cifrada para el admin si no tiene notas
  const noteCount = await prisma.note.count({ where: { userId: adminUser.id } });
  if (noteCount === 0) {
    const demoContent = 'Bienvenido a SecureVault Enterprise.\n\nEsta nota privada ha sido cifrada mediante AES-256-GCM utilizando un vector de inicialización (IV) de 12 bytes y una clave autenticada versión v1.\n\n#Seguridad #Directivas #Enterprise';
    const { encryptedPayload, iv, authTag, keyVersion } = encrypt(demoContent);

    await prisma.note.create({
      data: {
        userId: adminUser.id,
        title: 'Directivas de Seguridad y Cifrado 2026',
        encryptedContent: encryptedPayload,
        iv,
        authTag,
        keyVersion,
      },
    });
    console.log('Nota inicial de directivas cifrada creada exitosamente.');
  }

  // Crear logs de auditoría iniciales si no existen
  const logCount = await prisma.securityLog.count();
  if (logCount === 0) {
    await prisma.securityLog.createMany({
      data: [
        {
          eventType: 'SYSTEM_BOOTSTRAP',
          userId: adminUser.id,
          ipAddress: '127.0.0.1',
          userAgent: 'SecureVault-Kernel/1.0',
          status: 'SUCCESS',
          details: { message: 'Plataforma SecureVault inicializada con políticas de seguridad OWASP.' },
        },
        {
          eventType: 'USER_REGISTER',
          userId: adminUser.id,
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          status: 'SUCCESS',
          details: { email: adminEmail, role: 'ADMIN' },
        },
      ],
    });
    console.log('Bitácora inicial de seguridad poblada con eventos de auditoría.');
  }

  console.log('¡Semilla completada con éxito!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error durante la ejecución del seed:', err);
  process.exit(1);
});
