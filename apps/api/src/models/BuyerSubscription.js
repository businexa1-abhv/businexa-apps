const mongoose = require('mongoose');

const BUYER_PLAN_TYPES = ['buyer_monthly', 'buyer_half_yearly', 'buyer_yearly'];
const STATUS_TYPES = ['active', 'cancelled', 'expired'];

const buyerSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    planType: {
      type: String,
      enum: BUYER_PLAN_TYPES,
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
    razorpayOrderId: { type: String, default: '', trim: true },
    razorpaySignature: { type: String, default: '' },
    startsAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  {
    timestamps: true,
    collection: 'buyer_subscriptions',
  }
);

buyerSubscriptionSchema.index({ userId: 1, status: 1, expiresAt: -1 });

buyerSubscriptionSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    if (ret.price != null && ret.price.toString) {
      ret.price = ret.price.toString();
    }
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('BuyerSubscription', buyerSubscriptionSchema);
