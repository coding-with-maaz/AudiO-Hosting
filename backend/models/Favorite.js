const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Favorite = sequelize.define('Favorite', {
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
    audioId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'audios',
        key: 'id'
      }
    }
  }, {
    tableName: 'favorites',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'audioId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['audioId']
      }
    ]
  });

  Favorite.associate = (models) => {
    Favorite.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Favorite.belongsTo(models.Audio, { foreignKey: 'audioId', as: 'audio' });
  };

  return Favorite;
};

