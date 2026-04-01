const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    /** Firebase Auth (OTP / custom token flow). Sparse: JWT-only users omit this. */
    firebaseUid: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
      index: true,
    },
    /** Indian mobile; sparse when using username/password only. */
    mobileNumber: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Invalid 10-digit Indian mobile number'],
      index: true,
    },
    /** Local login (JWT): same value as email — valid email string. Sparse when using Firebase-only accounts. */
    username: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: [320, 'Login email too long'],
    },
    passwordHash: {
      type: String,
      select: false,
    },
    /** SHA-256 hex of raw reset token; cleared after successful reset. */
    passwordResetTokenHash: {
      type: String,
      select: false,
      sparse: true,
      index: true,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    /** Omit when unknown — do not store "" or null (unique index). Sparse: many users may omit email. */
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },
    role: {
      type: String,
      enum: {
        values: ['buyer', 'seller', 'admin'],
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

/** Empty email must not be stored (unique index + ""). */
userSchema.pre('validate', function normalizeEmail(next) {
  if (
    this.email === null ||
    this.email === '' ||
    (typeof this.email === 'string' && !this.email.trim())
  ) {
    this.email = undefined;
  }
  next();
});

/** JWT accounts: login id is email — keep `email` in sync for password reset and uniqueness. */
userSchema.pre('validate', function syncJwtUsernameEmail(next) {
  if (this.username && this.passwordHash) {
    const u = String(this.username).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u)) {
      return next(new Error('Login email must be a valid email address'));
    }
    this.username = u;
    this.email = u;
  }
  next();
});

/** New users: either Firebase (mobile + firebaseUid) or local (username + password). */
userSchema.pre('validate', function userPreValidate(next) {
  if (!this.isNew) return next();
  const hasFirebase = Boolean(this.firebaseUid && this.mobileNumber);
  const hasLocal = Boolean(this.username && this.passwordHash);
  if (!hasFirebase && !hasLocal) {
    return next(
      new Error('User must have mobile + firebaseUid (OTP) or username + password (JWT)')
    );
  }
  next();
});

/** True when role is seller (shop owner). */
userSchema.virtual('isSeller').get(function isSellerGetter() {
  return this.role === 'seller';
});

userSchema.virtual('isAdmin').get(function isAdminGetter() {
  return this.role === 'admin';
});

userSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    delete ret.__v;
    delete ret.passwordHash;
    delete ret.passwordResetTokenHash;
    return ret;
  },
});
userSchema.set('toObject', { virtuals: true });

/** List/filter by role + recency */
userSchema.index({ role: 1, createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
