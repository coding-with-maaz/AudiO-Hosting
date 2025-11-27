# Backend Tests

This directory contains all test files for the backend application.

## Structure

```
tests/
├── controllers/          # Controller unit tests
├── models/              # Model unit tests
├── routes/              # Route integration tests
├── middleware/          # Middleware unit tests
├── utils/               # Utility function tests
├── integration/         # Integration tests
├── helpers/             # Test helper functions
│   ├── testHelpers.js   # General test utilities
│   └── dbHelpers.js     # Database test utilities
├── setup.js             # Test setup configuration
└── README.md            # This file
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run a specific test file
```bash
npm test -- authController.test.js
```

### Run tests matching a pattern
```bash
npm test -- --testNamePattern="should register"
```

## Test Environment Setup

Tests use a separate test environment configuration. Make sure you have a `.env.test` file in the backend directory with test-specific environment variables:

```env
NODE_ENV=test
DB_HOST=localhost
DB_PORT=3306
DB_NAME=audio_hosting_db_test
DB_USER=root
DB_PASSWORD=your_test_password
JWT_SECRET=test-jwt-secret-key
PORT=3000
```

## Writing Tests

### Example Controller Test

```javascript
const controller = require('../../controllers/myController');
const { createMockRequest, createMockResponse } = require('../helpers/testHelpers');

describe('My Controller', () => {
  it('should handle request correctly', async () => {
    const req = createMockRequest({ body: { data: 'test' } });
    const res = createMockResponse();
    const next = jest.fn();

    await controller.myMethod(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });
});
```

### Example Integration Test

```javascript
const request = require('supertest');
const app = require('../../server');

describe('API Integration', () => {
  it('should return 200 for health check', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
```

## Test Helpers

### testHelpers.js

- `createMockRequest(options)` - Creates a mock Express request object
- `createMockResponse()` - Creates a mock Express response object
- `createMockNext()` - Creates a mock next function
- `generateTestToken(userId)` - Generates a JWT token for testing
- `createAuthenticatedRequest(options, userId)` - Creates an authenticated request

### dbHelpers.js

- `clearDatabase()` - Clears all database tables
- `createTestUser(userData)` - Creates a test user
- `createTestPlan(planData)` - Creates a test plan
- `createTestAudio(audioData)` - Creates a test audio
- `syncDatabase(force)` - Syncs the database schema

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Always clean up test data after each test
3. **Mocking**: Mock external services and dependencies when possible
4. **Descriptive Names**: Use descriptive test names that explain what is being tested
5. **Arrange-Act-Assert**: Structure tests with clear setup, action, and assertion phases
6. **Coverage**: Aim for high test coverage, especially for critical business logic

## CI/CD

Tests are automatically run in CI/CD pipelines. Make sure all tests pass before pushing code.

