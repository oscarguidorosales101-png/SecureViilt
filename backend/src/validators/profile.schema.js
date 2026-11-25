// ==============================================================================
// SECUREVAULT - ESQUEMAS DE VALIDACIÓN ZOD (DATO SENSIBLE DE PERFIL)
// ==============================================================================

import { z } from 'zod';

export const sensitiveDataSchema = z.object({
  dataType: z.enum(['PHONE', 'NATIONAL_ID'], {
    required_error: 'El tipo de dato es obligatorio (PHONE o NATIONAL_ID)',
    invalid_type_error: 'El tipo de dato debe ser PHONE o NATIONAL_ID',
  }),
  value: z
    .string({ required_error: 'El valor del dato sensible es obligatorio' })
    .trim()
    .min(4, 'El dato sensible debe tener al menos 4 caracteres')
    .max(50, 'El dato sensible no puede exceder los 50 caracteres'),
});

export const revealSensitiveDataSchema = z.object({
  password: z
    .string({ required_error: 'Debe ingresar su contraseña actual para confirmar su identidad' })
    .min(1, 'La contraseña no puede estar vacía'),
});
