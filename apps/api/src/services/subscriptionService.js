/**
 * Plans, Razorpay order/payment verification (HMAC-SHA256), subscription records.
 * @see NODEJS_API_GENERATION_PROMPT.md — KEY BUSINESS LOGIC (Subscription, Payment Verification)
 */
const crypto = require('crypto');
const mongoose = require('mongoose');
const { getRazorpay } = require('../config/razorpay');
const Subscription = require('../models/Subscription');
const Shop = require('../models/Shop');

const PLANS = [
  { id: 'monthly', name: 'Monthly', price: 99, duration: 30 },
  { id: 'quarterly', name: 'Quarterly', price: 279, duration: 90 },
  { id: 'half_yearly', name: 'Half-Yearly', price: 499, duration: 180 },
  { id: 'yearly', name: 'Yearly', price: 899, duration: 365 },
];

function getPlans() {
  return PLANS;
}

function getPlanById(planId) {
  return PLANS.find((p) => p.id === planId) || null;
}

async function getActiveSubscriptionForShop(shopId) {
  const now = new Date();
  return Subscription.findOne({
    shopId,
    status: 'active',
    expiresAt: { $gt: now },
  });
}

/** Subscription gate for QR and premium features. */
async function hasActiveSubscription(shopId) {
  const sub = await getActiveSubscriptionForShop(shopId);
  return Boolean(sub);
}

/**
 * Razorpay payment signature: HMAC-SHA256(orderId + "|" + paymentId, secret)
 */
function verifyRazorpayPaymentSignature(orderId, paymentId, signature) {
  const secret = process.env.RAZORPAY_SECRET;
  if (!secret) return false;
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  const sig = String(signature).trim();
  if (expected.length !== sig.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(sig, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Webhook body signature (raw JSON string as received).
 */
function verifyRazorpayWebhookSignature(rawBody, signatureHeader) {
  const secret = process.env.RAZORPAY_SECRET;
  if (!secret || !signatureHeader) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  const sig = String(signatureHeader).trim();
  if (expected.length !== sig.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(sig, 'hex'));
  } catch {
    return false;
  }
}

async function createRazorpayOrder({ planId, shopId, userId, isAdmin = false }) {
  const plan = getPlanById(planId);
  if (!plan) return { error: 'invalid_plan' };

  const shop = await Shop.findById(shopId);
  if (!shop) return { error: 'shop_not_found' };
  if (!isAdmin && String(shop.ownerId) !== String(userId)) return { error: 'forbidden' };

  const razorpay = getRazorpay();
  if (!razorpay) return { error: 'payments_not_configured' };

  const existing = await getActiveSubscriptionForShop(shopId);
  if (existing) return { error: 'already_subscribed' };

  const order = await razorpay.orders.create({
    amount: plan.price * 100,
    currency: 'INR',
    receipt: `rcpt_${shopId}_${Date.now()}`,
    notes: { planId, shopId: String(shopId), userId: String(userId) },
  });

  return {
    orderId: order.id,
    amount: plan.price * 100,
    currency: order.currency,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    plan,
  };
}

async function activateSubscriptionAfterPayment({
  userId,
  shopId,
  planId,
  orderId,
  paymentId,
  signature,
  isAdmin = false,
}) {
  if (!verifyRazorpayPaymentSignature(orderId, paymentId, signature)) {
    return { error: 'invalid_signature' };
  }

  const plan = getPlanById(planId);
  if (!plan) return { error: 'invalid_plan' };

  const shop = await Shop.findById(shopId);
  if (!shop) return { error: 'shop_not_found' };
  if (!isAdmin && String(shop.ownerId) !== String(userId)) return { error: 'forbidden' };

  const startsAt = new Date();
  const expiresAt = new Date(startsAt.getTime() + plan.duration * 24 * 60 * 60 * 1000);

  const subscription = await Subscription.create({
    userId,
    shopId,
    planType: planId,
    price: mongoose.Types.Decimal128.fromString(String(plan.price)),
    status: 'active',
    razorpayPaymentId: paymentId,
    razorpayOrderId: orderId,
    razorpaySignature: signature,
    startsAt,
    expiresAt,
  });

  shop.subscriptionPlan = planId;
  shop.subscriptionExpiresAt = expiresAt;
  await shop.save();

  return { subscription };
}

async function listSubscriptionsForUser(userId) {
  return Subscription.find({ userId }).sort({ createdAt: -1 });
}

async function listAllSubscriptions(limit = 200) {
  const cap = Math.min(500, Math.max(1, Number(limit) || 200));
  return Subscription.find({}).sort({ createdAt: -1 }).limit(cap).lean();
}

async function cancelSubscriptionById(subscriptionId, userId, options = {}) {
  const { isAdmin = false } = options;
  const sub = await Subscription.findById(subscriptionId);
  if (!sub) return { error: 'not_found' };
  if (!isAdmin && String(sub.userId) !== String(userId)) return { error: 'forbidden' };
  sub.status = 'cancelled';
  await sub.save();
  return { ok: true };
}

module.exports = {
  PLANS,
  getPlans,
  getPlanById,
  getActiveSubscriptionForShop,
  hasActiveSubscription,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
  createRazorpayOrder,
  activateSubscriptionAfterPayment,
  listSubscriptionsForUser,
  listAllSubscriptions,
  cancelSubscriptionById,
};
