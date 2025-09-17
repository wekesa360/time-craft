// API integration tests for Time & Wellness Application
import { describe, it, expect, beforeAll, afterEach, beforeEach } from 'vitest';
import { Miniflare } from 'miniflare';
import type { Env } from '../../src/lib/env';

describe('API Integration Tests', () => {
  let mf: Miniflare;
  let env: Env;

  beforeAll(async () => {
    // Set up Miniflare for testing the complete API
    mf = new Miniflare({
      modules: true,
      script: `
        import app from './src/workers/api-gateway.ts';
        export default app;
      `,
      d1Databases: {
        DB: 'test-db'
      },
      kvNamespaces: {
        CACHE: 'test-kv'
      },
      r2Buckets: {
        ASSETS: 'test-r2'
      }
    });

    env = await mf.getBindings();

    // Set up basic database schema
    const basicSchema = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        timezone TEXT DEFAULT 'UTC',
        preferred_language TEXT DEFAULT 'en',
        subscription_type TEXT DEFAULT 'free',
        subscription_expires_at INTEGER,
        stripe_customer_id TEXT,
        is_student BOOLEAN DEFAULT false,
        student_verification_status TEXT DEFAULT 'none',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        description TEXT,
        priority INTEGER NOT NULL DEFAULT 1,
        status TEXT DEFAULT 'pending',
        due_date INTEGER,
        estimated_duration INTEGER,
        ai_priority_score REAL,
        ai_planning_session_id TEXT,
        energy_level_required INTEGER,
        context_type TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS health_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        type TEXT CHECK(type IN ('exercise','nutrition','mood','hydration')) NOT NULL,
        payload JSON NOT NULL,
        recorded_at INTEGER NOT NULL,
        source TEXT CHECK(source IN ('auto','manual','device')) DEFAULT 'manual',
        device_type TEXT,
        created_at INTEGER NOT NULL
      );
    `;

    const statements = basicSchema.split(';').filter(s => s.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        await env.DB.prepare(statement).run();
      }
    }
  });

  afterEach(async () => {
    // Clean up test data
    await env.DB.prepare('DELETE FROM health_logs').run();
    await env.DB.prepare('DELETE FROM tasks').run();
    await env.DB.prepare('DELETE FROM users').run();
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const res = await mf.dispatchFetch('http://localhost/health');
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.status).toBe('ok');
    });
  });

  describe('Authentication API', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'testpassword123',
        firstName: 'Test',
        lastName: 'User',
        timezone: 'America/New_York',
        preferredLanguage: 'en',
        isStudent: false
      };

      const res = await mf.dispatchFetch('http://localhost/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      expect(res.status).toBe(201);
      
      const data = await res.json();
      expect(data.message).toBe('Registration successful');
      expect(data.user.email).toBe(userData.email);
      expect(data.tokens.accessToken).toBeDefined();
      expect(data.tokens.refreshToken).toBeDefined();
    });

    it('should login with valid credentials', async () => {
      // First register a user
      const userData = {
        email: 'login@example.com',
        password: 'testpassword123',
        firstName: 'Test',
        lastName: 'User'
      };

      await mf.dispatchFetch('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      // Then login
      const loginData = {
        email: userData.email,
        password: userData.password
      };

      const res = await mf.dispatchFetch('http://localhost/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.message).toBe('Login successful');
      expect(data.user.email).toBe(userData.email);
      expect(data.tokens.accessToken).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      };

      const res = await mf.dispatchFetch('http://localhost/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      expect(res.status).toBe(401);
      
      const data = await res.json();
      expect(data.error).toBe('Invalid email or password');
    });

    it('should validate JWT tokens', async () => {
      // Register and login to get a token
      const userData = {
        email: 'token@example.com',
        password: 'testpassword123',
        firstName: 'Test',
        lastName: 'User'
      };

      const registerRes = await mf.dispatchFetch('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const { tokens } = await registerRes.json();

      // Validate token
      const res = await mf.dispatchFetch('http://localhost/auth/validate', {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`
        }
      });

      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.valid).toBe(true);
      expect(data.payload.email).toBe(userData.email);
    });
  });

  describe('User Management API', () => {
    let accessToken: string;
    let userId: string;

    beforeEach(async () => {
      // Create a user and get token for authenticated requests
      const userData = {
        email: 'api@example.com',
        password: 'testpassword123',
        firstName: 'API',
        lastName: 'Test'
      };

      const registerRes = await mf.dispatchFetch('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await registerRes.json();
      accessToken = data.tokens.accessToken;
      userId = data.user.id;
    });

    it('should get user profile', async () => {
      const res = await mf.dispatchFetch('http://localhost/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.user.email).toBe('api@example.com');
      expect(data.user.first_name).toBe('API');
    });

    it('should update user profile', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        timezone: 'Europe/London'
      };

      const res = await mf.dispatchFetch('http://localhost/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.message).toBe('Profile updated successfully');
      expect(data.user.first_name).toBe('Updated');
      expect(data.user.timezone).toBe('Europe/London');
    });

    it('should require authentication', async () => {
      const res = await mf.dispatchFetch('http://localhost/api/user/profile');
      expect(res.status).toBe(401);
    });
  });

  describe('Task Management API', () => {
    let accessToken: string;
    let userId: string;

    beforeEach(async () => {
      const userData = {
        email: 'tasks@example.com',
        password: 'testpassword123',
        firstName: 'Task',
        lastName: 'User'
      };

      const registerRes = await mf.dispatchFetch('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await registerRes.json();
      accessToken = data.tokens.accessToken;
      userId = data.user.id;
    });

    it('should create a new task', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'A test task for API testing',
        priority: 2,
        dueDate: Date.now() + 86400000, // Tomorrow
        estimatedDuration: 60,
        contextType: 'work'
      };

      const res = await mf.dispatchFetch('http://localhost/api/tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      });

      expect(res.status).toBe(201);
      
      const data = await res.json();
      expect(data.message).toBe('Task created successfully');
      expect(data.task.title).toBe(taskData.title);
      expect(data.task.priority).toBe(taskData.priority);
      expect(data.task.user_id).toBe(userId);
    });

    it('should get user tasks', async () => {
      // Create a test task first
      await mf.dispatchFetch('http://localhost/api/tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Test Task',
          description: 'Test description',
          priority: 1
        })
      });

      const res = await mf.dispatchFetch('http://localhost/api/tasks', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(Array.isArray(data.tasks)).toBe(true);
      expect(data.tasks.length).toBe(1);
      expect(data.tasks[0].title).toBe('Test Task');
    });

    it('should get task statistics', async () => {
      const res = await mf.dispatchFetch('http://localhost/api/tasks/stats', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.stats).toBeDefined();
      expect(typeof data.stats.total).toBe('number');
      expect(typeof data.stats.completed).toBe('number');
      expect(typeof data.stats.pending).toBe('number');
      expect(typeof data.stats.overdue).toBe('number');
    });
  });

  describe('Health Tracking API', () => {
    let accessToken: string;

    beforeEach(async () => {
      const userData = {
        email: 'health@example.com',
        password: 'testpassword123',
        firstName: 'Health',
        lastName: 'User'
      };

      const registerRes = await mf.dispatchFetch('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await registerRes.json();
      accessToken = data.tokens.accessToken;
    });

    it('should log exercise activity', async () => {
      const exerciseData = {
        activity: 'Running',
        durationMinutes: 30,
        intensity: 7,
        caloriesBurned: 300,
        distance: 5.2,
        notes: 'Good morning run',
        source: 'manual'
      };

      const res = await mf.dispatchFetch('http://localhost/api/health/exercise', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(exerciseData)
      });

      expect(res.status).toBe(201);
      
      const data = await res.json();
      expect(data.message).toBe('Exercise logged successfully');
      expect(data.log.type).toBe('exercise');
    });

    it('should log mood data', async () => {
      const moodData = {
        score: 8,
        energy: 7,
        stress: 3,
        notes: 'Feeling great today',
        tags: ['happy', 'productive']
      };

      const res = await mf.dispatchFetch('http://localhost/api/health/mood', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(moodData)
      });

      expect(res.status).toBe(201);
      
      const data = await res.json();
      expect(data.message).toBe('Mood logged successfully');
      expect(data.log.type).toBe('mood');
    });

    it('should get health logs', async () => {
      // First log some health data
      await mf.dispatchFetch('http://localhost/api/health/exercise', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          activity: 'Walking',
          durationMinutes: 20,
          intensity: 4
        })
      });

      const res = await mf.dispatchFetch('http://localhost/api/health/logs', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(Array.isArray(data.logs)).toBe(true);
      expect(data.logs.length).toBe(1);
      expect(data.logs[0].type).toBe('exercise');
    });

    it('should get health summary', async () => {
      const res = await mf.dispatchFetch('http://localhost/api/health/summary', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.summary).toBeDefined();
      expect(typeof data.summary.exerciseCount).toBe('number');
      expect(typeof data.summary.nutritionCount).toBe('number');
      expect(typeof data.summary.hydrationTotal).toBe('number');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on auth endpoints', async () => {
      const requests = [];
      
      // Make multiple requests quickly
      for (let i = 0; i < 10; i++) {
        requests.push(
          mf.dispatchFetch('http://localhost/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'test@example.com',
              password: 'wrongpassword'
            })
          })
        );
      }

      const responses = await Promise.all(requests);
      
      // Should have some 429 responses due to rate limiting
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
      
      // Check rate limit headers
      const limitedResponse = rateLimitedResponses[0];
      expect(limitedResponse.headers.get('X-RateLimit-Limit')).toBeDefined();
      expect(limitedResponse.headers.get('Retry-After')).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors', async () => {
      const res = await mf.dispatchFetch('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
          password: '123', // Too short
          firstName: '',
          lastName: ''
        })
      });

      expect(res.status).toBe(400);
    });

    it('should handle unauthorized requests', async () => {
      const res = await mf.dispatchFetch('http://localhost/api/tasks', {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });

      expect(res.status).toBe(401);
    });

    it('should handle not found routes', async () => {
      const res = await mf.dispatchFetch('http://localhost/api/nonexistent');
      expect(res.status).toBe(404);
    });
  });

  describe('CORS', () => {
    it('should handle CORS preflight requests', async () => {
      const res = await mf.dispatchFetch('http://localhost/api/tasks', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://app.timeandwellness.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization'
        }
      });

      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBeDefined();
      expect(res.headers.get('Access-Control-Allow-Methods')).toBeDefined();
    });
  });
});