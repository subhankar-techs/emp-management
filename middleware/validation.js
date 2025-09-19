const Joi = require('joi');


const userSchemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().pattern(/^\d{10}$/).required(),
    role: Joi.string().valid('HR_MANAGER', 'EMPLOYEE').required(),
    department: Joi.string().min(2).max(50).required(),
    designation: Joi.string().min(2).max(50).required(),
    joinDate: Joi.date().optional(),
    managerId: Joi.string().hex().length(24).when('role', {
      is: 'EMPLOYEE',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    phone: Joi.string().pattern(/^\d{10}$/).optional(),
    department: Joi.string().min(2).max(50).optional(),
    designation: Joi.string().min(2).max(50).optional(),
    managerId: Joi.string().hex().length(24).optional()
  })
};


const leaveSchemas = {
  create: Joi.object({
    leaveType: Joi.string().valid('CASUAL', 'SICK', 'EARNED').required(),
    startDate: Joi.date().min('now').required(),
    endDate: Joi.date().greater(Joi.ref('startDate')).required(),
    reason: Joi.string().min(10).max(500).required()
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('APPROVED', 'REJECTED').required(),
    approvalComment: Joi.string().max(300).optional()
  })
};


const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details[0].message
      });
    }
    next();
  };
};

module.exports = {
  validate,
  userSchemas,
  leaveSchemas
};