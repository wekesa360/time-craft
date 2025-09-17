import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { authenticateUser, optionalAuth, requireSubscription, getCurrentUser } from '../../src/middleware/auth';
import type { Env } from '../../src/lib/env';

describe('Auth Middleware', () => {
  let app: Hono;
  let env: Env;

  beforeEach(() => {
    app = new Hono();
    env = {
      JWT_SECRET: 'test-jwt-secret',
      REFRESH_SECRET: 'test-refresh-secret',
      API_KEY: 'test-api-key'
    } as Env;
  });

  describe('authenticateUser', () => {
    it('should authenticate valid access token', async () => {
      // Create a valid access token
      const payload = {
        userId: 'user_123',
        email: 'test@example.com',
        subscriptionType: 'free' as const,
        isStudent: false,
        preferredLanguage: 'en',
        type: 'access' as const,
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };

      const token = await sign(payload, env.JWT_SECRET);

      app.use('*', authenticateUser);
      app.get('/test', (c) => {
        const user = getCurrentUser(c);
        return c.json({ user });
      });

      const res = await app.request('/test', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }, env);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user).toEqual({
        id: 'user_123',
        email: 'test@example.com',
        subscription_type: 'free',
        is_student: false,
        preferred_language: 'en'
      });
    });

    it('should reject missing authorization header', async () => {
      app.use('*', authenticateUser);
      app.get('/test', (c) => c.json({ success: true }));

      const res = await app.request('/test', {}, env);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Missing or invalid authorization header');
    });

    it('should reject invalid token', async () => {
      app.use('*', authenticateUser);
      app.get('/test', (c) => c.json({ success: true }));

      const res = await app.request('/test', {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      }, env);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Invalid or expired token');
    });

    it('should reject expired token', async () => {
      const payload = {
        userId: 'user_123',
        email: 'test@example.com',
        subscriptionType: 'free' as const,
        isStudent: false,
        preferredLanguage: 'en',
        type: 'access' as const,
        exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago (expired)
      };

      const token = await sign(payload, env.JWT_SECRET);

      app.use('*', authenticateUser);
      app.get('/test', (c) => c.json({ success: true }));

      const res = await app.request('/test', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }, env);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Invalid or expired token');
    });

    it('should reject refresh token for access endpoint', async () => {
      const payload = {
        userId: 'user_123',
        email: 'test@example.com',
        subscriptionType: 'free' as const,
        isStudent: false,
        preferredLanguage: 'en',
        type: 'refresh' as const, // Wrong token type
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      const token = await sign(payload, env.JWT_SECRET);

      app.use('*', authenticateUser);
      app.get('/test', (c) => c.json({ success: true }));

      const res = await app.request('/test', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }, env);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Invalid or expired token');
    });
  });

  describe('optionalAuth', () => {
    it('should continue without authentication when no token provided', async () => {
      app.use('*', optionalAuth);
      app.get('/test', (c) => {
        const user = getCurrentUser(c);
        return c.json({ user });
      });

      const res = await app.request('/test', {}, env);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user).toBeNull();
    });

    it('should authenticate when valid token provided', async () => {
      const payload = {
        userId: 'user_123',
        email: 'test@example.com',
        subscriptionType: 'standard' as const,
        isStudent: true,
        preferredLanguage: 'de',
        type: 'access' as const,
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      const token = await sign(payload, env.JWT_SECRET);

      app.use('*', optionalAuth);
      app.get('/test', (c) => {
        const user = getCurrentUser(c);
        return c.json({ user });
      });

      const res = await app.request('/test', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }, env);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user).toEqual({
        id: 'user_123',
        email: 'test@example.com',
        subscription_type: 'standard',
        is_student: true,
        preferred_language: 'de'
      });
    });

    it('should continue without authentication when invalid token provided', async () => {
      app.use('*', optionalAuth);
      app.get('/test', (c) => {
        const user = getCurrentUser(c);
        return c.json({ user });
      });

      const res = await app.request('/test', {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      }, env);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user).toBeNull();
    });
  });

  describe('requireSubscription', () => {
    it('should allow access with sufficient subscription level', async () => {
      const payload = {
        userId: 'user_123',
        email: 'test@example.com',
        subscriptionType: 'standard' as const,
        isStudent: false,
        preferredLanguage: 'en',
        type: 'access' as const,
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      const token = await sign(payload, env.JWT_SECRET);

      app.use('*', authenticateUser);
      app.use('*', requireSubscription('free'));
      app.get('/test', (c) => c.json({ success: true }));

      const res = await app.request('/test', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }, env);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('should deny access with insufficient subscription level', async () => {
      const payload = {
        userId: 'user_123',
        email: 'test@example.com',
        subscriptionType: 'free' as const,
        isStudent: false,
        preferredLanguage: 'en',
        type: 'access' as const,
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      const token = await sign(payload, env.JWT_SECRET);

      app.use('*', authenticateUser);
      app.use('*', requireSubscription('standard'));
      app.get('/test', (c) => c.json({ success: true }));

      const res = await app.request('/test', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }, env);

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe('standard subscription required');
      expect(data.upgrade_required).toBe(true);
      expect(data.current_subscription).toBe('free');
    });

    it('should allow student access to standard features', async () => {
      const payload = {
        userId: 'user_123',
        email: 'test@example.com',
        subscriptionType: 'student' as const,
        isStudent: true,
        preferredLanguage: 'en',
        type: 'access' as const,
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      const token = await sign(payload, env.JWT_SECRET);

      app.use('*', authenticateUser);
      app.use('*', requireSubscription('free'));
      app.get('/test', (c) => c.json({ success: true }));

      const res = await app.request('/test', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }, env);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when no user context', async () => {
      app.get('/test', (c) => {
        const user = getCurrentUser(c);
        return c.json({ user });
      });

      const res = await app.request('/test', {}, env);
      const data = await res.json();
      expect(data.user).toBeNull();
    });

    it('should return user data when authenticated', async () => {
      const payload = {
        userId: 'user_123',
        email: 'test@example.com',
        subscriptionType: 'standard' as const,
        isStudent: true,
        preferredLanguage: 'de',
        type: 'access' as const,
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      const token = await sign(payload, env.JWT_SECRET);

      app.use('*', authenticateUser);
      app.get('/test', (c) => {
        const user = getCurrentUser(c);
        return c.json({ user });
      });

      const res = await app.request('/test', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }, env);

      const data = await res.json();
      expect(data.user).toEqual({
        id: 'user_123',
        email: 'test@example.com',
        subscription_type: 'standard',
        is_student: true,
        preferred_language: 'de'
      });
    });
  });
});