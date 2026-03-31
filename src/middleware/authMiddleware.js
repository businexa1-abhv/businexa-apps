/**
 * Firebase ID token verification (JWT).
 * Uses firebase-admin `verifyIdToken`, which validates signature & expiry against Google’s JWKS
 * (equivalent to “Firebase public keys” in the security spec).
 *
 * @see NODEJS_API_GENERATION_PROMPT.md — Authentication & Security
 */
const { initFirebaseAdmin } = require('../config/firebase');
const User = require('../models/User');
const { AppError } = require('./errorHandler');

function mapFirebaseAuthError(err) {
  const code = err.code || err.errorInfo?.code;
  if (code === 'auth/id-token-expired') {
    return new AppError('Token expired', 401, 'TOKEN_EXPIRED');
  }
  if (code === 'auth/id-token-revoked') {
    return new AppError('Token revoked', 401, 'TOKEN_REVOKED');
  }
  if (code === 'auth/argument-error' || code === 'auth/invalid-id-token') {
    return new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }
  return new AppError('Invalid or expired token', 401, 'AUTH_ERROR');
}

/**
 * Requires `Authorization: Bearer <Firebase ID token>`.
 * Sets `req.user` (decoded claims) and `req.dbUser` when a User document exists.
 */
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError('Unauthorized', 401, 'NO_BEARER');
    }

    const idToken = header.slice(7).trim();
    if (!idToken) {
      throw new AppError('Unauthorized', 401, 'EMPTY_TOKEN');
    }

    initFirebaseAdmin();
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      throw new AppError('Authentication service not configured', 503, 'AUTH_NOT_CONFIGURED');
    }

    const checkRevoked = process.env.FIREBASE_CHECK_REVOKED === 'true';
    const decoded = await admin.auth().verifyIdToken(idToken, checkRevoked);
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      phone_number: decoded.phone_number,
      ...decoded,
    };

    const dbUser = await User.findOne({ firebaseUid: decoded.uid });
    if (dbUser) req.dbUser = dbUser;

    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    if (err.statusCode) return next(err);
    return next(mapFirebaseAuthError(err));
  }
}

/** After `requireAuth`, ensures a MongoDB user profile exists. */
function requireDbUser(req, res, next) {
  if (!req.dbUser) {
    return next(new AppError('User profile not found', 404, 'PROFILE_NOT_FOUND'));
  }
  next();
}

/** Runs `requireAuth` only when Authorization header is present; otherwise continues. */
async function optionalAuth(req, res, next) {
  if (!req.headers.authorization?.startsWith('Bearer ')) return next();
  return requireAuth(req, res, next);
}

/** RBAC: require `req.dbUser.role` to be one of the allowed roles. */
function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.dbUser?.role || req.user?.role;
    if (!role || !roles.includes(role)) {
      return next(new AppError('Forbidden', 403, 'FORBIDDEN_ROLE'));
    }
    next();
  };
}

module.exports = { requireAuth, requireDbUser, optionalAuth, requireRole };
