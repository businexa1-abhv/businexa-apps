#!/usr/bin/env node
/**
 * One-off database seed: bootstrap admin (username + password / JWT).
 *
 * Usage (from apps/api):
 *   Set in .env: SEED_ENABLED=true, SEED_ADMIN_USERNAME=email, SEED_ADMIN_PASSWORD=strong (see @businexa/shared)
 *   npm run seed
 *
 * Safe by default: does nothing unless SEED_ENABLED=true.
 *
 * Uses same env loading as server.js (.env then .env.businexaDev | .env.businexaProd).
 * Seed the dev DB by default; for production run with BUSINEXA_ENV=businexaProd explicitly.
 */
require('../src/config/loadEnv');

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { validatePasswordStrength, isValidLoginEmail } = require('@businexa/shared');
const { connectMongoDB, disconnectMongoDB } = require('../src/config/mongodb');
const User = require('../src/models/User');
const { ROLES } = require('../src/constants/roles');

const SALT_ROUNDS = 12;

/**
 * Non-sparse unique index on email treats every missing field as the same "null" key — only one doc
 * can omit email. Replace with sparse unique so many users can omit email; only non-empty emails compete.
 */
async function ensureSparseUniqueEmailIndex() {
  const coll = User.collection;
  try {
    await coll.dropIndex('email_1');
  } catch (e) {
    const ok =
      e.code === 26 || // NamespaceNotFound — no users collection yet
      e.code === 27 ||
      e.codeName === 'IndexNotFound' ||
      e.codeName === 'NamespaceNotFound';
    if (!ok) throw e;
  }
  await coll.createIndex({ email: 1 }, { unique: true, sparse: true, name: 'email_1' });
}

async function normalizeEmptyEmails() {
  const emptyStr = await User.updateMany({ email: '' }, { $unset: { email: 1 } });
  const bsonNull = await User.updateMany({ email: { $type: 10 } }, { $unset: { email: 1 } });
  const n = (emptyStr.modifiedCount || 0) + (bsonNull.modifiedCount || 0);
  if (n > 0) {
    // eslint-disable-next-line no-console
    console.log(`[seed] Unset empty/null email on ${n} user(s) (unique index compatibility).`);
  }
}

async function seedAdmin() {
  const username = String(process.env.SEED_ADMIN_USERNAME || 'admin@businexa.local')
    .trim()
    .toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!password) {
    throw new Error('Set SEED_ADMIN_PASSWORD in .env.');
  }
  if (!isValidLoginEmail(username)) {
    throw new Error('SEED_ADMIN_USERNAME must be a valid email (e.g. admin@yourdomain.com).');
  }
  const pw = validatePasswordStrength(password);
  if (!pw.ok) {
    throw new Error(`SEED_ADMIN_PASSWORD: ${pw.message}`);
  }

  await ensureSparseUniqueEmailIndex();
  await normalizeEmptyEmails();

  const existing = await User.findOne({ username });

  if (existing) {
    if (existing.role !== ROLES.ADMIN) {
      existing.role = ROLES.ADMIN;
      if (!existing.adminLevel) existing.adminLevel = 'super-admin';
      await existing.save();
      // eslint-disable-next-line no-console
      console.log(`[seed] Promoted existing user "${username}" to admin.`);
      return;
    }
    // eslint-disable-next-line no-console
    console.log(`[seed] User "${username}" already exists as admin — skipped.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const doc = {
    username,
    passwordHash,
    role: ROLES.ADMIN,
    adminLevel: 'super-admin',
    isVerified: true,
    fullName: String(process.env.SEED_ADMIN_FULL_NAME || 'Platform Admin').trim(),
  };

  await User.create(doc);

  // eslint-disable-next-line no-console
  console.log(`[seed] Created admin user "${username}" (JWT login at POST /api/auth/login).`);
}

async function main() {
  if (String(process.env.SEED_ENABLED || '').toLowerCase() !== 'true') {
    // eslint-disable-next-line no-console
    console.error('[seed] Refusing to run: set SEED_ENABLED=true in apps/api/.env');
    process.exit(1);
  }

  await connectMongoDB();
  try {
    await seedAdmin();
    const dbName = mongoose.connection.name;
    const cols = await mongoose.connection.db.listCollections().toArray();
    const names = cols.map((c) => c.name).sort();
    // eslint-disable-next-line no-console
    console.log(
      `[seed] Done. In Atlas, open database "${dbName}" — collections: ${names.join(', ') || '(none)'}`
    );
  } finally {
    await disconnectMongoDB();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[seed] Failed:', err.message || err);
  process.exit(1);
});
