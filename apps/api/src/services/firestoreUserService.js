/**
 * Firestore profile docs: users/{firebaseUid} — e.g. businessType for sellers.
 */
const crypto = require('crypto');
const logger = require('../utils/logger');
const { initFirebaseAdmin } = require('../config/firebase');

function adminSdk() {
  initFirebaseAdmin();
  return require('firebase-admin');
}

/**
 * Create or fetch Firebase Auth user by email (JWT sellers need a uid for Firestore users/{uid}).
 * Uses a random password; login remains JWT-based.
 */
async function ensureFirebaseAuthUserByEmail(email) {
  const admin = adminSdk();
  if (!admin.apps.length) return null;
  const pwd = crypto.randomBytes(32).toString('hex');
  const em = String(email || '')
    .trim()
    .toLowerCase();
  try {
    return await admin.auth().createUser({
      email: em,
      password: pwd,
      emailVerified: true,
    });
  } catch (e) {
    if (e.code === 'auth/email-already-exists') {
      return admin.auth().getUserByEmail(em);
    }
    throw e;
  }
}

async function deleteFirebaseAuthUser(uid) {
  try {
    const admin = adminSdk();
    if (!admin.apps.length || !uid) return;
    await admin.auth().deleteUser(uid);
  } catch (e) {
    logger.warn('deleteFirebaseAuthUser failed', { uid, err: e.message });
  }
}

async function setBusinessType(uid, businessType) {
  const admin = adminSdk();
  if (!admin.apps.length || !uid || businessType == null) return;
  const v = String(businessType).trim();
  if (!v) return;
  await admin
    .firestore()
    .collection('users')
    .doc(uid)
    .set(
      {
        businessType: v,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}

async function getBusinessType(uid) {
  const admin = adminSdk();
  if (!admin.apps.length || !uid) return null;
  const snap = await admin.firestore().collection('users').doc(uid).get();
  if (!snap.exists) return null;
  const d = snap.data();
  return typeof d.businessType === 'string' ? d.businessType : null;
}

module.exports = {
  ensureFirebaseAuthUserByEmail,
  deleteFirebaseAuthUser,
  setBusinessType,
  getBusinessType,
};
