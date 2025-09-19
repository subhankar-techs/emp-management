const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getLeaveSummary,
  getDepartmentReport,
  getEmployeeLeaveHistory,
  getActivityLogs
} = require('../controllers/reportController');

const router = express.Router();


router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'HR_MANAGER'));


router.get('/leave-summary', getLeaveSummary);


router.get('/department-report', getDepartmentReport);


router.get('/employee/:employeeId/leaves', getEmployeeLeaveHistory);


router.get('/activity-logs', getActivityLogs);

module.exports = router;