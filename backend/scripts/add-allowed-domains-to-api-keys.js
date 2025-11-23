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
    logging: false,
  }
);

async function addAllowedDomainsColumn() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    const queryInterface = sequelize.getQueryInterface();

    // Check if column exists
    const columns = await queryInterface.describeTable('api_keys');
    if (!columns.allowedDomains) {
      await queryInterface.addColumn('api_keys', 'allowedDomains', {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
        comment: 'Array of allowed domains for API key usage'
      });
      console.log('allowedDomains column added to api_keys table.');
    } else {
      console.log('allowedDomains column already exists.');
    }

    console.log('api_keys table is up to date.');
  } catch (error) {
    console.error('Error adding allowedDomains column:', error);
  } finally {
    await sequelize.close();
  }
}

addAllowedDomainsColumn();

