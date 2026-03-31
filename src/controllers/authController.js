/**
 * Authentication — NODEJS_API_GENERATION_PROMPT.md § A
 * POST /api/auth/send-otp | verify-otp | logout | refresh
 * GET  /api/auth/me
 */
const authService = require('../services/authService');
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

/** GET /api/auth/me — Bearer Firebase ID token */
async function getMe(req, res, next) {
  try {
    if (!req.dbUser) throw new AppError('User not found', 404);
    res.json({ user: req.dbUser });
  } catch (e) {
    next(e);
  }
}

/** POST /api/auth/logout */
async function logout(_req, res) {
  res.json({ success: true });
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
