// Debug Badge Test 3 - Mock DatabaseService directly
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadgeService } from '../src/lib/badges';
import { DatabaseService } from '../src/lib/db';
import { createMockEnv } from './utils/test-helpers';

// Mock the DatabaseService
vi.mock('../src/lib/db', () => ({
  DatabaseService: vi.fn().mockImplementation(() => ({
    query: vi.fn().mockImplementation(async (query: string, params?: any[]) => {
      console.log('Mocked query:', query);
      console.log('Mocked params:', params);
      
      if (query.includes('achievement_definitions') && query.includes('is_active = 1')) {
        return {
          success: true,
          results: [
            {
              id: 'badge_first_task',
              achievement_key: 'first_task',
              category: 'tasks',
              title_en: 'First Task',
              description_en: 'Complete your first task',
              criteria: '{"type":"count","threshold":1,"metric":"tasks_completed"}',
              points_awarded: 10,
              rarity: 'common',
              icon_emoji: '🎯',
              color_primary: '#3B82F6',
              color_secondary: '#1E40AF',
              is_active: 1
            }
          ],
          meta: { changes: 0 }
        };
      }
      
      // Mock user badges query (empty initially)
      if (query.includes('user_badges')) {
        return {
          success: true,
          results: [],
          meta: { changes: 0 }
        };
      }
      
      // Mock task count query
      if (query.includes('COUNT(*) as count FROM tasks')) {
        return {
          success: true,
          results: [{ count: 1 }],
          meta: { changes: 0 }
        };
      }
      
      return {
        success: true,
        results: [],
        meta: { changes: 0 }
      };
    })
  }))
}));

describe('Debug Badge Test 3', () => {
  let env: any;
  let badgeService: BadgeService;

  beforeEach(() => {
    env = createMockEnv();
    badgeService = new BadgeService(env);
  });

  it('should get badge definitions with mocked DatabaseService', async () => {
    const badgeDefinitions = await (badgeService as any).getActiveBadgeDefinitions();
    console.log('Badge definitions:', badgeDefinitions);
    expect(badgeDefinitions).toBeInstanceOf(Array);
    expect(badgeDefinitions.length).toBeGreaterThan(0);
  });

  it('should check and unlock badges', async () => {
    const newBadges = await badgeService.checkAndUnlockBadges('test-user-123');
    console.log('New badges:', newBadges);
    expect(newBadges).toBeInstanceOf(Array);
  });
});