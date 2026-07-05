const nodemailer = require('nodemailer');
const logger = require('./logger');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    logger.info(`[EMAIL] Initialized SMTP Transporter for ${host}:${port}`);
  } else {
    logger.warn('[EMAIL] SMTP credentials not set (SMTP_HOST, SMTP_USER, SMTP_PASS). Operating in logger/demo mode.');
  }

  return transporter;
}

/**
 * Sends a 6-digit verification code to the recipient email.
 */
async function sendVerificationEmail(toEmail, otpCode) {
  const fromAddress = process.env.SMTP_FROM || '"IncogniCare Support" <no-reply@incognicare-app.web.app>';
  const activeTransporter = getTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #010101; color: #ffffff; margin: 0; padding: 40px 20px; }
          .card { max-width: 500px; margin: 0 auto; background-color: #0d0d0d; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 40px; text-align: center; }
          .logo { font-size: 20px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: #7dd3fc; margin-bottom: 24px; display: block; }
          .title { font-size: 22px; font-weight: 800; margin-bottom: 12px; color: #ffffff; }
          .subtitle { font-size: 14px; color: rgba(255,255,255,0.6); line-height: 1.6; margin-bottom: 32px; }
          .code-box { background: rgba(125, 211, 252, 0.05); border: 1px solid rgba(125, 211, 252, 0.2); border-radius: 16px; padding: 24px; font-family: monospace; font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #7dd3fc; margin-bottom: 32px; }
          .footer { font-size: 11px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 1.5px; line-height: 1.5; border-t: 1px solid rgba(255,255,255,0.05); padding-top: 24px; }
        </style>
      </head>
      <body>
        <div class="card">
          <span class="logo">🛡️ IncogniCare</span>
          <div class="title">Security Verification Code</div>
          <div class="subtitle">Enter the 6-digit passcode below to verify your enclave account access. Valid for 5 minutes.</div>
          <div class="code-box">${otpCode}</div>
          <div class="footer">If you did not request this verification code, please ignore this email.<br>Zero-Knowledge Anonymous Health Network</div>
        </div>
      </body>
    </html>
  `;

  if (activeTransporter) {
    try {
      const info = await activeTransporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject: `${otpCode} is your IncogniCare Verification Code`,
        html: htmlContent,
      });
      logger.info(`[EMAIL] Verification code successfully sent to ${toEmail} (MessageId: ${info.messageId})`);
      return { sent: true, messageId: info.messageId };
    } catch (err) {
      logger.error(`[EMAIL] Failed to send email to ${toEmail}:`, { error: err.message });
      return { sent: false, error: err.message, isDemo: true, code: otpCode };
    }
  }

  logger.info(`[EMAIL DEMO MODE] Code for ${toEmail}: ${otpCode}`);
  return { sent: false, isDemo: true, code: otpCode };
}

module.exports = {
  sendVerificationEmail,
};
