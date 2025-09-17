// Global test setup file
// This file runs before all tests to set up the testing environment

import { vi } from 'vitest';

// Set up global test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.DEEPGRAM_API_KEY = 'test-deepgram-key';
process.env.ONESIGNAL_API_KEY = 'test-onesignal-key';
process.env.STRIPE_SECRET_KEY = 'sk_test_test-stripe-secret-key';

// Mock global fetch if not already mocked in individual tests
global.fetch = vi.fn();

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