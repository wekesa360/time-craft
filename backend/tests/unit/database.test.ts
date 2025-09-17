// Database tests for Time & Wellness Application
import { describe, it, expect, beforeAll, afterEach, beforeEach } from 'vitest';
import { Miniflare } from 'miniflare';
import type { Env } from '../../src/lib/env';
import {
  UserRepository,
  TaskRepository,
  HealthRepository,
  FinanceRepository,
  LocalizationRepository
} from '../../src/lib/db';
import { MigrationRunner } from '../../src/lib/migrations';
import type {
  User,
  Task,
  HealthLog,
  FinancialEntry,
  SupportedLanguage
} from '../../src/types/database';

describe('Database Operations', () => {
  let mf: Miniflare;
  let env: Env;

  beforeAll(async () => {
    // Set up Miniflare for testing
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
      }
    });

    env = await mf.getBindings();

    // Run initial migration
    const migrationRunner = new MigrationRunner(env);
    await migrationRunner.initMigrationsTable();

    // Create basic tables for testing
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

      CREATE TABLE IF NOT EXISTS financial_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        transaction_type TEXT CHECK(transaction_type IN ('income','expense','investment','saving')) NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'USD',
        description TEXT,
        tags JSON,
        payment_method TEXT,
        location TEXT,
        receipt_url TEXT,
        is_recurring BOOLEAN DEFAULT false,
        recurring_frequency TEXT,
        transaction_date INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS localized_content (
        id TEXT PRIMARY KEY,
        content_key TEXT NOT NULL,
        language TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        UNIQUE(content_key, language)
      );
    `;

    // Split and execute schema statements
    const statements = basicSchema.split(';').filter(s => s.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        await env.DB.prepare(statement).run();
      }
    }
  });

  afterEach(async () => {
    // Clean up test data after each test - order matters due to foreign keys
    await env.DB.prepare('DELETE FROM tasks').run();
    await env.DB.prepare('DELETE FROM health_logs').run();
    await env.DB.prepare('DELETE FROM financial_entries').run();
    await env.DB.prepare('DELETE FROM localized_content').run();
    await env.DB.prepare('DELETE FROM users').run();
  });

  describe('UserRepository', () => {
    let userRepo: UserRepository;

    beforeEach(() => {
      userRepo = new UserRepository(env);
    });

    it('should create a new user', async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe',
        timezone: 'America/New_York',
        preferred_language: 'en' as SupportedLanguage,
        subscription_type: 'free' as const,
        subscription_expires_at: null,
        stripe_customer_id: null,
        is_student: false,
        student_verification_status: 'none' as const
      };

      const user = await userRepo.createUser(userData);

      expect(user.id).toBeTruthy();
      expect(user.email).toBe(userData.email);
      expect(user.first_name).toBe(userData.first_name);
      expect(user.created_at).toBeTruthy();
      expect(user.updated_at).toBeTruthy();
    });

    it('should find user by email', async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe',
        timezone: 'UTC',
        preferred_language: 'en' as SupportedLanguage,
        subscription_type: 'free' as const,
        subscription_expires_at: null,
        stripe_customer_id: null,
        is_student: false,
        student_verification_status: 'none' as const
      };

      const createdUser = await userRepo.createUser(userData);
      const foundUser = await userRepo.findByEmail(userData.email);

      expect(foundUser).toBeTruthy();
      expect(foundUser?.id).toBe(createdUser.id);
      expect(foundUser?.email).toBe(userData.email);
    });

    it('should find user by id', async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe',
        timezone: 'UTC',
        preferred_language: 'en' as SupportedLanguage,
        subscription_type: 'free' as const,
        subscription_expires_at: null,
        stripe_customer_id: null,
        is_student: false,
        student_verification_status: 'none' as const
      };

      const createdUser = await userRepo.createUser(userData);
      const foundUser = await userRepo.findById(createdUser.id);

      expect(foundUser).toBeTruthy();
      expect(foundUser?.id).toBe(createdUser.id);
      expect(foundUser?.email).toBe(userData.email);
    });

    it('should update user subscription', async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe',
        timezone: 'UTC',
        preferred_language: 'en' as SupportedLanguage,
        subscription_type: 'free' as const,
        subscription_expires_at: null,
        stripe_customer_id: null,
        is_student: false,
        student_verification_status: 'none' as const
      };

      const user = await userRepo.createUser(userData);
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
      const stripeCustomerId = 'cus_test123';

      await userRepo.updateSubscription(user.id, 'standard', expiresAt, stripeCustomerId);

      const updatedUser = await userRepo.findById(user.id);
      expect(updatedUser?.subscription_type).toBe('standard');
      expect(updatedUser?.subscription_expires_at).toBe(expiresAt);
      expect(updatedUser?.stripe_customer_id).toBe(stripeCustomerId);
    });
  });

  describe('TaskRepository', () => {
    let userRepo: UserRepository;
    let taskRepo: TaskRepository;
    let testUser: User;

    beforeEach(async () => {
      userRepo = new UserRepository(env);
      taskRepo = new TaskRepository(env);

      // Create a test user
      testUser = await userRepo.createUser({
        email: `test-${Date.now()}-${Math.random()}@example.com`,
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe',
        timezone: 'UTC',
        preferred_language: 'en',
        subscription_type: 'free',
        subscription_expires_at: null,
        stripe_customer_id: null,
        is_student: false,
        student_verification_status: 'none'
      });
    });

    it('should create a new task', async () => {
      const taskData = {
        user_id: testUser.id,
        title: 'Test Task',
        description: 'A test task',
        priority: 2 as const,
        status: 'pending' as const,
        due_date: Date.now() + 86400000,
        estimated_duration: 60,
        ai_priority_score: 0.8,
        ai_planning_session_id: null,
        energy_level_required: 5,
        context_type: 'work'
      };

      const task = await taskRepo.createTask(taskData);

      expect(task.id).toBeTruthy();
      expect(task.user_id).toBe(testUser.id);
      expect(task.title).toBe(taskData.title);
      expect(task.priority).toBe(taskData.priority);
      expect(task.created_at).toBeTruthy();
      expect(task.updated_at).toBeTruthy();
    });

    it('should get user tasks with filters', async () => {
      // Create multiple tasks
      const tasks = [
        {
          user_id: testUser.id,
          title: 'High Priority Task',
          description: 'Important task',
          priority: 4 as const,
          status: 'pending' as const,
          due_date: null,
          estimated_duration: null,
          ai_priority_score: null,
          ai_planning_session_id: null,
          energy_level_required: null,
          context_type: 'work'
        },
        {
          user_id: testUser.id,
          title: 'Low Priority Task',
          description: 'Less important',
          priority: 1 as const,
          status: 'done' as const,
          due_date: null,
          estimated_duration: null,
          ai_priority_score: null,
          ai_planning_session_id: null,
          energy_level_required: null,
          context_type: 'personal'
        }
      ];

      await Promise.all(tasks.map(task => taskRepo.createTask(task)));

      // Test filtering by status
      const pendingTasks = await taskRepo.getTasks(testUser.id, { status: 'pending' });
      expect(pendingTasks.data).toHaveLength(1);
      expect(pendingTasks.data[0].status).toBe('pending');

      // Test filtering by priority
      const highPriorityTasks = await taskRepo.getTasks(testUser.id, { priority: 4 });
      expect(highPriorityTasks.data).toHaveLength(1);
      expect(highPriorityTasks.data[0].priority).toBe(4);

      // Test search
      const searchResults = await taskRepo.getTasks(testUser.id, { search: 'High Priority' });
      expect(searchResults.data).toHaveLength(1);
      expect(searchResults.data[0].title).toContain('High Priority');
    });

    it('should complete a task', async () => {
      const taskData = {
        user_id: testUser.id,
        title: 'Task to Complete',
        description: null,
        priority: 1 as const,
        status: 'pending' as const,
        due_date: null,
        estimated_duration: null,
        ai_priority_score: null,
        ai_planning_session_id: null,
        energy_level_required: null,
        context_type: null
      };

      const task = await taskRepo.createTask(taskData);
      await taskRepo.completeTask(task.id, testUser.id);

      const completedTasks = await taskRepo.getTasks(testUser.id, { status: 'done' });
      expect(completedTasks.data).toHaveLength(1);
      expect(completedTasks.data[0].id).toBe(task.id);
    });

    it('should get task statistics', async () => {
      // Create tasks with different statuses
      const tasks = [
        { status: 'pending' as const, due_date: Date.now() - 86400000 }, // overdue
        { status: 'pending' as const, due_date: Date.now() + 86400000 }, // future
        { status: 'done' as const, due_date: null },
        { status: 'done' as const, due_date: null }
      ];

      for (const taskData of tasks) {
        await taskRepo.createTask({
          user_id: testUser.id,
          title: 'Test Task',
          description: null,
          priority: 1,
          status: taskData.status,
          due_date: taskData.due_date,
          estimated_duration: null,
          ai_priority_score: null,
          ai_planning_session_id: null,
          energy_level_required: null,
          context_type: null
        });
      }

      const stats = await taskRepo.getTaskStats(testUser.id);
      expect(stats.total).toBe(4);
      expect(stats.completed).toBe(2);
      expect(stats.pending).toBe(2);
      expect(stats.overdue).toBe(1);
    });
  });

  describe('HealthRepository', () => {
    let userRepo: UserRepository;
    let healthRepo: HealthRepository;
    let testUser: User;

    beforeEach(async () => {
      userRepo = new UserRepository(env);
      healthRepo = new HealthRepository(env);

      testUser = await userRepo.createUser({
        email: `test-${Date.now()}-${Math.random()}@example.com`,
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe',
        timezone: 'UTC',
        preferred_language: 'en',
        subscription_type: 'free',
        subscription_expires_at: null,
        stripe_customer_id: null,
        is_student: false,
        student_verification_status: 'none'
      });
    });

    it('should log health data', async () => {
      const healthData = {
        user_id: testUser.id,
        type: 'exercise' as const,
        payload: {
          activity: 'Running',
          duration_minutes: 30,
          intensity: 7,
          calories_burned: 300
        },
        recorded_at: Date.now(),
        source: 'manual' as const,
        device_type: null
      };

      const healthLog = await healthRepo.logHealthData(healthData);

      expect(healthLog.id).toBeTruthy();
      expect(healthLog.user_id).toBe(testUser.id);
      expect(healthLog.type).toBe('exercise');
      expect(healthLog.payload).toEqual(healthData.payload);
      expect(healthLog.created_at).toBeTruthy();
    });

    it('should get health logs with filters', async () => {
      const healthLogs = [
        {
          user_id: testUser.id,
          type: 'exercise' as const,
          payload: { activity: 'Running' },
          recorded_at: Date.now(),
          source: 'manual' as const,
          device_type: null
        },
        {
          user_id: testUser.id,
          type: 'mood' as const,
          payload: { score: 8 },
          recorded_at: Date.now(),
          source: 'manual' as const,
          device_type: null
        }
      ];

      await Promise.all(healthLogs.map(log => healthRepo.logHealthData(log)));

      // Filter by type
      const exerciseLogs = await healthRepo.getHealthLogs(testUser.id, { type: 'exercise' });
      expect(exerciseLogs.data).toHaveLength(1);
      expect(exerciseLogs.data[0].type).toBe('exercise');

      // Filter by source
      const manualLogs = await healthRepo.getHealthLogs(testUser.id, { source: 'manual' });
      expect(manualLogs.data).toHaveLength(2);
    });

    it('should get health summary', async () => {
      const now = Date.now();
      const yesterday = now - 24 * 60 * 60 * 1000;

      const healthLogs = [
        {
          user_id: testUser.id,
          type: 'exercise' as const,
          payload: { activity: 'Running' },
          recorded_at: yesterday,
          source: 'manual' as const,
          device_type: null
        },
        {
          user_id: testUser.id,
          type: 'mood' as const,
          payload: { score: 8 },
          recorded_at: yesterday,
          source: 'manual' as const,
          device_type: null
        },
        {
          user_id: testUser.id,
          type: 'hydration' as const,
          payload: { amount_ml: 500 },
          recorded_at: yesterday,
          source: 'manual' as const,
          device_type: null
        }
      ];

      await Promise.all(healthLogs.map(log => healthRepo.logHealthData(log)));

      const summary = await healthRepo.getHealthSummary(testUser.id, 7);
      expect(summary.exerciseCount).toBe(1);
      expect(summary.moodAverage).toBe(8);
      expect(summary.hydrationTotal).toBe(500);
    });
  });

  describe('FinanceRepository', () => {
    let userRepo: UserRepository;
    let financeRepo: FinanceRepository;
    let testUser: User;

    beforeEach(async () => {
      userRepo = new UserRepository(env);
      financeRepo = new FinanceRepository(env);

      testUser = await userRepo.createUser({
        email: `test-${Date.now()}-${Math.random()}@example.com`,
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe',
        timezone: 'UTC',
        preferred_language: 'en',
        subscription_type: 'free',
        subscription_expires_at: null,
        stripe_customer_id: null,
        is_student: false,
        student_verification_status: 'none'
      });
    });

    it('should create a financial transaction', async () => {
      const transactionData = {
        user_id: testUser.id,
        transaction_type: 'expense' as const,
        category: 'food',
        amount: 25.50,
        currency: 'USD',
        description: 'Lunch at restaurant',
        tags: ['dining', 'work'],
        payment_method: 'credit_card',
        location: null,
        receipt_url: null,
        is_recurring: false,
        recurring_frequency: null,
        transaction_date: Date.now()
      };

      const transaction = await financeRepo.createTransaction(transactionData);

      expect(transaction.id).toBeTruthy();
      expect(transaction.user_id).toBe(testUser.id);
      expect(transaction.amount).toBe(25.50);
      expect(transaction.category).toBe('food');
      expect(transaction.created_at).toBeTruthy();
    });

    it('should get financial summary', async () => {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const transactions = [
        {
          user_id: testUser.id,
          transaction_type: 'income' as const,
          category: 'salary',
          amount: 5000,
          currency: 'USD',
          description: 'Monthly salary',
          tags: null,
          payment_method: null,
          location: null,
          receipt_url: null,
          is_recurring: true,
          recurring_frequency: 'monthly',
          transaction_date: Date.now()
        },
        {
          user_id: testUser.id,
          transaction_type: 'expense' as const,
          category: 'food',
          amount: 50,
          currency: 'USD',
          description: 'Groceries',
          tags: null,
          payment_method: null,
          location: null,
          receipt_url: null,
          is_recurring: false,
          recurring_frequency: null,
          transaction_date: Date.now()
        },
        {
          user_id: testUser.id,
          transaction_type: 'expense' as const,
          category: 'transport',
          amount: 100,
          currency: 'USD',
          description: 'Gas',
          tags: null,
          payment_method: null,
          location: null,
          receipt_url: null,
          is_recurring: false,
          recurring_frequency: null,
          transaction_date: Date.now()
        }
      ];

      await Promise.all(transactions.map(t => financeRepo.createTransaction(t)));

      const summary = await financeRepo.getFinancialSummary(testUser.id, currentMonth, currentYear);

      expect(summary.totalIncome).toBe(5000);
      expect(summary.totalExpenses).toBe(150);
      expect(summary.netAmount).toBe(4850);
      expect(summary.expensesByCategory).toHaveLength(2);
      expect(summary.expensesByCategory[0].category).toBe('transport'); // Higher amount first
      expect(summary.expensesByCategory[0].amount).toBe(100);
    });
  });

  describe('LocalizationRepository', () => {
    let localizationRepo: LocalizationRepository;

    beforeEach(() => {
      localizationRepo = new LocalizationRepository(env);
    });

    it('should set and get localized content', async () => {
      const contentKey = 'test.message';
      const language: SupportedLanguage = 'en';
      const content = 'Hello, World!';

      await localizationRepo.setLocalizedContent(contentKey, language, content);

      const localizedContent = await localizationRepo.getLocalizedContent(language, [contentKey]);

      expect(localizedContent[contentKey]).toBe(content);
    });

    it('should get all localized content for a language', async () => {
      const testContent = [
        { key: 'test.hello', language: 'en' as SupportedLanguage, content: 'Hello' },
        { key: 'test.goodbye', language: 'en' as SupportedLanguage, content: 'Goodbye' },
        { key: 'test.hello', language: 'de' as SupportedLanguage, content: 'Hallo' }
      ];

      for (const item of testContent) {
        await localizationRepo.setLocalizedContent(item.key, item.language, item.content);
      }

      const englishContent = await localizationRepo.getLocalizedContent('en');
      expect(Object.keys(englishContent)).toHaveLength(2);
      expect(englishContent['test.hello']).toBe('Hello');
      expect(englishContent['test.goodbye']).toBe('Goodbye');

      const germanContent = await localizationRepo.getLocalizedContent('de');
      expect(Object.keys(germanContent)).toHaveLength(1);
      expect(germanContent['test.hello']).toBe('Hallo');
    });

    it('should update existing localized content', async () => {
      const contentKey = 'test.message';
      const language: SupportedLanguage = 'en';
      const originalContent = 'Original message';
      const updatedContent = 'Updated message';

      await localizationRepo.setLocalizedContent(contentKey, language, originalContent);
      await localizationRepo.setLocalizedContent(contentKey, language, updatedContent);

      const localizedContent = await localizationRepo.getLocalizedContent(language, [contentKey]);

      expect(localizedContent[contentKey]).toBe(updatedContent);
    });
  });
});