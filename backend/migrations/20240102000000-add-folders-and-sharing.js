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

    // Helper function to add column if it doesn't exist
    const addColumnIfNotExists = async (tableName, columnName, columnDefinition) => {
      try {
        const tableDescription = await queryInterface.describeTable(tableName);
        if (!tableDescription[columnName]) {
          await queryInterface.addColumn(tableName, columnName, columnDefinition);
        } else {
          console.log(`Column ${tableName}.${columnName} already exists, skipping...`);
        }
      } catch (error) {
        if (error.message && error.message.includes('Duplicate column name')) {
          console.log(`Column ${tableName}.${columnName} already exists, skipping...`);
        } else {
          throw error;
        }
      }
    };

    // Helper function to add index if it doesn't exist
    const addIndexIfNotExists = async (tableName, fields, options = {}) => {
      try {
        await queryInterface.addIndex(tableName, fields, options);
      } catch (error) {
        if (error.message && error.message.includes('Duplicate key name')) {
          console.log(`Index on ${tableName}(${fields.join(', ')}) already exists, skipping...`);
        } else {
          throw error;
        }
      }
    };

    // Add folderId and sharing fields to audios table
    await addColumnIfNotExists('audios', 'folderId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'folders',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await addColumnIfNotExists('audios', 'shareToken', {
      type: Sequelize.STRING(100),
      allowNull: true,
      unique: true
    });

    await addColumnIfNotExists('audios', 'password', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    // Add indexes
    await addIndexIfNotExists('folders', ['userId']);
    await addIndexIfNotExists('folders', ['parentFolderId']);
    await addIndexIfNotExists('folders', ['shareToken'], { unique: true });
    await addIndexIfNotExists('folders', ['isPublic', 'isShared']);
    await addIndexIfNotExists('audios', ['folderId']);
    await addIndexIfNotExists('audios', ['shareToken'], { unique: true });
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

