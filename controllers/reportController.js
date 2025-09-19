const Leave = require('../models/Leave');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

const getLeaveSummary = async (req, res) => {
  try {
    const { startDate, endDate, department, status } = req.query;
    
    let filter = {};
    
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    }
    
    if (status) filter.status = status;

    let leaves = await Leave.find(filter)
      .populate('employeeId', 'name email department designation')
      .sort({ startDate: -1 });

    if (department) {
      leaves = leaves.filter(leave => leave.employeeId.department === department);
    }

    const summary = {
      totalRequests: leaves.length,
      byStatus: {},
      byType: {},
      byDepartment: {},
      totalDays: 0
    };

    leaves.forEach(leave => {
      summary.byStatus[leave.status] = (summary.byStatus[leave.status] || 0) + 1;
      
      summary.byType[leave.leaveType] = (summary.byType[leave.leaveType] || 0) + 1;
      
      const dept = leave.employeeId.department;
      summary.byDepartment[dept] = (summary.byDepartment[dept] || 0) + 1;
      
      if (leave.status === 'APPROVED') {
        summary.totalDays += leave.totalDays;
      }
    });

    res.json({
      success: true,
      data: {
        summary,
        leaves: leaves.slice(0, 50)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error generating leave summary'
    });
  }
};

const getDepartmentReport = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    const departments = await User.distinct('department', { 
      role: { $in: ['HR_MANAGER', 'EMPLOYEE'] },
      status: 'ACTIVE'
    });

    const departmentReports = [];

    for (const department of departments) {
      const employees = await User.find({
        department,
        role: { $in: ['HR_MANAGER', 'EMPLOYEE'] },
        status: 'ACTIVE'
      }).select('_id name');

      const employeeIds = employees.map(emp => emp._id);

      const leaves = await Leave.find({
        employeeId: { $in: employeeIds },
        startDate: { $gte: startDate, $lte: endDate }
      });

      const stats = {
        totalEmployees: employees.length,
        totalRequests: leaves.length,
        approvedRequests: leaves.filter(l => l.status === 'APPROVED').length,
        pendingRequests: leaves.filter(l => l.status === 'PENDING').length,
        rejectedRequests: leaves.filter(l => l.status === 'REJECTED').length,
        totalDaysApproved: leaves
          .filter(l => l.status === 'APPROVED')
          .reduce((sum, l) => sum + l.totalDays, 0),
        byType: {
          CASUAL: leaves.filter(l => l.leaveType === 'CASUAL').length,
          SICK: leaves.filter(l => l.leaveType === 'SICK').length,
          EARNED: leaves.filter(l => l.leaveType === 'EARNED').length
        }
      };

      departmentReports.push({
        department,
        ...stats
      });
    }

    res.json({
      success: true,
      data: {
        year,
        departments: departmentReports
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error generating department report'
    });
  }
};

const getEmployeeLeaveHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year, status, leaveType } = req.query;

    const employee = await User.findById(employeeId).select('name email department designation');
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    let filter = { employeeId };
    
    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      filter.startDate = { $gte: startDate, $lte: endDate };
    }
    
    if (status) filter.status = status;
    if (leaveType) filter.leaveType = leaveType;

    const leaves = await Leave.find(filter)
      .populate('approvedBy', 'name email')
      .sort({ startDate: -1 });

    const summary = {
      totalRequests: leaves.length,
      totalDaysRequested: leaves.reduce((sum, l) => sum + l.totalDays, 0),
      totalDaysApproved: leaves
        .filter(l => l.status === 'APPROVED')
        .reduce((sum, l) => sum + l.totalDays, 0),
      byStatus: {},
      byType: {}
    };

    leaves.forEach(leave => {
      summary.byStatus[leave.status] = (summary.byStatus[leave.status] || 0) + 1;
      summary.byType[leave.leaveType] = (summary.byType[leave.leaveType] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        employee,
        summary,
        leaves
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching employee leave history'
    });
  }
};

const getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, action, targetType, startDate, endDate } = req.query;

    let filter = {};
    
    if (action) filter.action = action;
    if (targetType) filter.targetType = targetType;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const logs = await ActivityLog.find(filter)
      .populate('actor', 'name email role')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await ActivityLog.countDocuments(filter);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching activity logs'
    });
  }
};

module.exports = {
  getLeaveSummary,
  getDepartmentReport,
  getEmployeeLeaveHistory,
  getActivityLogs
};