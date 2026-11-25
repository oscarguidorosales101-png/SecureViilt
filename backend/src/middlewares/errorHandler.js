// ==============================================================================
// SECUREVAULT - MANEJADOR CENTRALIZADO DE ERRORES (OWASP A10)
// ==============================================================================

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';

  // Registrar error estructurado (evitando fugar información sensible)
  console.error(`[ERROR] [${req.method} ${req.url}] ${err.name || 'InternalError'}: ${err.message}`);

  // En producción jamás se filtran stack traces ni datos de base de datos
  const response = {
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Ha ocurrido un error inesperado en el servidor.',
    },
  };

  if (!isProd && statusCode === 500 && err.stack) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
