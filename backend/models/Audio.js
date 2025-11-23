const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Audio = sequelize.define('Audio', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    folderId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'folders',
        key: 'id'
      },
      comment: 'Folder containing this audio'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    originalFilename: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    filePath: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'File size in bytes'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duration in seconds'
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    thumbnail: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Soft delete flag for trash bin'
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    downloads: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    shareToken: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      comment: 'Unique token for direct sharing'
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Optional password for audio access'
    },
    expirationDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date when file expires and will be deleted'
    }
  }, {
    tableName: 'audios',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['isPublic', 'isActive']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  Audio.associate = (models) => {
    Audio.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Audio.belongsTo(models.Folder, { foreignKey: 'folderId', as: 'folder' });
    Audio.hasMany(models.Analytics, { foreignKey: 'audioId', as: 'analytics' });
    Audio.hasMany(models.Bandwidth, { foreignKey: 'audioId', as: 'bandwidth' });
    Audio.belongsToMany(models.Playlist, {
      through: models.PlaylistAudio,
      foreignKey: 'audioId',
      otherKey: 'playlistId',
      as: 'playlists'
    });
    Audio.hasMany(models.Favorite, { foreignKey: 'audioId', as: 'favorites' });
    Audio.hasMany(models.Comment, { foreignKey: 'audioId', as: 'comments' });
    Audio.hasMany(models.Rating, { foreignKey: 'audioId', as: 'ratings' });
  };

  return Audio;
};

