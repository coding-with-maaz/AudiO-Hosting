const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Rating = sequelize.define('Rating', {
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
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      },
      comment: 'Rating from 1 to 5'
    }
  }, {
    tableName: 'ratings',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'audioId']
      },
      {
        fields: ['audioId']
      },
      {
        fields: ['userId']
      }
    ]
  });

  Rating.associate = (models) => {
    Rating.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Rating.belongsTo(models.Audio, { foreignKey: 'audioId', as: 'audio' });
  };

  return Rating;
};

