'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add bandwidth and soft delete fields to users
    await queryInterface.addColumn('users', 'bandwidthLimit', {
      type: Sequelize.BIGINT,
      allowNull: true,
      comment: 'Monthly bandwidth limit in bytes'
    });
    await queryInterface.addColumn('users', 'bandwidthUsed', {
      type: Sequelize.BIGINT,
      defaultValue: 0,
      comment: 'Current month bandwidth used in bytes'
    });
    await queryInterface.addColumn('users', 'bandwidthResetDate', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Date when bandwidth resets'
    });
    await queryInterface.addColumn('users', 'isDeleted', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
    await queryInterface.addColumn('users', 'deletedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Add soft delete to audios
    await queryInterface.addColumn('audios', 'isDeleted', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
    await queryInterface.addColumn('audios', 'deletedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Create Bandwidth table
    await queryInterface.createTable('bandwidth', {
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
      audioId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'audios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      bytesUsed: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('download', 'stream', 'upload'),
        allowNull: false,
        defaultValue: 'download'
      },
      ipAddress: {
        type: Sequelize.STRING(45),
        allowNull: true
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

    // Create API Keys table
    await queryInterface.createTable('api_keys', {
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
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      key: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true
      },
      secret: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      lastUsed: {
        type: Sequelize.DATE,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      rateLimit: {
        type: Sequelize.INTEGER,
        defaultValue: 1000
      },
      permissions: {
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

    // Create Playlists table
    await queryInterface.createTable('playlists', {
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
      coverImage: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      sortOrder: {
        type: Sequelize.ENUM('manual', 'date', 'title', 'duration'),
        defaultValue: 'manual'
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

    // Create PlaylistAudios junction table
    await queryInterface.createTable('playlist_audios', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      playlistId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'playlists',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      audioId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'audios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      order: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      addedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Create Favorites table
    await queryInterface.createTable('favorites', {
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
      audioId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'audios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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

    // Create Comments table
    await queryInterface.createTable('comments', {
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
      audioId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'audios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      parentId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'comments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      isEdited: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isDeleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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

    // Create Ratings table
    await queryInterface.createTable('ratings', {
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
      audioId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'audios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5
        }
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

    // Add indexes
    await queryInterface.addIndex('bandwidth', ['userId']);
    await queryInterface.addIndex('bandwidth', ['audioId']);
    await queryInterface.addIndex('bandwidth', ['year', 'month']);
    await queryInterface.addIndex('bandwidth', ['userId', 'year', 'month', 'type'], {
      unique: true,
      name: 'bandwidth_unique'
    });

    await queryInterface.addIndex('api_keys', ['key'], { unique: true });
    await queryInterface.addIndex('api_keys', ['userId']);

    await queryInterface.addIndex('playlists', ['userId']);
    await queryInterface.addIndex('playlists', ['isPublic']);

    await queryInterface.addIndex('playlist_audios', ['playlistId', 'audioId'], {
      unique: true,
      name: 'playlist_audio_unique'
    });
    await queryInterface.addIndex('playlist_audios', ['playlistId', 'order']);

    await queryInterface.addIndex('favorites', ['userId', 'audioId'], {
      unique: true,
      name: 'favorite_unique'
    });
    await queryInterface.addIndex('favorites', ['userId']);
    await queryInterface.addIndex('favorites', ['audioId']);

    await queryInterface.addIndex('comments', ['audioId']);
    await queryInterface.addIndex('comments', ['userId']);
    await queryInterface.addIndex('comments', ['parentId']);

    await queryInterface.addIndex('ratings', ['userId', 'audioId'], {
      unique: true,
      name: 'rating_unique'
    });
    await queryInterface.addIndex('ratings', ['audioId']);
    await queryInterface.addIndex('ratings', ['userId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ratings');
    await queryInterface.dropTable('comments');
    await queryInterface.dropTable('favorites');
    await queryInterface.dropTable('playlist_audios');
    await queryInterface.dropTable('playlists');
    await queryInterface.dropTable('api_keys');
    await queryInterface.dropTable('bandwidth');

    await queryInterface.removeColumn('audios', 'deletedAt');
    await queryInterface.removeColumn('audios', 'isDeleted');
    await queryInterface.removeColumn('users', 'deletedAt');
    await queryInterface.removeColumn('users', 'isDeleted');
    await queryInterface.removeColumn('users', 'bandwidthResetDate');
    await queryInterface.removeColumn('users', 'bandwidthUsed');
    await queryInterface.removeColumn('users', 'bandwidthLimit');
  }
};

