/**
 * Express middleware wrapping Joi/Zod schemas from `src/utils/validators.js`.
 */
const {
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
} = require('../utils/validators');

function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details.map((d) => d.message).join(', '),
        code: 'VALIDATION_ERROR',
      });
    }
    req.body = value;
    next();
  };
}

function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details.map((d) => d.message).join(', '),
        code: 'VALIDATION_ERROR',
      });
    }
    req.query = value;
    next();
  };
}

function validateBodyZod(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      return res.status(400).json({
        success: false,
        message,
        code: 'ZOD_VALIDATION',
      });
    }
    req.body = parsed.data;
    next();
  };
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
  validateBody,
  validateQuery,
  validateBodyZod,
};
