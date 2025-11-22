'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Folders table
    await queryInterface.createTable('folders', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      parentFolderId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'folders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      isPublic: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isShared: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      shareToken: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add folderId and sharing fields to audios table
    await queryInterface.addColumn('audios', 'folderId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'folders',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('audios', 'shareToken', {
      type: Sequelize.STRING(100),
      allowNull: true,
      unique: true
    });

    await queryInterface.addColumn('audios', 'password', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    // Add indexes
    await queryInterface.addIndex('folders', ['userId']);
    await queryInterface.addIndex('folders', ['parentFolderId']);
    await queryInterface.addIndex('folders', ['shareToken'], { unique: true });
    await queryInterface.addIndex('folders', ['isPublic', 'isShared']);
    await queryInterface.addIndex('audios', ['folderId']);
    await queryInterface.addIndex('audios', ['shareToken'], { unique: true });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('audios', ['shareToken']);
    await queryInterface.removeIndex('audios', ['folderId']);
    await queryInterface.removeIndex('folders', ['isPublic', 'isShared']);
    await queryInterface.removeIndex('folders', ['shareToken']);
    await queryInterface.removeIndex('folders', ['parentFolderId']);
    await queryInterface.removeIndex('folders', ['userId']);
    
    await queryInterface.removeColumn('audios', 'password');
    await queryInterface.removeColumn('audios', 'shareToken');
    await queryInterface.removeColumn('audios', 'folderId');
    
    await queryInterface.dropTable('folders');
  }
};

