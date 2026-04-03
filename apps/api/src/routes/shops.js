/**
 * Mounted at /api/shops
 *
 * Protected — role seller or admin (Bearer + Mongo user):
 *   GET    /my-shop
 *   POST   /                    — create shop
 *   GET    /:shopId/metrics
 *   POST   /:shopId/generate-qr
 *   PUT    /:shopId
 *   DELETE /:shopId
 *
 * Public:
 *   GET /browse?category=&page=&limit= — directory of active shops
 *   GET /:shopIdOrSlug — by ObjectId or slug (Cache-Control: 1h in controller)
 */
const express = require('express');
const shopController = require('../controllers/shopController');
const { requireAuth, requireDbUser, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

/** Seller or admin — shop management */
const auth = [requireAuth, requireDbUser, requireRole('seller', 'admin')];

router.get('/my-shop', ...auth, shopController.getMyShop);

router.get('/browse', shopController.listPublicShops);

router.get('/:shopId/metrics', ...auth, shopController.getMetrics);
router.post('/:shopId/generate-qr', ...auth, shopController.generateQr);
router.put('/:shopId', ...auth, shopController.updateShop);
router.delete('/:shopId', ...auth, shopController.deleteShop);

router.get('/:shopIdOrSlug', shopController.getShopByIdOrSlug);

router.post('/', ...auth, shopController.createShop);

module.exports = router;
