/**
 * Mounted at /api/auth
 *
 * Public:
 *   POST /send-otp      — rate limited (OTP)
 *   POST /verify-otp    — rate limited
 *   POST /register      — username + password → JWT
 *   POST /login         — username + password → JWT
 *   POST /refresh       — body validated (refresh token)
 *
 * Protected (Bearer API JWT or Firebase ID token):
 *   GET  /me
 *   POST /logout
 */
const express = require('express');
const authController = require('../controllers/authController');
const { requireAuth, requireDbUser } = require('../middleware/authMiddleware');
const { otpSendLimiter, authVerifyLimiter } = require('../middleware/rateLimiter');
const {
  sendOtpBody,
  verifyOtpBody,
  registerPasswordBody,
  loginPasswordBody,
  forgotPasswordBody,
  resetPasswordBody,
  refreshTokenBody,
  validateBody,
} = require('../middleware/validators');

const router = express.Router();

router.post('/send-otp', otpSendLimiter, validateBody(sendOtpBody), authController.sendOtp);
router.post('/verify-otp', authVerifyLimiter, validateBody(verifyOtpBody), authController.verifyOtp);
router.post('/register', authVerifyLimiter, validateBody(registerPasswordBody), authController.registerPassword);
router.post('/login', authVerifyLimiter, validateBody(loginPasswordBody), authController.loginPassword);
router.post(
  '/forgot-password',
  authVerifyLimiter,
  validateBody(forgotPasswordBody),
  authController.forgotPassword
);
router.post('/reset-password', authVerifyLimiter, validateBody(resetPasswordBody), authController.resetPassword);
router.post('/refresh', validateBody(refreshTokenBody), authController.refreshToken);

router.get('/me', requireAuth, requireDbUser, authController.getMe);
router.post('/logout', requireAuth, authController.logout);

module.exports = router;
