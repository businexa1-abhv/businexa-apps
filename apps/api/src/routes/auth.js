/**
 * Mounted at /api/auth
 *
 * Public:
 *   POST /send-otp      — rate limited (OTP)
 *   POST /verify-otp    — rate limited (login)
 *   POST /refresh       — body validated (refresh token)
 *
 * Protected (Bearer Firebase ID token):
 *   GET  /me
 *   POST /logout
 */
const express = require('express');
const authController = require('../controllers/authController');
const { requireAuth, requireDbUser } = require('../middleware/authMiddleware');
const { otpSendLimiter, authVerifyLimiter } = require('../middleware/rateLimiter');
const { sendOtpBody, verifyOtpBody, refreshTokenBody, validateBody } = require('../middleware/validators');

const router = express.Router();

router.post('/send-otp', otpSendLimiter, validateBody(sendOtpBody), authController.sendOtp);
router.post('/verify-otp', authVerifyLimiter, validateBody(verifyOtpBody), authController.verifyOtp);
router.post('/refresh', validateBody(refreshTokenBody), authController.refreshToken);

router.get('/me', requireAuth, requireDbUser, authController.getMe);
router.post('/logout', requireAuth, authController.logout);

module.exports = router;
