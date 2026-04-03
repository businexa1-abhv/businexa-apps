/**
 * Buyer membership — Razorpay; separate from seller shop subscriptions.
 */
const crypto = require('crypto');
const mongoose = require('mongoose');
const { getRazorpay } = require('../config/razorpay');
const BuyerSubscription = require('../models/BuyerSubscription');

const BUYER_PLANS = [
  { id: 'buyer_monthly', name: 'Monthly', price: 79, duration: 30 },
  { id: 'buyer_half_yearly', name: 'Half-yearly', price: 399, duration: 180 },
  { id: 'buyer_yearly', name: 'Yearly', price: 699, duration: 365 },
];

function getBuyerPlans() {
  return BUYER_PLANS;
}

function getBuyerPlanById(planId) {
  return BUYER_PLANS.find((p) => p.id === planId) || null;
}

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

async function createBuyerRazorpayOrder({ planId, userId }) {
  const plan = getBuyerPlanById(planId);
  if (!plan) return { error: 'invalid_plan' };

  const razorpay = getRazorpay();
  if (!razorpay) return { error: 'payments_not_configured' };

  const existing = await BuyerSubscription.findOne({
    userId,
    status: 'active',
    expiresAt: { $gt: new Date() },
  });
  if (existing) return { error: 'already_subscribed' };

  const order = await razorpay.orders.create({
    amount: plan.price * 100,
    currency: 'INR',
    receipt: `buyer_${userId}_${Date.now()}`,
    notes: { planId, userId: String(userId), kind: 'buyer' },
  });

  return {
    orderId: order.id,
    amount: plan.price * 100,
    currency: order.currency,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    plan,
  };
}

async function activateBuyerSubscriptionAfterPayment({
  userId,
  planId,
  orderId,
  paymentId,
  signature,
}) {
  if (!verifyRazorpayPaymentSignature(orderId, paymentId, signature)) {
    return { error: 'invalid_signature' };
  }

  const plan = getBuyerPlanById(planId);
  if (!plan) return { error: 'invalid_plan' };

  await BuyerSubscription.updateMany(
    { userId, status: 'active' },
    { $set: { status: 'cancelled' } }
  );

  const startsAt = new Date();
  const expiresAt = new Date(startsAt.getTime() + plan.duration * 24 * 60 * 60 * 1000);

  const subscription = await BuyerSubscription.create({
    userId,
    planType: planId,
    price: mongoose.Types.Decimal128.fromString(String(plan.price)),
    status: 'active',
    razorpayPaymentId: paymentId,
    razorpayOrderId: orderId,
    razorpaySignature: signature,
    startsAt,
    expiresAt,
  });

  return { subscription };
}

async function listBuyerSubscriptionsForUser(userId) {
  return BuyerSubscription.find({ userId }).sort({ createdAt: -1 });
}

async function cancelBuyerSubscriptionById(subscriptionId, userId) {
  const sub = await BuyerSubscription.findById(subscriptionId);
  if (!sub) return { error: 'not_found' };
  if (String(sub.userId) !== String(userId)) return { error: 'forbidden' };
  sub.status = 'cancelled';
  await sub.save();
  return { ok: true };
}

module.exports = {
  BUYER_PLANS,
  getBuyerPlans,
  getBuyerPlanById,
  createBuyerRazorpayOrder,
  activateBuyerSubscriptionAfterPayment,
  listBuyerSubscriptionsForUser,
  cancelBuyerSubscriptionById,
};
