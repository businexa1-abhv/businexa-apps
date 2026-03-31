/**
 * MSG91 Send OTP API — transactional SMS (India).
 * @see https://docs.msg91.com/otp (Send OTP / sendotp.php)
 *
 * Env:
 *   MSG91_ENABLED       — must be "true" to send SMS (default: off; use Firebase custom-token flow + dev console OTP first)
 *   MSG91_AUTHKEY       — required when MSG91_ENABLED=true
 *   MSG91_SENDER_ID     — 6-character approved sender (default OTPSMS)
 *   MSG91_MESSAGE       — optional; must match your DLT-approved template; use ##OTP## placeholder
 *   MSG91_OTP_EXPIRY_MINUTES — optional (default same as OTP_EXPIRY_MINUTES or 10)
 *
 * Mobile format: 91 + 10-digit Indian number (no +).
 */
const axios = require('axios');
const logger = require('../config/logger');

const SENDOTP_URL = 'https://api.msg91.com/api/sendotp.php';

function toMsg91Mobile(mobile10) {
  const d = String(mobile10).replace(/\D/g, '').slice(-10);
  if (!/^[6-9]\d{9}$/.test(d)) {
    throw new Error('Invalid Indian mobile for MSG91');
  }
  return `91${d}`;
}

function isMsg91Enabled() {
  return String(process.env.MSG91_ENABLED || '').toLowerCase() === 'true';
}

function isMsg91Configured() {
  return isMsg91Enabled() && Boolean(process.env.MSG91_AUTHKEY?.trim());
}

function parseMsg91Body(data) {
  if (data == null) return null;
  if (typeof data === 'object') return data;
  const s = String(data).trim();
  try {
    return JSON.parse(s);
  } catch {
    return { raw: s };
  }
}

/**
 * Send OTP via MSG91 using the same code already stored (hashed) in MongoDB.
 * @returns {Promise<{ skipped?: boolean, sent?: boolean, error?: string }>}
 */
async function sendOtpSms(mobileNumber10, otpPlaintext) {
  if (!isMsg91Configured()) {
    return { skipped: true };
  }

  const authkey = process.env.MSG91_AUTHKEY.trim();
  const sender = (process.env.MSG91_SENDER_ID || 'OTPSMS').trim().slice(0, 6);
  const mobile = toMsg91Mobile(mobileNumber10);
  const otpLen = String(otpPlaintext).length;
  const otpExpiry =
    Number(process.env.MSG91_OTP_EXPIRY_MINUTES) || Number(process.env.OTP_EXPIRY_MINUTES) || 10;

  const params = {
    authkey,
    mobile,
    sender,
    otp: String(otpPlaintext),
    otp_length: otpLen,
    otp_expiry: otpExpiry,
  };

  const template = process.env.MSG91_MESSAGE?.trim();
  if (template) {
    params.message = template;
  }

  try {
    const res = await axios.get(SENDOTP_URL, {
      params,
      timeout: 25000,
      validateStatus: () => true,
    });

    const body = parseMsg91Body(res.data);

    if (body && body.type === 'error') {
      const msg = body.message || 'MSG91 rejected the request';
      logger.error('MSG91 sendotp error', { message: msg, status: res.status });
      return { sent: false, error: msg };
    }

    if (body && body.type === 'success') {
      logger.info('MSG91 OTP dispatched', { mobile: mobileNumber10 });
      return { sent: true };
    }

    const raw = body?.raw != null ? String(body.raw) : JSON.stringify(body);
    const lower = raw.toLowerCase();
    if (lower.includes('success') || lower.includes('otp sent') || res.status === 200) {
      logger.info('MSG91 OTP dispatched (unparsed success)', { mobile: mobileNumber10 });
      return { sent: true };
    }

    logger.warn('MSG91 unexpected response', { status: res.status, data: res.data });
    return { sent: false, error: 'SMS gateway returned an unexpected response' };
  } catch (err) {
    const msg = err.message || 'SMS request failed';
    logger.error('MSG91 request failed', { err: msg });
    return { sent: false, error: msg };
  }
}

module.exports = {
  sendOtpSms,
  isMsg91Configured,
  isMsg91Enabled,
  toMsg91Mobile,
};
