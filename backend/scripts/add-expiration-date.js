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

async function addExpirationDateColumn() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Check if column exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
      AND TABLE_NAME = 'audios' 
      AND COLUMN_NAME = 'expirationDate'
    `);

    if (results.length > 0) {
      console.log('Column expirationDate already exists.');
      await sequelize.close();
      return;
    }

    // Add the column
    await sequelize.query(`
      ALTER TABLE audios 
      ADD COLUMN expirationDate DATETIME NULL 
      COMMENT 'Date when file expires and will be deleted'
    `);

    console.log('Successfully added expirationDate column to audios table.');
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

addExpirationDateColumn();

