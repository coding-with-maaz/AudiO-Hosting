const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Affiliate = sequelize.define('Affiliate', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    affiliateCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    commissionRate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      defaultValue: 0.1500,
      comment: 'Commission rate as decimal (0.15 = 15%)'
    },
    totalEarnings: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      allowNull: false
    },
    pendingEarnings: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      allowNull: false
    },
    paidEarnings: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      allowNull: false
    },
    totalReferrals: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    activeReferrals: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalClicks: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalSignups: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    payoutMethod: {
      type: DataTypes.ENUM('paypal', 'bank', 'crypto', 'other'),
      allowNull: true
    },
    payoutDetails: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    minPayout: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 50.00
    }
  }, {
    tableName: 'affiliates',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['affiliateCode']
      },
      {
        fields: ['userId']
      }
    ]
  });

  Affiliate.associate = (models) => {
    Affiliate.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Affiliate.hasMany(models.Transaction, { foreignKey: 'affiliateId', as: 'transactions' });
  };

  return Affiliate;
};

