/**
 * Bearer token: tries API JWT (HS256) first, then Firebase ID token.
 *
 * @see NODEJS_API_GENERATION_PROMPT.md — Authentication & Security
 */
const jwt = require('jsonwebtoken');
const { initFirebaseAdmin } = require('../config/firebase');
const User = require('../models/User');
const { AppError } = require('./errorHandler');
const { jwtSecret } = require('../services/jwtAuthService');

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
 * Requires `Authorization: Bearer <API JWT or Firebase ID token>`.
 * Sets `req.user` (includes `authType`: `jwt` | `firebase`) and `req.dbUser` when a User document exists.
 */
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError('Unauthorized', 401, 'NO_BEARER');
    }

    const token = header.slice(7).trim();
    if (!token) {
      throw new AppError('Unauthorized', 401, 'EMPTY_TOKEN');
    }

    const secret = jwtSecret();
    if (secret) {
      try {
        const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
        if (decoded.typ === 'access' && decoded.sub) {
          const dbUser = await User.findById(decoded.sub);
          if (!dbUser) {
            throw new AppError('User profile not found', 401, 'PROFILE_NOT_FOUND');
          }
          req.user = {
            uid: dbUser.firebaseUid || String(dbUser._id),
            authType: 'jwt',
            role: dbUser.role,
            sub: String(decoded.sub),
          };
          req.dbUser = dbUser;
          return next();
        }
      } catch (e) {
        if (e instanceof AppError) return next(e);
        if (e.name === 'TokenExpiredError') {
          return next(new AppError('Token expired', 401, 'TOKEN_EXPIRED'));
        }
        if (e.name !== 'JsonWebTokenError' && e.name !== 'NotBeforeError') {
          return next(e);
        }
      }
    }

    initFirebaseAdmin();
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      throw new AppError('Authentication service not configured', 503, 'AUTH_NOT_CONFIGURED');
    }

    const checkRevoked = process.env.FIREBASE_CHECK_REVOKED === 'true';
    const decoded = await admin.auth().verifyIdToken(token, checkRevoked);
    req.user = {
      uid: decoded.uid,
      authType: 'firebase',
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

function requireAdmin() {
  return requireRole('admin');
}

function requireSellerOrAdmin() {
  return requireRole('seller', 'admin');
}

function requireBuyerSellerOrAdmin() {
  return requireRole('buyer', 'seller', 'admin');
}

module.exports = {
  requireAuth,
  requireDbUser,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireSellerOrAdmin,
  requireBuyerSellerOrAdmin,
};
