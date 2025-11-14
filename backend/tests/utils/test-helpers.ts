// Test utilities and helpers for Time & Wellness Application
import { Env } from '../../src/lib/env';
import { sign } from 'hono/jwt';
import { vi } from 'vitest';

// Mock environment for testing
export const createMockEnv = (): Env => ({
  JWT_SECRET: 'test-jwt-secret-key',
  REFRESH_SECRET: 'test-refresh-secret',
  ENCRYPTION_KEY: 'test-encryption-key-32-characters',
  OPENAI_API_KEY: 'sk-test-openai-key',
  DEEPGRAM_API_KEY: 'test-deepgram-key',
  STRIPE_SECRET_KEY: 'sk_test_stripe_key',
  STRIPE_WEBHOOK_SECRET: 'whsec_test_webhook',
  RESEND_API_KEY: 're_test_resend_key',
  FROM_EMAIL: 'test@timecraft.app',
  ONESIGNAL_APP_ID: 'test-onesignal-app-id',
  ONESIGNAL_API_KEY: 'test-onesignal-api-key',
  GOOGLE_CLIENT_ID: 'test-google-client-id',
  GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
  GOOGLE_REDIRECT_URI: 'http://localhost:3000/api/calendar/google/callback',
  APP_BASE_URL: 'http://localhost:3000',
  OUTLOOK_CLIENT_ID: 'test-outlook-client-id',
  OUTLOOK_CLIENT_SECRET: 'test-outlook-client-secret',
  
  // Mock Cloudflare bindings
  DB: createMockD1(),
  CACHE: createMockKV(),
  ASSETS: createMockR2(),
  TASK_QUEUE: createMockQueue(),
  ANALYTICS: createMockAnalytics()
});

// Mock D1 Database (DatabaseService interface)
function createMockD1(): any {
  const mockResults = new Map<string, any>();
  
  const mockDB = {
    prepare: vi.fn((query: string) => {
      const statement = {
        bind: vi.fn((...params: any[]) => {
          const key = `${query}_${JSON.stringify(params)}`;
          return {
            run: vi.fn(async () => {
              const result = mockResults.get(key) || mockResults.get(query);
              if (result && result.error) {
                throw result.error;
              }
              return {
                success: true,
                results: result || [],
                meta: { changes: 1, last_row_id: 1, duration: 0.1 }
              };
            }),
            all: vi.fn(async () => {
              const result = mockResults.get(key) || mockResults.get(query);
              if (result && result.error) {
                throw result.error;
              }
              return {
                success: true,
                results: result || []
              };
            }),
            first: vi.fn(async () => {
              const result = mockResults.get(key) || mockResults.get(query);
              if (result && result.error) {
                throw result.error;
              }
              return (result || [])[0] || null;
            })
          };
        }),
        run: vi.fn(async () => {
          const result = mockResults.get(query);
          if (result && result.error) {
            throw result.error;
          }
          return {
            success: true,
            results: result || [],
            meta: { changes: 1, last_row_id: 1, duration: 0.1 }
          };
        }),
        all: vi.fn(async () => {
          const result = mockResults.get(query);
          if (result && result.error) {
            throw result.error;
          }
          return {
            success: true,
            results: result || []
          };
        }),
        first: vi.fn(async () => {
          const result = mockResults.get(query);
          if (result && result.error) {
            throw result.error;
          }
          return (result || [])[0] || null;
        })
      };
      return statement;
    }),
    exec: vi.fn(async (query: string) => ({
      success: true,
      results: mockResults.get(query) || []
    })),
    // Helper methods for testing
    _setMockData: (query: string, data: any[]) => {
      mockResults.set(query, data);
    },
    _clearMockData: () => {
      mockResults.clear();
    },
    _setMockError: (query: string, error: Error) => {
      mockResults.set(query, { error });
    },
    _getMockResults: () => mockResults
  };
  
  return mockDB;
}

// Mock KV Store
function createMockKV(): any {
  const storage = new Map<string, string>();
  const mockData = new Map<string, any>();
  
  return {
    get: async (key: string) => storage.get(key) || null,
    put: async (key: string, value: string, options?: any) => {
      storage.set(key, value);
    },
    delete: async (key: string) => {
      storage.delete(key);
    },
    list: async (options?: any) => ({
      keys: Array.from(storage.keys()).map(name => ({ name })),
      list_complete: true
    }),
    // Helper methods
    _clear: () => storage.clear(),
    _size: () => storage.size,
    _setMockData: (operation: string, data: any) => {
      mockData.set(operation, data);
    },
    _getMockData: (operation: string) => mockData.get(operation)
  };
}

// Mock R2 Bucket
function createMockR2(): any {
  const storage = new Map<string, any>();
  const mockData = new Map<string, any>();
  
  return {
    put: async (key: string, value: any, options?: any) => {
      storage.set(key, value);
      return { key, etag: 'mock-etag' };
    },
    get: async (key: string) => {
      const value = storage.get(key);
      return value ? { body: value } : null;
    },
    delete: async (key: string) => {
      storage.delete(key);
    },
    list: async (options?: any) => ({
      objects: Array.from(storage.keys()).map(key => ({ key }))
    }),
    _clear: () => storage.clear(),
    _setMockData: (operation: string, data: any) => {
      mockData.set(operation, data);
    },
    _getMockData: (operation: string) => mockData.get(operation)
  };
}

// Mock Queue
function createMockQueue(): any {
  const messages: any[] = [];
  
  return {
    send: async (message: any) => {
      messages.push(message);
      return { id: 'mock-message-id' };
    },
    _getMessages: () => messages,
    _clear: () => messages.length = 0
  };
}

// Mock Analytics Engine
function createMockAnalytics(): any {
  const dataPoints: any[] = [];
  
  return {
    writeDataPoint: async (data: any) => {
      dataPoints.push({ ...data, timestamp: Date.now() });
    },
    _getDataPoints: () => dataPoints,
    _clear: () => dataPoints.length = 0
  };
}

// Test user fixtures
export const testUsers = {
  regularUser: {
    id: 'user_test_regular',
    email: 'test@example.com',
    display_name: 'Test User',
    role: 'user',
    subscription_status: 'free',
    preferred_language: 'en',
    timezone: 'UTC',
    created_at: Date.now() - 86400000, // 1 day ago
    updated_at: Date.now()
  },
  adminUser: {
    id: 'user_test_admin', 
    email: 'admin@example.com',
    display_name: 'Admin User',
    role: 'admin',
    subscription_status: 'premium',
    preferred_language: 'en',
    timezone: 'UTC',
    created_at: Date.now() - 86400000,
    updated_at: Date.now()
  },
  germanUser: {
    id: 'user_test_german',
    email: 'test@beispiel.de',
    display_name: 'German User',
    role: 'user', 
    subscription_status: 'premium',
    preferred_language: 'de',
    timezone: 'Europe/Berlin',
    created_at: Date.now() - 86400000,
    updated_at: Date.now()
  }
};

// Test task fixtures
export const testTasks = [
  {
    id: 'task_1',
    user_id: 'user_test_regular',
    title: 'Complete project proposal',
    description: 'Write the Q4 project proposal document',
    priority: 4,
    status: 'pending',
    due_date: Date.now() + 86400000, // 1 day from now
    estimated_duration: 120, // 2 hours
    created_at: Date.now() - 3600000, // 1 hour ago
    updated_at: Date.now() - 3600000
  },
  {
    id: 'task_2',
    user_id: 'user_test_regular',
    title: 'Call dentist',
    description: 'Schedule dental cleaning appointment',
    priority: 2,
    status: 'pending',
    due_date: null,
    estimated_duration: 15,
    created_at: Date.now() - 7200000, // 2 hours ago
    updated_at: Date.now() - 7200000
  }
];

// Test health log fixtures
export const testHealthLogs = [
  {
    id: 'health_1',
    user_id: 'user_test_regular',
    type: 'exercise',
    value: 45,
    unit: 'minutes',
    notes: 'Morning gym session',
    created_at: Date.now() - 3600000,
    updated_at: Date.now() - 3600000
  },
  {
    id: 'health_2', 
    user_id: 'user_test_regular',
    type: 'mood',
    value: 8,
    unit: 'scale',
    notes: 'Feeling good today',
    created_at: Date.now() - 1800000,
    updated_at: Date.now() - 1800000
  },
  {
    id: 'health_3',
    user_id: 'user_test_regular', 
    type: 'hydration',
    value: 2000,
    unit: 'ml',
    notes: 'Daily water intake',
    created_at: Date.now() - 900000,
    updated_at: Date.now() - 900000
  }
];

// JWT token generation for testing
export async function generateTestToken(userId: string, role: string = 'user'): Promise<string> {
  const payload = {
    userId,
    email: `test-${userId}@example.com`,
    subscriptionType: role === 'admin' ? 'premium' : 'free',
    isStudent: false,
    preferredLanguage: 'en',
    type: 'access',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
  };
  
  return await sign(payload, 'test-jwt-secret-key');
}

// HTTP request helper
export async function makeRequest(
  app: any,
  method: string,
  path: string,
  options: {
    token?: string;
    body?: any;
    headers?: Record<string, string>;
    env?: any;
  } = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const reqOptions: RequestInit = {
    method,
    headers
  };

  if (options.body) {
    reqOptions.body = JSON.stringify(options.body);
  }

  // Pass environment to the request if provided
  if (options.env) {
    return await app.request(path, reqOptions, options.env);
  }

  return await app.request(path, reqOptions);
}

// Database setup helpers
export function setupTestDatabase(mockDB: any) {
  // Set up users - using DatabaseService interface
  mockDB._setMockData('SELECT * FROM users WHERE id = ?_["user_test_regular"]', [testUsers.regularUser]);
  mockDB._setMockData('SELECT * FROM users WHERE email = ?_["test@example.com"]', [testUsers.regularUser]);
  mockDB._setMockData('SELECT * FROM users WHERE id = ?_["user_test_admin"]', [testUsers.adminUser]);
  mockDB._setMockData('SELECT * FROM users WHERE email = ?_["admin@timecraft.com"]', [testUsers.adminUser]);
  
  // Set up tasks
  mockDB._setMockData('SELECT * FROM tasks WHERE user_id = ?_["user_test_regular"]', testTasks);
  
  // Set up health logs  
  mockDB._setMockData('SELECT * FROM health_logs WHERE user_id = ?_["user_test_regular"]', testHealthLogs);

  // Set up badge system data
  const badgeDefinitions = [
    {
      id: 'badge_first_task',
      achievement_key: 'first_task',
      category: 'tasks',
      title_en: 'First Task',
      description_en: 'Complete your first task',
      criteria: JSON.stringify({ type: 'count', threshold: 1, metric: 'tasks_completed' }),
      points_awarded: 10,
      rarity: 'common',
      icon_emoji: '🎯',
      color_primary: '#3B82F6',
      color_secondary: '#1E40AF',
      is_active: 1
    },
    {
      id: 'badge_task_master_10',
      achievement_key: 'task_master_10',
      category: 'tasks',
      title_en: 'Task Master',
      description_en: 'Complete 10 tasks',
      criteria: JSON.stringify({ type: 'count', threshold: 10, metric: 'tasks_completed' }),
      points_awarded: 50,
      rarity: 'uncommon',
      icon_emoji: '🏆',
      color_primary: '#F59E0B',
      color_secondary: '#D97706',
      is_active: 1
    },
    {
      id: 'badge_early_adopter',
      achievement_key: 'early_adopter',
      category: 'engagement',
      title_en: 'Early Adopter',
      description_en: 'Use the app for 7 consecutive days',
      criteria: JSON.stringify({ type: 'time_based', threshold: 7, metric: 'days_since_registration' }),
      points_awarded: 25,
      rarity: 'rare',
      icon_emoji: '🌟',
      color_primary: '#8B5CF6',
      color_secondary: '#7C3AED',
      is_active: 1
    },
    {
      id: 'badge_early_bird',
      achievement_key: 'early_bird',
      category: 'habits',
      title_en: 'Early Bird',
      description_en: 'Complete tasks before 9 AM',
      criteria: JSON.stringify({ type: 'custom', threshold: 5, metric: 'early_tasks', conditions: { before_hour: 9 } }),
      points_awarded: 20,
      rarity: 'uncommon',
      icon_emoji: '🌅',
      color_primary: '#F97316',
      color_secondary: '#EA580C',
      is_active: 1
    }
  ];

  // Mock badge definitions queries
  mockDB._setMockData('SELECT * FROM achievement_definitions WHERE is_active = 1 ORDER BY points_awarded ASC', badgeDefinitions);
  mockDB._setMockData('SELECT * FROM achievement_definitions WHERE is_active = ?', badgeDefinitions);
  
  // Mock user badges (initially empty)
  mockDB._setMockData('SELECT * FROM user_badges WHERE user_id = ? ORDER BY unlocked_at DESC', []);
  
  // Mock task completion counts - default to 0
  mockDB._setMockData('SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = ?', [{ count: 0 }]);
  
  // Mock user data for badge checking
  mockDB._setMockData('SELECT created_at FROM users WHERE id = ?', [{ created_at: Date.now() - (8 * 24 * 60 * 60 * 1000) }]);
  mockDB._setMockData('SELECT badge_points FROM users WHERE id = ?', [{ badge_points: 0 }]);
  
  // Mock early task completion queries
  mockDB._setMockData('SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = ? AND CAST(strftime(\'%H\', datetime(updated_at/1000, \'unixepoch\')) AS INTEGER) < ?', [{ count: 0 }]);
}

// Assertion helpers
export function expectSuccessResponse(response: Response, expectedStatus: number = 200) {
  expect(response.status).toBe(expectedStatus);
  expect(response.headers.get('content-type')).toContain('application/json');
}

export function expectErrorResponse(response: Response, expectedStatus: number, expectedMessage?: string) {
  expect(response.status).toBe(expectedStatus);
  if (expectedMessage) {
    expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining(expectedMessage)
    });
  }
}

export async function expectValidationError(response: Response, field?: string) {
  expect(response.status).toBe(400);
  const body = await response.json();
  expect(body.error).toBeDefined();
  
  if (field) {
    // Handle both string errors and Zod error objects
    if (typeof body.error === 'string') {
      expect(body.error).toContain(field);
    } else if (body.error.issues && Array.isArray(body.error.issues)) {
      // Zod error format
      const fieldFound = body.error.issues.some((issue: any) => 
        issue.path && issue.path.includes(field)
      );
      expect(fieldFound).toBe(true);
    } else {
      // Fallback - convert error to string and check
      expect(JSON.stringify(body.error)).toContain(field);
    }
  }
}

// Mock external API responses
export const mockExternalAPIs = {
  openai: {
    success: {
      choices: [{
        message: {
          content: JSON.stringify({
            analysis: 'Test AI analysis',
            confidence: 0.85,
            recommendations: ['Test recommendation']
          })
        }
      }]
    },
    error: {
      error: { message: 'OpenAI API error' }
    }
  },
  
  deepgram: {
    success: {
      results: {
        channels: [{
          alternatives: [{
            transcript: 'Test transcription',
            confidence: 0.9,
            words: [
              { word: 'Test', start: 0, end: 1 },
              { word: 'transcription', start: 1, end: 2 }
            ]
          }]
        }]
      },
      metadata: { duration: 2.5 }
    }
  },
  
  stripe: {
    customer: {
      id: 'cus_test_customer',
      email: 'test@example.com'
    },
    subscription: {
      id: 'sub_test_subscription',
      status: 'active',
      current_period_end: Math.floor(Date.now() / 1000) + 86400
    },
    checkoutSession: {
      id: 'cs_test_session',
      url: 'https://checkout.stripe.com/pay/cs_test_session'
    },
    paymentMethods: {
      data: [
        {
          id: 'pm_test_123',
          type: 'card',
          card: {
            brand: 'visa',
            last4: '4242',
            exp_month: 12,
            exp_year: 2025
          }
        }
      ]
    },
    setupIntent: {
      id: 'seti_test_123',
      client_secret: 'seti_test_123_secret_abc123'
    },
    invoices: {
      data: [
        {
          id: 'in_test_123',
          amount_paid: 1999,
          status: 'paid',
          created: Math.floor(Date.now() / 1000),
          hosted_invoice_url: 'https://invoice.stripe.com/in_test_123'
        }
      ],
      has_more: false
    },
    upcomingInvoice: {
      amount_due: 1999,
      currency: 'usd',
      period_start: Math.floor(Date.now() / 1000),
      period_end: Math.floor(Date.now() / 1000) + 2592000,
      lines: {
        data: [
          {
            description: 'Premium Monthly Subscription',
            amount: 1999
          }
        ]
      }
    }
  },
  
  oneSignal: {
    notification: {
      id: 'test-notification-id',
      recipients: 1
    },
    player: {
      id: 'test-player-id',
      success: true
    }
  }
};

// Standardized external API mocking function
export function setupMockExternalAPIs() {
  global.fetch = vi.fn()
    .mockResolvedValueOnce({ // OpenAI
      ok: true,
      json: () => Promise.resolve(mockExternalAPIs.openai.success)
    })
    .mockResolvedValueOnce({ // Deepgram
      ok: true,
      json: () => Promise.resolve(mockExternalAPIs.deepgram.success)
    })
    .mockResolvedValueOnce({ // OneSignal
      ok: true,
      json: () => Promise.resolve(mockExternalAPIs.oneSignal.notification)
    })
    .mockResolvedValueOnce({ // Stripe
      ok: true,
      json: () => Promise.resolve(mockExternalAPIs.stripe.customer)
    });
}

// Helper to set up badge test scenarios
export function setupBadgeTestScenario(mockDB: any, scenario: 'first_task' | 'task_master' | 'early_adopter' | 'early_bird') {
  switch (scenario) {
    case 'first_task':
      // User has completed 1 task
      mockDB._setMockData('SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = ?', [{ count: 1 }]);
      break;
    case 'task_master':
      // User has completed 10 tasks
      mockDB._setMockData('SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = ?', [{ count: 10 }]);
      break;
    case 'early_adopter':
      // User registered 8 days ago
      mockDB._setMockData('SELECT created_at FROM users WHERE id = ?', [{ created_at: Date.now() - (8 * 24 * 60 * 60 * 1000) }]);
      break;
    case 'early_bird':
      // User has completed 5 tasks before 9 AM
      mockDB._setMockData('SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = ? AND CAST(strftime(\'%H\', datetime(updated_at/1000, \'unixepoch\')) AS INTEGER) < ?', [{ count: 5 }]);
      break;
  }
}

// Helper functions for creating test data
export async function createTestUser(env: any, overrides: Partial<any> = {}): Promise<string> {
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const user = {
    id: userId,
    email: `test_${userId}@example.com`,
    password_hash: 'hashed_password',
    first_name: 'Test',
    last_name: 'User',
    timezone: 'UTC',
    preferred_language: 'en',
    subscription_type: 'free',
    subscription_expires_at: null,
    stripe_customer_id: null,
    is_student: false,
    student_verification_status: 'none',
    badge_points: 0,
    total_badges: 0,
    badge_tier: 'bronze',
    created_at: Date.now(),
    updated_at: Date.now(),
    ...overrides
  };

  await env.DB.execute(`
    INSERT INTO users (
      id, email, password_hash, first_name, last_name, timezone,
      preferred_language, subscription_type, subscription_expires_at,
      stripe_customer_id, is_student, student_verification_status,
      badge_points, total_badges, badge_tier, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    user.id, user.email, user.password_hash, user.first_name, user.last_name,
    user.timezone, user.preferred_language, user.subscription_type,
    user.subscription_expires_at, user.stripe_customer_id, user.is_student ? 1 : 0,
    user.student_verification_status, user.badge_points, user.total_badges,
    user.badge_tier, user.created_at, user.updated_at
  ]);

  return userId;
}

export async function createTestTask(env: any, userId: string, overrides: Partial<any> = {}): Promise<string> {
  const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const task = {
    id: taskId,
    user_id: userId,
    title: 'Test Task',
    description: 'Test task description',
    priority: 1,
    status: 'pending',
    due_date: null,
    estimated_duration: null,
    ai_priority_score: null,
    ai_planning_session_id: null,
    energy_level_required: null,
    context_type: null,
    // Eisenhower Matrix fields
    urgency: null,
    importance: null,
    matrix_notes: null,
    is_delegated: false,
    delegated_to: null,
    delegation_notes: null,
    matrix_last_reviewed: null,
    created_at: Date.now(),
    updated_at: Date.now(),
    ...overrides
  };

  await env.DB.execute(`
    INSERT INTO tasks (
      id, user_id, title, description, priority, status, due_date,
      estimated_duration, ai_priority_score, ai_planning_session_id,
      energy_level_required, context_type, urgency, importance,
      matrix_notes, is_delegated, delegated_to, delegation_notes,
      matrix_last_reviewed, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    task.id, task.user_id, task.title, task.description, task.priority,
    task.status, task.due_date, task.estimated_duration, task.ai_priority_score,
    task.ai_planning_session_id, task.energy_level_required, task.context_type,
    task.urgency, task.importance, task.matrix_notes, task.is_delegated ? 1 : 0,
    task.delegated_to, task.delegation_notes, task.matrix_last_reviewed,
    task.created_at, task.updated_at
  ]);

  return taskId;
}

// Test data cleanup
export function cleanupTestData(env: Env) {
  if (env.DB._clearMockData) env.DB._clearMockData();
  if (env.CACHE._clear) env.CACHE._clear();
  if (env.ASSETS._clear) env.ASSETS._clear();
  if (env.TASK_QUEUE._clear) env.TASK_QUEUE._clear();
  if (env.ANALYTICS._clear) env.ANALYTICS._clear();
}

// Performance testing helpers
export function measureResponseTime(fn: () => Promise<Response>) {
  return async () => {
    const start = Date.now();
    const response = await fn();
    const duration = Date.now() - start;
    return { response, duration };
  };
}

export function expectFastResponse(duration: number, maxMs: number = 200) {
  expect(duration).toBeLessThan(maxMs);
}

// Rate limiting test helpers
export async function testRateLimit(
  app: any, 
  path: string, 
  method: string = 'GET',
  maxRequests: number = 10
) {
  const requests = [];
  for (let i = 0; i < maxRequests + 1; i++) {
    requests.push(makeRequest(app, method, path));
  }
  
  const responses = await Promise.all(requests);
  const lastResponse = responses[responses.length - 1];
  
  expect(lastResponse.status).toBe(429); // Too Many Requests
}