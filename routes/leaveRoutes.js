const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, leaveSchemas } = require('../middleware/validation');
const {
  createLeave,
  getLeaves,
  getLeave,
  updateLeaveStatus,
  cancelLeave,
  getLeaveBalance
} = require('../controllers/leaveController');

const router = express.Router();


router.use(authenticate);


router.post('/', authorize('EMPLOYEE'), validate(leaveSchemas.create), createLeave);


router.get('/', getLeaves);


router.get('/balance', authorize('EMPLOYEE'), getLeaveBalance);


router.get('/:id', getLeave);


router.patch('/:id/status', authorize('SUPER_ADMIN', 'HR_MANAGER'), validate(leaveSchemas.updateStatus), updateLeaveStatus);


router.patch('/:id/cancel', authorize('EMPLOYEE'), cancelLeave);

module.exports = router;