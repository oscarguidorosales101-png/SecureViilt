// ==============================================================================
// SECUREVAULT - LIMITACIÓN DE TASA DE SOLICITUDES (EXPRESS-RATE-LIMIT)
// ==============================================================================

import rateLimit from 'express-rate-limit';

/**
 * Limitador estricto para endpoints de autenticación (Login, Registro):
 * Máximo 5 peticiones por ventana de 15 minutos por dirección IP.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Demasiados intentos de acceso desde esta dirección IP. Por favor, intente nuevamente en 15 minutos.',
    },
  },
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    error: {
      code: 'API_RATE_LIMIT_EXCEEDED',
      message: 'Límite de solicitudes de API alcanzado. Por favor, disminuya la frecuencia.',
    },
  },
});
