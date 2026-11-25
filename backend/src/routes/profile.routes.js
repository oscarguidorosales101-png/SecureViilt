// ==============================================================================
// SECUREVAULT - ENRUTADOR DE PERFIL Y DATOS SENSIBLES
// ==============================================================================

import { Router } from 'express';
import { profileController } from '../controllers/profile.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validateBody } from '../middlewares/validate.js';
import { sensitiveDataSchema, revealSensitiveDataSchema } from '../validators/profile.schema.js';
import { apiRateLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// Todas las rutas de perfil requieren autenticación previa obligatoria
router.use(authenticate);

// Consultar dato sensible de perfil (devuelve únicamente máscara determinística) (RF-05)
router.get('/sensitive-data', apiRateLimiter, profileController.getSensitiveData);

// Guardar o actualizar dato sensible (cifrado con AES-256-GCM)
router.post('/sensitive-data', apiRateLimiter, validateBody(sensitiveDataSchema), profileController.saveSensitiveData);

// Revelado seguro del dato sensible en texto plano (requiere confirmación de contraseña)
router.post('/sensitive-data/reveal', apiRateLimiter, validateBody(revealSensitiveDataSchema), profileController.revealSensitiveData);

export default router;
