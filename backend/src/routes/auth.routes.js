// ==============================================================================
// SECUREVAULT - RUTAS DE AUTENTICACIÓN
// ==============================================================================

import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { passwordResetController } from '../controllers/passwordReset.controller.js';
import { validateBody } from '../middlewares/validate.js';
import { registerSchema, loginSchema } from '../validators/auth.schema.js';
import { forgotPasswordSchema, resetPasswordSchema } from '../validators/passwordReset.schema.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authRateLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// Registro de usuario (RF-01) con rate limit y validación estricta
router.post('/register', authRateLimiter, validateBody(registerSchema), authController.register);

// Inicio de sesión (RF-02) con rate limit y protección contra session fixation
router.post('/login', authRateLimiter, validateBody(loginSchema), authController.login);

// Cierre de sesión (RF-02) con revocación de cookie y destrucción en BD
router.post('/logout', authenticate, authController.logout);

// Perfil de sesión activa
router.get('/me', authenticate, authController.getMe);

// Solicitud de recuperación de contraseña (RF-06, anti-enumeración)
router.post('/forgot-password', authRateLimiter, validateBody(forgotPasswordSchema), passwordResetController.forgotPassword);

// Restablecimiento de contraseña con token (RF-06)
router.post('/reset-password', authRateLimiter, validateBody(resetPasswordSchema), passwordResetController.resetPassword);

export default router;
