// ==============================================================================
// SECUREVAULT - ENRUTADOR DE NOTAS PRIVADAS
// ==============================================================================

import { Router } from 'express';
import { notesController } from '../controllers/notes.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validateBody } from '../middlewares/validate.js';
import { createNoteSchema, updateNoteSchema } from '../validators/note.schema.js';
import { apiRateLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// Todas las rutas de notas requieren autenticación previa obligatoria
router.use(authenticate);

// Listar todas las notas del usuario autenticado
router.get('/', apiRateLimiter, notesController.getAll);

// Crear nueva nota privada con cifrado en reposo (RF-04)
router.post('/', apiRateLimiter, validateBody(createNoteSchema), notesController.create);

// Obtener una nota específica (descifrado y validación IDOR)
router.get('/:id', apiRateLimiter, notesController.getOne);

// Actualizar una nota propia (recifrado con nuevo IV)
router.put('/:id', apiRateLimiter, validateBody(updateNoteSchema), notesController.update);

// Eliminar una nota propia
router.delete('/:id', apiRateLimiter, notesController.delete);

export default router;
