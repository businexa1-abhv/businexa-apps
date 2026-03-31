/**
 * QR & tracking — NODEJS_API_GENERATION_PROMPT.md § F
 * Base path: /api/qr
 */
const { AppError } = require('../middleware/errorHandler');
const Shop = require('../models/Shop');
const qrService = require('../services/qrService');

/** POST /api/qr/track/:shopId — no auth; increments scans + audit */
async function trackScan(req, res, next) {
  try {
    const { userAgent, referer } = req.body;
    const ipAddress = req.body.ipAddress || req.ip;
    const result = await qrService.incrementShopQrScan(req.params.shopId, {
      userAgent,
      referer,
      ipAddress,
    });
    if (!result.ok || !result.shop) throw new AppError('Shop not found', 404);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}

/** GET /api/qr/:shopId — public landing metadata */
async function getQrData(req, res, next) {
  try {
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) throw new AppError('Shop not found', 404);
    const publicUrl = qrService.getShopLandingUrl(shop);
    res.json({
      shopId: String(shop._id),
      shopName: shop.name,
      logoUrl: shop.logoUrl,
      publicUrl,
    });
  } catch (e) {
    next(e);
  }
}

/** POST /api/qr/product/:productId/track */
async function trackProductClick(req, res, next) {
  try {
    const ipAddress = req.body.ipAddress || req.ip;
    const result = await qrService.incrementProductClick(req.params.productId, {
      userAgent: req.body.userAgent,
      ipAddress,
    });
    if (!result.ok) throw new AppError('Product not found', 404);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  trackScan,
  getQrData,
  trackProductClick,
};
