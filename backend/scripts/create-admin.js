require('dotenv').config();
const db = require('../models');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connection established.');

    const args = process.argv.slice(2);
    const username = args[0] || 'admin';
    const email = args[1] || 'admin@example.com';
    const password = args[2] || 'admin123';

    // Check if admin already exists
    const existingAdmin = await db.User.findOne({
      where: {
        [db.Sequelize.Op.or]: [{ email }, { username }]
      }
    });

    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log(`Username: ${existingAdmin.username}`);
      console.log(`Email: ${existingAdmin.email}`);
      process.exit(0);
    }

    // Create admin user
    const admin = await db.User.create({
      username,
      email,
      password,
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
      storageLimit: 1073741824000 // 1TB for admin
    });

    console.log('Admin user created successfully!');
    console.log(`Username: ${admin.username}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Password: ${password}`);
    console.log('\nPlease change the password after first login!');

    await db.sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();

