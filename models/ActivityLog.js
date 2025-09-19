const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'USER_CREATED',
      'USER_UPDATED', 
      'USER_DEACTIVATED',
      'LEAVE_CREATED',
      'LEAVE_APPROVED',
      'LEAVE_REJECTED',
      'LEAVE_CANCELLED'
    ]
  },
  targetType: {
    type: String,
    required: true,
    enum: ['USER', 'LEAVE']
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  changes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});


activityLogSchema.index({ targetId: 1, targetType: 1 });
activityLogSchema.index({ actor: 1 });
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);