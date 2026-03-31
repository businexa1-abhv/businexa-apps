/**
 * Mounted at /api/qr
 *
 * Public (no auth — tracking & landing metadata):
 *   POST /track/:shopId
 *   POST /product/:productId/track
 *   GET  /:shopId
 *
 * Order: static path prefixes before /:shopId to avoid ambiguous matches.
 */
const express = require('express');
const qrController = require('../controllers/qrController');

const router = express.Router();

router.post('/track/:shopId', qrController.trackScan);
router.post('/product/:productId/track', qrController.trackProductClick);
router.get('/:shopId', qrController.getQrData);

module.exports = router;
