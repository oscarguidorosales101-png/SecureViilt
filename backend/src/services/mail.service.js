// ==============================================================================
// SECUREVAULT - SERVICIO DE ENVÍO DE CORREOS (GMAIL SMTP CON NODEMAILER)
// ==============================================================================

import 'dotenv/config';
import nodemailer from 'nodemailer';

let transporterInstance = null;

/**
 * Inicializa el transporte de correo según el entorno.
 * En producción/desarrollo con credenciales: Gmail SMTP mediante TLS/STARTTLS.
 * En testing o si no hay credenciales configuradas: Mock transporter sin fallar.
 */
function getTransporter() {
  if (transporterInstance) {
    return transporterInstance;
  }

  const isTest = process.env.NODE_ENV === 'test';
  const fallbackUser = 'oscarguidorosales101@gmail.com';
  const fallbackPassword = 'fvqtjuuwjyrmrhhp';
  const gmailUser = (process.env.GMAIL_USER ? process.env.GMAIL_USER.trim() : null) || (!isTest ? fallbackUser : null);
  const rawPassword = process.env.GMAIL_APP_PASSWORD || (!isTest ? fallbackPassword : '');
  const gmailPassword = rawPassword.replace(/\s+/g, '');

  const hasCredentials =
    gmailUser &&
    gmailPassword &&
    !gmailUser.includes('your-email') &&
    !gmailPassword.includes('xxxx');

  if (isTest || !hasCredentials) {
    // Transporte simulado para pruebas y desarrollo preliminar sin credenciales
    transporterInstance = {
      sendMail: async (options) => {
        return {
          messageId: `mock-${Date.now()}`,
          response: '250 Mock Message Accepted',
          mocked: true,
        };
      },
      mocked: true,
    };
    return transporterInstance;
  }

  // Transporte real con Gmail SMTP
  transporterInstance = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPassword,
    },
    tls: {
      rejectUnauthorized: true,
    },
  });

  return transporterInstance;
}

export const mailService = {
  lastSentMail: null,

  /**
   * Envía un correo con el enlace temporal para restablecer contraseña (RF-06).
   */
  async sendPasswordResetEmail({ toEmail, name, resetUrl, expiresInMinutes = 15 }) {
    const transporter = getTransporter();
    const fromAddress = process.env.GMAIL_USER || 'no-reply@securevault.io';

    const mailOptions = {
      from: `"SecureVault Security" <${fromAddress}>`,
      to: toEmail,
      subject: 'Restablecimiento de contraseña - SecureVault',
      text: `Hola ${name},\n\nHemos recibido una solicitud para restablecer la contraseña de su cuenta en SecureVault.\n\nPor favor, acceda al siguiente enlace temporal para establecer su nueva contraseña:\n${resetUrl}\n\nEste enlace es válido por ${expiresInMinutes} minutos y solo puede utilizarse una vez.\n\nSi usted no realizó esta solicitud, puede ignorar este mensaje; su cuenta permanece segura.\n\nAtentamente,\nEquipo de Seguridad de SecureVault`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #1f293e; border-radius: 8px; background-color: #0b101b; color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #60a5fa; margin: 0; font-size: 24px;">🛡️ SecureVault</h1>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Recuperación de Acceso Seguro</p>
          </div>
          <p style="font-size: 16px; color: #f8fafc;">Hola <strong>${name}</strong>,</p>
          <p style="color: #94a3b8; line-height: 1.6;">
            Hemos recibido una solicitud para restablecer la contraseña de acceso a su cuenta en <strong>SecureVault</strong>.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #3b82f6; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 15px;">Restablecer Contraseña</a>
          </div>
          <div style="background-color: #141b2a; border: 1px solid #222e47; border-radius: 6px; padding: 12px 16px; margin: 20px 0;">
            <p style="font-size: 13px; color: #cbd5e1; margin: 0;">
              🔒 <strong>Seguridad:</strong> Este enlace expirará en <strong>${expiresInMinutes} minutos</strong> y es de un solo uso.
            </p>
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 25px; border-top: 1px solid #1c263c; padding-top: 15px; text-align: center;">
            Si usted no solicitó este cambio, ignore este correo. Su cuenta y datos cifrados permanecen seguros.
          </p>
        </div>
      `,
    };

    this.lastSentMail = mailOptions;

    if (transporter.mocked) {
      console.log('\n================================================================');
      console.log(' [DEV MODE] ENLACE TEMPORAL DE RESTABLECIMIENTO GENERADO:');
      console.log(` Para: ${toEmail}`);
      console.log(` URL: ${resetUrl}`);
      console.log(' (Copia y pega este enlace en tu navegador para cambiar la clave)');
      console.log('================================================================\n');
    }

    return transporter.sendMail(mailOptions);
  },

  /**
   * Envía un correo de bienvenida al registrarse una nueva cuenta.
   */
  async sendWelcomeEmail({ toEmail, name }) {
    try {
      const transporter = getTransporter();
      const fromAddress = process.env.GMAIL_USER || 'no-reply@securevault.io';

      const mailOptions = {
        from: `"SecureVault Security" <${fromAddress}>`,
        to: toEmail,
        subject: '¡Bienvenido a SecureVault! Tu bóveda de seguridad está lista',
        text: `Hola ${name},\n\n¡Bienvenido a SecureVault!\n\nTu cuenta ha sido creada exitosamente. Todas tus notas privadas y datos confidenciales estarán protegidos mediante cifrado de grado militar AES-256-GCM y hashing seguro Argon2id.\n\nPuedes acceder en cualquier momento desde tu panel web.\n\nAtentamente,\nEquipo de Seguridad de SecureVault`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #1f293e; border-radius: 8px; background-color: #0b101b; color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #60a5fa; margin: 0; font-size: 24px;">🛡️ SecureVault</h1>
              <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Zero-Trust Encrypted Storage</p>
            </div>
            <p style="font-size: 16px; color: #f8fafc;">Hola <strong>${name}</strong>,</p>
            <p style="color: #94a3b8; line-height: 1.6;">
              ¡Bienvenido a <strong>SecureVault</strong>! Tu cuenta ha sido activada y tu bóveda criptográfica personal está lista.
            </p>
            <div style="background-color: #141b2a; border: 1px solid #222e47; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px; color: #34d399;">Garantías de Seguridad Activas:</h4>
              <ul style="color: #cbd5e1; font-size: 14px; padding-left: 20px; margin: 0; line-height: 1.6;">
                <li>Cifrado en reposo <strong>AES-256-GCM</strong> con vectores de inicialización (IV) únicos.</li>
                <li>Contraseñas protegidas mediante <strong>Argon2id</strong> (RFC 9106).</li>
                <li>Bóveda de secretos personales protegida por confirmación de contraseña.</li>
                <li>Bitácora forense de auditoría en tiempo real.</li>
              </ul>
            </div>
            <p style="color: #94a3b8; font-size: 13px; text-align: center; margin-top: 25px;">
              Gracias por confiar en SecureVault para la protección de tu información privada.
            </p>
          </div>
        `,
      };

      if (transporter.mocked) {
        console.log(`[DEV MODE] Correo de bienvenida simulado generado para: ${toEmail}`);
      }

      return await transporter.sendMail(mailOptions);
    } catch (err) {
      console.error('Aviso: No se pudo enviar el correo de bienvenida:', err.message);
      return null;
    }
  },
};
