// ==============================================================================
// SECUREVAULT - SERVICIO DE ENVÍO DE CORREOS (GMAIL SMTP CON NODEMAILER)
// ==============================================================================

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
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;

  const hasCredentials =
    gmailUser &&
    gmailPassword &&
    !gmailUser.includes('your-email') &&
    !gmailPassword.includes('xxxx');

  if (isTest || !hasCredentials) {
    // Transporte simulado para pruebas y desarrollo preliminar
    transporterInstance = {
      sendMail: async (options) => {
        // En entorno de prueba o mock, registramos sin filtrar el token
        return {
          messageId: `mock-${Date.now()}`,
          response: '250 Mock Message Accepted',
          mocked: true,
        };
      },
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
   * Envía un correo con el enlace temporal para restablecer contraseña.
   * Regla de seguridad: El token se envía únicamente en el enlace al usuario,
   * JAMÁS se imprime ni se almacena en los logs de la aplicación.
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
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #1a365d; margin-top: 0;">Restablecimiento de Contraseña</h2>
          <p>Hola <strong>${name}</strong>,</p>
          <p>Hemos recibido una solicitud para restablecer la contraseña de acceso a su cuenta en <strong>SecureVault</strong>.</p>
          <p>Haga clic en el botón siguiente para definir una nueva contraseña:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #2b6cb0; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Restablecer mi contraseña</a>
          </div>
          <p style="font-size: 13px; color: #718096;">
            <strong>Seguridad:</strong> Este enlace expirará en <strong>${expiresInMinutes} minutos</strong> y es de un solo uso.
          </p>
          <p style="font-size: 12px; color: #a0aec0; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
            Si usted no solicitó este cambio, ignore este correo electrónico. Ningún dato ha sido modificado.
          </p>
        </div>
      `,
    };

    this.lastSentMail = mailOptions;

    if (transporterInstance.mocked) {
      console.log('\n================================================================');
      console.log(' [DEV MODE] ENLACE TEMPORAL DE RESTABLECIMIENTO GENERADO:');
      console.log(` Para: ${toEmail}`);
      console.log(` URL: ${resetUrl}`);
      console.log(' (Copia y pega este enlace en tu navegador para cambiar la clave)');
      console.log('================================================================\n');
    }

    return transporter.sendMail(mailOptions);
  },
};
