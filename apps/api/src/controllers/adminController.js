/**
 * Admin-only routes — users, shops, stats.
 */
const adminService = require('../services/adminService');
const { AppError } = require('../middleware/errorHandler');

async function listUsers(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const role = req.query.role;
    const out = await adminService.listUsers({ page, limit, role });
    res.json({ success: true, ...out });
  } catch (e) {
    next(e);
  }
}

async function updateUserRole(req, res, next) {
  try {
    const out = await adminService.updateUserRole(req.dbUser._id, req.params.userId, req.body.role);
    if (out.error === 'not_found') throw new AppError('User not found', 404);
    if (out.error === 'invalid_role') throw new AppError('Invalid role', 400);
    res.json({ success: true, user: out.user });
  } catch (e) {
    next(e);
  }
}

async function listShops(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const out = await adminService.listShops({ page, limit });
    res.json({ success: true, ...out });
  } catch (e) {
    next(e);
  }
}

async function stats(req, res, next) {
  try {
    const out = await adminService.getStats();
    res.json({ success: true, ...out });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listUsers,
  updateUserRole,
  listShops,
  stats,
};
