'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add metadata column to users table
    await queryInterface.addColumn('users', 'metadata', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {},
      comment: 'JSON object for storing additional user data like OTP codes'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'metadata');
  }
};

