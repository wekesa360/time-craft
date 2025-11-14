// Debug Badge Test 2
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadgeService } from '../src/lib/badges';
import { createMockEnv, setupTestDatabase } from './utils/test-helpers';

describe('Debug Badge Test 2', () => {
  let env: any;
  let badgeService: BadgeService;

  beforeEach(() => {
    env = createMockEnv();
    setupTestDatabase(env.DB);
    badgeService = new BadgeService(env);
    
    // Add spy to see what queries are being made
    vi.spyOn(env.DB, 'query').mockImplementation(async (query: string, params?: any[]) => {
      console.log('Query:', query);
      console.log('Params:', params);
      
      // Return mock badge definitions for the specific query
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
      
      // Default empty result
      return {
        success: true,
        results: [],
        meta: { changes: 0 }
      };
    });
  });

  it('should get badge definitions with spy', async () => {
    const badgeDefinitions = await (badgeService as any).getActiveBadgeDefinitions();
    console.log('Badge definitions with spy:', badgeDefinitions);
    expect(badgeDefinitions).toBeInstanceOf(Array);
    expect(badgeDefinitions.length).toBeGreaterThan(0);
  });
});