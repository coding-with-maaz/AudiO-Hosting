const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Playlist = sequelize.define('Playlist', {
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    coverImage: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    sortOrder: {
      type: DataTypes.ENUM('manual', 'date', 'title', 'duration'),
      defaultValue: 'manual'
    }
  }, {
    tableName: 'playlists',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['isPublic']
      }
    ]
  });

  Playlist.associate = (models) => {
    Playlist.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Playlist.belongsToMany(models.Audio, {
      through: 'PlaylistAudios',
      foreignKey: 'playlistId',
      otherKey: 'audioId',
      as: 'audios'
    });
  };

  return Playlist;
};

