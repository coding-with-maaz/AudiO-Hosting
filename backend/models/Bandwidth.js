const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Bandwidth = sequelize.define('Bandwidth', {
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
      allowNull: true,
      references: {
        model: 'audios',
        key: 'id'
      }
    },
    bytesUsed: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Bytes transferred'
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Month (1-12)'
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Year (e.g., 2024)'
    },
    type: {
      type: DataTypes.ENUM('download', 'stream', 'upload'),
      allowNull: false,
      defaultValue: 'download'
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true
    }
  }, {
    tableName: 'bandwidth',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['audioId']
      },
      {
        fields: ['year', 'month']
      },
      {
        unique: true,
        fields: ['userId', 'year', 'month', 'type']
      }
    ]
  });

  Bandwidth.associate = (models) => {
    Bandwidth.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Bandwidth.belongsTo(models.Audio, { foreignKey: 'audioId', as: 'audio' });
  };

  return Bandwidth;
};

