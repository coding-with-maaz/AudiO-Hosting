const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [6, 255],
        notEmpty: true
      }
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('admin', 'user', 'affiliate'),
      defaultValue: 'user',
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    storageUsed: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      comment: 'Storage used in bytes'
    },
    storageLimit: {
      type: DataTypes.BIGINT,
      defaultValue: 1073741824,
      comment: 'Storage limit in bytes (default 1GB)'
    },
    bandwidthLimit: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'Monthly bandwidth limit in bytes (null = unlimited)'
    },
    bandwidthUsed: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      comment: 'Current month bandwidth used in bytes'
    },
    bandwidthResetDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date when bandwidth resets'
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Soft delete flag'
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
      comment: 'JSON object for storing additional user data like OTP codes'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    }
  });

  User.associate = (models) => {
    User.hasMany(models.Audio, { foreignKey: 'userId', as: 'audios' });
    User.hasMany(models.Transaction, { foreignKey: 'userId', as: 'transactions' });
    User.hasMany(models.Subscription, { foreignKey: 'userId', as: 'subscriptions' });
    User.hasOne(models.Affiliate, { foreignKey: 'userId', as: 'affiliate' });
    User.hasMany(models.Analytics, { foreignKey: 'userId', as: 'analytics' });
    User.hasMany(models.Bandwidth, { foreignKey: 'userId', as: 'bandwidth' });
    User.hasMany(models.ApiKey, { foreignKey: 'userId', as: 'apiKeys' });
    User.hasMany(models.Playlist, { foreignKey: 'userId', as: 'playlists' });
    User.hasMany(models.Favorite, { foreignKey: 'userId', as: 'favorites' });
    User.hasMany(models.Comment, { foreignKey: 'userId', as: 'comments' });
    User.hasMany(models.Rating, { foreignKey: 'userId', as: 'ratings' });
  };

  User.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password;
    return values;
  };

  return User;
};

