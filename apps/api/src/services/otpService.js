/**
 * OTP lifecycle: random digits → PBKDF2 hash + salt in DB → constant-time verify.
 * @see NODEJS_API_GENERATION_PROMPT.md — KEY BUSINESS LOGIC (OTP Security)
 */
const OTPVerification = require('../models/OTPVerification');
const { generateSalt, hashOtp, verifyOtpHash, randomOtpDigits } = require('../utils/cryptoUtils');

const OTP_EXPIRY_MS = () => (Number(process.env.OTP_EXPIRY_MINUTES) || 10) * 60 * 1000;

/** Max verification attempts per OTP record before it is treated as exhausted. */
const MAX_OTP_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS) || 5;

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

  const otp = randomOtpDigits();
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

  return { otp, expiresIn: Math.floor(OTP_EXPIRY_MS() / 1000) };
}

/**
 * Verify OTP with constant-time hash compare; increment attempts on failure; mark verified on success.
 */
async function verifyOtpRecord(mobileNumber, otp) {
  const record = await OTPVerification.findOne({ mobileNumber, verified: false }).sort({ createdAt: -1 });

  if (!record || record.expiresAt < new Date()) {
    return { ok: false, reason: 'expired_or_missing' };
  }

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    return { ok: false, reason: 'too_many_attempts' };
  }

  record.attempts += 1;

  const match = await verifyOtpHash(otp, record.otpSalt, record.otpHash);
  if (!match) {
    await record.save();
    return { ok: false, reason: 'invalid' };
  }

  record.verified = true;
  await record.save();
  return { ok: true, record };
}

module.exports = {
  createOtpForMobile,
  verifyOtpRecord,
  invalidatePendingOtps,
  OTP_EXPIRY_MS,
  MAX_OTP_ATTEMPTS,
};
