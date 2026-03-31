/**
 * Razorpay client — `RAZORPAY_KEY_ID` and `RAZORPAY_SECRET` from `.env`.
 * Webhook HMAC uses the same secret unless you add a separate key in subscription service.
 */
const Razorpay = require('razorpay');
const logger = require('./logger');

let instance = null;

function readRazorpayConfigFromEnv() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_SECRET;
  if (!keyId || !keySecret) {
    return null;
  }
  return { key_id: keyId, key_secret: keySecret };
}

function getRazorpay() {
  if (instance) return instance;

  const cfg = readRazorpayConfigFromEnv();
  if (!cfg) {
    logger.warn('Razorpay: set RAZORPAY_KEY_ID and RAZORPAY_SECRET in .env');
    return null;
  }

  instance = new Razorpay(cfg);
  logger.info('Razorpay client initialized');
  return instance;
}

module.exports = { getRazorpay, readRazorpayConfigFromEnv };
