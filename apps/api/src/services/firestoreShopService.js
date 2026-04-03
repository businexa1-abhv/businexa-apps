/**
 * Public mirror: shops/{mongoShopId} — read by anyone; writes via Admin sync from API.
 * Client rules allow sellers to create/update own doc by ownerFirebaseUid.
 */
const { initFirebaseAdmin } = require('../config/firebase');
const logger = require('../utils/logger');

function adminSdk() {
  initFirebaseAdmin();
  return require('firebase-admin');
}

/**
 * @param {import('mongoose').Document} shop
 * @param {string} ownerFirebaseUid
 */
async function syncShop(shop, ownerFirebaseUid) {
  const admin = adminSdk();
  if (!admin.apps.length || !shop?._id || !ownerFirebaseUid) return;
  const bt = String(shop.businessType || shop.category || '').trim();
  try {
    await admin
      .firestore()
      .collection('shops')
      .doc(String(shop._id))
      .set(
        {
          mongoShopId: String(shop._id),
          name: shop.name,
          slug: shop.slug,
          businessType: bt,
          ownerFirebaseUid,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
  } catch (e) {
    logger.warn('Firestore shop sync failed', { err: e.message });
  }
}

async function deleteShopDoc(shopId) {
  const admin = adminSdk();
  if (!admin.apps.length || !shopId) return;
  try {
    await admin.firestore().collection('shops').doc(String(shopId)).delete();
  } catch (e) {
    logger.warn('Firestore shop delete failed', { err: e.message });
  }
}

module.exports = {
  syncShop,
  deleteShopDoc,
};
