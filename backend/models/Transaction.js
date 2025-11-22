const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Transaction = sequelize.define('Transaction', {
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
    affiliateId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'affiliates',
        key: 'id'
      },
      comment: 'Affiliate who referred this user'
    },
    planId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'plans',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('subscription', 'affiliate_commission', 'payout', 'refund'),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded', 'cancelled'),
      defaultValue: 'pending',
      allowNull: false
    },
    paymentMethod: {
      type: DataTypes.ENUM('credit_card', 'paypal', 'bank_transfer', 'crypto', 'other'),
      allowNull: true
    },
    paymentGateway: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    paymentId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Payment gateway transaction ID'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    }
  }, {
    tableName: 'transactions',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['affiliateId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['type']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Transaction.belongsTo(models.Affiliate, { foreignKey: 'affiliateId', as: 'affiliate' });
    Transaction.belongsTo(models.Plan, { foreignKey: 'planId', as: 'plan' });
  };

  return Transaction;
};

