/**
 * Mounted at /api/analytics
 *
 * Protected (Bearer + Mongo user):
 *   GET /dashboard?from=&to=
 *   GET /shops/:shopId
 */
const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { requireAuth, requireDbUser } = require('../middleware/authMiddleware');

const router = express.Router();

const auth = [requireAuth, requireDbUser];

router.get('/dashboard', ...auth, analyticsController.dashboard);
router.get('/shops/:shopId', ...auth, analyticsController.shopAnalytics);

module.exports = router;
