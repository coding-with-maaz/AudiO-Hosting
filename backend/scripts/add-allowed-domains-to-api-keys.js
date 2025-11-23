const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
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

