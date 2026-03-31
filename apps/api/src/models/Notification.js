const mongoose = require('mongoose');

const NOTIFICATION_TYPES = ['order', 'subscription', 'system'];

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false, index: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    collection: 'notifications',
  }
);

/** Truncated message for list views. */
notificationSchema.virtual('snippet').get(function snippetGetter() {
  const m = this.message || '';
  if (m.length <= 120) return m;
  return `${m.slice(0, 117)}...`;
});

/** Convenience alias for inbox filters. */
notificationSchema.virtual('isUnread').get(function isUnreadGetter() {
  return !this.isRead;
});

notificationSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});
notificationSchema.set('toObject', { virtuals: true });

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
