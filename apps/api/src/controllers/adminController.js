/**
 * Admin-only routes — users, shops, stats, audit.
 */
const adminService = require('../services/adminService');
const { logAdminAction } = require('../services/auditService');
const { getEffectiveAdminPermissions, hasAdminPermission } = require('../constants/adminAccess');
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

async function getUser(req, res, next) {
  try {
    const out = await adminService.getUserById(req.params.userId);
    if (out.error === 'invalid_id') throw new AppError('Invalid user id', 400);
    if (out.error === 'not_found') throw new AppError('User not found', 404);
    res.json({ success: true, user: out.user });
  } catch (e) {
    next(e);
  }
}

async function createUser(req, res, next) {
  try {
    if (req.body.role === 'admin' && !hasAdminPermission(req.dbUser, 'adminManagement')) {
      throw new AppError(
        'Only staff with admin management access can create admin accounts',
        403,
        'ADMIN_FORBIDDEN'
      );
    }
    const out = await adminService.createUserByAdmin(req.body);
    if (out.error === 'invalid_email') throw new AppError('Invalid email', 400);
    if (out.error === 'weak_password') throw new AppError(out.message || 'Weak password', 400);
    if (out.error === 'duplicate') throw new AppError('An account with this email already exists', 409);
    await logAdminAction(req, {
      resourceType: 'user',
      resourceId: out.user._id,
      action: 'create',
      details: { source: 'admin_create_user', role: out.user.role },
    });
    res.status(201).json({ success: true, user: out.user });
  } catch (e) {
    next(e);
  }
}

async function updateUser(req, res, next) {
  try {
    const out = await adminService.updateUserByAdmin(req.params.userId, req.body);
    if (out.error === 'invalid_id') throw new AppError('Invalid user id', 400);
    if (out.error === 'not_found') throw new AppError('User not found', 404);
    if (out.error === 'email_locked_firebase') {
      throw new AppError(
        'Login email can only be changed for password-based accounts (not OTP/Firebase-only users).',
        400,
        'EMAIL_LOCKED'
      );
    }
    if (out.error === 'invalid_email') throw new AppError('Invalid email', 400);
    if (out.error === 'duplicate_email') throw new AppError('That email is already in use', 409);
    await logAdminAction(req, {
      resourceType: 'user',
      resourceId: out.user._id,
      action: 'update',
      changes: out.changes,
      details: { source: 'admin_patch_user' },
    });
    res.json({ success: true, user: out.user });
  } catch (e) {
    next(e);
  }
}

async function deleteUser(req, res, next) {
  try {
    const out = await adminService.deleteUserByAdmin(req.dbUser._id, req.params.userId);
    if (out.error === 'invalid_id') throw new AppError('Invalid user id', 400);
    if (out.error === 'not_found') throw new AppError('User not found', 404);
    if (out.error === 'cannot_delete_self') {
      throw new AppError('Use account settings to delete your own account', 400, 'CANNOT_DELETE_SELF');
    }
    await logAdminAction(req, {
      resourceType: 'user',
      resourceId: req.params.userId,
      action: 'delete',
      details: { source: 'admin_delete_user' },
    });
    res.json({ success: true });
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
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
  listShops,
  stats,
  adminMe,
  listAuditLogs,
};
