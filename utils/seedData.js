const User = require('../models/User');

const createSuperAdmin = async () => {
  try {
    const existingSuperAdmin = await User.findOne({ role: 'SUPER_ADMIN' });
    
    if (!existingSuperAdmin) {
      const superAdmin = new User({
        name: 'Super Administrator',
        email: process.env.SUPER_ADMIN_EMAIL,
        password: process.env.SUPER_ADMIN_PASSWORD,
        phone: '9999999999',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE'
      });

      await superAdmin.save();
      console.log('Super Admin created successfully');
      console.log(`Email: ${process.env.SUPER_ADMIN_EMAIL}`);
      console.log(`Password: ${process.env.SUPER_ADMIN_PASSWORD}`);
    }
  } catch (error) {
    console.error('Error creating Super Admin:', error);
  }
};

module.exports = { createSuperAdmin };