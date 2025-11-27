/**
 * Tests for authController
 */

const authController = require('../../controllers/authController');
const db = require('../../models');
const { createMockRequest, createMockResponse, createMockNext } = require('../helpers/testHelpers');
const { createTestUser } = require('../helpers/dbHelpers');
const bcrypt = require('bcryptjs');

// Mock emailController
jest.mock('../../controllers/emailController', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendWelcomeEmail: jest.fn().mockResolvedValue(true)
}));

describe('Auth Controller', () => {
  let testUser;

  beforeEach(async () => {
    // Clear database before each test
    await db.User.destroy({ where: {}, force: true });
    
    // Create a test user
    testUser = await createTestUser({
      username: 'testuser',
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 10),
      isEmailVerified: true
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await db.User.destroy({ where: {}, force: true });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const req = createMockRequest({
        body: {
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'User'
        }
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
          user: expect.objectContaining({
            username: 'newuser',
            email: 'newuser@example.com'
          })
        })
      );
    });

    it('should fail if user already exists', async () => {
      const req = createMockRequest({
        body: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        }
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('already exists')
        })
      );
    });

    it('should fail validation if required fields are missing', async () => {
      const req = createMockRequest({
        body: {
          username: 'newuser'
          // Missing email and password
        }
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Mock validation errors
      req.validationErrors = [
        { param: 'email', msg: 'Email is required' },
        { param: 'password', msg: 'Password is required' }
      ];

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const req = createMockRequest({
        body: {
          email: 'test@example.com',
          password: 'password123'
        }
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: expect.any(String),
          user: expect.objectContaining({
            email: 'test@example.com'
          })
        })
      );
    });

    it('should fail with invalid credentials', async () => {
      const req = createMockRequest({
        body: {
          email: 'test@example.com',
          password: 'wrongpassword'
        }
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Invalid')
        })
      );
    });

    it('should fail if user does not exist', async () => {
      const req = createMockRequest({
        body: {
          email: 'nonexistent@example.com',
          password: 'password123'
        }
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});

