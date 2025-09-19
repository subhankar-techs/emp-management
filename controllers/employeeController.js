const User = require('../models/User');
const { logUserActivity } = require('../utils/activityLogger');

const getAllEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 10, department, status = 'ACTIVE' } = req.query;
    
    const filter = { role: { $in: ['HR_MANAGER', 'EMPLOYEE'] } };
    if (department) filter.department = department;
    if (status) filter.status = status;

    const employees = await User.find(filter)
      .populate('managerId', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        employees,
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
      message: 'Server error fetching employees'
    });
  }
};

const getEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    
    const employee = await User.findById(id).populate('managerId', 'name email department');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: { employee }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching employee'
    });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    

    delete updates.password;
    delete updates.email;
    delete updates.role;

    const employee = await User.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    if (updates.name || updates.phone) {
      const duplicateQuery = { _id: { $ne: id } };
      const orConditions = [];
      
      if (updates.name) orConditions.push({ name: updates.name });
      if (updates.phone) orConditions.push({ phone: updates.phone });
      
      duplicateQuery.$or = orConditions;
      
      const existingUser = await User.findOne(duplicateQuery);
      if (existingUser) {
        const duplicateField = existingUser.name === updates.name ? 'name' : 'phone';
        return res.status(400).json({
          success: false,
          message: `${duplicateField.charAt(0).toUpperCase() + duplicateField.slice(1)} already exists`
        });
      }
    }

    if (updates.managerId) {
      const manager = await User.findById(updates.managerId);
      if (!manager || manager.role !== 'HR_MANAGER') {
        return res.status(400).json({
          success: false,
          message: 'Invalid manager ID. Manager must be an HR Manager.'
        });
      }
    }

    const changes = {};
    Object.keys(updates).forEach(key => {
      if (employee[key] !== updates[key]) {
        changes[key] = { from: employee[key], to: updates[key] };
      }
    });

    const updatedEmployee = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('managerId', 'name email');

    if (Object.keys(changes).length > 0) {
      await logUserActivity.updated(req.user._id, id, changes);
    }

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: { employee: updatedEmployee }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error updating employee'
    });
  }
};

const deactivateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    
    const employee = await User.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    if (employee.status === 'INACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Employee is already inactive'
      });
    }

    employee.status = 'INACTIVE';
    await employee.save();

    await logUserActivity.deactivated(req.user._id, id, employee.name);

    res.json({
      success: true,
      message: 'Employee deactivated successfully',
      data: { employee }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error deactivating employee'
    });
  }
};

const activateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    
    const employee = await User.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    if (employee.status === 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Employee is already active'
      });
    }

    employee.status = 'ACTIVE';
    await employee.save();

    res.json({
      success: true,
      message: 'Employee activated successfully',
      data: { employee }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error activating employee'
    });
  }
};

const getDepartments = async (req, res) => {
  try {
    const departments = await User.distinct('department', { 
      role: { $in: ['HR_MANAGER', 'EMPLOYEE'] },
      status: 'ACTIVE'
    });

    res.json({
      success: true,
      data: { departments }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching departments'
    });
  }
};

module.exports = {
  getAllEmployees,
  getEmployee,
  updateEmployee,
  deactivateEmployee,
  activateEmployee,
  getDepartments
};