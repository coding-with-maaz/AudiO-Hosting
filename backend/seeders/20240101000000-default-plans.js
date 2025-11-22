module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('plans', [
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Free',
        description: 'Perfect for getting started',
        price: 0.00,
        currency: 'USD',
        billingPeriod: 'monthly',
        storageLimit: 1073741824, // 1GB
        bandwidthLimit: 10737418240, // 10GB
        maxFileSize: 52428800, // 50MB
        maxFiles: 10,
        features: JSON.stringify({
          basicUpload: true,
          publicSharing: true,
          analytics: false,
          customDomain: false,
          prioritySupport: false
        }),
        isActive: true,
        isPopular: false,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Basic',
        description: 'For small creators',
        price: 9.99,
        currency: 'USD',
        billingPeriod: 'monthly',
        storageLimit: 10737418240, // 10GB
        bandwidthLimit: 107374182400, // 100GB
        maxFileSize: 104857600, // 100MB
        maxFiles: 100,
        features: JSON.stringify({
          basicUpload: true,
          publicSharing: true,
          analytics: true,
          customDomain: false,
          prioritySupport: false
        }),
        isActive: true,
        isPopular: true,
        sortOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'Pro',
        description: 'For professional creators',
        price: 29.99,
        currency: 'USD',
        billingPeriod: 'monthly',
        storageLimit: 107374182400, // 100GB
        bandwidthLimit: null, // Unlimited
        maxFileSize: 524288000, // 500MB
        maxFiles: null, // Unlimited
        features: JSON.stringify({
          basicUpload: true,
          publicSharing: true,
          analytics: true,
          customDomain: true,
          prioritySupport: true
        }),
        isActive: true,
        isPopular: false,
        sortOrder: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '00000000-0000-0000-0000-000000000004',
        name: 'Enterprise',
        description: 'For businesses and large teams',
        price: 99.99,
        currency: 'USD',
        billingPeriod: 'monthly',
        storageLimit: 1073741824000, // 1TB
        bandwidthLimit: null, // Unlimited
        maxFileSize: null, // Unlimited
        maxFiles: null, // Unlimited
        features: JSON.stringify({
          basicUpload: true,
          publicSharing: true,
          analytics: true,
          customDomain: true,
          prioritySupport: true,
          apiAccess: true,
          whiteLabel: true
        }),
        isActive: true,
        isPopular: false,
        sortOrder: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('plans', null, {});
  }
};

