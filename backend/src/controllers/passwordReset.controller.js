// ==============================================================================
// SECUREVAULT - CONTROLADOR DE RECUPERACIÓN DE CONTRASEÑA
// ==============================================================================

import { passwordResetService } from '../services/passwordReset.service.js';

export const passwordResetController = {
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await passwordResetService.requestPasswordReset({
        email,
        ipAddress,
        userAgent,
      });

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await passwordResetService.resetPassword({
        token,
        newPassword,
        ipAddress,
        userAgent,
      });

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  },
};
