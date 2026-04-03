#!/usr/bin/env node
/**
 * Seed Firestore collection `businessCategories` (name, slug, order).
 *
 * From apps/api with Firebase credentials configured (same as API server).
 *   node scripts/seedFirestoreCategories.js
 */
require('../src/config/loadEnv');

const { initFirebaseAdmin, admin } = require('../src/config/firebase');
const { BUSINESS_CATEGORY_NAMES, slugifyName } = require('../src/constants/businessCategories');

async function main() {
  if (String(process.env.SKIP_FIREBASE_INIT || '').toLowerCase() === 'true') {
    // eslint-disable-next-line no-console
    console.error('[seedFirestoreCategories] Refusing: SKIP_FIREBASE_INIT=true');
    process.exit(1);
  }

  initFirebaseAdmin();
  if (!admin.apps.length) {
    // eslint-disable-next-line no-console
    console.error(
      '[seedFirestoreCategories] Firebase Admin not initialized. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_* in .env'
    );
    process.exit(1);
  }

  const batch = admin.firestore().batch();
  BUSINESS_CATEGORY_NAMES.forEach((name, order) => {
    const slug = slugifyName(name);
    const ref = admin.firestore().collection('businessCategories').doc(slug);
    batch.set(ref, { name, slug, order }, { merge: true });
  });
  await batch.commit();
  // eslint-disable-next-line no-console
  console.log(`[seedFirestoreCategories] Wrote ${BUSINESS_CATEGORY_NAMES.length} documents to businessCategories.`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[seedFirestoreCategories] Failed:', err.message || err);
  process.exit(1);
});
