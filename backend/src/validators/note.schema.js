// ==============================================================================
// SECUREVAULT - ESQUEMAS DE VALIDACIÓN ZOD (NOTAS PRIVADAS)
// ==============================================================================

import { z } from 'zod';

export const createNoteSchema = z.object({
  title: z
    .string({ required_error: 'El título es obligatorio' })
    .trim()
    .min(1, 'El título no puede estar vacío')
    .max(200, 'El título no puede exceder los 200 caracteres'),
  content: z
    .string({ required_error: 'El contenido es obligatorio' })
    .min(1, 'El contenido no puede estar vacío')
    .max(10000, 'El contenido no puede exceder los 10,000 caracteres'),
});

export const updateNoteSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'El título no puede estar vacío')
      .max(200, 'El título no puede exceder los 200 caracteres')
      .optional(),
    content: z
      .string()
      .min(1, 'El contenido no puede estar vacío')
      .max(10000, 'El contenido no puede exceder los 10,000 caracteres')
      .optional(),
  })
  .refine(
    (data) => data.title !== undefined || data.content !== undefined,
    'Debe proporcionar al menos el título o el contenido para actualizar la nota'
  );
