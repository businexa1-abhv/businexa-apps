#!/usr/bin/env node
/**
 * Hyderabadi demo data: sellers (+ shops + products), buyers, admins.
 *
 * Prerequisite: `MONGODB_URI` in `apps/api/.env` (this script loads the same env as the API).
 *
 * Run from repository root:
 *   node server/seed.js
 *
 * Notes (schemas as of this repo):
 * - Models live under `apps/api/src/models/`. There is NO `Category.js` — categories are strings on Shop/Product.
 * - `Shop` has no `lat`/`lng` fields; coordinates are stored in `description` as text.
 * - `Product` uses `ownerId` (Mongo user id), not `sellerId`; stock visibility uses `isVisible` (no `inStock` in Mongo).
 * - All JWT users share the same demo password (see PLAIN_PASSWORD below).
 * - Sellers have **no** `firebaseUid` (Mongo/JWT only). Public shop + Mongo product APIs work; the **web seller
 *   Firestore product UI** (dashboard grid, client Firestore CRUD) requires a linked Firebase account — use normal
 *   seller registration with Firebase configured, or extend this script with Firebase Admin to create Auth users.
 */
const path = require('path');

require(path.join(__dirname, '../apps/api/src/config/loadEnv'));

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { connectMongoDB, disconnectMongoDB } = require('../apps/api/src/config/mongodb');

const User = require('../apps/api/src/models/User');
const Shop = require('../apps/api/src/models/Shop');
const Product = require('../apps/api/src/models/Product');

const SALT_ROUNDS = 12;
const PLAIN_PASSWORD = 'password123';

/** Decimal128 helper aligned with `apps/api/src/services/productService.js` */
function toDecimal128(n) {
  return mongoose.Types.Decimal128.fromString(String(n));
}

function slugify(base) {
  let s = String(base || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  if (!s) s = 'shop';
  return s;
}

function ensureUniqueSlug(base) {
  return `${slugify(base)}-${Date.now().toString(36)}`;
}

/** Approximate Hyderabad-area coordinates (for description text only). */
const LOCATIONS = [
  { area: 'Madhapur, Hyderabad', lat: 17.4489, lng: 78.3908 },
  { area: 'Charminar, Hyderabad', lat: 17.3616, lng: 78.4747 },
  { area: 'Begumpet, Hyderabad', lat: 17.4375, lng: 78.4692 },
  { area: 'Banjara Hills, Hyderabad', lat: 17.4065, lng: 78.4772 },
  { area: 'Abids, Hyderabad', lat: 17.385, lng: 78.4867 },
];

const SELLERS = [
  { fullName: 'Ravi Kumar', businessKey: 'food', businessLabel: 'Food', email: 'seed.ravi.kumar@example.com' },
  { fullName: 'Fatima Begum', businessKey: 'clothing', businessLabel: 'Clothing', email: 'seed.fatima.begum@example.com' },
  { fullName: 'Suresh Reddy', businessKey: 'jewellery', businessLabel: 'Jewellery', email: 'seed.suresh.reddy@example.com' },
  { fullName: 'Priya Sharma', businessKey: 'beauty', businessLabel: 'Beauty', email: 'seed.priya.sharma@example.com' },
  { fullName: 'Mohammed Ali', businessKey: 'electronics', businessLabel: 'Electronics', email: 'seed.mohammed.ali@example.com' },
];

/** Buyers — JWT (username + password); no shop. */
const BUYERS = [
  { fullName: 'Ananya Rao', email: 'seed.buyer.ananya@example.com' },
  { fullName: 'Karthik Nair', email: 'seed.buyer.karthik@example.com' },
  { fullName: 'Sneha Iyer', email: 'seed.buyer.sneha@example.com' },
];

/**
 * Admins — `adminLevel` must match User schema enum.
 * @type {Array<{ fullName: string; email: string; adminLevel: 'super-admin' | 'moderator' | 'analyst' | 'support' }>}
 */
const ADMINS = [
  { fullName: 'Admin Console', email: 'seed.admin.super@example.com', adminLevel: 'super-admin' },
  { fullName: 'Moderation Desk', email: 'seed.admin.moderator@example.com', adminLevel: 'moderator' },
  { fullName: 'Analytics Bot', email: 'seed.admin.analyst@example.com', adminLevel: 'analyst' },
  { fullName: 'Support Line', email: 'seed.admin.support@example.com', adminLevel: 'support' },
];

const PRODUCT_ROWS = {
  food: [
    { name: 'Hyderabadi Biryani', price: 350, description: 'Fragrant basmati with tender meat — Hyderabadi style.' },
    { name: 'Haleem', price: 180, description: 'Slow-cooked wheat and lentils with spices.' },
    { name: 'Mirchi ka Salan', price: 120, description: 'Classic chilli curry — pairs with biryani.' },
    { name: 'Qubani ka Meetha', price: 90, description: 'Apricot dessert, royal Hyderabad sweet.' },
    { name: 'Lukhmi', price: 40, description: 'Crisp mince-stuffed squares — tea-time favourite.' },
  ],
  clothing: [
    { name: 'Silk Saree', price: 4500, description: 'Handloom silk with zari border.' },
    { name: 'Salwar Kameez', price: 2200, description: 'Embroidered cotton-silk set.' },
    { name: 'Lehenga Choli', price: 15000, description: 'Festive lehenga with dupatta.' },
    { name: 'Pathani Suit', price: 2800, description: 'Classic Pathani kurta set.' },
    { name: 'Dupatta', price: 850, description: 'Chiffon dupatta with light embroidery.' },
  ],
  jewellery: [
    { name: 'Gold Necklace', price: 85000, description: '22K gold necklace — traditional design.' },
    { name: 'Diamond Earrings', price: 45000, description: 'Stud earrings with certified diamonds.' },
    { name: 'Silver Anklet', price: 1200, description: 'Sterling silver ghungroo anklet.' },
    { name: 'Bangles Set', price: 8500, description: 'Gold-plated bangles set of four.' },
    { name: 'Nose Ring', price: 3500, description: 'Delicate gold nose pin.' },
  ],
  beauty: [
    { name: 'Kumkuma Puvvu Face Pack', price: 450, description: 'Saffron and floral blend face pack.' },
    { name: 'Rose Water Toner', price: 320, description: 'Steam-distilled rose water toner.' },
    { name: 'Almond Hair Oil', price: 280, description: 'Cold-pressed almond oil for hair.' },
    { name: 'Kajal', price: 150, description: 'Traditional smudge-proof kajal.' },
    { name: 'Haldi Ubtan', price: 380, description: 'Turmeric ubtan for brightening.' },
  ],
  electronics: [
    { name: 'Mobile Phone', price: 15999, description: 'Dual-SIM smartphone — latest budget model.' },
    { name: 'Bluetooth Speaker', price: 2499, description: 'Portable 10W speaker with IPX5.' },
    { name: 'Power Bank', price: 1999, description: '20000 mAh fast-charge power bank.' },
    { name: 'Smart Watch', price: 3999, description: 'Fitness tracking and notifications.' },
    { name: 'Earbuds', price: 1299, description: 'TWS earbuds with ENC.' },
  ],
};

async function dropCollections(db) {
  const toDrop = ['products', 'shops', 'users'];
  for (const name of toDrop) {
    try {
      await db.collection(name).drop();
      // eslint-disable-next-line no-console
      console.log(`[seed] Dropped collection: ${name}`);
    } catch (e) {
      const ok =
        e.code === 26 ||
        e.code === 27 ||
        e.codeName === 'NamespaceNotFound' ||
        e.message?.includes('ns not found');
      if (!ok) throw e;
    }
  }
}

async function main() {
  let sellersInserted = 0;
  let buyersInserted = 0;
  let adminsInserted = 0;
  let shopsInserted = 0;
  let productsInserted = 0;
  let failures = 0;
  const errors = [];

  await connectMongoDB();
  const db = mongoose.connection.db;

  try {
    await dropCollections(db);

    const passwordHash = await bcrypt.hash(PLAIN_PASSWORD, SALT_ROUNDS);

    for (let i = 0; i < SELLERS.length; i += 1) {
      const row = SELLERS[i];
      const loc = LOCATIONS[i];
      try {
        const user = await User.create({
          username: row.email,
          email: row.email,
          passwordHash,
          role: 'seller',
          fullName: row.fullName,
          isVerified: true,
        });
        sellersInserted += 1;

        const shopName = `${row.fullName.split(' ')[0]}'s ${row.businessLabel} — Hyderabad`;
        const slug = ensureUniqueSlug(`${row.fullName}-${row.businessKey}`);
        const address = loc.area;
        const description =
          `Coordinates (approx.): ${loc.lat}°N, ${loc.lng}°E. Serving ${row.businessLabel.toLowerCase()} in ${address}.`;

        const shop = await Shop.create({
          ownerId: user._id,
          name: shopName,
          slug,
          address,
          businessType: row.businessLabel,
          category: row.businessLabel,
          description,
          isActive: true,
          metrics: { totalProducts: 0, qrScans: 0, views: 0 },
        });
        shopsInserted += 1;

        const rows = PRODUCT_ROWS[row.businessKey];
        if (!rows) {
          throw new Error(`Missing product list for businessKey: ${row.businessKey}`);
        }

        for (const p of rows) {
          await Product.create({
            shopId: shop._id,
            ownerId: user._id,
            name: p.name,
            description: p.description || '',
            price: toDecimal128(p.price),
            businessType: row.businessLabel,
            category: row.businessLabel,
            imageUrl: '',
            isVisible: true,
          });
          productsInserted += 1;
        }

        shop.metrics = shop.metrics || {};
        shop.metrics.totalProducts = rows.length;
        await shop.save();
      } catch (err) {
        failures += 1;
        errors.push({ step: 'seller', name: row.fullName, message: err.message || String(err) });
        // eslint-disable-next-line no-console
        console.error(`[seed] Error for seller ${row.fullName}:`, err.message || err);
      }
    }

    for (const row of BUYERS) {
      try {
        await User.create({
          username: row.email,
          email: row.email,
          passwordHash,
          role: 'buyer',
          fullName: row.fullName,
          isVerified: true,
        });
        buyersInserted += 1;
      } catch (err) {
        failures += 1;
        errors.push({ step: 'buyer', name: row.fullName, message: err.message || String(err) });
        // eslint-disable-next-line no-console
        console.error(`[seed] Error for buyer ${row.fullName}:`, err.message || err);
      }
    }

    for (const row of ADMINS) {
      try {
        await User.create({
          username: row.email,
          email: row.email,
          passwordHash,
          role: 'admin',
          adminLevel: row.adminLevel,
          fullName: row.fullName,
          isVerified: true,
        });
        adminsInserted += 1;
      } catch (err) {
        failures += 1;
        errors.push({ step: 'admin', name: row.fullName, message: err.message || String(err) });
        // eslint-disable-next-line no-console
        console.error(`[seed] Error for admin ${row.fullName}:`, err.message || err);
      }
    }
  } finally {
    await disconnectMongoDB();
  }

  const expectedUsers = SELLERS.length + BUYERS.length + ADMINS.length;

  // eslint-disable-next-line no-console
  console.log('\n--- Seed summary ---');
  // eslint-disable-next-line no-console
  console.log(
    `Users — sellers:   ${sellersInserted} (expected ${SELLERS.length}), buyers: ${buyersInserted} (expected ${BUYERS.length}), admins: ${adminsInserted} (expected ${ADMINS.length}), total: ${sellersInserted + buyersInserted + adminsInserted} (expected ${expectedUsers})`
  );
  // eslint-disable-next-line no-console
  console.log(`Shops inserted:    ${shopsInserted} (expected ${SELLERS.length})`);
  // eslint-disable-next-line no-console
  console.log(`Products inserted: ${productsInserted} (expected ${SELLERS.length * 5})`);
  // eslint-disable-next-line no-console
  console.log(`Failures:          ${failures}`);
  if (errors.length) {
    // eslint-disable-next-line no-console
    console.log('Error details:', JSON.stringify(errors, null, 2));
  }
  // eslint-disable-next-line no-console
  console.log('Done.');
  process.exit(failures > 0 ? 1 : 0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[seed] Fatal:', err.message || err);
  process.exit(1);
});
