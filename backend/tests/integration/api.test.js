/**
 * Comprehensive API Integration Tests
 */

const request = require('supertest');
const db = require('../../models');
const bcrypt = require('bcryptjs');
const { createTestUser, createTestPlan, createTestAudio } = require('../helpers/dbHelpers');

// Set test environment before importing app
process.env.NODE_ENV = 'test';
const app = require('../../server');

describe('API Integration Tests', () => {
  let authToken;
  let testUser;
  let testPlan;
  let adminUser;
  let adminToken;

  beforeAll(async () => {
    try {
      // Try to authenticate database connection
      await db.sequelize.authenticate();
      // Sync database schema
      await db.sequelize.sync({ alter: false });
    } catch (error) {
      console.warn('Database connection failed in tests, some tests may fail:', error.message);
    }

    // Clear database
    try {
      await db.User.destroy({ where: {}, force: true });
      await db.Plan.destroy({ where: {}, force: true });

      // Create a regular test user
      testUser = await createTestUser({
        username: 'testuser',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        isEmailVerified: true,
        isActive: true
      });

      // Create an admin user
      adminUser = await createTestUser({
        username: 'adminuser',
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        isEmailVerified: true,
        isActive: true,
        role: 'admin'
      });

      // Create a test plan
      testPlan = await createTestPlan({
        name: 'Test Plan',
        price: 9.99,
        storageLimit: 1000,
        bandwidthLimit: 10000
      });

      // Get auth tokens by logging in
      const userLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });
      
      if (userLogin.body.token) {
        authToken = userLogin.body.token;
      }

      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@example.com', password: 'admin123' });
      
      if (adminLogin.body.token) {
        adminToken = adminLogin.body.token;
      }
    } catch (error) {
      console.warn('Test setup failed:', error.message);
    }
  });

  afterAll(async () => {
    // Clean up
    await db.User.destroy({ where: {}, force: true });
    await db.Plan.destroy({ where: {}, force: true });
    await db.Audio.destroy({ where: {}, force: true });
    await db.Folder.destroy({ where: {}, force: true });
  });

  describe('Root Endpoint', () => {
    it('GET / should return API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.endpoints).toBeDefined();
    });
  });

  describe('Health Check', () => {
    it('GET /health should return server status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('Authentication APIs', () => {
    describe('POST /api/auth/register', () => {
      it('should register a new user successfully', async () => {
        const userData = {
          username: `newuser_${Date.now()}`,
          email: `newuser_${Date.now()}@example.com`,
          password: 'password123',
          firstName: 'New',
          lastName: 'User'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.user).toBeDefined();
        expect(response.body.user.email).toBe(userData.email);
        expect(response.body.token).toBeDefined();
      });

      it('should fail with duplicate email', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: 'anotheruser',
            email: 'test@example.com',
            password: 'password123'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should fail validation with invalid data', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: 'ab', // Too short
            email: 'invalid-email',
            password: '123' // Too short
          })
          .expect(400);
      });
    });

    describe('POST /api/auth/login', () => {
      it('should login with valid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'password123'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.token).toBeDefined();
        expect(response.body.user).toBeDefined();
      });

      it('should fail with invalid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword'
          })
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/auth/profile', () => {
      it('should get user profile with valid token', async () => {
        const response = await request(app)
          .get('/api/auth/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.user).toBeDefined();
        expect(response.body.user.email).toBe('test@example.com');
      });

      it('should fail without authentication', async () => {
        const response = await request(app)
          .get('/api/auth/profile')
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });

    describe('PUT /api/auth/profile', () => {
      it('should update user profile', async () => {
        const response = await request(app)
          .put('/api/auth/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            firstName: 'Updated',
            lastName: 'Name'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.user.firstName).toBe('Updated');
      });
    });
  });

  describe('Plans APIs', () => {
    describe('GET /api/plans', () => {
      it('should get all plans without authentication', async () => {
        const response = await request(app)
          .get('/api/plans')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.plans)).toBe(true);
      });
    });

    describe('GET /api/plans/:id', () => {
      it('should get a specific plan', async () => {
        const response = await request(app)
          .get(`/api/plans/${testPlan.id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.plan).toBeDefined();
        expect(response.body.plan.id).toBe(testPlan.id);
      });
    });
  });

  describe('Audio APIs', () => {
    describe('GET /api/audio', () => {
      it('should get public audios without authentication', async () => {
        const response = await request(app)
          .get('/api/audio')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.audios)).toBe(true);
      });
    });

    describe('GET /api/audio/my/list', () => {
      it('should get user audios with authentication', async () => {
        const response = await request(app)
          .get('/api/audio/my/list')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.audios)).toBe(true);
      });

      it('should fail without authentication', async () => {
        await request(app)
          .get('/api/audio/my/list')
          .expect(401);
      });
    });
  });

  describe('Playlists APIs', () => {
    describe('GET /api/playlists', () => {
      it('should get user playlists with authentication', async () => {
        const response = await request(app)
          .get('/api/playlists')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.playlists)).toBe(true);
      });
    });

    describe('POST /api/playlists', () => {
      it('should create a playlist with authentication', async () => {
        const response = await request(app)
          .post('/api/playlists')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Test Playlist',
            description: 'A test playlist',
            isPublic: false
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.playlist).toBeDefined();
        expect(response.body.playlist.name).toBe('Test Playlist');
      });
    });
  });

  describe('Folders APIs', () => {
    describe('GET /api/folders', () => {
      it('should get user folders with authentication', async () => {
        const response = await request(app)
          .get('/api/folders')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.folders)).toBe(true);
      });
    });

    describe('POST /api/folders', () => {
      it('should create a folder with authentication', async () => {
        const response = await request(app)
          .post('/api/folders')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Test Folder',
            description: 'A test folder'
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.folder).toBeDefined();
        expect(response.body.folder.name).toBe('Test Folder');
      });
    });
  });

  describe('Search APIs', () => {
    describe('GET /api/search/audios', () => {
      it('should search audios without authentication', async () => {
        const response = await request(app)
          .get('/api/search/audios')
          .query({ q: 'test' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.audios)).toBe(true);
      });
    });

    describe('GET /api/search/filters', () => {
      it('should get search filters', async () => {
        const response = await request(app)
          .get('/api/search/filters')
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Interactions APIs', () => {
    describe('GET /api/interactions/favorites', () => {
      it('should get user favorites with authentication', async () => {
        const response = await request(app)
          .get('/api/interactions/favorites')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.favorites)).toBe(true);
      });
    });
  });

  describe('Analytics APIs', () => {
    describe('GET /api/analytics/my', () => {
      it('should get user analytics with authentication', async () => {
        const response = await request(app)
          .get('/api/analytics/my')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Subscriptions APIs', () => {
    describe('GET /api/subscriptions/my', () => {
      it('should get user subscriptions with authentication', async () => {
        const response = await request(app)
          .get('/api/subscriptions/my')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.subscriptions)).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);
    });

    it('should return 401 for protected routes without auth', async () => {
      await request(app)
        .get('/api/auth/profile')
        .expect(401);
    });
  });
});

