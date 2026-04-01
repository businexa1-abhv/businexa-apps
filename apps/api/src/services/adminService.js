/**
 * Admin-only: users, shops listing; role updates; audit log listing.
 */
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { validatePasswordStrength, isValidLoginEmail } = require('@businexa/shared');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Subscription = require('../models/Subscription');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { initFirebaseAdmin } = require('../config/firebase');
const { ROLES, USER_ROLES } = require('../constants/roles');
const { ADMIN_LEVELS } = require('../constants/adminAccess');

const SALT_ROUNDS = 12;

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

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

  const previousRole = target.role;
  target.role = newRole;
  if (newRole !== 'admin') {
    target.adminLevel = undefined;
    target.adminPermissions = undefined;
  } else if (!target.adminLevel) {
    target.adminLevel = 'super-admin';
  }
  await target.save();
  return { user: target, previousRole };
}

async function getUserById(userId) {
  if (!isValidObjectId(userId)) return { error: 'invalid_id' };
  const user = await User.findById(userId);
  if (!user) return { error: 'not_found' };
  return { user };
}

/**
 * Create email/password user (same storage as POST /auth/register). Does not create Firebase OTP users.
 */
async function createUserByAdmin({ username, password, role, fullName, adminLevel }) {
  const u = String(username || '')
    .trim()
    .toLowerCase();
  if (!isValidLoginEmail(u)) {
    return { error: 'invalid_email' };
  }
  const pw = validatePasswordStrength(password);
  if (!pw.ok) {
    return { error: 'weak_password', message: pw.message };
  }
  const exists = await User.exists({ username: u });
  if (exists) {
    return { error: 'duplicate' };
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const fn = fullName != null ? String(fullName).trim() : '';

  const doc = {
    username: u,
    passwordHash,
    role,
    isVerified: true,
    fullName: fn,
  };
  if (role === ROLES.ADMIN) {
    const level =
      adminLevel && ADMIN_LEVELS.includes(String(adminLevel).trim())
        ? String(adminLevel).trim()
        : 'super-admin';
    doc.adminLevel = level;
  }

  try {
    const user = await User.create(doc);
    return { user };
  } catch (err) {
    if (err && (err.code === 11000 || err.code === 11001)) {
      return { error: 'duplicate' };
    }
    throw err;
  }
}

/**
 * Update profile fields for any user. Email/username only for JWT accounts (passwordHash set).
 */
async function updateUserByAdmin(targetUserId, body) {
  if (!isValidObjectId(targetUserId)) return { error: 'invalid_id' };
  const target = await User.findById(targetUserId).select('+passwordHash');
  if (!target) return { error: 'not_found' };

  const before = {
    fullName: target.fullName,
    isVerified: target.isVerified,
    profileImage: target.profileImage,
    username: target.username,
    email: target.email,
  };

  if (body.fullName !== undefined) target.fullName = body.fullName != null ? String(body.fullName).trim() : '';
  if (body.isVerified !== undefined) target.isVerified = Boolean(body.isVerified);
  if (body.profileImage !== undefined) target.profileImage = body.profileImage != null ? String(body.profileImage).trim() : '';

  if (body.email !== undefined && body.email !== null) {
    if (!target.passwordHash) {
      return { error: 'email_locked_firebase' };
    }
    const em = String(body.email).trim().toLowerCase();
    if (!isValidLoginEmail(em)) {
      return { error: 'invalid_email' };
    }
    const taken = await User.findOne({
      _id: { $ne: target._id },
      $or: [{ username: em }, { email: em }],
    }).lean();
    if (taken) {
      return { error: 'duplicate_email' };
    }
    target.username = em;
    target.email = em;
  }

  await target.save();
  const after = {
    fullName: target.fullName,
    isVerified: target.isVerified,
    profileImage: target.profileImage,
    username: target.username,
    email: target.email,
  };
  return { user: target, changes: { before, after } };
}

async function deleteUserByAdmin(actorId, targetUserId) {
  if (!isValidObjectId(targetUserId)) return { error: 'invalid_id' };
  if (String(actorId) === String(targetUserId)) {
    return { error: 'cannot_delete_self' };
  }
  const target = await User.findById(targetUserId);
  if (!target) return { error: 'not_found' };

  const uid = target._id;
  const firebaseUid = target.firebaseUid;

  await Product.deleteMany({ ownerId: uid });
  await Subscription.deleteMany({ userId: uid });
  await Shop.deleteMany({ ownerId: uid });
  await Notification.deleteMany({ userId: uid });
  await User.deleteOne({ _id: uid });

  if (firebaseUid) {
    try {
      initFirebaseAdmin();
      const admin = require('firebase-admin');
      if (admin.apps.length) {
        await admin.auth().deleteUser(firebaseUid);
      }
    } catch (_) {
      /* best-effort */
    }
  }

  return { ok: true };
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

async function listAuditLogs({ page = 1, limit = 50 } = {}) {
  const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
  const take = Math.min(100, Math.max(1, limit));
  const [logs, total] = await Promise.all([
    AuditLog.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(take)
      .populate('userId', 'username email fullName role adminLevel')
      .lean(),
    AuditLog.countDocuments({}),
  ]);
  return { logs, total, page: Math.max(1, page) };
}

module.exports = {
  listUsers,
  updateUserRole,
  getUserById,
  createUserByAdmin,
  updateUserByAdmin,
  deleteUserByAdmin,
  listShops,
  getStats,
  listAuditLogs,
};
