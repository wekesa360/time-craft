// Global test setup file
// This file runs before all tests to set up the testing environment

import { vi } from 'vitest';

// Set up global test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.REFRESH_SECRET = 'test-refresh-secret-key-for-testing';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.DEEPGRAM_API_KEY = 'test-deepgram-key';
process.env.ONESIGNAL_API_KEY = 'test-onesignal-key';
process.env.STRIPE_SECRET_KEY = 'sk_test_test-stripe-secret-key';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_webhook_secret';
process.env.RESEND_API_KEY = 're_test_resend_key';
process.env.FROM_EMAIL = 'test@timecraft.app';
process.env.APP_BASE_URL = 'http://localhost:3000';

// Mock global fetch if not already mocked in individual tests
global.fetch = vi.fn();

// Mock bcrypt for password testing
vi.mock('bcryptjs', () => ({
  hash: vi.fn(async (password: string, rounds: number) => `$2b$${rounds}$mocked.hash.${password}`),
  compare: vi.fn(async (password: string, hash: string) => {
    // For testing, accept 'correct-password' with any mock hash
    return password === 'correct-password' && hash.includes('mocked.hash');
  })
}));

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  debug: vi.fn(),
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Set up global test timeout
vi.setConfig({ testTimeout: 10000 });

// Mock Date.now for consistent testing
const mockNow = new Date('2024-01-15T10:00:00Z').getTime();
vi.spyOn(Date, 'now').mockReturnValue(mockNow);

// Mock crypto for consistent UUID generation
const mockCrypto = {
  randomUUID: vi.fn(() => 'test-uuid-123'),
  getRandomValues: vi.fn((arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  })
};

// Only mock crypto if it's not already available
if (!global.crypto) {
  Object.defineProperty(global, 'crypto', {
    value: mockCrypto,
    writable: true
  });
}

// Clean up after each test
beforeEach(() => {
  vi.clearAllMocks();
  // Reset fetch mock
  (global.fetch as any).mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Global error handler for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export {};