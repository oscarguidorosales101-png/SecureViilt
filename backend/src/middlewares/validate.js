// ==============================================================================
// SECUREVAULT - MIDDLEWARE DE VALIDACIÓN DE ENTRADA CON ZOD
// ==============================================================================

export const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err.errors) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Los datos proporcionados no cumplen con las reglas de validación.',
            details: err.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      }
      return res.status(400).json({
        success: false,
        error: {
          code: 'MALFORMED_PAYLOAD',
          message: 'Estructura de datos malformada o inválida.',
        },
      });
    }
  };
};
