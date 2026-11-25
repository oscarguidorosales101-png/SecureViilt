// ==============================================================================
// SECUREVAULT - CONTROLADOR DE ADMINISTRACIÓN
// ==============================================================================

import { adminService } from '../services/admin.service.js';

export const adminController = {
  async getUsers(req, res, next) {
    try {
      const skip = req.query.skip ? Number(req.query.skip) : 0;
      const take = req.query.take ? Number(req.query.take) : 50;

      const users = await adminService.listUsers({ skip, take });

      return res.status(200).json({
        success: true,
        data: {
          users,
          count: users.length,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async updateUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const updatedUser = await adminService.updateUserStatus({
        targetUserId: id,
        isActive,
        adminUserId: req.user.id,
        ipAddress,
        userAgent,
      });

      return res.status(200).json({
        success: true,
        message: `Estado del usuario actualizado a ${isActive ? 'Activo' : 'Inactivo'}.`,
        data: {
          user: updatedUser,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async getAuditLogs(req, res, next) {
    try {
      const skip = req.query.skip ? Number(req.query.skip) : 0;
      const take = req.query.take ? Number(req.query.take) : 50;
      const eventType = req.query.eventType || null;
      const status = req.query.status || null;

      const logs = await adminService.listAuditLogs({ skip, take, eventType, status });

      return res.status(200).json({
        success: true,
        data: {
          logs,
          count: logs.length,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
