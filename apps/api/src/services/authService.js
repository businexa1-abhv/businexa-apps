/**
 * OTP send/verify and Firebase custom token issuance.
 * Signup: send-otp with checkUserExists: false → verify-otp with role buyer|seller (admin is never accepted from client).
 * Login: send-otp with checkUserExists: true → verify-otp (role ignored; MongoDB role wins).
 * Admin: set ADMIN_MOBILE_NUMBERS in env for automatic admin on first signup only, or set role in DB.
 * @see NODEJS_API_GENERATION_PROMPT.md — Authentication Flow, KEY BUSINESS LOGIC (OTP)
 */
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { ROLES, OTP_SIGNUP_ROLES } = require('../constants/roles');
const { isListedAdminPhone } = require('../utils/adminPhones');
const { initFirebaseAdmin } = require('../config/firebase');
const { createOtpForMobile, verifyOtpRecord } = require('./otpService');
const { sendOtpSms } = require('./msg91Service');

async function sendOtp(mobileNumber, checkUserExists) {
  const exists = await User.exists({ mobileNumber });

  if (checkUserExists === true && !exists) {
    return {
      success: false,
      message: 'No account found for this number. Please sign up first.',
      expiresIn: 0,
    };
  }
  if (checkUserExists === false && exists) {
    return {
      success: false,
      message: 'An account already exists for this number. Please log in.',
      expiresIn: 0,
    };
  }

  const { otp, expiresIn, testMode } = await createOtpForMobile(mobileNumber);

  const sms = await sendOtpSms(mobileNumber, otp);

  if (sms.skipped) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      if (testMode) {
        console.log(
          `[test-otp] Fixed OTP for ${mobileNumber}: ${otp} (TEST_OTP_ENABLED — use on verify screen; then Firebase custom token. Roles: seller=signup default; buyer=verify role; admin=${process.env.ADMIN_MOBILE_NUMBERS ? 'ADMIN_MOBILE_NUMBERS' : 'set ADMIN_MOBILE_NUMBERS'})`
        );
      } else {
        console.log(
          `[dev] OTP for ${mobileNumber}: ${otp} (use this code; after verify, Firebase issues the session token. MSG91: MSG91_ENABLED=true when ready)`
        );
      }
    }
  } else if (!sms.sent) {
    return {
      success: false,
      message: sms.error || 'Could not send OTP. Please try again later.',
      expiresIn: 0,
    };
  }

  return {
    success: true,
    message: 'OTP sent',
    expiresIn,
    flow:
      checkUserExists === true ? 'login' : checkUserExists === false ? 'signup' : undefined,
  };
}

function resolveSignupRole(requestedRole) {
  const r = requestedRole && OTP_SIGNUP_ROLES.includes(requestedRole) ? requestedRole : ROLES.BUYER;
  return r;
}

async function verifyOtpAndIssue(mobileNumber, otp, role = ROLES.BUYER) {
  const result = await verifyOtpRecord(mobileNumber, otp);

  if (!result.ok) {
    const msg =
      result.reason === 'expired_or_missing'
        ? 'OTP expired or not found'
        : result.reason === 'too_many_attempts'
          ? 'Too many invalid attempts. Request a new OTP.'
          : 'Invalid OTP';
    return { success: false, message: msg };
  }

  initFirebaseAdmin();
  const admin = require('firebase-admin');

  let user = await User.findOne({ mobileNumber });
  const isNewUser = !user;

  if (!user) {
    if (!admin.apps.length) {
      return { success: false, message: 'Firebase not configured' };
    }
    const phoneE164 = `+91${mobileNumber}`;
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().createUser({ phoneNumber: phoneE164 });
    } catch (err) {
      if (err.code === 'auth/phone-number-already-exists') {
        firebaseUser = await admin.auth().getUserByPhoneNumber(phoneE164);
      } else {
        throw err;
      }
    }
    let newRole = resolveSignupRole(role);
    if (isListedAdminPhone(mobileNumber)) {
      newRole = ROLES.ADMIN;
    }
    user = await User.create({
      firebaseUid: firebaseUser.uid,
      mobileNumber,
      role: newRole,
      isVerified: true,
    });
  } else {
    user.isVerified = true;
    await user.save();
  }

  let customToken = null;
  if (admin.apps.length) {
    customToken = await admin.auth().createCustomToken(user.firebaseUid, { role: user.role });
  }

  await AuditLog.create({
    userId: user._id,
    action: 'create',
    resourceType: 'user',
    resourceId: user._id,
    details: { event: isNewUser ? 'signup' : 'login', mobileNumber },
    ipAddress: '',
  }).catch(() => {});

  return {
    success: true,
    firebaseToken: customToken,
    user: {
      userId: user._id,
      mobileNumber: user.mobileNumber,
      role: user.role,
      isNewUser,
    },
    sessionToken: customToken,
    flow: isNewUser ? 'signup' : 'login',
  };
}

module.exports = { sendOtp, verifyOtpAndIssue };
