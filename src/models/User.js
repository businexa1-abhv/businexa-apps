const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: [true, 'firebaseUid is required'],
      unique: true,
      trim: true,
      index: true,
    },
    mobileNumber: {
      type: String,
      required: [true, 'mobileNumber is required'],
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Invalid 10-digit Indian mobile number'],
      index: true,
    },
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: {
        values: ['buyer', 'seller'],
        message: '{VALUE} is not a valid role',
      },
      required: true,
      index: true,
    },
    fullName: { type: String, default: '', trim: true },
    profileImage: { type: String, default: '', trim: true },
    isVerified: { type: Boolean, default: false, index: true },
    preferences: {
      language: { type: String, default: 'en', trim: true },
      theme: {
        type: String,
        enum: ['light', 'dark'],
        default: 'light',
      },
      notifications: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

/** True when role is seller (shop owner flows). */
userSchema.virtual('isSeller').get(function isSellerGetter() {
  return this.role === 'seller';
});

userSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});
userSchema.set('toObject', { virtuals: true });

/** List/filter by role + recency */
userSchema.index({ role: 1, createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
