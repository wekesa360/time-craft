// Authentication API unit tests
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { Miniflare } from 'miniflare';
import type { Env } from '../../src/lib/env';
import { UserRepository } from '../../src/lib/db';
import bcrypt from 'bcryptjs';

describe('Authentication API', () => {
  let mf: Miniflare;
  let env: Env;

  beforeAll(async () => {
    mf = new Miniflare({
      modules: true,
      script: `
        export default {
          async fetch(request, env, ctx) {
            return new Response('OK');
          }
        };
      `,
      d1Databases: {
        DB: 'test-db'
      },
      kvNamespaces: {
        CACHE: 'test-kv'
      },
      bindings: {
        JWT_SECRET: 'test-jwt-secret',
        REFRESH_SECRET: 'test-refresh-secret'
      }
    });

    env = await mf.getBindings();

    // Set up database schema
    const schema = `
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
    `;

    await env.DB.prepare(schema).run();
  });

  afterEach(async () => {
    await env.DB.prepare('DELETE FROM users').run();
  });

  describe('User Registration', () => {
    it('should create a new user with hashed password', async () => {
      const userRepo = new UserRepository(env);
      
      const userData = {
        email: 'test@example.com',
        password_hash: await bcrypt.hash('testpassword123', 10),
        first_name: 'Test',
        last_name: 'User',
        timezone: 'UTC',
        preferred_language: 'en' as const,
        subscription_type: 'free' as const,
        subscription_expires_at: null,
        stripe_customer_id: null,
        is_student: false,
        student_verification_status: 'none' as const
      };

      const user = await userRepo.createUser(userData);

      expect(user.id).toBeTruthy();
      expect(user.email).toBe(userData.email);
      expect(user.password_hash).toBe(userData.password_hash);
      expect(user.first_name).toBe(userData.first_name);
      expect(user.subscription_type).toBe('free');
      expect(user.created_at).toBeTruthy();
      expect(user.updated_at).toBeTruthy();
    });

    it('should prevent duplicate email registration', async () => {
      const userRepo = new UserRepository(env);
      
      const userData = {
        email: 'duplicate@example.com',
        password_hash: await bcrypt.hash('password123', 10),
        first_name: 'First',
        last_name: 'User',
        timezone: 'UTC',
        preferred_language: 'en' as const,
        subscription_type: 'free' as const,
        subscription_expires_at: null,
        stripe_customer_id: null,
        is_student: false,
        student_verification_status: 'none' as const
      };

      // Create first user
      await userRepo.createUser(userData);

      // Try to create duplicate
      await expect(userRepo.createUser({
        ...userData,
        first_name: 'Second'
      })).rejects.toThrow();
    });

    it('should find user by email', async () => {
      const userRepo = new UserRepository(env);
      
      const userData = {
        email: 'findme@example.com',
        password_hash: await bcrypt.hash('password123', 10),
        first_name: 'Find',
        last_name: 'Me',
        timezone: 'UTC',
        preferred_language: 'en' as const,
        subscription_type: 'free' as const,
        subscription_expires_at: null,
        stripe_customer_id: null,
        is_student: false,
        student_verification_status: 'none' as const
      };

      const createdUser = await userRepo.createUser(userData);
      const foundUser = await userRepo.findByEmail(userData.email);

      expect(foundUser).not.toBeNull();
      expect(foundUser?.id).toBe(createdUser.id);
      expect(foundUser?.email).toBe(userData.email);
    });

    it('should return null for non-existent email', async () => {
      const userRepo = new UserRepository(env);
      const user = await userRepo.findByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });
  });

  describe('Password Security', () => {
    it('should hash passwords with bcrypt', async () => {
      const password = 'mysecretpassword123';
      const hashedPassword = await bcrypt.hash(password, 10);

      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.startsWith('$2a$')).toBe(true);

      // Verify password can be checked
      const isValid = await bcrypt.compare(password, hashedPassword);
      expect(isValid).toBe(true);

      const isInvalid = await bcrypt.compare('wrongpassword', hashedPassword);
      expect(isInvalid).toBe(false);
    });
  });

  describe('User Updates', () => {
    it('should update user subscription', async () => {
      const userRepo = new UserRepository(env);
      
      const user = await userRepo.createUser({
        email: 'subscription@example.com',
        password_hash: await bcrypt.hash('password123', 10),
        first_name: 'Sub',
        last_name: 'User',
        timezone: 'UTC',
        preferred_language: 'en',
        subscription_type: 'free',
        subscription_expires_at: null,
        stripe_customer_id: null,
        is_student: false,
        student_verification_status: 'none'
      });

      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
      const stripeCustomerId = 'cus_test123';

      await userRepo.updateSubscription(
        user.id, 
        'standard', 
        expiresAt, 
        stripeCustomerId
      );

      const updatedUser = await userRepo.findById(user.id);
      expect(updatedUser?.subscription_type).toBe('standard');
      expect(updatedUser?.subscription_expires_at).toBe(expiresAt);
      expect(updatedUser?.stripe_customer_id).toBe(stripeCustomerId);
    });

    it('should update user profile', async () => {
      const userRepo = new UserRepository(env);
      
      const user = await userRepo.createUser({
        email: 'profile@example.com',
        password_hash: await bcrypt.hash('password123', 10),
        first_name: 'Old',
        last_name: 'Name',
        timezone: 'UTC',
        preferred_language: 'en',
        subscription_type: 'free',
        subscription_expires_at: null,
        stripe_customer_id: null,
        is_student: false,
        student_verification_status: 'none'
      });

      await userRepo.updateUser(user.id, {
        first_name: 'New',
        last_name: 'Name',
        timezone: 'America/New_York',
        preferred_language: 'de'
      });

      const updatedUser = await userRepo.findById(user.id);
      expect(updatedUser?.first_name).toBe('New');
      expect(updatedUser?.timezone).toBe('America/New_York');
      expect(updatedUser?.preferred_language).toBe('de');
      expect(updatedUser?.updated_at).toBeGreaterThan(user.updated_at);
    });
  });

  describe('Student Verification', () => {
    it('should create student users', async () => {
      const userRepo = new UserRepository(env);
      
      const studentData = {
        email: 'student@university.edu',
        password_hash: await bcrypt.hash('password123', 10),
        first_name: 'Student',
        last_name: 'User',
        timezone: 'UTC',
        preferred_language: 'en' as const,
        subscription_type: 'free' as const,
        subscription_expires_at: null,
        stripe_customer_id: null,
        is_student: true,
        student_verification_status: 'pending' as const
      };

      const student = await userRepo.createUser(studentData);

      expect(student.is_student).toBe(true);
      expect(student.student_verification_status).toBe('pending');
    });
  });

  describe('Internationalization', () => {
    it('should support different languages', async () => {
      const userRepo = new UserRepository(env);
      
      const germanUser = await userRepo.createUser({
        email: 'german@example.com',
        password_hash: await bcrypt.hash('password123', 10),
        first_name: 'Hans',
        last_name: 'Müller',
        timezone: 'Europe/Berlin',
        preferred_language: 'de',
        subscription_type: 'free',
        subscription_expires_at: null,
        stripe_customer_id: null,
        is_student: false,
        student_verification_status: 'none'
      });

      expect(germanUser.preferred_language).toBe('de');
      expect(germanUser.timezone).toBe('Europe/Berlin');

      const englishUser = await userRepo.createUser({
        email: 'english@example.com',
        password_hash: await bcrypt.hash('password123', 10),
        first_name: 'John',
        last_name: 'Doe',
        timezone: 'America/New_York',
        preferred_language: 'en',
        subscription_type: 'free',
        subscription_expires_at: null,
        stripe_customer_id: null,
        is_student: false,
        student_verification_status: 'none'
      });

      expect(englishUser.preferred_language).toBe('en');
      expect(englishUser.timezone).toBe('America/New_York');
    });
  });
});