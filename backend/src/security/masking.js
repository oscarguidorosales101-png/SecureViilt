// ==============================================================================
// SECUREVAULT - ENMASCARAMIENTO SEGURO DE DATOS SENSIBLES DE PERFIL (RF-05)
// ==============================================================================

/**
 * Enmascara un número telefónico preservando el prefijo/código de país y los últimos 4 dígitos.
 * Ejemplo: "+506 8888-1234" -> "+506 ****-1234", "88881234" -> "****1234"
 * @param {string} phone - Teléfono original en texto plano.
 * @returns {string} Teléfono enmascarado.
 */
export function maskPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return '****';

  const trimmed = phone.trim();
  if (trimmed.length <= 4) {
    return '****';
  }

  const lastFour = trimmed.slice(-4);

  // Si tiene formato internacional "+506 8888-1234"
  if (trimmed.startsWith('+') && trimmed.includes(' ')) {
    const countryCode = trimmed.split(' ')[0];
    return `${countryCode} ****-${lastFour}`;
  }

  return `****-${lastFour}`;
}

/**
 * Enmascara un número de identificación o cédula mostrando solo los últimos 4 dígitos.
 * Ejemplo: "117890123" -> "*****0123"
 * @param {string} idNumber - Documento de identidad en texto plano.
 * @returns {string} Identificación enmascarada.
 */
export function maskNationalId(idNumber) {
  if (!idNumber || typeof idNumber !== 'string') return '****';

  const trimmed = idNumber.trim();
  if (trimmed.length <= 4) {
    return '****';
  }

  const visibleCount = 4;
  const maskedPart = '*'.repeat(trimmed.length - visibleCount);
  const visiblePart = trimmed.slice(-visibleCount);

  return `${maskedPart}${visiblePart}`;
}

/**
 * Enmascara una dirección de correo electrónico.
 * Ejemplo: "usuario@dominio.com" -> "u***o@dominio.com"
 * @param {string} email - Correo electrónico original.
 * @returns {string} Correo enmascarado.
 */
export function maskEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) return '****';

  const [username, domain] = email.split('@');
  if (username.length <= 2) {
    return `*@${domain}`;
  }

  const firstChar = username[0];
  const lastChar = username[username.length - 1];
  return `${firstChar}***${lastChar}@${domain}`;
}

/**
 * Enmascaramiento genérico configurable según el tipo de dato sensible.
 * @param {string} value - Valor en texto plano.
 * @param {'PHONE' | 'NATIONAL_ID' | 'EMAIL' | 'GENERIC'} type - Tipo de dato.
 * @returns {string} Valor enmascarado.
 */
export function maskSensitiveData(value, type = 'GENERIC') {
  switch (type) {
    case 'PHONE':
      return maskPhoneNumber(value);
    case 'NATIONAL_ID':
      return maskNationalId(value);
    case 'EMAIL':
      return maskEmail(value);
    default:
      return maskNationalId(value);
  }
}
