/**
 * QR targets `FRONTEND_URL/shop/{slug}`; optional PNG/DataURL; metrics + audit hooks.
 * @see NODEJS_API_GENERATION_PROMPT.md — KEY BUSINESS LOGIC (QR Code Generation, Metrics)
 */
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');
const { generateQrDataUrl: encodeQrDataUrl } = require('../utils/qrUtils');
const { hasActiveSubscription } = require('./subscriptionService');

function buildPublicShopUrl(slug) {
  const base = (process.env.FRONTEND_URL || 'https://businexa.com').replace(/\/$/, '');
  return `${base}/shop/${slug}`;
}

async function generateQrDataUrl(text, options = {}) {
  return encodeQrDataUrl(text, options);
}

function getShopLandingUrl(shop) {
  return buildPublicShopUrl(shop.slug);
}

/**
 * Full flow: ensure subscription → landing URL → optional data URL for client display.
 */
async function generateShopQrAssets(shop) {
  const active = await hasActiveSubscription(shop._id);
  if (!active) return { error: 'subscription_required', url: null, dataUrl: null };

  const url = getShopLandingUrl(shop);
  const dataUrl = await generateQrDataUrl(url);
  return { url, dataUrl, error: null };
}

async function persistShopQrUrl(shop, url) {
  shop.qrCodeUrl = url;
  await shop.save();
  return shop;
}

async function incrementShopQrScan(shopId, meta = {}) {
  const shop = await Shop.findByIdAndUpdate(
    shopId,
    { $inc: { 'metrics.qrScans': 1 } },
    { new: true }
  );
  if (!shop) return { ok: false, shop: null };

  await AuditLog.create({
    action: 'update',
    resourceType: 'shop',
    resourceId: shop._id,
    details: { event: 'qr_scan', ...meta },
    ipAddress: meta.ipAddress || '',
  }).catch(() => {});

  return { ok: true, shop };
}

async function incrementShopView(shopId) {
  return Shop.findByIdAndUpdate(shopId, { $inc: { 'metrics.views': 1 } }, { new: true });
}

async function incrementProductClick(productId, meta = {}) {
  const product = await Product.findByIdAndUpdate(
    productId,
    { $inc: { 'metrics.clicks': 1 } },
    { new: true }
  );
  if (!product) return { ok: false, product: null };

  await AuditLog.create({
    action: 'update',
    resourceType: 'product',
    resourceId: product._id,
    details: { event: 'product_click', ...meta },
    ipAddress: meta.ipAddress || '',
  }).catch(() => {});

  return { ok: true, product };
}

module.exports = {
  generateQrDataUrl,
  getShopLandingUrl,
  generateShopQrAssets,
  persistShopQrUrl,
  incrementShopQrScan,
  incrementShopView,
  incrementProductClick,
};
