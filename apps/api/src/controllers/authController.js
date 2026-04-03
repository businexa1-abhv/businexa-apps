/**
 * Authentication — NODEJS_API_GENERATION_PROMPT.md § A
 * POST /api/auth/send-otp | verify-otp | logout | refresh
 * GET  /api/auth/me
 */
const authService = require('../services/authService');
const jwtAuthService = require('../services/jwtAuthService');
const firestoreUserService = require('../services/firestoreUserService');
const { initFirebaseAdmin } = require('../config/firebase');
const { AppError } = require('../middleware/errorHandler');

/** GET /api/auth/firebase-custom-token — JWT session → Firebase custom token (sellers; client Firestore/Storage). */
async function firebaseCustomToken(req, res, next) {
  try {
    const u = req.dbUser;
    if (!u.firebaseUid) {
      return res.status(403).json({
        success: false,
        message: 'No Firebase account linked. Contact support.',
      });
    }
    initFirebaseAdmin();
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      return res.status(503).json({
        success: false,
        message: 'Firebase Admin is not configured on the server.',
      });
    }
    const firebaseCustomToken = await admin.auth().createCustomToken(u.firebaseUid);
    res.json({ success: true, firebaseCustomToken });
  } catch (e) {
    next(e);
  }
}

/** POST /api/auth/send-otp */
async function sendOtp(req, res, next) {
  try {
    const { mobileNumber, checkUserExists } = req.body;
    const out = await authService.sendOtp(mobileNumber, checkUserExists);
    if (!out.success) {
      return res.status(400).json(out);
    }
    res.json(out);
  } catch (e) {
    next(e);
  }
}

/** POST /api/auth/verify-otp */
async function verifyOtp(req, res, next) {
  try {
    const { mobileNumber, otp, role } = req.body;
    const out = await authService.verifyOtpAndIssue(mobileNumber, otp, role);
    if (!out.success) {
      return res.status(400).json(out);
    }
    res.json(out);
  } catch (e) {
    next(e);
  }
}

/** POST /api/auth/register — username + password (JWT). */
async function registerPassword(req, res, next) {
  try {
    const { username, password, role, profile, shop } = req.body;
    const out = await jwtAuthService.registerWithPassword(username, password, role, { profile, shop });
    if (!out.success) {
      return res.status(400).json(out);
    }
    res.json(out);
  } catch (e) {
    next(e);
  }
}

/** POST /api/auth/login — username + password (JWT). */
async function loginPassword(req, res, next) {
  try {
    const { username, password } = req.body;
    const out = await jwtAuthService.loginWithPassword(username, password);
    if (!out.success) {
      return res.status(401).json(out);
    }
    res.json(out);
  } catch (e) {
    next(e);
  }
}

/** POST /api/auth/forgot-password — sends reset link to account email (JWT users: login email). */
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const out = await jwtAuthService.requestPasswordReset(email);
    res.json(out);
  } catch (e) {
    next(e);
  }
}

/** POST /api/auth/reset-password — complete reset with token from email (or dev link). */
async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    const out = await jwtAuthService.completePasswordReset(token, password);
    if (!out.success) {
      return res.status(400).json(out);
    }
    res.json(out);
  } catch (e) {
    next(e);
  }
}

/** GET /api/auth/me — Bearer API JWT or Firebase ID token + Mongo user */
async function getMe(req, res, next) {
  try {
    const u = req.dbUser.toJSON ? req.dbUser.toJSON() : req.dbUser;
    let businessType;
    if (u.role === 'seller' && u.firebaseUid) {
      businessType = await firestoreUserService.getBusinessType(u.firebaseUid);
    }
    res.json({
      user: {
        ...u,
        ...(businessType ? { businessType } : {}),
      },
    });
  } catch (e) {
    next(e);
  }
}

/**
 * POST /api/auth/logout — Bearer Firebase ID token.
 * Revokes Firebase refresh tokens for this user so new ID tokens cannot be minted.
 * The current ID token remains valid until it expires (typically ≤1h); clients should discard it locally.
 */
async function logout(req, res, next) {
  try {
    if (req.user?.authType === 'jwt') {
      return res.json({
        success: true,
        message: 'Signed out. Clear the JWT on the client.',
      });
    }
    initFirebaseAdmin();
    const admin = require('firebase-admin');
    const uid = req.user?.uid;
    if (admin.apps.length && uid) {
      await admin.auth().revokeRefreshTokens(uid);
    }
    res.json({
      success: true,
      message:
        'Signed out. Refresh tokens revoked. Clear stored ID token on the client; it may remain valid until expiry.',
    });
  } catch (e) {
    next(e);
  }
}

/**
 * POST /api/auth/refresh
 * Body: { refreshToken }
 * Response: { firebaseToken, expiresIn } — requires refresh-token store / Firebase custom flow.
 */
async function refreshToken(req, res, next) {
  try {
    const { refreshToken: token } = req.body;
    if (!token) throw new AppError('refreshToken required', 400);
    res.status(501).json({ message: 'Refresh flow not implemented yet' });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  sendOtp,
  verifyOtp,
  registerPassword,
  loginPassword,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
  refreshToken,
  firebaseCustomToken,
};
