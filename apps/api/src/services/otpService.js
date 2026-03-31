/**
 * OTP lifecycle: random digits → PBKDF2 hash + salt in DB → constant-time verify.
 * @see NODEJS_API_GENERATION_PROMPT.md — KEY BUSINESS LOGIC (OTP Security)
 *
 * Test mode (local QA): TEST_OTP_ENABLED=true + TEST_OTP_MOBILES + TEST_OTP_CODE uses a fixed OTP
 * for listed numbers (no SMS). Not for production unless ALLOW_TEST_OTP_IN_PROD=true.
 */
const OTPVerification = require('../models/OTPVerification');
const { normalizeIndianMobile } = require('../utils/adminPhones');
const { generateSalt, hashOtp, verifyOtpHash, randomOtpDigits } = require('../utils/cryptoUtils');

const OTP_EXPIRY_MS = () => (Number(process.env.OTP_EXPIRY_MINUTES) || 10) * 60 * 1000;

/** Max verification attempts per OTP record before it is treated as exhausted. */
const MAX_OTP_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS) || 5;

function otpLength() {
  return Math.min(9, Math.max(4, Number(process.env.OTP_LENGTH) || 6));
}

function loadTestOtpMobileSet() {
  const raw = process.env.TEST_OTP_MOBILES || '';
  const set = new Set();
  raw.split(/[,;\s]+/).forEach((part) => {
    const m = normalizeIndianMobile(part);
    if (m) set.add(m);
  });
  return set;
}

function isTestOtpFeatureEnabled() {
  if (String(process.env.TEST_OTP_ENABLED || '').toLowerCase() !== 'true') return false;
  if (process.env.NODE_ENV === 'production' && String(process.env.ALLOW_TEST_OTP_IN_PROD || '').toLowerCase() !== 'true') {
    return false;
  }
  return true;
}

function shouldUseFixedTestOtp(mobileNumber) {
  if (!isTestOtpFeatureEnabled()) return false;
  const m = normalizeIndianMobile(mobileNumber);
  if (!m) return false;
  return loadTestOtpMobileSet().has(m);
}

/**
 * Remove pending (unverified) OTP rows for this mobile so only the latest applies.
 */
async function invalidatePendingOtps(mobileNumber) {
  await OTPVerification.deleteMany({ mobileNumber, verified: false });
}

/**
 * Generate OTP, hash with PBKDF2 + salt, persist. Returns plaintext OTP once (for SMS/dev only).
 */
async function createOtpForMobile(mobileNumber) {
  await invalidatePendingOtps(mobileNumber);

  const len = otpLength();
  let otp;
  let testMode = false;

  if (shouldUseFixedTestOtp(mobileNumber)) {
    const code = String(process.env.TEST_OTP_CODE || '123456').replace(/\D/g, '');
    otp = code.slice(0, len).padEnd(len, '0').slice(0, len);
    testMode = true;
  } else {
    otp = randomOtpDigits(len);
  }

  const salt = generateSalt();
  const otpHash = await hashOtp(otp, salt);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS());

  await OTPVerification.create({
    mobileNumber,
    otpHash,
    otpSalt: salt,
    expiresAt,
    verified: false,
    attempts: 0,
  });

  return {
    otp,
    expiresIn: Math.floor(OTP_EXPIRY_MS() / 1000),
    testMode,
  };
}

/**
 * Verify OTP with constant-time hash compare; increment attempts on failure; mark verified on success.
 */
async function verifyOtpRecord(mobileNumber, otp) {
  const now = new Date();
  const pending = await OTPVerification.findOne({ mobileNumber, verified: false }).sort({ createdAt: -1 });

  if (!pending) {
    const latest = await OTPVerification.findOne({ mobileNumber }).sort({ createdAt: -1 });
    if (latest?.verified) {
      return { ok: false, reason: 'already_used' };
    }
    return { ok: false, reason: 'not_sent' };
  }

  if (pending.expiresAt < now) {
    return { ok: false, reason: 'expired' };
  }

  if (pending.attempts >= MAX_OTP_ATTEMPTS) {
    return { ok: false, reason: 'too_many_attempts' };
  }

  pending.attempts += 1;

  const match = await verifyOtpHash(otp, pending.otpSalt, pending.otpHash);
  if (!match) {
    await pending.save();
    return { ok: false, reason: 'invalid' };
  }

  pending.verified = true;
  await pending.save();
  return { ok: true, record: pending };
}

module.exports = {
  createOtpForMobile,
  verifyOtpRecord,
  invalidatePendingOtps,
  OTP_EXPIRY_MS,
  MAX_OTP_ATTEMPTS,
  shouldUseFixedTestOtp,
};
