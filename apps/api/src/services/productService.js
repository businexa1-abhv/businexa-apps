/**
 * Product CRUD, search, metrics (aligns with shop product counts).
 * @see NODEJS_API_GENERATION_PROMPT.md — Product endpoints, KEY BUSINESS LOGIC (metrics)
 */
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Shop = require('../models/Shop');

function toDecimal128(n) {
  return mongoose.Types.Decimal128.fromString(String(n));
}

async function getDefaultShopForOwner(ownerId) {
  return Shop.findOne({ ownerId });
}

async function createProduct(ownerId, payload, imageUrl = '') {
  const shop = await getDefaultShopForOwner(ownerId);
  if (!shop) return { error: 'no_shop' };

  const { name, description, price, category } = payload;
  const product = await Product.create({
    shopId: shop._id,
    ownerId,
    name: name.trim(),
    description: description || '',
    price: toDecimal128(price),
    category: category || '',
    imageUrl: imageUrl || payload.imageUrl || '',
  });

  shop.metrics = shop.metrics || {};
  shop.metrics.totalProducts = (shop.metrics.totalProducts || 0) + 1;
  await shop.save();

  return { product, shop };
}

async function listByShop({ shopId, page, limit }) {
  const filter = shopId ? { shopId } : {};
  const [products, total] = await Promise.all([
    Product.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);
  return { products, total, page };
}

async function listByOwner(ownerId, page, limit) {
  const filter = { ownerId };
  const [products, total] = await Promise.all([
    Product.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);
  return { products, total, page };
}

async function listAllPaginated(page, limit) {
  const filter = {};
  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);
  return { products, total, page };
}

async function getProductById(productId) {
  return Product.findById(productId);
}

async function updateProduct(productId, ownerId, body, options = {}) {
  const { isAdmin = false } = options;
  const product = await Product.findById(productId);
  if (!product) return { error: 'not_found' };
  if (!isAdmin && String(product.ownerId) !== String(ownerId)) return { error: 'forbidden' };

  const keys = ['name', 'description', 'price', 'category', 'imageUrl', 'isVisible'];
  keys.forEach((k) => {
    if (body[k] !== undefined) {
      if (k === 'price') product[k] = toDecimal128(body[k]);
      else product[k] = body[k];
    }
  });
  await product.save();
  return { product };
}

async function deleteProduct(productId, ownerId, options = {}) {
  const { isAdmin = false } = options;
  const product = await Product.findById(productId);
  if (!product) return { error: 'not_found' };
  if (!isAdmin && String(product.ownerId) !== String(ownerId)) return { error: 'forbidden' };

  const shopId = product.shopId;
  await product.deleteOne();

  const shop = await Shop.findById(shopId);
  if (shop && shop.metrics?.totalProducts > 0) {
    shop.metrics.totalProducts -= 1;
    await shop.save();
  }

  return { ok: true };
}

async function listByCategory(category, shopId) {
  const filter = { category };
  if (shopId) filter.shopId = shopId;
  return Product.find(filter).lean();
}

/** Visible products in active shops; optional category filter (buyer catalog). */
async function listPublicCatalog({ category, page = 1, limit = 24 }) {
  const activeShopIds = await Shop.find({ isActive: true }).distinct('_id');
  const filter = { isVisible: true, shopId: { $in: activeShopIds } };
  const cat = category != null ? String(category).trim() : '';
  if (cat) filter.category = cat;
  const skip = Math.max(0, (page - 1) * limit);
  const [products, total] = await Promise.all([
    Product.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);
  return { products, total, page };
}

async function searchProducts(query, shopId) {
  if (!query || !String(query).trim()) return [];
  const filter = { $text: { $search: query } };
  if (shopId) filter.shopId = shopId;
  return Product.find(filter).lean();
}

async function incrementProductClicks(productId) {
  return Product.findByIdAndUpdate(
    productId,
    { $inc: { 'metrics.clicks': 1 } },
    { new: true }
  );
}

async function incrementProductViews(productId) {
  return Product.findByIdAndUpdate(
    productId,
    { $inc: { 'metrics.views': 1 } },
    { new: true }
  );
}

module.exports = {
  toDecimal128,
  getDefaultShopForOwner,
  createProduct,
  listByShop,
  listByOwner,
  listAllPaginated,
  getProductById,
  updateProduct,
  deleteProduct,
  listByCategory,
  listPublicCatalog,
  searchProducts,
  incrementProductClicks,
  incrementProductViews,
};
