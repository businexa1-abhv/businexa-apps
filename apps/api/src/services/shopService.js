/**
 * Shop CRUD, slug uniqueness, metrics helpers.
 * @see NODEJS_API_GENERATION_PROMPT.md — Shop endpoints, KEY BUSINESS LOGIC
 */
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const User = require('../models/User');
const logger = require('../utils/logger');
const { slugify } = require('../utils/validators');
const firestoreUserService = require('./firestoreUserService');

async function ensureUniqueSlug(base) {
  let slug = slugify(base) || 'shop';
  let n = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = n ? `${slug}-${n}` : slug;
    const exists = await Shop.exists({ slug: candidate });
    if (!exists) return candidate;
    n += 1;
  }
}

function buildPublicShopUrl(slug) {
  const base = (process.env.FRONTEND_URL || 'https://businexa.com').replace(/\/$/, '');
  return `${base}/shop/${slug}`;
}

async function createShop(ownerId, payload) {
  const { name, address, category, whatsappNumber, email, description } = payload;
  const slug = await ensureUniqueSlug(name);
  const shop = await Shop.create({
    ownerId,
    name: name.trim(),
    slug,
    address: address || '',
    category: category || '',
    description: description != null ? String(description) : '',
    whatsappNumber: whatsappNumber || '',
    email: email || '',
  });
  const owner = await User.findById(ownerId).select('firebaseUid');
  if (owner?.firebaseUid && shop.category) {
    try {
      await firestoreUserService.setBusinessType(owner.firebaseUid, shop.category);
    } catch (e) {
      logger.warn('Firestore businessType sync failed on createShop', { err: e.message });
    }
  }
  return shop;
}

async function findShopByOwner(ownerId) {
  return Shop.findOne({ ownerId });
}

async function findShopByIdOrSlug(shopIdOrSlug) {
  const isOid = /^[a-f\d]{24}$/i.test(shopIdOrSlug);
  if (isOid) return Shop.findById(shopIdOrSlug);
  return Shop.findOne({ slug: String(shopIdOrSlug).toLowerCase() });
}

async function findShopById(shopId) {
  return Shop.findById(shopId);
}

async function updateShopById(shopId, ownerId, updates, options = {}) {
  const { isAdmin = false } = options;
  const shop = await Shop.findById(shopId);
  if (!shop) return { error: 'not_found' };
  if (!isAdmin && String(shop.ownerId) !== String(ownerId)) return { error: 'forbidden' };
  const allowed = ['name', 'description', 'address', 'whatsappNumber', 'logoUrl', 'email', 'category'];
  allowed.forEach((k) => {
    if (updates[k] !== undefined) shop[k] = updates[k];
  });
  await shop.save();
  const owner = await User.findById(shop.ownerId).select('firebaseUid');
  if (owner?.firebaseUid && shop.category) {
    try {
      await firestoreUserService.setBusinessType(owner.firebaseUid, shop.category);
    } catch (e) {
      logger.warn('Firestore businessType sync failed on updateShop', { err: e.message });
    }
  }
  return { shop };
}

async function deleteShopById(shopId, ownerId, options = {}) {
  const { isAdmin = false } = options;
  const shop = await Shop.findById(shopId);
  if (!shop) return { error: 'not_found' };
  if (!isAdmin && String(shop.ownerId) !== String(ownerId)) return { error: 'forbidden' };
  await Product.deleteMany({ shopId: shop._id });
  await shop.deleteOne();
  return { ok: true };
}

async function setQrCodeUrl(shop, url) {
  shop.qrCodeUrl = url;
  await shop.save();
  return shop;
}

async function recalculateProductCount(shopId) {
  const count = await Product.countDocuments({ shopId });
  await Shop.updateOne({ _id: shopId }, { $set: { 'metrics.totalProducts': count } });
}

/** Public directory: active shops, optional business category (Mongo string, aligns with Firestore seed labels). */
async function listPublicShops({ category, page = 1, limit = 24 }) {
  const filter = { isActive: true };
  const cat = category != null ? String(category).trim() : '';
  if (cat) filter.category = cat;
  const skip = Math.max(0, (page - 1) * limit);
  const [shops, total] = await Promise.all([
    Shop.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    Shop.countDocuments(filter),
  ]);
  return { shops, total, page };
}

module.exports = {
  ensureUniqueSlug,
  buildPublicShopUrl,
  createShop,
  findShopByOwner,
  findShopByIdOrSlug,
  findShopById,
  updateShopById,
  deleteShopById,
  setQrCodeUrl,
  recalculateProductCount,
  listPublicShops,
};
