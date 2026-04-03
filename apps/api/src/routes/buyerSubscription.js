/**
 * Buyer membership (monthly / half-yearly / yearly) — Razorpay.
 * Mounted at /api/buyer/subscription
 */
const express = require('express');
const buyerSubscriptionController = require('../controllers/buyerSubscriptionController');
const { requireAuth, requireDbUser, requireRole } = require('../middleware/authMiddleware');
const { validateBody } = require('../middleware/validators');
const { buyerCreateOrderBody, buyerVerifyPaymentBody } = require('../utils/validators');

const router = express.Router();

const authBuyer = [requireAuth, requireDbUser, requireRole('buyer')];

router.get('/plans', buyerSubscriptionController.listPlans);

router.post(
  '/create-order',
  ...authBuyer,
  validateBody(buyerCreateOrderBody),
  buyerSubscriptionController.createOrder
);
router.post(
  '/verify-payment',
  ...authBuyer,
  validateBody(buyerVerifyPaymentBody),
  buyerSubscriptionController.verifyPayment
);
router.get('/mine', ...authBuyer, buyerSubscriptionController.listMine);
router.post('/:subscriptionId/cancel', ...authBuyer, buyerSubscriptionController.cancelSubscription);

module.exports = router;
