const mongoose = require('mongoose');

const otpVerificationSchema = new mongoose.Schema(
  {
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
      match: [/^[6-9]\d{9}$/, 'Invalid mobile number'],
    },
    otpHash: { type: String, required: true },
    otpSalt: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    verified: { type: Boolean, default: false, index: true },
    attempts: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    collection: 'otp_verifications',
  }
);

/** True when current time is past expiresAt. */
otpVerificationSchema.virtual('isExpired').get(function isExpiredGetter() {
  if (!this.expiresAt) return true;
  return this.expiresAt.getTime() <= Date.now();
});

otpVerificationSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    delete ret.otpHash;
    delete ret.otpSalt;
    delete ret.__v;
    return ret;
  },
});
otpVerificationSchema.set('toObject', { virtuals: true });

/** Latest OTP per mobile (verify flow) */
otpVerificationSchema.index({ mobileNumber: 1, createdAt: -1 });
/** Active (unverified) OTP lookups */
otpVerificationSchema.index({ mobileNumber: 1, verified: 1, expiresAt: 1 });
/** TTL-style cleanup queries (optional cron) */
otpVerificationSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('OTPVerification', otpVerificationSchema);
