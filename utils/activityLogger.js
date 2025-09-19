const ActivityLog = require('../models/ActivityLog');

const logActivity = async (actorId, action, targetType, targetId, changes = {}, description = '', metadata = {}) => {
  try {
    await ActivityLog.create({
      actor: actorId,
      action,
      targetType,
      targetId,
      changes,
      description,
      metadata
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};


const logUserActivity = {
  created: (actorId, userId, userData) => 
    logActivity(actorId, 'USER_CREATED', 'USER', userId, userData, `User ${userData.name} created`),
  
  updated: (actorId, userId, changes) => 
    logActivity(actorId, 'USER_UPDATED', 'USER', userId, changes, `User profile updated`),
  
  deactivated: (actorId, userId, userName) => 
    logActivity(actorId, 'USER_DEACTIVATED', 'USER', userId, {}, `User ${userName} deactivated`)
};

const logLeaveActivity = {
  created: (actorId, leaveId, leaveData) => 
    logActivity(actorId, 'LEAVE_CREATED', 'LEAVE', leaveId, leaveData, `Leave request created`),
  
  approved: (actorId, leaveId, comment) => 
    logActivity(actorId, 'LEAVE_APPROVED', 'LEAVE', leaveId, { comment }, `Leave request approved`),
  
  rejected: (actorId, leaveId, comment) => 
    logActivity(actorId, 'LEAVE_REJECTED', 'LEAVE', leaveId, { comment }, `Leave request rejected`),
  
  cancelled: (actorId, leaveId) => 
    logActivity(actorId, 'LEAVE_CANCELLED', 'LEAVE', leaveId, {}, `Leave request cancelled`)
};

module.exports = {
  logActivity,
  logUserActivity,
  logLeaveActivity
};