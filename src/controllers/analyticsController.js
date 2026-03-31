/**
 * Analytics — NODEJS_API_GENERATION_PROMPT.md § G
 * Base path: /api/analytics
 */
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Subscription = require('../models/Subscription');
const { AppError } = require('../middleware/errorHandler');

/** GET /api/analytics/dashboard?from=&to= */
async function dashboard(req, res, next) {
  try {
    if (!process.env.ENABLE_ANALYTICS || process.env.ENABLE_ANALYTICS === 'false') {
      return res.status(503).json({ message: 'Analytics disabled' });
    }

    const { from, to } = req.query;
    const ownerId = req.dbUser._id;

    const [totalShops, totalProducts, activeSubscriptions] = await Promise.all([
      Shop.countDocuments({ ownerId }),
      Product.countDocuments({ ownerId }),
      Subscription.countDocuments({ userId: ownerId, status: 'active', expiresAt: { $gt: new Date() } }),
    ]);

    res.json({
      totalShops,
      totalProducts,
      activeSubscriptions,
      revenue: 0,
      trends: { qrScans: [], views: [] },
      range: from || to ? { from: from || null, to: to || null } : undefined,
    });
  } catch (e) {
    next(e);
  }
}

/** GET /api/analytics/shops/:shopId */
async function shopAnalytics(req, res, next) {
  try {
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) throw new AppError('Shop not found', 404);
    if (String(shop.ownerId) !== String(req.dbUser._id)) throw new AppError('Forbidden', 403);
    const topProducts = await Product.find({ shopId: shop._id }).sort({ 'metrics.clicks': -1 }).limit(5).lean();
    res.json({
      metrics: {
        scans: shop.metrics?.qrScans ?? 0,
        views: shop.metrics?.views ?? 0,
        conversions: 0,
      },
      topProducts,
      dailyData: [],
    });
  } catch (e) {
    next(e);
  }
}

module.exports = { dashboard, shopAnalytics };
