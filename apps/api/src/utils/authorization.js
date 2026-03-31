const { AppError } = require('../middleware/errorHandler');
const { ROLES } = require('../constants/roles');

function isAdminRole(role) {
  return role === ROLES.ADMIN;
}

/** @param {import('express').Request} req */
function isAdmin(req) {
  return isAdminRole(req.dbUser?.role);
}

/**
 * Shop must exist. Admin may access any shop; others only their own.
 * @param {import('express').Request} req
 * @param {{ ownerId?: unknown } | null} shop
 */
function assertShopOwnerOrAdmin(req, shop) {
  if (!shop) throw new AppError('Shop not found', 404);
  if (isAdmin(req)) return;
  if (!req.dbUser) throw new AppError('Unauthorized', 401);
  if (String(shop.ownerId) !== String(req.dbUser._id)) throw new AppError('Forbidden', 403);
}

module.exports = {
  ROLES,
  isAdminRole,
  isAdmin,
  assertShopOwnerOrAdmin,
};
