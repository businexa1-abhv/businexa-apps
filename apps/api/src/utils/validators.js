/**
 * Joi (and Zod) schemas for API request bodies/queries.
 * Use with `middleware/validators.js` `validateBody` / `validateQuery` / `validateBodyZod`.
 *
 * @see NODEJS_API_GENERATION_PROMPT.md — Input validation
 */
const Joi = require('joi');
const { z } = require('zod');
const {
  validatePasswordStrength,
  isValidLoginEmail,
} = require('@businexa/shared');
const { OTP_SIGNUP_ROLES, USER_ROLES } = require('../constants/roles');
const { ADMIN_LEVELS } = require('../constants/adminAccess');
const { normalizeIndianMobile } = require('./adminPhones');
const { otpLength } = require('../constants/otp');

const loginEmailSchema = Joi.string()
  .trim()
  .max(320)
  .required()
  .custom((value, helpers) => {
    if (!isValidLoginEmail(value)) {
      return helpers.error('any.custom', { message: 'Enter a valid email address' });
    }
    return String(value).trim().toLowerCase();
  }, 'login email');

const strongPasswordSchema = Joi.string()
  .max(128)
  .required()
  .custom((value, helpers) => {
    const r = validatePasswordStrength(value);
    if (!r.ok) return helpers.error('any.custom', { message: r.message });
    return value;
  }, 'strong password');

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
    .length(otpLength())
    .pattern(/^\d+$/)
    .required(),
  role: Joi.string().valid(...OTP_SIGNUP_ROLES),
});

const profileRegisterSchema = Joi.object({
  fullName: Joi.string().trim().max(200).allow(''),
  mobileNumber: Joi.string()
    .allow('', null)
    .custom((value, helpers) => {
      if (value === '' || value == null) return undefined;
      const n = normalizeIndianMobile(value);
      if (!n) return helpers.error('any.custom', { message: 'Invalid Indian mobile number' });
      return n;
    }),
});

const shopAtRegisterSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required(),
  address: Joi.string().trim().min(1).max(500).required(),
  category: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().max(2000).allow(''),
  whatsappNumber: Joi.alternatives().try(
    Joi.string().pattern(/^[6-9]\d{9}$/),
    Joi.string().allow('')
  ),
  email: Joi.string().email().allow('', null).max(320),
});

const registerPasswordBody = Joi.object({
  /** Login identifier — must be a valid email (same as stored username + email). */
  username: loginEmailSchema,
  password: strongPasswordSchema,
  role: Joi.string().valid(...OTP_SIGNUP_ROLES).required(),
  profile: profileRegisterSchema.optional(),
  shop: Joi.when('role', {
    is: 'seller',
    then: shopAtRegisterSchema.required(),
    otherwise: Joi.forbidden(),
  }),
});

const adminUpdateUserRoleBody = Joi.object({
  role: Joi.string()
    .valid(...USER_ROLES)
    .required(),
});

/** PATCH /api/admin/users/:userId — profile fields (not role; use …/role). */
const adminPatchUserBody = Joi.object({
  fullName: Joi.string().trim().max(200).allow('', null),
  isVerified: Joi.boolean(),
  profileImage: Joi.string().uri().allow('', null).max(2000),
  email: Joi.string()
    .trim()
    .max(320)
    .optional()
    .custom((value, helpers) => {
      if (value === undefined || value === null || value === '') return undefined;
      if (!isValidLoginEmail(value)) {
        return helpers.error('any.custom', { message: 'Enter a valid email address' });
      }
      return String(value).trim().toLowerCase();
    }, 'login email'),
})
  .min(1)
  .messages({ 'object.min': 'At least one field is required' });

/** POST /api/admin/users — JWT (email) accounts only; OTP/mobile users use public signup. */
const adminCreateUserBody = Joi.object({
  username: loginEmailSchema,
  password: strongPasswordSchema,
  role: Joi.string()
    .valid(...USER_ROLES)
    .required(),
  fullName: Joi.string().trim().max(200).allow('', null),
  adminLevel: Joi.string()
    .valid(...ADMIN_LEVELS)
    .when('role', {
      is: 'admin',
      then: Joi.optional(),
      otherwise: Joi.forbidden(),
    }),
});

const loginPasswordBody = Joi.object({
  username: loginEmailSchema,
  password: Joi.string().min(1).max(128).required(),
});

const forgotPasswordBody = Joi.object({
  email: Joi.string().trim().max(320).optional(),
  username: Joi.string().trim().max(320).optional(),
})
  .or('email', 'username')
  .custom((value, helpers) => {
    const raw = value.email ?? value.username;
    if (!isValidLoginEmail(raw)) {
      return helpers.error('any.custom', { message: 'Enter a valid email address' });
    }
    return { email: String(raw).trim().toLowerCase() };
  }, 'forgot-password email');

const resetPasswordBody = Joi.object({
  token: Joi.string().min(16).max(256).required(),
  password: strongPasswordSchema,
});

const refreshTokenBody = Joi.object({
  refreshToken: Joi.string().required(),
});

const createShopBody = Joi.object({
  name: Joi.string().trim().min(1).max(200).required(),
  address: Joi.string().allow('', null).max(500),
  category: Joi.string().trim().min(1).max(100).required(),
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
  registerPasswordBody,
  adminUpdateUserRoleBody,
  adminPatchUserBody,
  adminCreateUserBody,
  loginPasswordBody,
  forgotPasswordBody,
  resetPasswordBody,
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
