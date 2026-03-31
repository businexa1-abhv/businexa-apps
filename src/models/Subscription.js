const mongoose = require('mongoose');

const PLAN_TYPES = ['monthly', 'quarterly', 'half_yearly', 'yearly'];
const STATUS_TYPES = ['active', 'cancelled', 'expired'];

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
      index: true,
    },
    planType: {
      type: String,
      enum: PLAN_TYPES,
      required: true,
      index: true,
    },
    price: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },
    status: {
      type: String,
      enum: STATUS_TYPES,
      default: 'active',
      index: true,
    },
    razorpayPaymentId: { type: String, default: '', trim: true, index: true },
    razorpayOrderId: { type: String, default: '', trim: true, index: true },
    razorpaySignature: { type: String, default: '' },
    startsAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  {
    timestamps: true,
    collection: 'subscriptions',
  }
);

/** Price as number for reporting. */
subscriptionSchema.virtual('priceNumber').get(function priceNumberGetter() {
  if (this.price == null) return null;
  try {
    return parseFloat(this.price.toString());
  } catch {
    return null;
  }
});

/** True when status is active and expiresAt is in the future. */
subscriptionSchema.virtual('isCurrentlyActive').get(function isCurrentlyActiveGetter() {
  if (this.status !== 'active' || !this.expiresAt) return false;
  return this.expiresAt.getTime() > Date.now();
});

subscriptionSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    if (ret.price != null && ret.price.toString) {
      ret.price = ret.price.toString();
    }
    delete ret.__v;
    return ret;
  },
});
subscriptionSchema.set('toObject', { virtuals: true });

subscriptionSchema.index({ userId: 1, status: 1, expiresAt: -1 });
subscriptionSchema.index({ shopId: 1, status: 1, expiresAt: -1 });
subscriptionSchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
