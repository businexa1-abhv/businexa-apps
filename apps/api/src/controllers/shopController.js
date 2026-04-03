/**
 * Shops — NODEJS_API_GENERATION_PROMPT.md § B
 * Base path: /api/shops
 */
const { AppError } = require('../middleware/errorHandler');
const { assertShopOwnerOrAdmin } = require('../utils/authorization');
const shopService = require('../services/shopService');
const qrService = require('../services/qrService');
const firestoreProductService = require('../services/firestoreProductService');

/** POST /api/shops — create */
async function createShop(req, res, next) {
  try {
    const shop = await shopService.createShop(req.dbUser._id, req.body);
    res.status(201).json({ shop });
  } catch (e) {
    next(e);
  }
}

/** GET /api/shops/my-shop */
async function getMyShop(req, res, next) {
  try {
    const shop = await shopService.findShopByOwner(req.dbUser._id);
    res.json({ shop: shop || null });
  } catch (e) {
    next(e);
  }
}

/** GET /api/shops/browse?businessType=&category=&page=&limit= — public shop directory */
async function listPublicShops(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 24);
    const { category, businessType } = req.query;
    const out = await shopService.listPublicShops({ category, businessType, page, limit });
    res.set('Cache-Control', 'public, max-age=60');
    res.json(out);
  } catch (e) {
    next(e);
  }
}

/** GET /api/shops/:shopIdOrSlug — public read by id or slug */
async function getShopByIdOrSlug(req, res, next) {
  try {
    const shop = await shopService.findShopByIdOrSlug(req.params.shopIdOrSlug);
    if (!shop) throw new AppError('Shop not found', 404);
    res.set('Cache-Control', 'public, max-age=3600');
    res.json({ shop });
  } catch (e) {
    next(e);
  }
}

/** PUT /api/shops/:shopId — update (owner) */
async function updateShop(req, res, next) {
  try {
    const isAdmin = req.dbUser.role === 'admin';
    const result = await shopService.updateShopById(req.params.shopId, req.dbUser._id, req.body, {
      isAdmin,
    });
    if (result.error === 'not_found') throw new AppError('Shop not found', 404);
    if (result.error === 'forbidden') throw new AppError('Forbidden', 403);
    res.json({ shop: result.shop });
  } catch (e) {
    next(e);
  }
}

/** DELETE /api/shops/:shopId */
async function deleteShop(req, res, next) {
  try {
    const isAdmin = req.dbUser.role === 'admin';
    const result = await shopService.deleteShopById(req.params.shopId, req.dbUser._id, { isAdmin });
    if (result.error === 'not_found') throw new AppError('Shop not found', 404);
    if (result.error === 'forbidden') throw new AppError('Forbidden', 403);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}

/** POST /api/shops/:shopId/generate-qr — active subscription required */
async function generateQr(req, res, next) {
  try {
    const shop = await shopService.findShopById(req.params.shopId);
    assertShopOwnerOrAdmin(req, shop);

    const assets = await qrService.generateShopQrAssets(shop);
    if (assets.error === 'subscription_required') {
      throw new AppError('Active subscription required', 402);
    }

    await qrService.persistShopQrUrl(shop, assets.url);
    res.json({ qrCodeUrl: shop.qrCodeUrl });
  } catch (e) {
    next(e);
  }
}

/** GET /api/shops/:shopId/metrics */
async function getMetrics(req, res, next) {
  try {
    const shop = await shopService.findShopById(req.params.shopId);
    assertShopOwnerOrAdmin(req, shop);
    let totalProducts = shop.metrics?.totalProducts ?? 0;
    const fsCount = await firestoreProductService.countByShopId(String(shop._id));
    if (fsCount != null) {
      totalProducts = fsCount;
    }
    res.json({
      metrics: {
        qrScans: shop.metrics?.qrScans ?? 0,
        views: shop.metrics?.views ?? 0,
        totalProducts,
      },
    });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  createShop,
  getMyShop,
  listPublicShops,
  getShopByIdOrSlug,
  updateShop,
  deleteShop,
  generateQr,
  getMetrics,
};
