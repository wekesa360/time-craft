// Simple test to verify test setup works
import { describe, it, expect } from 'vitest';

describe('Simple Test', () => {
  it('should pass basic assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle async operations', async () => {
    const result = await Promise.resolve('hello');
    expect(result).toBe('hello');
  });

  it('should verify test environment variables', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});