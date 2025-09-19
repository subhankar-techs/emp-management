const express = require('express');
const { authenticate, authorize, canAccessEmployee } = require('../middleware/auth');
const { validate, userSchemas } = require('../middleware/validation');
const {
  getAllEmployees,
  getEmployee,
  updateEmployee,
  deactivateEmployee,
  activateEmployee,
  getDepartments
} = require('../controllers/employeeController');

const router = express.Router();


router.use(authenticate);


router.get('/', authorize('SUPER_ADMIN', 'HR_MANAGER'), getAllEmployees);


router.get('/departments', getDepartments);


router.get('/:id', canAccessEmployee, getEmployee);


router.put('/:id', authorize('SUPER_ADMIN', 'HR_MANAGER'), validate(userSchemas.updateProfile), updateEmployee);


router.patch('/:id/deactivate', authorize('SUPER_ADMIN', 'HR_MANAGER'), deactivateEmployee);


router.patch('/:id/activate', authorize('SUPER_ADMIN', 'HR_MANAGER'), activateEmployee);

module.exports = router;