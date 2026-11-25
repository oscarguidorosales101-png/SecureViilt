// ==============================================================================
// SECUREVAULT - CONTROLADOR DE AUTENTICACIÓN
// ==============================================================================

import { authService } from '../services/auth.service.js';

export const authController = {
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;
      const userName = (name && name.trim().length >= 2) ? name.trim() : email.split('@')[0];
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const user = await authService.register({
        name: userName,
        email,
        password,
        ipAddress,
        userAgent,
      });

      return res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente.',
        data: {
          user,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const user = await authService.login({
        email,
        password,
        req,
        ipAddress,
        userAgent,
      });

      return res.status(200).json({
        success: true,
        message: 'Inicio de sesión exitoso.',
        data: {
          user,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async logout(req, res, next) {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const userId = req.session ? req.session.userId : null;

      await authService.logout({
        req,
        userId,
        ipAddress,
        userAgent,
      });

      res.clearCookie('connect.sid');

      return res.status(200).json({
        success: true,
        message: 'Sesión cerrada exitosamente.',
      });
    } catch (err) {
      next(err);
    }
  },

  async getMe(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user.id);

      return res.status(200).json({
        success: true,
        data: {
          user,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
