const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Plan = sequelize.define('Plan', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
      allowNull: false
    },
    billingPeriod: {
      type: DataTypes.ENUM('monthly', 'yearly', 'lifetime'),
      defaultValue: 'monthly',
      allowNull: false
    },
    storageLimit: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'Storage limit in bytes'
    },
    bandwidthLimit: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'Monthly bandwidth limit in bytes (null = unlimited)'
    },
    maxFileSize: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'Maximum file size in bytes (null = unlimited)'
    },
    maxFiles: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Maximum number of files (null = unlimited)'
    },
    features: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
      comment: 'JSON object with plan features'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isPopular: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'plans',
    timestamps: true
  });

  Plan.associate = (models) => {
    Plan.hasMany(models.Subscription, { foreignKey: 'planId', as: 'subscriptions' });
  };

  return Plan;
};

