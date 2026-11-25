// ==============================================================================
// SECUREVAULT - CONFIGURACIÓN DE SESIONES EN POSTGRESQL (EXPRESS-SESSION)
// ==============================================================================

import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './db.js';

const PgStore = connectPgSimple(session);

export const sessionMiddleware = session({
  store: new PgStore({
    pool,
    tableName: 'sessions',
    createTableIfMissing: false, // Ya creada formalmente con la migración de Prisma
  }),
  secret: process.env.SESSION_SECRET || 'fallback_development_session_secret_at_least_64_characters_long_entropy',
  name: 'connect.sid',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, // Inaccesible desde JavaScript de cliente (mitiga XSS)
    secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
    sameSite: 'lax', // Mitigación contra Cross-Site Request Forgery (CSRF)
    maxAge: Number(process.env.SESSION_MAX_AGE_MS) || 24 * 60 * 60 * 1000, // 24 horas
  },
});
