const User = require('../models/User');
const { generateTokens, verifyRefreshToken } = require('../utils/jwtUtils');
const { logUserActivity } = require('../utils/activityLogger');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive. Please contact administrator.'
      });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

const register = async (req, res) => {
  try {
    const { name, email, password, phone, role, department, designation, joinDate, managerId } = req.body;

    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });
    
    if (existingUser) {
      const duplicateField = existingUser.email === email ? 'email' : 'phone';
      return res.status(400).json({
        success: false,
        message: `${duplicateField.charAt(0).toUpperCase() + duplicateField.slice(1)} already exists`
      });
    }
    
    const existingName = await User.findOne({ name });
    if (existingName) {
      return res.status(400).json({
        success: false,
        message: 'Name already exists'
      });
    }

    if (role === 'EMPLOYEE' && managerId) {
      const manager = await User.findById(managerId);
      if (!manager || manager.role !== 'HR_MANAGER') {
        return res.status(400).json({
          success: false,
          message: 'Invalid manager ID. Manager must be an HR Manager.'
        });
      }
    }

    const userData = {
      name,
      email,
      password,
      phone,
      role,
      department,
      designation,
      joinDate: joinDate || new Date(),
      ...(role === 'EMPLOYEE' && managerId && { managerId })
    };

    const user = new User(userData);
    await user.save();

    await logUserActivity.created(req.user._id, user._id, {
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user: user.toJSON() }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const tokens = generateTokens(user._id);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: tokens
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};

const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.refreshToken = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('managerId', 'name email');
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
};

module.exports = {
  login,
  register,
  refreshToken,
  logout,
  getProfile
};