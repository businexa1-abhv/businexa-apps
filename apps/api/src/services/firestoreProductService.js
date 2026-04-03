/**
 * Products in Firestore: products/{productId}
 * Fields: name, description, price, imageUrl, category, shopId, sellerId, inStock, createdAt
 */
const { initFirebaseAdmin } = require('../config/firebase');
const Shop = require('../models/Shop');

function adminSdk() {
  initFirebaseAdmin();
  return require('firebase-admin');
}

function fs() {
  const admin = adminSdk();
  if (!admin.apps.length) return null;
  return admin.firestore();
}

function timestampToIso(ts) {
  if (!ts) return undefined;
  if (typeof ts.toDate === 'function') return ts.toDate().toISOString();
  return undefined;
}

function mapDoc(id, data) {
  if (!data) return null;
  const priceRaw = data.price;
  const price =
    typeof priceRaw === 'number'
      ? priceRaw
      : typeof priceRaw === 'string'
        ? parseFloat(priceRaw)
        : 0;
  const priceNumber = Number.isFinite(price) ? price : 0;
  const businessType = data.businessType != null ? String(data.businessType) : '';
  const category = data.category != null ? String(data.category) : '';
  return {
    _id: id,
    shopId: data.shopId != null ? String(data.shopId) : '',
    ownerId: data.sellerId != null ? String(data.sellerId) : '',
    name: data.name || '',
    description: data.description || '',
    price: priceNumber,
    priceNumber,
    businessType: businessType || category,
    category: category || businessType,
    imageUrl: data.imageUrl || '',
    isVisible: data.inStock !== false,
    inStock: data.inStock !== false,
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

/**
 * @returns {Promise<{ products: object[], total: number, page: number } | null>}
 */
async function listByShop({ shopId, page = 1, limit = 20 }) {
  const db = fs();
  if (!db || !shopId) return null;

  const sid = String(shopId);
  const lim = Math.min(100, Math.max(1, limit));
  const pageNum = Math.max(1, page);

  let q = db.collection('products').where('shopId', '==', sid).orderBy('createdAt', 'desc');

  if (pageNum === 1) {
    const snap = await q.limit(lim).get();
    const products = snap.docs.map((d) => mapDoc(d.id, d.data())).filter(Boolean);
    let total;
    try {
      const totalSnap = await db.collection('products').where('shopId', '==', sid).count().get();
      total = totalSnap.data().count;
    } catch {
      const fb = await db.collection('products').where('shopId', '==', sid).get();
      total = fb.size;
    }
    return { products, total, page: pageNum };
  }

  const skip = (pageNum - 1) * lim;
  const window = await q.limit(skip + lim).get();
  const all = window.docs.map((d) => mapDoc(d.id, d.data())).filter(Boolean);
  const products = all.slice(skip, skip + lim);
  let total;
  try {
    const totalSnap = await db.collection('products').where('shopId', '==', sid).count().get();
    total = totalSnap.data().count;
  } catch {
    const fb = await db.collection('products').where('shopId', '==', sid).get();
    total = fb.size;
  }
  return { products, total, page: pageNum };
}

async function getById(productId) {
  const db = fs();
  if (!db || !productId) return null;
  const snap = await db.collection('products').doc(String(productId)).get();
  if (!snap.exists) return null;
  return mapDoc(snap.id, snap.data());
}

/**
 * @returns {Promise<number | null>}
 */
async function countByShopId(shopId) {
  const db = fs();
  if (!db || !shopId) return null;
  try {
    const snap = await db.collection('products').where('shopId', '==', String(shopId)).count().get();
    return snap.data().count;
  } catch {
    const fallback = await db.collection('products').where('shopId', '==', String(shopId)).get();
    return fallback.size;
  }
}

/**
 * Seller's products by Firebase uid (JWT sellers).
 * @returns {Promise<{ products: object[], total: number, page: number } | null>}
 */
async function listBySeller({ sellerId, page = 1, limit = 20 }) {
  const db = fs();
  if (!db || !sellerId) return null;

  const lim = Math.min(100, Math.max(1, limit));
  const pageNum = Math.max(1, page);
  const sid = String(sellerId);

  let q = db.collection('products').where('sellerId', '==', sid).orderBy('createdAt', 'desc');

  if (pageNum === 1) {
    const snap = await q.limit(lim).get();
    const products = snap.docs.map((d) => mapDoc(d.id, d.data())).filter(Boolean);
    let total;
    try {
      const totalSnap = await db.collection('products').where('sellerId', '==', sid).count().get();
      total = totalSnap.data().count;
    } catch {
      const fb = await db.collection('products').where('sellerId', '==', sid).get();
      total = fb.size;
    }
    return { products, total, page: pageNum };
  }

  const skip = (pageNum - 1) * lim;
  const window = await q.limit(skip + lim).get();
  const all = window.docs.map((d) => mapDoc(d.id, d.data())).filter(Boolean);
  const products = all.slice(skip, skip + lim);
  let total;
  try {
    const totalSnap = await db.collection('products').where('sellerId', '==', sid).count().get();
    total = totalSnap.data().count;
  } catch {
    const fb = await db.collection('products').where('sellerId', '==', sid).get();
    total = fb.size;
  }
  return { products, total, page: pageNum };
}

/**
 * Name/description search with optional businessType filter (in-memory; caps scan size).
 */
async function searchPublicCatalog({ db, businessType, needle, page, limit }) {
  const snap = await db.collection('products').where('inStock', '==', true).limit(600).get();
  let list = snap.docs.map((d) => mapDoc(d.id, d.data())).filter(Boolean);
  const bt = String(businessType || '').trim();
  if (bt) {
    list = list.filter((p) => p.businessType === bt || p.category === bt);
  }
  list = list.filter(
    (p) =>
      p.name.toLowerCase().includes(needle) ||
      (p.description || '').toLowerCase().includes(needle)
  );
  list.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
  const total = list.length;
  const skip = (page - 1) * limit;
  const products = list.slice(skip, skip + limit);
  return { products, total, page };
}

/**
 * Public catalog: inStock products, optional businessType/category, optional name search (q), paginated.
 * @returns {Promise<{ products: object[], total: number, page: number } | null>}
 */
async function listPublicCatalog({ category, businessType, q: searchQ, page = 1, limit = 24 }) {
  const db = fs();
  if (!db) return null;

  const lim = Math.min(100, Math.max(1, limit));
  const pageNum = Math.max(1, page);
  const bt = String(businessType || category || '').trim();
  const needle = searchQ != null ? String(searchQ).trim().toLowerCase() : '';

  if (needle) {
    return searchPublicCatalog({ db, businessType: bt, needle, page: pageNum, limit: lim });
  }

  let base = db.collection('products').where('inStock', '==', true);
  if (bt) {
    base = base.where('businessType', '==', bt);
  }
  const queryRef = base.orderBy('createdAt', 'desc');

  if (pageNum === 1) {
    const snap = await queryRef.limit(lim).get();
    const products = snap.docs.map((d) => mapDoc(d.id, d.data())).filter(Boolean);
    let total;
    try {
      const totalSnap = await (bt
        ? db.collection('products').where('inStock', '==', true).where('businessType', '==', bt).count()
        : db.collection('products').where('inStock', '==', true).count()
      ).get();
      total = totalSnap.data().count;
    } catch {
      const baseQ = bt
        ? db.collection('products').where('inStock', '==', true).where('businessType', '==', bt)
        : db.collection('products').where('inStock', '==', true);
      const fb = await baseQ.get();
      total = fb.size;
    }
    return { products, total, page: pageNum };
  }

  const skip = (pageNum - 1) * lim;
  const window = await queryRef.limit(skip + lim).get();
  const all = window.docs.map((d) => mapDoc(d.id, d.data())).filter(Boolean);
  const products = all.slice(skip, skip + lim);
  let total;
  try {
    const totalSnap = await (bt
      ? db.collection('products').where('inStock', '==', true).where('businessType', '==', bt).count()
      : db.collection('products').where('inStock', '==', true).count()
    ).get();
    total = totalSnap.data().count;
  } catch {
    const baseQ = bt
      ? db.collection('products').where('inStock', '==', true).where('businessType', '==', bt)
      : db.collection('products').where('inStock', '==', true);
    const fb = await baseQ.get();
    total = fb.size;
  }
  return { products, total, page: pageNum };
}

/**
 * Delete product (seller owns shop or sellerId matches firebase uid).
 * @returns {Promise<{ ok: true } | { error: string } | null>}
 */
async function deleteProduct(productId, dbUser) {
  const db = fs();
  if (!db || !productId) return null;
  const ref = db.collection('products').doc(String(productId));
  const snap = await ref.get();
  if (!snap.exists) {
    return { error: 'not_found' };
  }
  const data = snap.data();
  const sellerId = data.sellerId != null ? String(data.sellerId) : '';
  const shopId = data.shopId != null ? String(data.shopId) : '';

  if (dbUser.firebaseUid && sellerId && sellerId === String(dbUser.firebaseUid)) {
    await ref.delete();
    return { ok: true };
  }

  const shop = shopId ? await Shop.findById(shopId) : null;
  if (shop && String(shop.ownerId) === String(dbUser._id)) {
    await ref.delete();
    return { ok: true };
  }

  if (dbUser.role === 'admin') {
    await ref.delete();
    return { ok: true };
  }

  return { error: 'forbidden' };
}

module.exports = {
  listByShop,
  listBySeller,
  getById,
  countByShopId,
  listPublicCatalog,
  deleteProduct,
};
