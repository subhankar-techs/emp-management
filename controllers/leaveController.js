const Leave = require('../models/Leave');
const User = require('../models/User');
const { logLeaveActivity } = require('../utils/activityLogger');

// Create leave request
const createLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    const employeeId = req.user._id;


    const overlappingLeave = await Leave.findOne({
      employeeId,
      status: { $in: ['PENDING', 'APPROVED'] },
      $or: [
        { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } }
      ]
    });

    if (overlappingLeave) {
      return res.status(400).json({
        success: false,
        message: 'You have overlapping leave requests for the selected dates'
      });
    }


    const leave = new Leave({
      employeeId,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason
    });

    await leave.save();


    await leave.populate('employeeId', 'name email department');

    // Log activity
    await logLeaveActivity.created(employeeId, leave._id, {
      leaveType,
      startDate,
      endDate,
      totalDays: leave.totalDays
    });

    res.status(201).json({
      success: true,
      message: 'Leave request created successfully',
      data: { leave }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error creating leave request'
    });
  }
};

// Get leaves (with role-based filtering)
const getLeaves = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, leaveType, startDate, endDate, employeeId } = req.query;
    const user = req.user;

    let filter = {};


    if (user.role === 'EMPLOYEE') {
      filter.employeeId = user._id;
    } else if (employeeId) {
      filter.employeeId = employeeId;
    }


    if (status) filter.status = status;
    if (leaveType) filter.leaveType = leaveType;
    
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    }

    const leaves = await Leave.find(filter)
      .populate('employeeId', 'name email department designation')
      .populate('approvedBy', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Leave.countDocuments(filter);

    res.json({
      success: true,
      data: {
        leaves,
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
      message: 'Server error fetching leaves'
    });
  }
};

// Get single leave
const getLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const leave = await Leave.findById(id)
      .populate('employeeId', 'name email department designation')
      .populate('approvedBy', 'name email');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }


    if (user.role === 'EMPLOYEE' && leave.employeeId._id.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own leave requests.'
      });
    }

    res.json({
      success: true,
      data: { leave }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching leave'
    });
  }
};

// Update leave status (HR Manager only)
const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approvalComment } = req.body;

    const leave = await Leave.findById(id).populate('employeeId', 'name email');
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (leave.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Only pending leave requests can be approved or rejected'
      });
    }


    leave.status = status;
    leave.approvedBy = req.user._id;
    leave.approvalComment = approvalComment;
    leave.approvalDate = new Date();

    await leave.save();

    // Log activity
    if (status === 'APPROVED') {
      await logLeaveActivity.approved(req.user._id, leave._id, approvalComment);
    } else {
      await logLeaveActivity.rejected(req.user._id, leave._id, approvalComment);
    }

    await leave.populate('approvedBy', 'name email');

    res.json({
      success: true,
      message: `Leave request ${status.toLowerCase()} successfully`,
      data: { leave }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error updating leave status'
    });
  }
};

// Cancel leave request (Employee only, before start date)
const cancelLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const leave = await Leave.findById(id);
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }


    if (leave.employeeId.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own leave requests'
      });
    }


    if (leave.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Leave request is already cancelled'
      });
    }

    if (leave.status === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel rejected leave request'
      });
    }

    if (new Date() >= leave.startDate) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel leave request after start date'
      });
    }

    leave.status = 'CANCELLED';
    await leave.save();

    // Log activity
    await logLeaveActivity.cancelled(user._id, leave._id);

    res.json({
      success: true,
      message: 'Leave request cancelled successfully',
      data: { leave }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error cancelling leave'
    });
  }
};

// Get leave balance (simplified - you can enhance this based on company policy)
const getLeaveBalance = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const currentYear = new Date().getFullYear();


    const approvedLeaves = await Leave.find({
      employeeId,
      status: 'APPROVED',
      startDate: {
        $gte: new Date(`${currentYear}-01-01`),
        $lte: new Date(`${currentYear}-12-31`)
      }
    });


    const usedLeaves = {
      CASUAL: 0,
      SICK: 0,
      EARNED: 0
    };

    approvedLeaves.forEach(leave => {
      usedLeaves[leave.leaveType] += leave.totalDays;
    });


    const entitlements = {
      CASUAL: 12,
      SICK: 12,
      EARNED: 21
    };

    const balance = {
      CASUAL: entitlements.CASUAL - usedLeaves.CASUAL,
      SICK: entitlements.SICK - usedLeaves.SICK,
      EARNED: entitlements.EARNED - usedLeaves.EARNED
    };

    res.json({
      success: true,
      data: {
        entitlements,
        used: usedLeaves,
        balance,
        year: currentYear
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching leave balance'
    });
  }
};

module.exports = {
  createLeave,
  getLeaves,
  getLeave,
  updateLeaveStatus,
  cancelLeave,
  getLeaveBalance
};