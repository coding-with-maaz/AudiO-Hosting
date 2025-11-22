const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const ApiKey = sequelize.define('ApiKey', {
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
      type: DataTypes.STRING(100),
      allowNull: false
    },
    key: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true
    },
    secret: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    lastUsed: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    rateLimit: {
      type: DataTypes.INTEGER,
      defaultValue: 1000,
      comment: 'Requests per hour'
    },
    permissions: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
      comment: 'API key permissions'
    }
  }, {
    tableName: 'api_keys',
    timestamps: true,
    hooks: {
      beforeCreate: (apiKey) => {
        if (!apiKey.key) {
          apiKey.key = `ak_${crypto.randomBytes(24).toString('hex')}`;
        }
        if (!apiKey.secret) {
          apiKey.secret = crypto.randomBytes(32).toString('hex');
        }
      }
    },
    indexes: [
      {
        unique: true,
        fields: ['key']
      },
      {
        fields: ['userId']
      }
    ]
  });

  ApiKey.associate = (models) => {
    ApiKey.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return ApiKey;
};

