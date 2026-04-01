/**
 * Fine-grained checks for `role: admin` (after requireAuth + requireDbUser).
 */
const { AppError } = require('./errorHandler');
const { hasAdminPermission } = require('../constants/adminAccess');

/**
 * @param {string} area - users | shops | products | subscriptions | analytics | audit | communications | settings | adminManagement
 * @param {string} [capability] - view | edit | delete | manage
 */
function requireAdminPermission(area, capability = 'view') {
  return (req, res, next) => {
    if (!req.dbUser) {
      return next(new AppError('Unauthorized', 401, 'NO_PROFILE'));
    }
    if (req.dbUser.role !== 'admin') {
      return next(new AppError('Forbidden', 403, 'FORBIDDEN_ROLE'));
    }
    if (!hasAdminPermission(req.dbUser, area, capability)) {
      return next(new AppError('Insufficient admin permissions', 403, 'ADMIN_FORBIDDEN'));
    }
    next();
  };
}

module.exports = { requireAdminPermission };
