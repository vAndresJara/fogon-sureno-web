const nodemailer = require('nodemailer');

// Verificar si las variables SMTP requeridas están configuradas
const isMailConfigured = !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
);

let transporter = null;

if (isMailConfigured) {
    console.log('✓ [EmailService] SMTP configurado. Los correos se enviarán de forma real.');
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '465', 10),
        secure: parseInt(process.env.SMTP_PORT || '465', 10) === 465, // true para puerto 465 (SSL)
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
} else {
    console.log('⚠ [EmailService] SMTP no configurado. Los correos se imprimirán en la consola del servidor (Modo Desarrollo).');
}

/**
 * Envia un correo electrónico genérico.
 * Si no está configurado el SMTP, lo imprime en consola.
 * 
 * @param {Object} options
 * @param {string} options.to - Destinatario
 * @param {string} options.subject - Asunto del correo
 * @param {string} [options.text] - Cuerpo en texto plano
 * @param {string} [options.html] - Cuerpo en HTML
 */
const sendEmail = async ({ to, subject, text, html }) => {
    const from = process.env.EMAIL_FROM || '"El Fogón Sureño" <no-reply@fogonsureno.com>';

    if (isMailConfigured && transporter) {
        try {
            const info = await transporter.sendMail({
                from,
                to,
                subject,
                text,
                html,
            });
            console.log(`[EmailService] Correo enviado a ${to}. MessageId: ${info.messageId}`);
            return info;
        } catch (error) {
            console.error(`[EmailService] Error enviando correo a ${to}:`, error);
            throw error;
        }
    } else {
        // Fallback en consola para desarrollo
        console.log('\n==================== ENVÍO DE CORREO (SIMULADO) ====================');
        console.log(`De:      ${from}`);
        console.log(`Para:    ${to}`);
        console.log(`Asunto:  ${subject}`);
        if (text) console.log(`Texto:   ${text}`);
        if (html) console.log(`HTML:\n${html}`);
        console.log('====================================================================\n');
        
        return {
            message: 'Email outputted to console (development mode)',
            messageId: 'dev-mode-' + Date.now(),
        };
    }
};

/**
 * Envía un correo con el enlace para restablecer la contraseña.
 * 
 * @param {string} email - Correo del usuario destinatario
 * @param {string} resetUrl - URL de restablecimiento
 */
const sendResetPasswordEmail = async (email, resetUrl) => {
    const subject = 'Restablecer contraseña - El Fogón Sureño';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #d35400; text-align: center;">El Fogón Sureño</h2>
            <p>Hola,</p>
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta asociada a este correo electrónico.</p>
            <p>Para restablecer tu contraseña, haz clic en el siguiente enlace. Este enlace es válido por 1 hora:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #d35400; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Restablecer Contraseña</a>
            </div>
            <p style="color: #666; font-size: 12px;">Si el botón no funciona, puedes copiar y pegar el siguiente enlace en tu navegador:</p>
            <p style="color: #d35400; font-size: 12px; word-break: break-all;">${resetUrl}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">Si tú no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
        </div>
    `;
    return sendEmail({ to: email, subject, html });
};

module.exports = {
    sendEmail,
    sendResetPasswordEmail,
};
