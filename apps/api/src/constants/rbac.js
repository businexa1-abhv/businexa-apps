/**
 * Role model (MongoDB `User.role`): buyer | seller | admin.
 * Enforce with `requireRole`, `requireAdmin`, `requireSellerOrAdmin`, or `assertShopOwnerOrAdmin`.
 */
const { ROLES } = require('./roles');

/** Human-readable map for docs / clients. */
const ROLE_DESCRIPTIONS = {
  [ROLES.BUYER]: 'Browse shops and products; no shop management.',
  [ROLES.SELLER]: 'Owns a shop; manage products, subscriptions, QR for own shop.',
  [ROLES.ADMIN]: 'Platform administration: users, shops, stats (see /api/admin/*).',
};

module.exports = {
  ROLES,
  ROLE_DESCRIPTIONS,
};
