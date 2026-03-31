/**
 * Rate limits per NODEJS_API_GENERATION_PROMPT.md:
 * - OTP send: 3 / 30 min per IP
 * - Login (verify-otp): 5 / 15 min per IP
 * - Global API: configurable window (default 15 min / 100 req)
 *
 * Behind a reverse proxy, set `app.set('trust proxy', 1)` so `req.ip` is correct
 * (see `src/app.js`).
 */
const rateLimit = require('express-rate-limit');

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const max = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

function skipHealthAndDocs(req) {
  const p = req.path || '';
  return p === '/health' || p.startsWith('/api-docs');
}

const apiLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipHealthAndDocs,
  message: { success: false, message: 'Too many requests, please try again later.', code: 'RATE_LIMIT' },
});

/** OTP: 3 requests per 30 minutes per IP (spec). */
const otpSendLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'OTP rate limit exceeded. Try again later.', code: 'OTP_RATE_LIMIT' },
});

/** Verify-otp / login attempts: 5 per 15 minutes per IP (spec). */
const authVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts.', code: 'AUTH_RATE_LIMIT' },
});

module.exports = { apiLimiter, otpSendLimiter, authVerifyLimiter };
