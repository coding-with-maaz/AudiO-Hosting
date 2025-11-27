/**
 * Tests for constants utility
 */

const constants = require('../../utils/constants');

describe('Constants', () => {
  it('should export HTTP_STATUS constants', () => {
    expect(constants.HTTP_STATUS).toBeDefined();
    expect(constants.HTTP_STATUS.OK).toBeDefined();
    expect(constants.HTTP_STATUS.CREATED).toBeDefined();
    expect(constants.HTTP_STATUS.BAD_REQUEST).toBeDefined();
    expect(constants.HTTP_STATUS.UNAUTHORIZED).toBeDefined();
    expect(constants.HTTP_STATUS.NOT_FOUND).toBeDefined();
  });

  it('should export RESPONSE_KEYS constants', () => {
    expect(constants.RESPONSE_KEYS).toBeDefined();
    expect(constants.RESPONSE_KEYS.SUCCESS).toBeDefined();
    expect(constants.RESPONSE_KEYS.MESSAGE).toBeDefined();
    expect(constants.RESPONSE_KEYS.DATA).toBeDefined();
  });

  it('should export MESSAGES constants', () => {
    expect(constants.MESSAGES).toBeDefined();
    expect(constants.MESSAGES.AUTH_REQUIRED).toBeDefined();
  });

  it('should have consistent HTTP status codes', () => {
    expect(constants.HTTP_STATUS.OK).toBe(200);
    expect(constants.HTTP_STATUS.CREATED).toBe(201);
    expect(constants.HTTP_STATUS.BAD_REQUEST).toBe(400);
    expect(constants.HTTP_STATUS.UNAUTHORIZED).toBe(401);
    expect(constants.HTTP_STATUS.FORBIDDEN).toBe(403);
    expect(constants.HTTP_STATUS.NOT_FOUND).toBe(404);
    expect(constants.HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
  });
});

