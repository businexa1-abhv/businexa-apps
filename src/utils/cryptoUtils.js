/**
 * OTP hashing (PBKDF2) and constant-time verification.
 * @see NODEJS_API_GENERATION_PROMPT.md — OTP Security
 */
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

/** @param {number} [length=32] Salt length in bytes (hex string length = 2×bytes) */
function generateSalt(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Derive OTP hash (PBKDF2). Salt is the same hex string stored in DB (must not change algorithmically).
 * @param {string} otp Plain OTP digits
 * @param {string} salt Hex string from generateSalt()
 * @returns {Promise<string>} Hex-encoded derived key
 */
function hashOtp(otp, salt) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(String(otp), salt, PBKDF2_ITERATIONS, KEY_LENGTH, DIGEST, (err, derived) => {
      if (err) reject(err);
      else resolve(derived.toString('hex'));
    });
  });
}

/**
 * Verify OTP against stored hash using constant-time comparison of equal-length buffers.
 * @param {string} otp User-supplied OTP
 * @param {string} salt Same salt used for hashOtp
 * @param {string} storedHash Hex string previously stored as otpHash
 */
async function verifyOtpHash(otp, salt, storedHash) {
  const computed = await hashOtp(otp, salt);
  const a = Buffer.from(computed, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Cryptographically secure numeric OTP (length from OTP_LENGTH env or default 6). */
function randomOtpDigits(length = 6) {
  const n = Number(process.env.OTP_LENGTH) || length;
  let out = '';
  for (let i = 0; i < n; i += 1) {
    out += crypto.randomInt(0, 10).toString();
  }
  return out;
}

module.exports = {
  PBKDF2_ITERATIONS,
  KEY_LENGTH,
  DIGEST,
  generateSalt,
  hashOtp,
  verifyOtpHash,
  randomOtpDigits,
  bcrypt,
};
