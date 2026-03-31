/**
 * OTP send/verify and Firebase custom token issuance.
 * @see NODEJS_API_GENERATION_PROMPT.md — Authentication Flow, KEY BUSINESS LOGIC (OTP)
 */
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { initFirebaseAdmin } = require('../config/firebase');
const { createOtpForMobile, verifyOtpRecord } = require('./otpService');

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

  const { otp, expiresIn } = await createOtpForMobile(mobileNumber);

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log(`[dev] OTP for ${mobileNumber}: ${otp}`);
  }

  return { success: true, message: 'OTP sent', expiresIn };
}

async function verifyOtpAndIssue(mobileNumber, otp, role = 'buyer') {
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
    user = await User.create({
      firebaseUid: firebaseUser.uid,
      mobileNumber,
      role,
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
  };
}

module.exports = { sendOtp, verifyOtpAndIssue };
