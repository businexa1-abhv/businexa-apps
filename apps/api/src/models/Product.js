const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },
    category: { type: String, default: '', trim: true, index: true },
    imageUrl: { type: String, default: '', trim: true },
    qrCodeUrl: { type: String, default: '', trim: true },
    isVisible: { type: Boolean, default: true, index: true },
    metrics: {
      views: { type: Number, default: 0, min: 0 },
      clicks: { type: Number, default: 0, min: 0 },
    },
  },
  {
    timestamps: true,
    collection: 'products',
  }
);

/** Numeric price for APIs/UI (Decimal128 as number). */
productSchema.virtual('priceNumber').get(function priceNumberGetter() {
  if (this.price == null) return null;
  try {
    return parseFloat(this.price.toString());
  } catch {
    return null;
  }
});

productSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    if (ret.price != null && ret.price.toString) {
      ret.price = ret.price.toString();
    }
    delete ret.__v;
    return ret;
  },
});
productSchema.set('toObject', { virtuals: true });

productSchema.index({ shopId: 1, isVisible: 1 });
productSchema.index({ shopId: 1, category: 1 });
productSchema.index({ shopId: 1, createdAt: -1 });
productSchema.index({ ownerId: 1, createdAt: -1 });
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
