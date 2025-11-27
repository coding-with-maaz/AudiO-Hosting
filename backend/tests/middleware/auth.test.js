/**
 * Tests for auth middleware
 */

const jwt = require('jsonwebtoken');
const auth = require('../../middleware/auth');
const db = require('../../models');
const config = require('../../config/config');
const { createMockRequest, createMockResponse, createMockNext } = require('../helpers/testHelpers');
const { createTestUser } = require('../helpers/dbHelpers');

describe('Auth Middleware', () => {
  let testUser;
  let validToken;

  beforeEach(async () => {
    // Create a test user
    testUser = await createTestUser({
      username: 'testuser',
      email: 'test@example.com',
      isEmailVerified: true
    });

    // Generate a valid token
    validToken = jwt.sign(
      { userId: testUser.id },
      config.jwt.secret || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterEach(async () => {
    await db.User.destroy({ where: {}, force: true });
  });

  it('should allow access with valid JWT token', async () => {
    const req = createMockRequest({
      headers: {
        authorization: `Bearer ${validToken}`
      }
    });
    const res = createMockResponse();
    const next = createMockNext();

    await auth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe(testUser.id);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should deny access without token', async () => {
    const req = createMockRequest({
      headers: {}
    });
    const res = createMockResponse();
    const next = createMockNext();

    await auth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false
      })
    );
  });

  it('should deny access with invalid token', async () => {
    const req = createMockRequest({
      headers: {
        authorization: 'Bearer invalid-token'
      }
    });
    const res = createMockResponse();
    const next = createMockNext();

    await auth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should deny access with expired token', async () => {
    // Create an expired token
    const expiredToken = jwt.sign(
      { userId: testUser.id },
      config.jwt.secret || 'test-secret',
      { expiresIn: '-1h' }
    );

    const req = createMockRequest({
      headers: {
        authorization: `Bearer ${expiredToken}`
      }
    });
    const res = createMockResponse();
    const next = createMockNext();

    await auth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should get token from cookies if not in headers', async () => {
    const req = createMockRequest({
      headers: {},
      cookies: {
        token: validToken
      }
    });
    const res = createMockResponse();
    const next = createMockNext();

    await auth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
  });

  it('should deny access if user does not exist', async () => {
    // Create token for non-existent user
    const fakeUserId = '00000000-0000-0000-0000-000000000000';
    const fakeToken = jwt.sign(
      { userId: fakeUserId },
      config.jwt.secret || 'test-secret',
      { expiresIn: '1h' }
    );

    const req = createMockRequest({
      headers: {
        authorization: `Bearer ${fakeToken}`
      }
    });
    const res = createMockResponse();
    const next = createMockNext();

    await auth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

