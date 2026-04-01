/**
 * Password rules aligned with common app standards (length + complexity).
 * Used by API (Joi/custom), web, and mobile for consistent UX.
 */

const PASSWORD_MIN_LENGTH = 9;

/** Uppercase, lowercase, digit, special (non-alphanumeric), min length */
const STRONG_PASSWORD =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{9,128}$/;

function validatePasswordStrength(password) {
  const p = String(password ?? '');
  if (p.length < PASSWORD_MIN_LENGTH) {
    return {
      ok: false,
      code: 'MIN_LENGTH',
      message: `Password must be more than 8 characters (at least ${PASSWORD_MIN_LENGTH}).`,
    };
  }
  if (p.length > 128) {
    return { ok: false, code: 'MAX_LENGTH', message: 'Password is too long.' };
  }
  if (!/[a-z]/.test(p)) {
    return {
      ok: false,
      code: 'LOWERCASE',
      message: 'Password must include at least one lowercase letter.',
    };
  }
  if (!/[A-Z]/.test(p)) {
    return {
      ok: false,
      code: 'UPPERCASE',
      message: 'Password must include at least one uppercase letter.',
    };
  }
  if (!/\d/.test(p)) {
    return { ok: false, code: 'DIGIT', message: 'Password must include at least one number.' };
  }
  if (!/[^A-Za-z0-9]/.test(p)) {
    return {
      ok: false,
      code: 'SPECIAL',
      message: 'Password must include at least one special character.',
    };
  }
  return { ok: true };
}

function passwordRequirementsShort() {
  return 'At least 9 characters, with upper & lower case, a number, and a special character.';
}

/** RFC-style practical check (matches Joi .email() closely for login id) */
function isValidLoginEmail(s) {
  const v = String(s ?? '').trim().toLowerCase();
  if (v.length < 5 || v.length > 320) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

module.exports = {
  PASSWORD_MIN_LENGTH,
  STRONG_PASSWORD,
  validatePasswordStrength,
  passwordRequirementsShort,
  isValidLoginEmail,
};
