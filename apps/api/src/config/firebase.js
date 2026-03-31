/**
 * Firebase Admin SDK — `.env` or JSON file.
 *
 * Recommended: Firebase Console → Project settings → Service accounts → Generate new private key.
 * Save as firebase-service-account.json and set FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
 *
 * Do not use firebase-service-account.example.json — it contains placeholders, not a real key.
 *
 * Skip Firebase: SKIP_FIREBASE_INIT=true
 */
const crypto = require('crypto');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

let initialized = false;

/**
 * Normalize PEM from .env or JSON (line endings, escaped \n, quotes).
 */
function normalizePrivateKey(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let key = raw.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }
  key = key.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  key = key.replace(/\\n/g, '\n');
  return key.trim();
}

function assertValidPemPrivateKey(pem, context) {
  if (!pem.includes('BEGIN') || !pem.includes('PRIVATE KEY')) {
    throw new Error(
      `${context}: private key must include -----BEGIN PRIVATE KEY----- (or RSA PRIVATE KEY). Re-download the JSON from Firebase.`
    );
  }
  try {
    crypto.createPrivateKey({ key: pem, format: 'pem' });
  } catch (e) {
    throw new Error(
      `${context}: invalid PEM (${e.message}). Usually the key was edited, truncated, or copied from the example file. ` +
        'Download a new key: Firebase Console → Project settings → Service accounts → Generate new private key.'
    );
  }
}

function readServiceAccountFromEnv() {
  if (process.env.SKIP_FIREBASE_INIT === 'true') {
    return { skip: true };
  }

  const jsonPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (jsonPath) {
    const abs = path.resolve(process.cwd(), jsonPath);
    if (!fs.existsSync(abs)) {
      throw new Error(`FIREBASE_SERVICE_ACCOUNT_PATH file not found: ${abs}`);
    }
    let raw = fs.readFileSync(abs, 'utf8');
    if (raw.charCodeAt(0) === 0xfeff) {
      raw = raw.slice(1);
    }
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(raw);
    } catch (e) {
      throw new Error(`Invalid JSON in ${abs}: ${e.message}`);
    }
    if (!serviceAccount.private_key || !serviceAccount.client_email || !serviceAccount.project_id) {
      throw new Error(
        `Missing project_id, client_email, or private_key in ${abs}. Use the file from "Generate new private key", not the .example template.`
      );
    }

    serviceAccount.private_key = normalizePrivateKey(serviceAccount.private_key);
    assertValidPemPrivateKey(serviceAccount.private_key, abs);

    let credential;
    try {
      credential = admin.credential.cert(serviceAccount);
    } catch (e) {
      throw new Error(
        `Firebase could not load credentials from ${abs}: ${e.message}. ` +
          'Delete this file, click "Generate new private key" in Firebase, save the new JSON, and try again.'
      );
    }
    return { credential };
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY || '');

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  assertValidPemPrivateKey(privateKey, 'FIREBASE_PRIVATE_KEY in .env');

  let credential;
  try {
    credential = admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    });
  } catch (e) {
    throw new Error(
      `Firebase could not load credentials from .env: ${e.message}. ` +
        'Use FIREBASE_SERVICE_ACCOUNT_PATH with a fresh JSON download instead.'
    );
  }
  return { credential };
}

function initFirebaseAdmin() {
  if (initialized) return admin;

  let creds;
  try {
    creds = readServiceAccountFromEnv();
  } catch (err) {
    logger.error('Firebase config error', { err: err.message });
    throw err;
  }

  if (creds?.skip) {
    logger.warn('Firebase Admin skipped (SKIP_FIREBASE_INIT=true)');
    return admin;
  }

  if (!creds) {
    logger.warn(
      'Firebase Admin not configured — set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_* in .env, or SKIP_FIREBASE_INIT=true'
    );
    return admin;
  }

  if (admin.apps.length) {
    return admin;
  }

  try {
    const options = {
      credential: creds.credential,
    };

    const bucket = process.env.FIREBASE_STORAGE_BUCKET;
    if (bucket) {
      options.storageBucket = bucket;
    }

    admin.initializeApp(options);
    initialized = true;
    logger.info('Firebase Admin initialized');
  } catch (err) {
    logger.error('Firebase Admin initializeApp failed', { err: err.message });
    throw new Error(`Firebase Admin failed: ${err.message}`);
  }

  return admin;
}

module.exports = { initFirebaseAdmin, admin, normalizePrivateKey };
