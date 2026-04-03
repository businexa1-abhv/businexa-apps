/**
 * Canonical business / shop categories (Firestore `businessCategories` + Mongo `Shop.category`).
 * @see scripts/seedFirestoreCategories.js
 */
const BUSINESS_CATEGORY_NAMES = [
  'Food',
  'Clothing',
  'Jewellery',
  'Beauty',
  'Electronics',
  'Grocery',
  'Home',
  'Books',
  'Gifts',
  'Pets',
  'Auto',
];

function slugifyName(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

function fallbackDocs() {
  return BUSINESS_CATEGORY_NAMES.map((name, order) => ({
    id: slugifyName(name),
    name,
    slug: slugifyName(name),
    order,
  }));
}

module.exports = { BUSINESS_CATEGORY_NAMES, slugifyName, fallbackDocs };
