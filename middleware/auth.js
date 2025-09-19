const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -refreshToken');
    
    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token or user inactive.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }
    next();
  };
};

const canAccessEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (user.role === 'SUPER_ADMIN' || user.role === 'HR_MANAGER') {
      return next();
    }

    if (user.role === 'EMPLOYEE' && user._id.toString() === id) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own data.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during authorization check.'
    });
  }
};

module.exports = {
  authenticate,
  authorize,
  canAccessEmployee
};