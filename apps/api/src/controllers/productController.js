/**
 * Products — NODEJS_API_GENERATION_PROMPT.md § C
 * Base path: /api/products — multipart field `image` for create/update
 */
const { AppError } = require('../middleware/errorHandler');
const productService = require('../services/productService');
const cloudStorage = require('../utils/cloudStorage');

/**
 * Resolve image URL: uploaded file (Cloudinary) or body.imageUrl.
 */
async function resolveProductImageUrl(req) {
  if (req.file?.buffer) {
    try {
      return await cloudStorage.uploadProductImage(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
    } catch (err) {
      const msg = err.message || 'Image upload failed';
      throw new AppError(
        `${msg}. Configure CLOUDINARY_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET or send imageUrl in JSON.`,
        503
      );
    }
  }
  return req.body.imageUrl || '';
}

/** POST /api/products — multipart: name, description, price, category, image */
async function createProduct(req, res, next) {
  try {
    const imageUrl = await resolveProductImageUrl(req);
    const result = await productService.createProduct(req.dbUser._id, req.body, imageUrl);
    if (result.error === 'no_shop') throw new AppError('Create a shop first', 400);
    res.status(201).json({ product: result.product });
  } catch (e) {
    next(e);
  }
}

/** GET /api/products?shopId=&page=&limit= */
async function listByShop(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const { shopId } = req.query;
    const out = await productService.listByShop({ shopId, page, limit });
    res.json(out);
  } catch (e) {
    next(e);
  }
}

/** GET /api/products/my-products */
async function myProducts(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    if (req.dbUser.role === 'admin') {
      const out = await productService.listAllPaginated(page, limit);
      return res.json({ ...out, scope: 'all' });
    }
    const out = await productService.listByOwner(req.dbUser._id, page, limit);
    res.json({ ...out, scope: 'mine' });
  } catch (e) {
    next(e);
  }
}

/** GET /api/products/:productId */
async function getById(req, res, next) {
  try {
    const product = await productService.getProductById(req.params.productId);
    if (!product) throw new AppError('Product not found', 404);
    res.json({ product });
  } catch (e) {
    next(e);
  }
}

/** PUT /api/products/:productId — optional multipart image */
async function updateProduct(req, res, next) {
  try {
    let body = { ...req.body };
    if (req.file?.buffer) {
      body.imageUrl = await resolveProductImageUrl(req);
    }
    const isAdmin = req.dbUser.role === 'admin';
    const result = await productService.updateProduct(req.params.productId, req.dbUser._id, body, {
      isAdmin,
    });
    if (result.error === 'not_found') throw new AppError('Product not found', 404);
    if (result.error === 'forbidden') throw new AppError('Forbidden', 403);
    res.json({ product: result.product });
  } catch (e) {
    next(e);
  }
}

/** DELETE /api/products/:productId */
async function deleteProduct(req, res, next) {
  try {
    const isAdmin = req.dbUser.role === 'admin';
    const result = await productService.deleteProduct(req.params.productId, req.dbUser._id, {
      isAdmin,
    });
    if (result.error === 'not_found') throw new AppError('Product not found', 404);
    if (result.error === 'forbidden') throw new AppError('Forbidden', 403);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}

/** GET /api/products/category/:category?shopId= */
async function byCategory(req, res, next) {
  try {
    const products = await productService.listByCategory(req.params.category, req.query.shopId);
    res.json({ products });
  } catch (e) {
    next(e);
  }
}

/** GET /api/products/search?q=&shopId= */
async function search(req, res, next) {
  try {
    const products = await productService.searchProducts(req.query.q, req.query.shopId);
    res.json({ products });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  createProduct,
  listByShop,
  myProducts,
  getById,
  updateProduct,
  deleteProduct,
  byCategory,
  search,
};
