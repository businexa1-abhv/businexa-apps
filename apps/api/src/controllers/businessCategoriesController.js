const logger = require('../config/logger');
const { initFirebaseAdmin, admin } = require('../config/firebase');
const { fallbackDocs } = require('../constants/businessCategories');

/** GET /api/business-categories — Firestore-backed list with static fallback */
async function list(req, res) {
  try {
    initFirebaseAdmin();
    if (process.env.SKIP_FIREBASE_INIT === 'true' || !admin.apps.length) {
      res.set('Cache-Control', 'public, max-age=300');
      return res.json({ categories: fallbackDocs() });
    }
    const snap = await admin.firestore().collection('businessCategories').orderBy('order', 'asc').get();
    if (snap.empty) {
      res.set('Cache-Control', 'public, max-age=300');
      return res.json({ categories: fallbackDocs() });
    }
    const categories = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.set('Cache-Control', 'public, max-age=300');
    res.json({ categories });
  } catch (err) {
    logger.warn('businessCategories Firestore read failed, using fallback', { err: err.message });
    res.set('Cache-Control', 'public, max-age=60');
    res.json({ categories: fallbackDocs() });
  }
}

module.exports = { list };
