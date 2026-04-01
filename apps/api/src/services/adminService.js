/**
 * Admin-only: users, shops listing; role updates.
 */
const User = require('../models/User');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const { USER_ROLES } = require('../constants/roles');

async function listUsers({ page = 1, limit = 20, role } = {}) {
  const q = {};
  if (role && USER_ROLES.includes(role)) q.role = role;
  const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
  const take = Math.min(100, Math.max(1, limit));
  const [users, total] = await Promise.all([
    User.find(q).sort({ createdAt: -1 }).skip(skip).limit(take).lean(),
    User.countDocuments(q),
  ]);
  return { users, total, page: Math.max(1, page) };
}

async function updateUserRole(requestingUserId, targetUserId, newRole) {
  if (!USER_ROLES.includes(newRole)) {
    return { error: 'invalid_role' };
  }
  const target = await User.findById(targetUserId);
  if (!target) return { error: 'not_found' };

  target.role = newRole;
  await target.save();
  return { user: target };
}

async function listShops({ page = 1, limit = 20 } = {}) {
  const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
  const take = Math.min(100, Math.max(1, limit));
  const [shops, total] = await Promise.all([
    Shop.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(take)
      .populate('ownerId', 'username email role mobileNumber fullName')
      .lean(),
    Shop.countDocuments({}),
  ]);
  return { shops, total, page: Math.max(1, page) };
}

async function getStats() {
  const [usersByRole, shopCount, productCount] = await Promise.all([
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    Shop.countDocuments({}),
    Product.countDocuments({}),
  ]);
  return { usersByRole, shopCount, productCount };
}

module.exports = {
  listUsers,
  updateUserRole,
  listShops,
  getStats,
};
