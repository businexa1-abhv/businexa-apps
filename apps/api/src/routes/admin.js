/**
 * Mounted at /api/admin — admin role only.
 */
const express = require('express');
const adminController = require('../controllers/adminController');
const { requireAuth, requireDbUser, requireAdmin } = require('../middleware/authMiddleware');
const { adminUpdateUserRoleBody, validateBody } = require('../middleware/validators');

const router = express.Router();

const authAdmin = [requireAuth, requireDbUser, requireAdmin()];

router.get('/users', ...authAdmin, adminController.listUsers);
router.patch(
  '/users/:userId/role',
  ...authAdmin,
  validateBody(adminUpdateUserRoleBody),
  adminController.updateUserRole
);
router.get('/shops', ...authAdmin, adminController.listShops);
router.get('/stats', ...authAdmin, adminController.stats);

module.exports = router;
