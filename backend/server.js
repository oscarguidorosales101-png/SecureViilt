// ==============================================================================
// SECUREVAULT - SERVIDOR PRINCIPAL HTTP
// ==============================================================================

import 'dotenv/config';
import { app } from './src/app.js';
import { pool, checkDatabaseConnection } from './src/config/db.js';

const PORT = Number(process.env.PORT) || 3000;

async function bootstrap() {
  console.log('Verificando conexión con el motor de base de datos PostgreSQL...');
  const dbStatus = await checkDatabaseConnection();

  if (!dbStatus.connected) {
    console.error('ERROR CRÍTICO: No fue posible conectar con PostgreSQL:', dbStatus.error);
    process.exit(1);
  }

  console.log(`Conexión establecida con la base de datos: [${dbStatus.database}] en PostgreSQL (${dbStatus.version.split(' ')[1]}).`);

  const server = app.listen(PORT, () => {
    console.log(`SecureVault API escuchando en el puerto ${PORT} [Entorno: ${process.env.NODE_ENV || 'development'}]`);
  });

  // Apagado ordenado (Graceful Shutdown)
  const shutdown = async (signal) => {
    console.log(`Señal ${signal} recibida. Cerrando servidor de forma segura...`);
    server.close(async () => {
      console.log('Servidor HTTP cerrado.');
      await pool.end();
      console.log('Conexiones a PostgreSQL cerradas.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap();
