/**
 * Database test helpers
 */

const db = require('../../models');

/**
 * Clear all database tables
 * Useful for cleanup between tests
 */
const clearDatabase = async () => {
  try {
    // Delete in reverse order of dependencies
    await db.Transaction.destroy({ where: {}, force: true });
    await db.Subscription.destroy({ where: {}, force: true });
    await db.PlaylistAudio.destroy({ where: {}, force: true });
    await db.Playlist.destroy({ where: {}, force: true });
    await db.Comment.destroy({ where: {}, force: true });
    await db.Rating.destroy({ where: {}, force: true });
    await db.Favorite.destroy({ where: {}, force: true });
    await db.Analytics.destroy({ where: {}, force: true });
    await db.Bandwidth.destroy({ where: {}, force: true });
    await db.ApiKey.destroy({ where: {}, force: true });
    await db.Audio.destroy({ where: {}, force: true });
    await db.Folder.destroy({ where: {}, force: true });
    await db.Contact.destroy({ where: {}, force: true });
    await db.Affiliate.destroy({ where: {}, force: true });
    await db.User.destroy({ where: {}, force: true });
    await db.Plan.destroy({ where: {}, force: true });
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
};

/**
 * Create a test user
 * @param {object} userData - User data (optional)
 * @returns {object} Created user
 */
const createTestUser = async (userData = {}) => {
  const bcrypt = require('bcryptjs');
  const defaultData = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: await bcrypt.hash('testpassword123', 10),
    firstName: 'Test',
    lastName: 'User',
    isEmailVerified: true,
    ...userData
  };

  return await db.User.create(defaultData);
};

/**
 * Create a test plan
 * @param {object} planData - Plan data (optional)
 * @returns {object} Created plan
 */
const createTestPlan = async (planData = {}) => {
  const defaultData = {
    name: 'Test Plan',
    price: 9.99,
    storageLimit: 1000,
    bandwidthLimit: 10000,
    isActive: true,
    ...planData
  };

  return await db.Plan.create(defaultData);
};

/**
 * Create a test audio
 * @param {object} audioData - Audio data (optional)
 * @returns {object} Created audio
 */
const createTestAudio = async (audioData = {}) => {
  const defaultData = {
    title: 'Test Audio',
    filename: 'test-audio.mp3',
    fileSize: 1024000,
    duration: 180,
    mimeType: 'audio/mpeg',
    isPublic: false,
    ...audioData
  };

  return await db.Audio.create(defaultData);
};

/**
 * Sync database (for testing)
 */
const syncDatabase = async (force = false) => {
  try {
    await db.sequelize.sync({ force });
  } catch (error) {
    console.error('Error syncing database:', error);
    throw error;
  }
};

module.exports = {
  clearDatabase,
  createTestUser,
  createTestPlan,
  createTestAudio,
  syncDatabase
};

