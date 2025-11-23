require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false
  }
);

async function addUserMetadata() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Check if metadata column exists
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'metadata'
    `);

    if (columns.length === 0) {
      console.log('Adding metadata column to users table...');
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN metadata JSON DEFAULT ('{}')
      `);
      console.log('Metadata column added.');
    } else {
      console.log('Metadata column already exists.');
    }

    console.log('Users table is up to date.');
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

addUserMetadata();

