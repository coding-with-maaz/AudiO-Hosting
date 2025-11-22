'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add expiration date to audios
    await queryInterface.addColumn('audios', 'expirationDate', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Date when file expires and will be deleted'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('audios', 'expirationDate');
  }
};

