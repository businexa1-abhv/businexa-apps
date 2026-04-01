/**
 * Mounted at /api/admin — admin role + per-area permissions (adminAccess.js).
 */
const express = require('express');
const adminController = require('../controllers/adminController');
const { requireAuth, requireDbUser } = require('../middleware/authMiddleware');
const { requireAdminPermission } = require('../middleware/adminPermission');
const { adminUpdateUserRoleBody, validateBody } = require('../middleware/validators');

const router = express.Router();

const auth = [requireAuth, requireDbUser];

router.get(
  '/me',
  ...auth,
  requireAdminPermission('users', 'view'),
  adminController.adminMe
);
router.get(
  '/users',
  ...auth,
  requireAdminPermission('users', 'view'),
  adminController.listUsers
);
router.patch(
  '/users/:userId/role',
  ...auth,
  requireAdminPermission('users', 'edit'),
  validateBody(adminUpdateUserRoleBody),
  adminController.updateUserRole
);
router.get(
  '/shops',
  ...auth,
  requireAdminPermission('shops', 'view'),
  adminController.listShops
);
router.get(
  '/stats',
  ...auth,
  requireAdminPermission('analytics', 'view'),
  adminController.stats
);
router.get(
  '/audit-logs',
  ...auth,
  requireAdminPermission('audit', 'view'),
  adminController.listAuditLogs
);

module.exports = router;
