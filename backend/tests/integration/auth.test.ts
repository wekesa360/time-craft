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
    
    // Set up mock user data
    env.DB._setMockData('SELECT * FROM users WHERE email = ?', []);
    env.DB._setMockData('INSERT INTO users', [{ id: 'new_user_id' }]);
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
      });

      expectSuccessResponse(response, 201);
      const body = await response.json();
      
      expect(body).toMatchObject({
        message: expect.stringContaining('registered successfully'),
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
        }
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
        }
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
        }
      });

      expectErrorResponse(response, 400, 'already registered');
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
        }
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
        }
      });

      expectErrorResponse(response, 401, 'Invalid credentials');
    });

    it('should reject login with invalid password', async () => {
      const response = await makeRequest(app, 'POST', '/auth/login', {
        body: {
          email: testUsers.regularUser.email,
          password: 'wrong-password'
        }
      });

      expectErrorResponse(response, 401, 'Invalid credentials');
    });
  });

  describe('POST /refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      // Mock valid refresh token
      const refreshToken = 'valid.refresh.token';
      env.DB._setMockData('SELECT * FROM refresh_tokens WHERE token = ?', [{
        token: refreshToken,
        user_id: testUsers.regularUser.id,
        expires_at: Date.now() + 86400000, // 1 day from now
        is_revoked: false
      }]);
      env.DB._setMockData('SELECT * FROM users WHERE id = ?', [testUsers.regularUser]);

      const response = await makeRequest(app, 'POST', '/auth/refresh', {
        body: { refreshToken }
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
        body: { refreshToken: 'invalid.token' }
      });

      expectErrorResponse(response, 401, 'Invalid refresh token');
    });
  });

  describe('POST /logout', () => {
    it('should logout user successfully', async () => {
      const token = 'valid.access.token';
      
      const response = await makeRequest(app, 'POST', '/auth/logout', {
        token,
        body: { refreshToken: 'refresh.token' }
      });

      expectSuccessResponse(response);
      const body = await response.json();
      expect(body.message).toContain('logged out');
    });
  });

  describe('POST /forgot-password', () => {
    it('should send password reset email', async () => {
      env.DB._setMockData('SELECT * FROM users WHERE email = ?', [testUsers.regularUser]);

      const response = await makeRequest(app, 'POST', '/auth/forgot-password', {
        body: { email: testUsers.regularUser.email }
      });

      expectSuccessResponse(response);
      const body = await response.json();
      expect(body.message).toContain('reset instructions');
    });

    it('should handle non-existent email gracefully', async () => {
      env.DB._setMockData('SELECT * FROM users WHERE email = ?', []);

      const response = await makeRequest(app, 'POST', '/auth/forgot-password', {
        body: { email: 'nonexistent@example.com' }
      });

      // Should still return success to prevent email enumeration
      expectSuccessResponse(response);
    });
  });

  describe('POST /reset-password', () => {
    it('should reset password with valid token', async () => {
      const resetToken = 'valid-reset-token';
      env.DB._setMockData('SELECT * FROM password_reset_tokens WHERE token = ?', [{
        token: resetToken,
        user_id: testUsers.regularUser.id,
        expires_at: Date.now() + 3600000, // 1 hour from now
        used: false
      }]);

      const response = await makeRequest(app, 'POST', '/auth/reset-password', {
        body: {
          token: resetToken,
          password: 'NewSecurePassword123!'
        }
      });

      expectSuccessResponse(response);
      const body = await response.json();
      expect(body.message).toContain('reset successfully');
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
          password: 'NewSecurePassword123!'
        }
      });

      expectErrorResponse(response, 400, 'Invalid or expired');
    });
  });

  describe('POST /verify-student', () => {
    it('should verify student email successfully', async () => {
      const response = await makeRequest(app, 'POST', '/auth/verify-student', {
        body: { email: 'student@university.edu' }
      });

      expectSuccessResponse(response);
      const body = await response.json();
      expect(body).toMatchObject({
        verified: expect.any(Boolean),
        institution: expect.any(String)
      });
    });

    it('should reject non-student email', async () => {
      const response = await makeRequest(app, 'POST', '/auth/verify-student', {
        body: { email: 'regular@gmail.com' }
      });

      expectSuccessResponse(response);
      const body = await response.json();
      expect(body.verified).toBe(false);
    });
  });
});