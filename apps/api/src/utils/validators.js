/**
 * Joi (and Zod) schemas for API request bodies/queries.
 * Use with `middleware/validators.js` `validateBody` / `validateQuery` / `validateBodyZod`.
 *
 * @see NODEJS_API_GENERATION_PROMPT.md — Input validation
 */
const Joi = require('joi');
const { z } = require('zod');
const { OTP_SIGNUP_ROLES } = require('../constants/roles');
const { normalizeIndianMobile } = require('./adminPhones');

/** 10-digit Indian mobile; accepts +91 / 91 / spaces so DB always matches verify lookup. */
const mobileSchema = Joi.string()
  .required()
  .custom((value, helpers) => {
    const n = normalizeIndianMobile(value);
    if (!n) {
      return helpers.error('any.custom', { message: 'Invalid Indian mobile number' });
    }
    return n;
  }, 'Indian mobile normalization');

const objectIdString = Joi.string().hex().length(24);

const sendOtpBody = Joi.object({
  mobileNumber: mobileSchema,
  checkUserExists: Joi.boolean(),
});

const verifyOtpBody = Joi.object({
  mobileNumber: mobileSchema,
  otp: Joi.string()
    .length(6)
    .pattern(/^\d+$/)
    .required(),
  role: Joi.string().valid(...OTP_SIGNUP_ROLES),
});

const refreshTokenBody = Joi.object({
  refreshToken: Joi.string().required(),
});

const createShopBody = Joi.object({
  name: Joi.string().trim().min(1).max(200).required(),
  address: Joi.string().allow('', null).max(500),
  category: Joi.string().allow('', null).max(100),
  whatsappNumber: Joi.alternatives().try(
    Joi.string().pattern(/^[6-9]\d{9}$/),
    Joi.string().allow('')
  ),
  email: Joi.string().email().allow('', null).max(320),
});

const createOrderBody = Joi.object({
  planId: Joi.string().valid('monthly', 'quarterly', 'half_yearly', 'yearly').required(),
  shopId: objectIdString.required(),
});

const verifyPaymentBody = Joi.object({
  orderId: Joi.string().required(),
  paymentId: Joi.string().required(),
  signature: Joi.string().required(),
  shopId: objectIdString.required(),
  planId: Joi.string().valid('monthly', 'quarterly', 'half_yearly', 'yearly').required(),
});

const updateProfileBody = Joi.object({
  fullName: Joi.string().trim().max(200).allow('', null),
  email: Joi.string().email().allow('', null).max(320),
  profileImage: Joi.string().uri().allow('', null).max(2000),
});

const updatePreferencesBody = Joi.object({
  language: Joi.string().trim().max(20),
  theme: Joi.string().valid('light', 'dark'),
  notifications: Joi.boolean(),
});

const refreshTokenZod = z.object({
  refreshToken: z.string().min(1),
});

/** Format helpers (not Joi — used by services). */
const MOBILE_IN = /^[6-9]\d{9}$/;

function isValidIndianMobile(mobile) {
  return typeof mobile === 'string' && MOBILE_IN.test(mobile);
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

module.exports = {
  mobileSchema,
  objectIdString,
  sendOtpBody,
  verifyOtpBody,
  refreshTokenBody,
  createShopBody,
  createOrderBody,
  verifyPaymentBody,
  updateProfileBody,
  updatePreferencesBody,
  refreshTokenZod,
  z,
  MOBILE_IN,
  isValidIndianMobile,
  slugify,
};
