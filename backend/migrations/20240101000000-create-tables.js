'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      firstName: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      lastName: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      role: {
        type: Sequelize.ENUM('admin', 'user', 'affiliate'),
        defaultValue: 'user',
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      isEmailVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      avatar: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      storageUsed: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      storageLimit: {
        type: Sequelize.BIGINT,
        defaultValue: 1073741824
      },
      lastLogin: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create Plans table
    await queryInterface.createTable('plans', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'USD',
        allowNull: false
      },
      billingPeriod: {
        type: Sequelize.ENUM('monthly', 'yearly', 'lifetime'),
        defaultValue: 'monthly',
        allowNull: false
      },
      storageLimit: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      bandwidthLimit: {
        type: Sequelize.BIGINT,
        allowNull: true
      },
      maxFileSize: {
        type: Sequelize.BIGINT,
        allowNull: true
      },
      maxFiles: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      features: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      isPopular: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      sortOrder: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create Audios table
    await queryInterface.createTable('audios', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      filename: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      originalFilename: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      filePath: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      fileSize: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      mimeType: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      thumbnail: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      isPublic: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      views: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      downloads: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      likes: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      tags: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create Affiliates table
    await queryInterface.createTable('affiliates', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      affiliateCode: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      commissionRate: {
        type: Sequelize.DECIMAL(5, 4),
        allowNull: false,
        defaultValue: 0.1500
      },
      totalEarnings: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      pendingEarnings: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      paidEarnings: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      totalReferrals: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      activeReferrals: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      totalClicks: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      totalSignups: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      payoutMethod: {
        type: Sequelize.ENUM('paypal', 'bank', 'crypto', 'other'),
        allowNull: true
      },
      payoutDetails: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
      },
      minPayout: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 50.00
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create Subscriptions table
    await queryInterface.createTable('subscriptions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      planId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'plans',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      status: {
        type: Sequelize.ENUM('active', 'cancelled', 'expired', 'pending'),
        defaultValue: 'pending',
        allowNull: false
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      autoRenew: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      cancelledAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      cancellationReason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create Transactions table
    await queryInterface.createTable('transactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      affiliateId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'affiliates',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      planId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'plans',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      type: {
        type: Sequelize.ENUM('subscription', 'affiliate_commission', 'payout', 'refund'),
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'USD',
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed', 'refunded', 'cancelled'),
        defaultValue: 'pending',
        allowNull: false
      },
      paymentMethod: {
        type: Sequelize.ENUM('credit_card', 'paypal', 'bank_transfer', 'crypto', 'other'),
        allowNull: true
      },
      paymentGateway: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      paymentId: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create Analytics table
    await queryInterface.createTable('analytics', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      audioId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'audios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      eventType: {
        type: Sequelize.ENUM('view', 'download', 'play', 'like', 'share', 'click'),
        allowNull: false
      },
      ipAddress: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      referrer: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      country: {
        type: Sequelize.STRING(2),
        allowNull: true
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      device: {
        type: Sequelize.ENUM('desktop', 'mobile', 'tablet', 'other'),
        allowNull: true
      },
      browser: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      os: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('audios', ['userId']);
    await queryInterface.addIndex('audios', ['isPublic', 'isActive']);
    await queryInterface.addIndex('audios', ['createdAt']);
    await queryInterface.addIndex('affiliates', ['affiliateCode'], { unique: true });
    await queryInterface.addIndex('affiliates', ['userId']);
    await queryInterface.addIndex('subscriptions', ['userId']);
    await queryInterface.addIndex('subscriptions', ['planId']);
    await queryInterface.addIndex('subscriptions', ['status']);
    await queryInterface.addIndex('subscriptions', ['endDate']);
    await queryInterface.addIndex('transactions', ['userId']);
    await queryInterface.addIndex('transactions', ['affiliateId']);
    await queryInterface.addIndex('transactions', ['status']);
    await queryInterface.addIndex('transactions', ['type']);
    await queryInterface.addIndex('transactions', ['createdAt']);
    await queryInterface.addIndex('analytics', ['userId']);
    await queryInterface.addIndex('analytics', ['audioId']);
    await queryInterface.addIndex('analytics', ['eventType']);
    await queryInterface.addIndex('analytics', ['createdAt']);
    await queryInterface.addIndex('analytics', ['country']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('analytics');
    await queryInterface.dropTable('transactions');
    await queryInterface.dropTable('subscriptions');
    await queryInterface.dropTable('affiliates');
    await queryInterface.dropTable('audios');
    await queryInterface.dropTable('plans');
    await queryInterface.dropTable('users');
  }
};

