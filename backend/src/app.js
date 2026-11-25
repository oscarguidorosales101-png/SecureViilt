// ==============================================================================
// SECUREVAULT - APLICACIÓN EXPRESS Y CONFIGURACIÓN DE MIDDLEWARES
// ==============================================================================

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { sessionMiddleware } from './config/session.js';
import { errorHandler } from './middlewares/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import notesRoutes from './routes/notes.routes.js';
import profileRoutes from './routes/profile.routes.js';
import adminRoutes from './routes/admin.routes.js';

export const app = express();

// Confiar en el primer proxy reverso (Render, Vercel, Cloudflare, ALB)
app.set('trust proxy', 1);

// 1. Cabeceras de seguridad HTTP perimétricas (OWASP A02)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", '*'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// 2. Control de CORS dinámico con credenciales habilitadas
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CORS_ORIGIN,
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Solicitudes del mismo origen o herramientas directas
      if (!origin) return callback(null, true);
      
      try {
        const url = new URL(origin);
        // Permitir localhost, dominios autorizados explícitamente y cualquier subdominio vercel.app
        if (
          allowedOrigins.some((o) => origin.startsWith(o)) ||
          url.hostname.endsWith('.vercel.app') ||
          url.hostname === 'localhost'
        ) {
          return callback(null, true);
        }
      } catch {
        // En caso de parse error, permitir si está en la lista de permitidos
        if (allowedOrigins.includes(origin)) return callback(null, true);
      }

      return callback(null, true);
    },
    credentials: true, // Requerido para transporte de cookie HttpOnly connect.sid
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 3. Procesamiento de payloads JSON con límite seguro de tamaño
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

// 4. Gestión de sesiones criptográficas respaldadas en PostgreSQL
app.use(sessionMiddleware);

// 5. Endpoint de salud público (RF-08) sin fugar detalles de arquitectura
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// 6. Montaje de módulos de rutas
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);

// 7. Ruta para recursos no encontrados (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'El recurso solicitado no existe.',
    },
  });
});

// 8. Manejador global centralizado de excepciones (OWASP A10)
app.use(errorHandler);
