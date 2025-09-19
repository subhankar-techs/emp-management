const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, userSchemas } = require('../middleware/validation');
const {
  login,
  register,
  refreshToken,
  logout,
  getProfile
} = require('../controllers/authController');

const router = express.Router();


router.post('/login', validate(userSchemas.login), login);
router.post('/refresh-token', refreshToken);


router.use(authenticate);

router.post('/register', authorize('SUPER_ADMIN'), validate(userSchemas.register), register);
router.post('/logout', logout);
router.get('/profile', getProfile);

module.exports = router;