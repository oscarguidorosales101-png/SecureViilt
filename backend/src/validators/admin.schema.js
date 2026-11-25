// ==============================================================================
// SECUREVAULT - ESQUEMAS DE VALIDACIÓN ZOD (ADMINISTRACIÓN)
// ==============================================================================

import { z } from 'zod';

export const updateUserStatusSchema = z.object({
  isActive: z.boolean({
    required_error: 'El campo isActive es obligatorio (true o false)',
    invalid_type_error: 'El campo isActive debe ser un valor booleano',
  }),
});
