/**
 * Centralized audit logging (admin actions + existing flows).
 */
const AuditLog = require('../models/AuditLog');

function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string') return xff.split(',')[0].trim();
  if (Array.isArray(xff) && xff[0]) return String(xff[0]).trim();
  return req.ip || '';
}

/**
 * Log an action performed from the admin API (actor = req.dbUser).
 */
async function logAdminAction(req, { resourceType, resourceId, action = 'update', changes, details }) {
  const actorId = req.dbUser?._id;
  if (!actorId) return null;
  try {
    return await AuditLog.create({
      userId: actorId,
      action,
      resourceType,
      resourceId,
      details: { ...(details || {}), source: 'admin_api' },
      changes: changes || undefined,
      ipAddress: clientIp(req),
    });
  } catch (e) {
    return null;
  }
}

module.exports = {
  logAdminAction,
  clientIp,
};
