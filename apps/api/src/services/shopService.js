/**
 * Shop CRUD, slug uniqueness, metrics helpers.
 * @see NODEJS_API_GENERATION_PROMPT.md — Shop endpoints, KEY BUSINESS LOGIC
 */
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const { slugify } = require('../utils/validators');

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
  return Shop.create({
    ownerId,
    name: name.trim(),
    slug,
    address: address || '',
    category: category || '',
    description: description != null ? String(description) : '',
    whatsappNumber: whatsappNumber || '',
    email: email || '',
  });
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
};
