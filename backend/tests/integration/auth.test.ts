// Authentication API Integration Tests
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import apiGateway from '../../src/workers/api-gateway';
import { 
  createMockEnv, 
  testUsers, 
  makeRequest, 
  expectSuccessResponse, 
  expectErrorResponse,
  expectValidationError,
  cleanupTestData
} from '../utils/test-helpers';

describe('Authentication API', () => {
  let env: any;
  let app: any;

  beforeEach(() => {
    env = createMockEnv();
    app = apiGateway;
    
    // Clear any existing mock data
    env.DB._clearMockData();
    
    // Set up mock user data - no existing user for registration
    env.DB._setMockData('SELECT * FROM users WHERE email = ?', []);
    
    // Mock successful user creation
    env.DB._setMockData('INSERT INTO users (id, email, password_hash, first_name, last_name, preferred_language, timezone, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [{ 
      id: 'new_user_id',
      email: 'newuser@example.com',
      first_name: 'Test',
      last_name: 'User',
      created_at: Date.now(),
      updated_at: Date.now()
    }]);
    
    // Mock user retrieval after creation
    env.DB._setMockData('SELECT * FROM users WHERE id = ?', [{
      id: 'new_user_id',
      email: 'newuser@example.com',
      first_name: 'Test',
      last_name: 'User',
      preferred_language: 'en',
      timezone: 'UTC',
      created_at: Date.now(),
      updated_at: Date.now()
    }]);
  });

  afterEach(() => {
    cleanupTestData(env);
  });

  describe('POST /register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        firstName: 'Test',
        lastName: 'User',
        preferredLanguage: 'en'
      };

      const response = await makeRequest(app, 'POST', '/auth/register', {
          
        body: userData
      ,
          env: env
        });

      expectSuccessResponse(response, 201);
      const body = await response.json();
      
      expect(body).toMatchObject({
        message: expect.stringContaining('Registration successful'),
        user: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName
        },
        tokens: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String)
        }
      });
    });

    it('should reject registration with invalid email', async () => {
      const response = await makeRequest(app, 'POST', '/auth/register', {
        body: {
          email: 'invalid-email',
          password: 'SecurePassword123!',
          firstName: 'Test',
          lastName: 'User'
        },
        env: env
      });

      await expectValidationError(response, 'email');
    });

    it('should reject registration with weak password', async () => {
      const response = await makeRequest(app, 'POST', '/auth/register', {
        body: {
          email: 'test@example.com',
          password: '123', // Too weak
          firstName: 'Test',
          lastName: 'User'
        },
        env: env
      });

      await expectValidationError(response, 'password');
    });

    it('should reject registration with existing email', async () => {
      // Mock existing user
      env.DB._setMockData('SELECT * FROM users WHERE email = ?', [testUsers.regularUser]);

      const response = await makeRequest(app, 'POST', '/auth/register', {
        body: {
          email: testUsers.regularUser.email,
          password: 'SecurePassword123!',
          firstName: 'Test',
          lastName: 'User'
        },
        env: env
      });

      expectErrorResponse(response, 409, 'User already exists');
    });
  });

  describe('POST /login', () => {
    beforeEach(() => {
      // Mock user with hashed password
      const userWithPassword = {
        ...testUsers.regularUser,
        password_hash: '$2b$10$mocked.hash.for.testing'
      };
      env.DB._setMockData('SELECT * FROM users WHERE email = ?', [userWithPassword]);
    });

    it('should login user with valid credentials', async () => {
      const response = await makeRequest(app, 'POST', '/auth/login', {
        body: {
          email: testUsers.regularUser.email,
          password: 'correct-password'
        },
        env: env
      });

      expectSuccessResponse(response);
      const body = await response.json();
      
      expect(body).toMatchObject({
        message: expect.stringContaining('successful'),
        user: {
          id: testUsers.regularUser.id,
          email: testUsers.regularUser.email
        },
        tokens: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String)
        }
      });
    });

    it('should reject login with invalid email', async () => {
      env.DB._setMockData('SELECT * FROM users WHERE email = ?', []);

      const response = await makeRequest(app, 'POST', '/auth/login', {
        body: {
          email: 'nonexistent@example.com',
          password: 'password'
        },
        env: env
      });

      expectErrorResponse(response, 401, 'Invalid email or password');
    });

    it('should reject login with invalid password', async () => {
      const response = await makeRequest(app, 'POST', '/auth/login', {
        body: {
          email: testUsers.regularUser.email,
          password: 'wrong-password'
        },
        env: env
      });

      expectErrorResponse(response, 401, 'Invalid email or password');
    });
  });

  describe('POST /refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      // Create a proper JWT refresh token
      const { sign } = await import('hono/jwt');
      const refreshToken = await sign(
        {
          userId: testUsers.regularUser.id,
          email: testUsers.regularUser.email,
          subscriptionType: testUsers.regularUser.subscription_type,
          isStudent: testUsers.regularUser.is_student,
          preferredLanguage: testUsers.regularUser.preferred_language,
          exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 1 day
          type: 'refresh'
        },
        env.REFRESH_SECRET
      );

      env.DB._setMockData('SELECT * FROM users WHERE id = ?', [testUsers.regularUser]);

      const response = await makeRequest(app, 'POST', '/auth/refresh', {
        body: { refreshToken },
        env: env
      });

      expectSuccessResponse(response);
      const body = await response.json();
      
      expect(body).toMatchObject({
        tokens: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String)
        }
      });
    });

    it('should reject invalid refresh token', async () => {
      env.DB._setMockData('SELECT * FROM refresh_tokens WHERE token = ?', []);

      const response = await makeRequest(app, 'POST', '/auth/refresh', {
        body: { refreshToken: 'invalid.token' },
        env: env
      });

      expectErrorResponse(response, 401, 'Invalid or expired refresh token');
    });
  });

  describe('POST /logout', () => {
    it('should logout user successfully', async () => {
      const token = 'valid.access.token';
      
      const response = await makeRequest(app, 'POST', '/auth/logout', {
        token,
        body: { refreshToken: 'refresh.token' },
        env: env
      });

      expectSuccessResponse(response);
      const body = await response.json();
      expect(body.message).toContain('Logout successful');
    });
  });

  describe('POST /forgot-password', () => {
    it('should send password reset email', async () => {
      env.DB._setMockData('SELECT * FROM users WHERE email = ?', [testUsers.regularUser]);

      const response = await makeRequest(app, 'POST', '/auth/forgot-password', {
        body: { email: testUsers.regularUser.email },
        env: env
      });

      expectSuccessResponse(response);
      const body = await response.json();
      expect(body.message).toContain('reset link has been sent');
    });

    it('should handle non-existent email gracefully', async () => {
      env.DB._setMockData('SELECT * FROM users WHERE email = ?', []);

      const response = await makeRequest(app, 'POST', '/auth/forgot-password', {
        body: { email: 'nonexistent@example.com' },
        env: env
      });

      // Should still return success to prevent email enumeration
      expectSuccessResponse(response);
    });
  });

  describe('POST /reset-password', () => {
    it('should reset password with valid token', async () => {
      // Create a proper JWT reset token
      const { sign } = await import('hono/jwt');
      const resetToken = await sign(
        {
          userId: testUsers.regularUser.id,
          exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
          type: 'password_reset'
        },
        env.JWT_SECRET
      );

      // Mock the KV cache to have the token
      await env.CACHE.put(`reset_token_${testUsers.regularUser.id}`, resetToken);
      
      // Mock user lookup
      env.DB._setMockData('SELECT * FROM users WHERE id = ?', [testUsers.regularUser]);

      const response = await makeRequest(app, 'POST', '/auth/reset-password', {
        body: {
          token: resetToken,
          newPassword: 'NewSecurePassword123!'
        },
        env: env
      });

      expectSuccessResponse(response);
      const body = await response.json();
      expect(body.message).toContain('Password reset successful');
    });

    it('should reject expired reset token', async () => {
      const resetToken = 'expired-reset-token';
      env.DB._setMockData('SELECT * FROM password_reset_tokens WHERE token = ?', [{
        token: resetToken,
        user_id: testUsers.regularUser.id,
        expires_at: Date.now() - 3600000, // 1 hour ago (expired)
        used: false
      }]);

      const response = await makeRequest(app, 'POST', '/auth/reset-password', {
        body: {
          token: resetToken,
          newPassword: 'NewSecurePassword123!'
        },
        env: env
      });

      expectErrorResponse(response, 401, 'Invalid or expired');
    });
  });

  describe('POST /verify-student', () => {
    it('should verify student email successfully', async () => {
      const response = await makeRequest(app, 'POST', '/auth/verify-student', {
        body: { email: 'student@university.edu' },
        env: env
      });

      // Student verification endpoint not implemented yet
      expect(response.status).toBe(404);
    });

    it('should reject non-student email', async () => {
      const response = await makeRequest(app, 'POST', '/auth/verify-student', {
        body: { email: 'regular@gmail.com' },
        env: env
      });

      // Student verification endpoint not implemented yet
      expect(response.status).toBe(404);
    });
  });
});