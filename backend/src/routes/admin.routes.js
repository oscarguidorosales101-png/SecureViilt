// ==============================================================================
// SECUREVAULT - ENRUTADOR DE ADMINISTRACIÓN (RBAC: ADMIN OBLIGATORIO)
// ==============================================================================

import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validateBody } from '../middlewares/validate.js';
import { updateUserStatusSchema } from '../validators/admin.schema.js';
import { apiRateLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// Todas las rutas administrativas exigen sesión activa Y rol ADMIN verificado en backend (RF-03, RF-07)
router.use(authenticate);
router.use(authorize(['ADMIN']));

// Listado de usuarios del sistema
router.get('/users', apiRateLimiter, adminController.getUsers);

// Activación / Desactivación de cuentas de usuario
router.patch('/users/:id/status', apiRateLimiter, validateBody(updateUserStatusSchema), adminController.updateUserStatus);

// Consulta de bitácora forense de auditoría de seguridad
router.get('/audit-logs', apiRateLimiter, adminController.getAuditLogs);

export default router;
