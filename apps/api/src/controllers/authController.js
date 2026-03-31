/**
 * Authentication — NODEJS_API_GENERATION_PROMPT.md § A
 * POST /api/auth/send-otp | verify-otp | logout | refresh
 * GET  /api/auth/me
 */
const authService = require('../services/authService');
const { initFirebaseAdmin } = require('../config/firebase');
const { AppError } = require('../middleware/errorHandler');

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

/** GET /api/auth/me — Bearer Firebase ID token + Mongo user */
async function getMe(req, res) {
  res.json({ user: req.dbUser });
}

/**
 * POST /api/auth/logout — Bearer Firebase ID token.
 * Revokes Firebase refresh tokens for this user so new ID tokens cannot be minted.
 * The current ID token remains valid until it expires (typically ≤1h); clients should discard it locally.
 */
async function logout(req, res, next) {
  try {
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
  getMe,
  logout,
  refreshToken,
};
