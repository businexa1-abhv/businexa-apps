/**
 * Transactional email via SMTP (nodemailer).
 * @see NODEJS_API_GENERATION_PROMPT.md — Email notifications
 */
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  return transporter;
}

async function sendMail({ to, subject, text, html, replyTo }) {
  const t = getTransporter();
  if (!t) {
    logger.warn('emailService: SMTP not configured, skipping send');
    return { skipped: true };
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await t.sendMail({
    from,
    to,
    subject,
    text,
    html,
    ...(replyTo && { replyTo }),
  });
  return { sent: true };
}

async function sendWelcomeEmail(to, { name = 'there' } = {}) {
  return sendMail({
    to,
    subject: 'Welcome to Businexa',
    text: `Hi ${name},\n\nWelcome to Businexa — your QR advertisement platform.\n`,
    html: `<p>Hi ${name},</p><p>Welcome to <strong>Businexa</strong>.</p>`,
  });
}

async function sendSubscriptionConfirmation(to, { planName, expiresAt, shopName }) {
  const exp = expiresAt instanceof Date ? expiresAt.toISOString() : String(expiresAt);
  return sendMail({
    to,
    subject: `Subscription confirmed — ${planName}`,
    text: `Your ${planName} subscription for ${shopName} is active until ${exp}.`,
    html: `<p>Your <strong>${planName}</strong> subscription for <strong>${shopName}</strong> is active until ${exp}.</p>`,
  });
}

async function sendOtpEmail(to, otp, expiresMinutes = 10) {
  return sendMail({
    to,
    subject: 'Your Businexa verification code',
    text: `Your OTP is ${otp}. It expires in ${expiresMinutes} minutes. Do not share this code.`,
    html: `<p>Your OTP is <strong>${otp}</strong>.</p><p>Expires in ${expiresMinutes} minutes.</p>`,
  });
}

module.exports = {
  sendMail,
  sendWelcomeEmail,
  sendSubscriptionConfirmation,
  sendOtpEmail,
  getTransporter,
};
