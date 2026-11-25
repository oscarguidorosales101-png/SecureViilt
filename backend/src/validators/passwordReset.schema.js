// ==============================================================================
// SECUREVAULT - ESQUEMAS DE VALIDACIÓN ZOD (RECUPERACIÓN DE CONTRASEÑA)
// ==============================================================================

import { z } from 'zod';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{10,}$/;

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'El correo electrónico es obligatorio' })
    .trim()
    .toLowerCase()
    .email('El formato del correo electrónico no es válido'),
});

export const resetPasswordSchema = z.object({
  token: z
    .string({ required_error: 'El token de recuperación es obligatorio' })
    .min(32, 'Token inválido o malformado'),
  newPassword: z
    .string({ required_error: 'La nueva contraseña es obligatoria' })
    .min(10, 'La contraseña debe tener un mínimo de 10 caracteres')
    .max(128, 'La contraseña no puede exceder 128 caracteres')
    .regex(
      PASSWORD_REGEX,
      'La nueva contraseña debe incluir al menos una letra mayúscula, una minúscula, un número y un carácter especial (!@#$%^&*...)'
    ),
});
