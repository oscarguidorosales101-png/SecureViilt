// ==============================================================================
// SECUREVAULT - MIDDLEWARE DE AUTORIZACIÓN BASADA EN ROLES (RBAC) (RF-03)
// ==============================================================================

/**
 * Control de acceso basado en roles verificado estrictamente en el backend.
 * @param {Array<'USER' | 'ADMIN'>} allowedRoles - Roles permitidos para la ruta.
 */
export const authorize = (allowedRoles = ['ADMIN']) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No autenticado.',
        },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Permisos insuficientes para realizar esta acción.',
        },
      });
    }

    next();
  };
};
