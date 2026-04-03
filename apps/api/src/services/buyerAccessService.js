/**
 * Buyer catalog access: 24h trial after signup, then active buyer subscription required.
 * Sellers/admins always have full access to browse other shops.
 */
const BuyerSubscription = require('../models/BuyerSubscription');

const TRIAL_MS = 24 * 60 * 60 * 1000;

async function getActiveBuyerSubscription(userId) {
  const now = new Date();
  return BuyerSubscription.findOne({
    userId,
    status: 'active',
    expiresAt: { $gt: now },
  });
}

function trialEndsAt(user) {
  if (!user?.createdAt) return new Date(0);
  return new Date(user.createdAt.getTime() + TRIAL_MS);
}

function isInTrial(user) {
  if (!user?.createdAt) return false;
  return Date.now() < trialEndsAt(user).getTime();
}

/**
 * @param {import('mongoose').Document | null} user - from optional auth (may be null for guests)
 */
async function getBuyerAccessForUser(user) {
  if (!user) {
    return {
      role: null,
      canAccessPremium: false,
      inTrial: false,
      trialEndsAt: null,
      hasActiveSubscription: false,
    };
  }
  if (user.role === 'seller' || user.role === 'admin') {
    return {
      role: user.role,
      canAccessPremium: true,
      inTrial: false,
      trialEndsAt: null,
      hasActiveSubscription: false,
    };
  }
  if (user.role !== 'buyer') {
    return {
      role: user.role,
      canAccessPremium: false,
      inTrial: false,
      trialEndsAt: null,
      hasActiveSubscription: false,
    };
  }

  const sub = await getActiveBuyerSubscription(user._id);
  const hasActiveSubscription = Boolean(sub);
  const inTrial = isInTrial(user);
  const canAccessPremium = hasActiveSubscription || inTrial;

  return {
    role: 'buyer',
    canAccessPremium,
    inTrial,
    trialEndsAt: trialEndsAt(user).toISOString(),
    hasActiveSubscription,
    subscriptionExpiresAt: sub?.expiresAt ? sub.expiresAt.toISOString() : null,
  };
}

module.exports = {
  getBuyerAccessForUser,
  getActiveBuyerSubscription,
  trialEndsAt,
  isInTrial,
};
