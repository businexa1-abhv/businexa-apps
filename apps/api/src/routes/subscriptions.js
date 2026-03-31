/**
 * Mounted at /api/subscriptions
 *
 * Public:
 *   GET  /plans
 *   POST /webhook/razorpay — Razorpay webhook (signature header)
 *
 * Protected (Bearer + Mongo user):
 *   POST /create-order
 *   POST /verify-payment
 *   GET  /                    — current user’s subscriptions
 *   GET  /shop/:shopId      — active subscription for shop (or null)
 *   POST /:subscriptionId/cancel
 */
const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');
const { requireAuth, requireDbUser, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

const auth = [requireAuth, requireDbUser, requireRole('seller', 'admin')];

router.get('/plans', subscriptionController.listPlans);
router.post('/webhook/razorpay', express.json({ type: '*/*' }), subscriptionController.razorpayWebhook);

router.post('/create-order', ...auth, subscriptionController.createOrder);
router.post('/verify-payment', ...auth, subscriptionController.verifyPayment);
router.get('/', ...auth, subscriptionController.listSubscriptions);
router.get('/shop/:shopId', ...auth, subscriptionController.shopSubscription);
router.post('/:subscriptionId/cancel', ...auth, subscriptionController.cancelSubscription);

module.exports = router;
