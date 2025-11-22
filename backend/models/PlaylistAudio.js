const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PlaylistAudio = sequelize.define('PlaylistAudio', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    playlistId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'playlists',
        key: 'id'
      }
    },
    audioId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'audios',
        key: 'id'
      }
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    addedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'playlist_audios',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['playlistId', 'audioId']
      },
      {
        fields: ['playlistId', 'order']
      }
    ]
  });

  PlaylistAudio.associate = (models) => {
    PlaylistAudio.belongsTo(models.Playlist, { foreignKey: 'playlistId', as: 'playlist' });
    PlaylistAudio.belongsTo(models.Audio, { foreignKey: 'audioId', as: 'audio' });
  };

  return PlaylistAudio;
};

