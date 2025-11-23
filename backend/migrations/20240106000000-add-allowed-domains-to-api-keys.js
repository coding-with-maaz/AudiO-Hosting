'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add allowedDomains column to api_keys table
    await queryInterface.addColumn('api_keys', 'allowedDomains', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of allowed domains for API key usage'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('api_keys', 'allowedDomains');
  }
};

