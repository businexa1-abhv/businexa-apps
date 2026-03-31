/**
 * Application roles (MongoDB `User.role` and RBAC).
 * - buyer: browse / purchase-oriented flows
 * - seller: shop owner (create shop, products, subscriptions for own shops)
 * - admin: full access; never assignable via client `verify-otp` body (use ADMIN_MOBILE_NUMBERS or DB)
 */
const ROLES = Object.freeze({
  BUYER: 'buyer',
  SELLER: 'seller',
  ADMIN: 'admin',
});

const USER_ROLES = Object.freeze([ROLES.BUYER, ROLES.SELLER, ROLES.ADMIN]);

/** Roles allowed in POST /api/auth/verify-otp for new accounts (signup). */
const OTP_SIGNUP_ROLES = Object.freeze([ROLES.BUYER, ROLES.SELLER]);

module.exports = {
  ROLES,
  USER_ROLES,
  OTP_SIGNUP_ROLES,
};
