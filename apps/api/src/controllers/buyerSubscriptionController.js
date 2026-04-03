const { AppError } = require('../middleware/errorHandler');
const buyerSubscriptionService = require('../services/buyerSubscriptionService');

async function listPlans(_req, res) {
  res.json({ plans: buyerSubscriptionService.getBuyerPlans() });
}

async function createOrder(req, res, next) {
  try {
    const { planId } = req.body;
    const result = await buyerSubscriptionService.createBuyerRazorpayOrder({
      planId,
      userId: req.dbUser._id,
    });
    if (result.error === 'invalid_plan') throw new AppError('Invalid plan', 400);
    if (result.error === 'already_subscribed') throw new AppError('You already have an active membership', 409);
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

async function verifyPayment(req, res, next) {
  try {
    const { orderId, paymentId, signature, planId } = req.body;
    const result = await buyerSubscriptionService.activateBuyerSubscriptionAfterPayment({
      userId: req.dbUser._id,
      planId,
      orderId,
      paymentId,
      signature,
    });
    if (result.error === 'invalid_signature') throw new AppError('Invalid signature', 400);
    if (result.error === 'invalid_plan') throw new AppError('Invalid plan', 400);

    res.json({ subscription: result.subscription });
  } catch (e) {
    next(e);
  }
}

async function listMine(req, res, next) {
  try {
    const subscriptions = await buyerSubscriptionService.listBuyerSubscriptionsForUser(req.dbUser._id);
    res.json({ subscriptions });
  } catch (e) {
    next(e);
  }
}

async function cancelSubscription(req, res, next) {
  try {
    const result = await buyerSubscriptionService.cancelBuyerSubscriptionById(
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

module.exports = {
  listPlans,
  createOrder,
  verifyPayment,
  listMine,
  cancelSubscription,
};
