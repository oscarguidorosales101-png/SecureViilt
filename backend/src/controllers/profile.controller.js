// ==============================================================================
// SECUREVAULT - CONTROLADOR DE PERFIL Y DATOS SENSIBLES
// ==============================================================================

import { profileService } from '../services/profile.service.js';

export const profileController = {
  async getSensitiveData(req, res, next) {
    try {
      const result = await profileService.getSensitiveData({
        userId: req.user.id,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  async saveSensitiveData(req, res, next) {
    try {
      const { dataType, value } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await profileService.saveSensitiveData({
        userId: req.user.id,
        dataType,
        value,
        ipAddress,
        userAgent,
      });

      return res.status(200).json({
        success: true,
        message: 'Dato sensible de perfil cifrado y almacenado exitosamente.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  async revealSensitiveData(req, res, next) {
    try {
      const { password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await profileService.revealSensitiveData({
        userId: req.user.id,
        password,
        ipAddress,
        userAgent,
      });

      return res.status(200).json({
        success: true,
        message: 'Identidad confirmada. Dato sensible descifrado.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },
};
