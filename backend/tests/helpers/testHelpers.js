/**
 * Test helper utilities
 */

const jwt = require('jsonwebtoken');
const config = require('../../config/config');

/**
 * Generate a test JWT token for a user
 * @param {number} userId - User ID
 * @returns {string} JWT token
 */
const generateTestToken = (userId) => {
  return jwt.sign({ userId }, config.jwt.secret || 'test-secret', {
    expiresIn: '1h'
  });
};

/**
 * Create mock request object
 * @param {object} options - Request options
 * @returns {object} Mock request object
 */
const createMockRequest = (options = {}) => {
  const {
    body = {},
    params = {},
    query = {},
    headers = {},
    user = null,
    file = null,
    files = null
  } = options;

  return {
    body,
    params,
    query,
    headers: {
      'content-type': 'application/json',
      ...headers
    },
    user,
    file,
    files,
    get: (header) => headers[header] || null
  };
};

/**
 * Create mock response object
 * @returns {object} Mock response object
 */
const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Create mock next function
 * @returns {function} Mock next function
 */
const createMockNext = () => {
  return jest.fn();
};

/**
 * Wait for a specified amount of time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after the timeout
 */
const wait = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Create authenticated request
 * @param {object} options - Request options
 * @param {number} userId - User ID for authentication
 * @returns {object} Mock request with authentication
 */
const createAuthenticatedRequest = (options = {}, userId = 1) => {
  const token = generateTestToken(userId);
  const req = createMockRequest(options);
  req.headers.authorization = `Bearer ${token}`;
  req.user = { id: userId };
  return req;
};

module.exports = {
  generateTestToken,
  createMockRequest,
  createMockResponse,
  createMockNext,
  wait,
  createAuthenticatedRequest
};

