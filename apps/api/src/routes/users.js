/**
 * Mounted at /api/users
 *
 * All routes require Bearer Firebase ID token + Mongo user profile.
 *
 *   GET    /profile
 *   PUT    /profile
 *   PUT    /preferences
 *   GET    /notifications?page=&limit=
 *   PUT    /notifications/:notificationId/read
 *   DELETE /account
 */
const express = require('express');
const userController = require('../controllers/userController');
const { requireAuth, requireDbUser } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth, requireDbUser);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/preferences', userController.updatePreferences);
router.get('/notifications', userController.listNotifications);
router.put('/notifications/:notificationId/read', userController.markRead);
router.delete('/account', userController.deleteAccount);

module.exports = router;
