/**
 * Subscriptions — NODEJS_API_GENERATION_PROMPT.md § D
 * Base path: /api/subscriptions
 */
const mongoose = require('mongoose');
const { AppError } = require('../middleware/errorHandler');
const subscriptionService = require('../services/subscriptionService');
const Shop = require('../models/Shop');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

/** GET /api/subscriptions/plans */
async function listPlans(_req, res) {
  res.json({ plans: subscriptionService.getPlans() });
}

/** POST /api/subscriptions/create-order */
async function createOrder(req, res, next) {
  try {
    const { planId, shopId } = req.body;
    const result = await subscriptionService.createRazorpayOrder({
      planId,
      shopId,
      userId: req.dbUser._id,
    });
    if (result.error === 'invalid_plan') throw new AppError('Invalid plan', 400);
    if (result.error === 'forbidden') throw new AppError('Forbidden', 403);
    if (result.error === 'already_subscribed') throw new AppError('Shop already has an active subscription', 409);
    if (result.error === 'payments_not_configured') throw new AppError('Payments not configured', 503);

    res.json({
      orderId: result.orderId,
      amount: result.amount,
      currency: result.currency,
      razorpayKeyId: result.razorpayKeyId,
    });
  } catch (e) {
    next(e);
  }
}

/** POST /api/subscriptions/verify-payment — HMAC signature verified in service */
async function verifyPayment(req, res, next) {
  try {
    const { orderId, paymentId, signature, shopId, planId } = req.body;
    const result = await subscriptionService.activateSubscriptionAfterPayment({
      userId: req.dbUser._id,
      shopId,
      planId,
      orderId,
      paymentId,
      signature,
    });
    if (result.error === 'invalid_signature') throw new AppError('Invalid signature', 400);
    if (result.error === 'invalid_plan') throw new AppError('Invalid plan', 400);
    if (result.error === 'forbidden') throw new AppError('Forbidden', 403);

    res.json({ subscription: result.subscription });
  } catch (e) {
    next(e);
  }
}

/** GET /api/subscriptions */
async function listSubscriptions(req, res, next) {
  try {
    const subscriptions = await subscriptionService.listSubscriptionsForUser(req.dbUser._id);
    res.json({ subscriptions });
  } catch (e) {
    next(e);
  }
}

/** GET /api/subscriptions/shop/:shopId */
async function shopSubscription(req, res, next) {
  try {
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) throw new AppError('Shop not found', 404);
    if (String(shop.ownerId) !== String(req.dbUser._id)) throw new AppError('Forbidden', 403);
    const sub = await subscriptionService.getActiveSubscriptionForShop(req.params.shopId);
    res.json({ subscription: sub || null });
  } catch (e) {
    next(e);
  }
}

/** POST /api/subscriptions/:subscriptionId/cancel */
async function cancelSubscription(req, res, next) {
  try {
    const result = await subscriptionService.cancelSubscriptionById(
      req.params.subscriptionId,
      req.dbUser._id
    );
    if (result.error === 'not_found') throw new AppError('Not found', 404);
    if (result.error === 'forbidden') throw new AppError('Forbidden', 403);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}

/**
 * POST /api/subscriptions/webhook/razorpay
 * Verify X-Razorpay-Signature; audit log; optional in-app notification for payment events.
 */
async function razorpayWebhook(req, res, next) {
  try {
    const secret = process.env.RAZORPAY_SECRET;
    const sig = req.headers['x-razorpay-signature'];
    const rawBody = JSON.stringify(req.body);
    if (secret && sig && !subscriptionService.verifyRazorpayWebhookSignature(rawBody, sig)) {
      throw new AppError('Invalid webhook signature', 400);
    }

    await AuditLog.create({
      action: 'create',
      resourceType: 'other',
      details: { source: 'razorpay_webhook', payload: req.body },
      ipAddress: req.ip,
    });

    const event = req.body?.event;
    const notes = req.body?.payload?.payment?.entity?.notes;
    const rawUserId = notes?.userId;
    if (event && rawUserId && mongoose.isValidObjectId(String(rawUserId))) {
      await Notification.create({
        userId: rawUserId,
        type: 'subscription',
        title: 'Payment update',
        message: `Razorpay event: ${event}`,
        data: { event },
      }).catch(() => {});
    }

    res.json({ status: 'ok' });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listPlans,
  createOrder,
  verifyPayment,
  listSubscriptions,
  listMine: (req, res, next) => listSubscriptions(req, res, next),
  shopSubscription,
  cancelSubscription,
  razorpayWebhook,
};
