const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Subscription = sequelize.define('Subscription', {
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
    planId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'plans',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'cancelled', 'expired', 'pending'),
      defaultValue: 'pending',
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Null for lifetime plans'
    },
    autoRenew: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancellationReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    }
  }, {
    tableName: 'subscriptions',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['planId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['endDate']
      }
    ]
  });

  Subscription.associate = (models) => {
    Subscription.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Subscription.belongsTo(models.Plan, { foreignKey: 'planId', as: 'plan' });
  };

  return Subscription;
};

