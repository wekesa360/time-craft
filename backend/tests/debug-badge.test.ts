// Debug Badge Test
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadgeService } from '../src/lib/badges';
import { createMockEnv, setupTestDatabase } from './utils/test-helpers';

describe('Debug Badge Test', () => {
  let env: any;
  let badgeService: BadgeService;

  beforeEach(() => {
    env = createMockEnv();
    setupTestDatabase(env.DB);
    badgeService = new BadgeService(env);
  });

  it('should get badge definitions', async () => {
    // Call the private method through reflection to debug
    const badgeDefinitions = await (badgeService as any).getActiveBadgeDefinitions();
    console.log('Badge definitions:', badgeDefinitions);
    expect(badgeDefinitions).toBeInstanceOf(Array);
  });

  it('should check badge progress', async () => {
    const progress = await badgeService.getBadgeProgress('test-user-123');
    console.log('Badge progress:', progress);
    expect(progress).toBeInstanceOf(Array);
  });
});