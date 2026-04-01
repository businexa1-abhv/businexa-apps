const mongoose = require('mongoose');

const RESOURCE_TYPES = ['shop', 'product', 'subscription', 'user', 'other'];
const ACTIONS = ['create', 'update', 'delete'];

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    action: {
      type: String,
      enum: ACTIONS,
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      enum: RESOURCE_TYPES,
      required: true,
      index: true,
    },
    resourceId: { type: mongoose.Schema.Types.ObjectId, index: true },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    /** Optional before/after snapshot for admin or sensitive updates */
    changes: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String, default: '', trim: true },
  },
  {
    timestamps: true,
    collection: 'audit_logs',
  }
);

/** Short label for dashboards (resource + action). */
auditLogSchema.virtual('summary').get(function summaryGetter() {
  const id = this.resourceId ? String(this.resourceId).slice(-6) : '—';
  return `${this.action}:${this.resourceType}:${id}`;
});

auditLogSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});
auditLogSchema.set('toObject', { virtuals: true });

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
