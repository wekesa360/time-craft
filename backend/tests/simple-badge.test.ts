// Simple Badge Test to verify fixes
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadgeService } from '../src/lib/badges';
import { createMockEnv, setupTestDatabase } from './utils/test-helpers';

describe('Simple Badge Test', () => {
  let env: any;
  let badgeService: BadgeService;

  beforeEach(() => {
    env = createMockEnv();
    setupTestDatabase(env.DB);
    badgeService = new BadgeService(env);
  });

  it('should create badge service without errors', () => {
    expect(badgeService).toBeDefined();
  });

  it('should get empty badge progress for new user', async () => {
    const progress = await badgeService.getBadgeProgress('test-user-123');
    expect(progress).toBeInstanceOf(Array);
  });
});