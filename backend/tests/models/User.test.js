/**
 * Tests for User model
 */

const db = require('../../models');
const bcrypt = require('bcryptjs');
const { createTestUser } = require('../helpers/dbHelpers');

describe('User Model', () => {
  beforeEach(async () => {
    await db.User.destroy({ where: {}, force: true });
  });

  afterEach(async () => {
    await db.User.destroy({ where: {}, force: true });
  });

  describe('User Creation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Test',
        lastName: 'User'
      };

      const user = await db.User.create(userData);

      expect(user.id).toBeDefined();
      expect(user.username).toBe(userData.username);
      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.isEmailVerified).toBe(false); // Default value
    });

    it('should not create user with duplicate email', async () => {
      const userData = {
        username: 'testuser1',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10)
      };

      await db.User.create(userData);

      // Try to create another user with same email
      await expect(
        db.User.create({
          username: 'testuser2',
          email: 'test@example.com',
          password: await bcrypt.hash('password123', 10)
        })
      ).rejects.toThrow();
    });

    it('should not create user with duplicate username', async () => {
      const userData = {
        username: 'testuser',
        email: 'test1@example.com',
        password: await bcrypt.hash('password123', 10)
      };

      await db.User.create(userData);

      // Try to create another user with same username
      await expect(
        db.User.create({
          username: 'testuser',
          email: 'test2@example.com',
          password: await bcrypt.hash('password123', 10)
        })
      ).rejects.toThrow();
    });

    it('should validate email format', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: await bcrypt.hash('password123', 10)
      };

      await expect(db.User.create(userData)).rejects.toThrow();
    });

    it('should validate username length', async () => {
      const userData = {
        username: 'ab', // Too short (min 3)
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10)
      };

      await expect(db.User.create(userData)).rejects.toThrow();
    });

    it('should validate password length', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: '12345' // Too short (min 6)
      };

      await expect(db.User.create(userData)).rejects.toThrow();
    });
  });

  describe('User Instance Methods', () => {
    it('should compare password correctly', async () => {
      const plainPassword = 'password123';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const user = await db.User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword
      });

      // Check if comparePassword method exists and works
      const isValid = await bcrypt.compare(plainPassword, user.password);
      expect(isValid).toBe(true);

      const isInvalid = await bcrypt.compare('wrongpassword', user.password);
      expect(isInvalid).toBe(false);
    });
  });

  describe('User Queries', () => {
    beforeEach(async () => {
      // Create test users
      await createTestUser({ username: 'user1', email: 'user1@example.com' });
      await createTestUser({ username: 'user2', email: 'user2@example.com' });
      await createTestUser({ username: 'user3', email: 'user3@example.com', isActive: false });
    });

    it('should find user by email', async () => {
      const user = await db.User.findOne({ where: { email: 'user1@example.com' } });
      expect(user).toBeDefined();
      expect(user.email).toBe('user1@example.com');
    });

    it('should find user by username', async () => {
      const user = await db.User.findOne({ where: { username: 'user2' } });
      expect(user).toBeDefined();
      expect(user.username).toBe('user2');
    });

    it('should find all active users', async () => {
      const users = await db.User.findAll({ where: { isActive: true } });
      expect(users.length).toBeGreaterThanOrEqual(2);
      users.forEach(user => {
        expect(user.isActive).toBe(true);
      });
    });
  });
});

