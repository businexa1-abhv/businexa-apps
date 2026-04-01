#!/usr/bin/env node
/**
 * Database seed: admin users from `scripts/admins.seed.json` (JWT email + password).
 *
 * Usage (from apps/api):
 *   Set SEED_ENABLED=true in .env
 *   Optional: SEED_ADMINS_PASSWORD (defaults to Harsha@1234 if unset)
 *   npm run seed
 *
 * Edits `admins.seed.json` to add/remove rows: { email, adminLevel, fullName }.
 * Same password is applied to every listed admin (re-applied on each seed run).
 *
 * Uses same env loading as server.js (.env then .env.businexaDev | .env.businexaProd).
 */
require('../src/config/loadEnv');

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { validatePasswordStrength, isValidLoginEmail } = require('@businexa/shared');
const { connectMongoDB, disconnectMongoDB } = require('../src/config/mongodb');
const User = require('../src/models/User');
const { ROLES } = require('../src/constants/roles');
const { ADMIN_LEVELS } = require('../src/constants/adminAccess');

const SALT_ROUNDS = 12;

const ADMINS_JSON = path.join(__dirname, 'admins.seed.json');

/** Shared dev default; override with SEED_ADMINS_PASSWORD in .env for other environments. */
const DEFAULT_SEED_PASSWORD = 'Harsha@1234';

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
      e.code === 26 ||
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

function loadAdminsConfig() {
  if (!fs.existsSync(ADMINS_JSON)) {
    throw new Error(`Missing ${ADMINS_JSON} — create it or copy from admins.seed.json in repo.`);
  }
  const raw = fs.readFileSync(ADMINS_JSON, 'utf8');
  const data = JSON.parse(raw);
  const list = Array.isArray(data.admins) ? data.admins : Array.isArray(data) ? data : null;
  if (!list || list.length === 0) {
    throw new Error('admins.seed.json must contain a non-empty "admins" array.');
  }
  return list;
}

async function seedAdmins() {
  const password = String(
    process.env.SEED_ADMINS_PASSWORD || process.env.SEED_ADMIN_PASSWORD || DEFAULT_SEED_PASSWORD
  );
  const pw = validatePasswordStrength(password);
  if (!pw.ok) {
    throw new Error(`SEED_ADMINS_PASSWORD: ${pw.message}`);
  }

  const entries = loadAdminsConfig();
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  await ensureSparseUniqueEmailIndex();
  await normalizeEmptyEmails();

  let created = 0;
  let updated = 0;

  for (const row of entries) {
    const email = String(row.email || '')
      .trim()
      .toLowerCase();
    const adminLevel = String(row.adminLevel || 'super-admin').trim();
    const fullName = row.fullName != null ? String(row.fullName).trim() : 'Admin';

    if (!isValidLoginEmail(email)) {
      throw new Error(`Invalid email in admins.seed.json: ${row.email}`);
    }
    if (!ADMIN_LEVELS.includes(adminLevel)) {
      throw new Error(`Invalid adminLevel "${adminLevel}" for ${email}. Use: ${ADMIN_LEVELS.join(', ')}`);
    }

    let user = await User.findOne({ username: email });

    if (!user) {
      await User.create({
        username: email,
        passwordHash,
        role: ROLES.ADMIN,
        adminLevel,
        isVerified: true,
        fullName: fullName || 'Admin',
      });
      created += 1;
      // eslint-disable-next-line no-console
      console.log(`[seed] Created admin ${email} (${adminLevel})`);
      continue;
    }

    user.role = ROLES.ADMIN;
    user.adminLevel = adminLevel;
    user.passwordHash = passwordHash;
    user.isVerified = true;
    if (fullName) user.fullName = fullName;
    await user.save();
    updated += 1;
    // eslint-disable-next-line no-console
    console.log(`[seed] Updated admin ${email} (${adminLevel})`);
  }

  // eslint-disable-next-line no-console
  console.log(`[seed] Admins summary: ${created} created, ${updated} updated (${entries.length} in JSON).`);
}

async function main() {
  if (String(process.env.SEED_ENABLED || '').toLowerCase() !== 'true') {
    // eslint-disable-next-line no-console
    console.error('[seed] Refusing to run: set SEED_ENABLED=true in apps/api/.env');
    process.exit(1);
  }

  await connectMongoDB();
  try {
    await seedAdmins();
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
