/**
 * Admin-only routes — users, shops, stats, audit.
 */
const adminService = require('../services/adminService');
const { logAdminAction } = require('../services/auditService');
const { getEffectiveAdminPermissions } = require('../constants/adminAccess');
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
    await logAdminAction(req, {
      resourceType: 'user',
      resourceId: out.user._id,
      action: 'update',
      changes: {
        before: { role: out.previousRole },
        after: { role: out.user.role },
      },
      details: { field: 'role' },
    });
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

/** GET /api/admin/me — effective admin permissions for the current admin (UI gating). */
async function adminMe(req, res, next) {
  try {
    const perms = getEffectiveAdminPermissions(req.dbUser);
    res.json({
      success: true,
      adminLevel: req.dbUser.adminLevel || 'super-admin',
      adminPermissions: perms,
    });
  } catch (e) {
    next(e);
  }
}

async function listAuditLogs(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const out = await adminService.listAuditLogs({ page, limit });
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
  adminMe,
  listAuditLogs,
};
