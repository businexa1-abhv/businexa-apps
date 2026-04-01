/**
 * OTP digit length (send + verify must match). Mirrors otpService / Joi verify body.
 */
function otpLength() {
  return Math.min(9, Math.max(4, Number(process.env.OTP_LENGTH) || 6));
}

module.exports = { otpLength };
