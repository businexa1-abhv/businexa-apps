const mongoose = require('mongoose');

const PLAN_TYPES = ['monthly', 'quarterly', 'half_yearly', 'yearly'];

const shopSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    logoUrl: { type: String, default: '', trim: true },
    description: { type: String, default: '' },
    address: { type: String, default: '', trim: true },
    /** Canonical business vertical (one per shop); synced with `category` for legacy clients. */
    businessType: { type: String, default: '', trim: true, index: true },
    category: { type: String, default: '', trim: true, index: true },
    whatsappNumber: {
      type: String,
      default: '',
      trim: true,
      match: [/^$|^[6-9]\d{9}$/, 'WhatsApp must be 10 digits'],
    },
    email: { type: String, default: '', trim: true, lowercase: true },
    subscriptionPlan: {
      type: String,
      enum: PLAN_TYPES,
    },
    subscriptionExpiresAt: { type: Date, index: true },
    isActive: { type: Boolean, default: true, index: true },
    qrCodeUrl: { type: String, default: '', trim: true },
    metrics: {
      totalProducts: { type: Number, default: 0, min: 0 },
      qrScans: { type: Number, default: 0, min: 0 },
      views: { type: Number, default: 0, min: 0 },
    },
  },
  {
    timestamps: true,
    collection: 'shops',
  }
);

/** Public shop path (pathname only). */
shopSchema.virtual('publicPath').get(function publicPathGetter() {
  return `/shop/${this.slug}`;
});

/** Full public URL when FRONTEND_URL is set. */
shopSchema.virtual('publicUrl').get(function publicUrlGetter() {
  const base = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
  if (!base) return '';
  return `${base}/shop/${this.slug}`;
});

shopSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});
shopSchema.set('toObject', { virtuals: true });

shopSchema.pre('save', function shopSyncBusinessType(next) {
  const bt = this.businessType != null ? String(this.businessType).trim() : '';
  const cat = this.category != null ? String(this.category).trim() : '';
  if (bt) {
    this.businessType = bt;
    this.category = bt;
  } else if (cat) {
    this.category = cat;
    this.businessType = cat;
  }
  next();
});

shopSchema.index({ businessType: 1, isActive: 1 });
shopSchema.index({ category: 1, isActive: 1 });
shopSchema.index({ isActive: 1, subscriptionExpiresAt: 1 });

module.exports = mongoose.model('Shop', shopSchema);
