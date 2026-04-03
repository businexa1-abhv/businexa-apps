/**
 * Products — NODEJS_API_GENERATION_PROMPT.md § C
 * Base path: /api/products — multipart field `image` for create/update
 */
const { AppError } = require('../middleware/errorHandler');
const productService = require('../services/productService');
const firestoreProductService = require('../services/firestoreProductService');
const cloudStorage = require('../utils/cloudStorage');
const buyerAccessService = require('../services/buyerAccessService');

async function buyerCatalogBlocked(req) {
  const access = await buyerAccessService.getBuyerAccessForUser(req.dbUser);
  return access.canAccessPremium ? null : access;
}

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

/** True when Firestore returned nothing useful — fall back to Mongo (e.g. seed data only in Mongo). */
function shouldFallbackProductsToMongo(fsOut) {
  return !fsOut || !Array.isArray(fsOut.products) || fsOut.products.length === 0;
}

/** GET /api/products/browse?businessType=&category=&q=&page=&limit= — visible products across active shops */
async function browsePublic(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 24);
    const { category, businessType, q } = req.query;
    const needle = q != null ? String(q).trim() : '';

    const blocked = await buyerCatalogBlocked(req);
    if (blocked) {
      res.set('Cache-Control', 'private, no-store');
      return res.json({
        products: [],
        total: 0,
        page,
        buyerCatalog: { preview: true, ...blocked },
      });
    }

    let out = null;
    try {
      out = await firestoreProductService.listPublicCatalog({
        category,
        businessType,
        q: needle || undefined,
        page,
        limit,
      });
    } catch {
      out = null;
    }
    if (shouldFallbackProductsToMongo(out)) {
      if (needle) {
        const all = await productService.searchProducts(needle, undefined, businessType || category);
        const skip = Math.max(0, (page - 1) * limit);
        const total = all.length;
        const products = all.slice(skip, skip + limit);
        out = { products, total, page };
      } else {
        out = await productService.listPublicCatalog({ category, businessType, page, limit });
      }
    }
    res.set('Cache-Control', 'public, max-age=60');
    res.json(out);
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

    const blocked = await buyerCatalogBlocked(req);
    if (blocked) {
      res.set('Cache-Control', 'private, no-store');
      return res.json({
        products: [],
        total: 0,
        page,
        buyerCatalog: { preview: true, ...blocked },
      });
    }

    let out = null;
    try {
      out = await firestoreProductService.listByShop({ shopId, page, limit });
    } catch {
      out = null;
    }
    if (shouldFallbackProductsToMongo(out)) {
      out = await productService.listByShop({ shopId, page, limit });
    }
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
    let out = null;
    if (req.dbUser.firebaseUid) {
      try {
        out = await firestoreProductService.listBySeller({
          sellerId: req.dbUser.firebaseUid,
          page,
          limit,
        });
      } catch {
        out = null;
      }
    }
    if (!out || shouldFallbackProductsToMongo(out)) {
      out = await productService.listByOwner(req.dbUser._id, page, limit);
    }
    res.json({ ...out, scope: 'mine' });
  } catch (e) {
    next(e);
  }
}

/** GET /api/products/:productId */
async function getById(req, res, next) {
  try {
    const blocked = await buyerCatalogBlocked(req);
    if (blocked) {
      throw new AppError(
        'Subscribe or use your free trial to view products',
        402,
        'BUYER_SUBSCRIPTION_REQUIRED'
      );
    }
    let product = await firestoreProductService.getById(req.params.productId);
    if (!product) {
      product = await productService.getProductById(req.params.productId);
    }
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
    const fsResult = await firestoreProductService.deleteProduct(req.params.productId, req.dbUser);
    if (fsResult && fsResult.ok) {
      return res.json({ success: true });
    }
    if (fsResult && fsResult.error === 'forbidden') {
      throw new AppError('Forbidden', 403);
    }
    if (fsResult && fsResult.error === 'not_found') {
      // fall through to Mongo (legacy products)
    } else if (fsResult == null) {
      // Firestore not configured — use Mongo
    }
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
    const blocked = await buyerCatalogBlocked(req);
    if (blocked) {
      return res.json({ products: [], buyerCatalog: { preview: true, ...blocked } });
    }
    const products = await productService.listByCategory(req.params.category, req.query.shopId);
    res.json({ products });
  } catch (e) {
    next(e);
  }
}

/** GET /api/products/search?q=&shopId=&businessType= */
async function search(req, res, next) {
  try {
    const blocked = await buyerCatalogBlocked(req);
    if (blocked) {
      return res.json({ products: [], buyerCatalog: { preview: true, ...blocked } });
    }
    const products = await productService.searchProducts(
      req.query.q,
      req.query.shopId,
      req.query.businessType || req.query.category
    );
    res.json({ products });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  createProduct,
  browsePublic,
  listByShop,
  myProducts,
  getById,
  updateProduct,
  deleteProduct,
  byCategory,
  search,
};
