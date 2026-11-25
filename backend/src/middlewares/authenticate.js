// ==============================================================================
// SECUREVAULT - MIDDLEWARE DE AUTENTICACIÓN (SESIÓN ACTIVA)
// ==============================================================================

import { userRepository } from '../repositories/user.repository.js';

export const authenticate = async (req, res, next) => {
  if (!req.session || !req.session.authenticated || !req.session.userId) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Acceso denegado: debe iniciar sesión para acceder a este recurso.',
      },
    });
  }

  try {
    const user = await userRepository.findById(req.session.userId);

    if (!user || !user.isActive) {
      // Invalida la sesión si el usuario fue desactivado o eliminado
      req.session.destroy(() => {});
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_INACTIVE_OR_REVOKED',
          message: 'La cuenta no existe o ha sido desactivada por un administrador.',
        },
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_VERIFICATION_ERROR',
        message: 'Error al verificar la identidad del usuario.',
      },
    });
  }
};
