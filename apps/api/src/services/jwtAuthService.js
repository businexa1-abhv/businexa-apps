/**
 * Username / password auth with HS256 JWT (same Bearer header as Firebase ID tokens; middleware tries JWT first).
 */
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validatePasswordStrength, isValidLoginEmail } = require('@businexa/shared');
const User = require('../models/User');
const { ROLES, OTP_SIGNUP_ROLES } = require('../constants/roles');
const { sendPasswordResetEmail } = require('./emailService');
const shopService = require('./shopService');
const firestoreUserService = require('./firestoreUserService');
const { normalizeIndianMobile } = require('../utils/adminPhones');
const logger = require('../utils/logger');

const SALT_ROUNDS = 12;

function jwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s || s === 'your-super-secret-jwt-key') {
    return null;
  }
  return s;
}

function jwtExpiry() {
  return process.env.JWT_EXPIRY || '7d';
}

function resetExpiryMs() {
  return (Number(process.env.PASSWORD_RESET_EXPIRY_MINUTES) || 60) * 60 * 1000;
}

function hashPasswordResetToken(raw) {
  return crypto.createHash('sha256').update(String(raw), 'utf8').digest('hex');
}

function signAccessToken(userId, role) {
  const secret = jwtSecret();
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign(
    { sub: String(userId), typ: 'access', role },
    secret,
    { expiresIn: jwtExpiry(), algorithm: 'HS256' }
  );
}

/**
 * @param {object} [options]
 * @param {object} [options.profile] fullName, email, mobileNumber
 * @param {object} [options.shop] required when role is seller — name, address, category, description, whatsappNumber, email
 */
async function registerWithPassword(username, password, role, options = {}) {
  if (!jwtSecret()) {
    return { success: false, message: 'JWT auth is not configured (set JWT_SECRET in .env).' };
  }
  const u = String(username || '')
    .trim()
    .toLowerCase();
  if (!isValidLoginEmail(u)) {
    return { success: false, message: 'Enter a valid email address for your account.' };
  }
  const pw = validatePasswordStrength(password);
  if (!pw.ok) {
    return { success: false, message: pw.message };
  }
  const exists = await User.exists({ username: u });
  if (exists) {
    return { success: false, message: 'An account with this email already exists' };
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const r = role && OTP_SIGNUP_ROLES.includes(role) ? role : ROLES.BUYER;
  const { profile = {}, shop: shopPayload } = options;

  const userFields = {
    username: u,
    passwordHash,
    role: r,
    isVerified: true,
    fullName: profile.fullName ? String(profile.fullName).trim() : '',
  };
  if (profile.mobileNumber) {
    const m = normalizeIndianMobile(profile.mobileNumber);
    if (m) userFields.mobileNumber = m;
  }

  if (r === ROLES.SELLER && !shopPayload) {
    return { success: false, message: 'Shop name and address are required for seller registration.' };
  }
  if (r === ROLES.SELLER && shopPayload) {
    const cat = String(shopPayload.category || '').trim();
    if (!cat) {
      return { success: false, message: 'Business category is required for seller registration.' };
    }
  }

  let firebaseUidForSeller = null;
  if (r === ROLES.SELLER) {
    const fu = await firestoreUserService.ensureFirebaseAuthUserByEmail(u);
    if (!fu) {
      return {
        success: false,
        message:
          'Seller registration requires Firebase Admin. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_* in .env.',
      };
    }
    firebaseUidForSeller = fu.uid;
    userFields.firebaseUid = fu.uid;
  }

  let user;
  try {
    user = await User.create(userFields);
  } catch (err) {
    if (firebaseUidForSeller) {
      await firestoreUserService.deleteFirebaseAuthUser(firebaseUidForSeller);
    }
    if (err && (err.code === 11000 || err.code === 11001)) {
      return { success: false, message: 'Username or mobile already registered' };
    }
    throw err;
  }

  let shopDoc = null;
  if (r === ROLES.SELLER && shopPayload) {
    try {
      shopDoc = await shopService.createShop(user._id, {
        name: shopPayload.name,
        address: shopPayload.address,
        category: shopPayload.category,
        description: shopPayload.description,
        whatsappNumber: shopPayload.whatsappNumber || '',
        email: shopPayload.email || u || '',
      });
    } catch (err) {
      await User.deleteOne({ _id: user._id });
      if (firebaseUidForSeller) {
        await firestoreUserService.deleteFirebaseAuthUser(firebaseUidForSeller);
      }
      logger.error('registerWithPassword: shop create failed', { err: err.message });
      return { success: false, message: err.message || 'Could not create shop. Try again.' };
    }
  }

  const token = signAccessToken(user._id.toString(), user.role);
  const mail = String(user.email || user.username || '').trim();
  let businessType;
  if (user.role === ROLES.SELLER && user.firebaseUid) {
    businessType = await firestoreUserService.getBusinessType(user.firebaseUid);
  }
  return {
    success: true,
    token,
    expiresIn: jwtExpiry(),
    user: {
      userId: String(user._id),
      username: user.username,
      email: mail,
      mobileNumber: user.mobileNumber || '',
      fullName: user.fullName || '',
      role: user.role,
      isNewUser: true,
      ...(user.firebaseUid ? { firebaseUid: user.firebaseUid } : {}),
      ...(businessType ? { businessType } : {}),
    },
    ...(shopDoc && { shop: shopDoc.toJSON ? shopDoc.toJSON() : shopDoc }),
  };
}

async function loginWithPassword(username, password) {
  if (!jwtSecret()) {
    return { success: false, message: 'JWT auth is not configured (set JWT_SECRET in .env).' };
  }
  const u = String(username || '')
    .trim()
    .toLowerCase();
  const user = await User.findOne({ username: u }).select('+passwordHash');
  if (!user || !user.passwordHash) {
    return { success: false, message: 'Invalid email or password' };
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return { success: false, message: 'Invalid email or password' };
  }
  if (!user.isVerified) {
    user.isVerified = true;
    await user.save();
  }
  const token = signAccessToken(user._id.toString(), user.role);
  const mail = (user.email || user.username || '').trim();
  let businessType;
  if (user.role === ROLES.SELLER && user.firebaseUid) {
    businessType = await firestoreUserService.getBusinessType(user.firebaseUid);
  }
  return {
    success: true,
    token,
    expiresIn: jwtExpiry(),
    user: {
      userId: String(user._id),
      username: user.username,
      email: mail,
      mobileNumber: user.mobileNumber || '',
      fullName: user.fullName || '',
      role: user.role,
      isNewUser: false,
      ...(user.firebaseUid ? { firebaseUid: user.firebaseUid } : {}),
      ...(businessType ? { businessType } : {}),
    },
  };
}

/**
 * Starts password reset for local (email + password) accounts.
 * Sends confirmation link to the account email (same as login id). Generic response when no match (no enumeration).
 */
async function requestPasswordReset(loginEmail) {
  const generic = {
    success: true,
    message:
      'If an account exists for this email, you will receive password reset instructions shortly.',
  };
  const e = String(loginEmail || '')
    .trim()
    .toLowerCase();
  if (!e || !isValidLoginEmail(e)) return generic;

  const user = await User.findOne({
    passwordHash: { $exists: true, $ne: null },
    $or: [{ username: e }, { email: e }],
  }).select('+passwordHash +passwordResetTokenHash');
  if (!user || !user.passwordHash) {
    return generic;
  }

  const raw = crypto.randomBytes(32).toString('hex');
  user.passwordResetTokenHash = hashPasswordResetToken(raw);
  user.passwordResetExpires = new Date(Date.now() + resetExpiryMs());
  await user.save();

  const base = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const resetUrl = `${base}/reset-password?token=${encodeURIComponent(raw)}`;

  const to = String(user.email || user.username || e).trim();
  const emailOk = to && isValidLoginEmail(to);

  if (emailOk) {
    try {
      const out = await sendPasswordResetEmail(to, resetUrl);
      if (out.skipped) {
        logger.warn('Password reset email skipped (SMTP not configured)');
        if (process.env.NODE_ENV === 'development' && process.env.PASSWORD_RESET_DEV_LINK === 'true') {
          return { success: true, message: 'SMTP not configured — development reset link.', resetUrl };
        }
      }
    } catch (err) {
      logger.error('Password reset email failed', { err: err.message });
    }
  } else if (process.env.NODE_ENV === 'development' && process.env.PASSWORD_RESET_DEV_LINK === 'true') {
    return {
      success: true,
      message: 'No valid email on file — development reset link.',
      resetUrl,
    };
  }

  return generic;
}

async function completePasswordReset(token, newPassword) {
  if (!token) {
    return { success: false, message: 'Invalid or expired reset link.' };
  }
  const pw = validatePasswordStrength(newPassword);
  if (!pw.ok) {
    return { success: false, message: pw.message };
  }
  const hash = hashPasswordResetToken(token);
  const user = await User.findOne({
    passwordResetTokenHash: hash,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordHash');

  if (!user) {
    return { success: false, message: 'Invalid or expired reset link.' };
  }

  user.passwordHash = await bcrypt.hash(String(newPassword), SALT_ROUNDS);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return { success: true, message: 'Password updated. You can sign in with your new password.' };
}

module.exports = {
  registerWithPassword,
  loginWithPassword,
  requestPasswordReset,
  completePasswordReset,
  signAccessToken,
  jwtSecret,
  jwtExpiry,
};
