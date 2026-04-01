/**
 * Role model (MongoDB `User.role`): buyer | seller | admin.
 * Enforce with `requireRole`, `requireAdmin`, `requireSellerOrAdmin`, or `assertShopOwnerOrAdmin`.
 *
 * Staff with `role: admin` also have `adminLevel` + `adminPermissions` — see `constants/adminAccess.js`
 * and middleware `requireAdminPermission` on `/api/admin/*` routes.
 */
const { ROLES } = require('./roles');

/** Human-readable map for docs / clients. */
const ROLE_DESCRIPTIONS = {
  [ROLES.BUYER]: 'Browse shops and products; no shop management.',
  [ROLES.SELLER]: 'Owns a shop; manage products, subscriptions, QR for own shop.',
  [ROLES.ADMIN]:
    'Platform administration via /api/admin/*; granular rights from adminLevel + adminPermissions.',
};

module.exports = {
  ROLES,
  ROLE_DESCRIPTIONS,
};
