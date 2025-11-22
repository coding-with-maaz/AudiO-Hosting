const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Analytics = sequelize.define('Analytics', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    audioId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'audios',
        key: 'id'
      }
    },
    eventType: {
      type: DataTypes.ENUM('view', 'download', 'play', 'like', 'share', 'click'),
      allowNull: false
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    referrer: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(2),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    device: {
      type: DataTypes.ENUM('desktop', 'mobile', 'tablet', 'other'),
      allowNull: true
    },
    browser: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    os: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    }
  }, {
    tableName: 'analytics',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['audioId']
      },
      {
        fields: ['eventType']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['country']
      }
    ]
  });

  Analytics.associate = (models) => {
    Analytics.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Analytics.belongsTo(models.Audio, { foreignKey: 'audioId', as: 'audio' });
  };

  return Analytics;
};

