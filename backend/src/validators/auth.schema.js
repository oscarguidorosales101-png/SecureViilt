// ==============================================================================
// SECUREVAULT - ESQUEMAS DE VALIDACIÓN ZOD (AUTENTICACIÓN)
// ==============================================================================

import { z } from 'zod';

/**
 * Expresión regular para política estricta de contraseñas:
 * - Mínimo 10 caracteres
 * - Al menos 1 letra mayúscula
 * - Al menos 1 letra minúscula
 * - Al menos 1 dígito numérico
 * - Al menos 1 símbolo especial
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{10,}$/;

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .optional(),
  email: z
    .string({ required_error: 'El correo electrónico es obligatorio' })
    .trim()
    .toLowerCase()
    .email('El formato del correo electrónico no es válido')
    .max(255, 'El correo no puede exceder 255 caracteres'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(10, 'La contraseña debe tener un mínimo de 10 caracteres')
    .max(128, 'La contraseña no puede exceder 128 caracteres')
    .regex(
      PASSWORD_REGEX,
      'La contraseña debe incluir al menos una letra mayúscula, una minúscula, un número y un carácter especial (!@#$%^&*...)'
    ),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'El correo electrónico es obligatorio' })
    .trim()
    .toLowerCase()
    .email('El formato del correo electrónico no es válido'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(1, 'La contraseña no puede estar vacía'),
});
