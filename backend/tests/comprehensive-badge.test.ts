// Comprehensive Badge System Tests
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { BadgeService } from '../src/lib/badges';
import { createMockEnv } from './utils/test-helpers';

// Mock the DatabaseService
const mockQuery = vi.fn();
vi.mock('../src/lib/db', () => ({
  DatabaseService: vi.fn().mockImplementation(() => ({
    query: mockQuery
  }))
}));

// Mock the notifications module
vi.mock('../src/lib/notifications', () => ({
  queueNotification: vi.fn()
}));

describe('Comprehensive Badge System', () => {
  let env: any;
  let badgeService: BadgeService;
  const testUserId = 'test-user-123';

  const mockBadgeDefinitions = [
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
    },
    {
      id: 'badge_task_master_10',
      achievement_key: 'task_master_10',
      category: 'tasks',
      title_en: 'Task Master',
      description_en: 'Complete 10 tasks',
      criteria: '{"type":"count","threshold":10,"metric":"tasks_completed"}',
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
      criteria: '{"type":"time_based","threshold":7,"metric":"days_since_registration"}',
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
      criteria: '{"type":"custom","threshold":5,"metric":"early_tasks","conditions":{"before_hour":9}}',
      points_awarded: 20,
      rarity: 'uncommon',
      icon_emoji: '🌅',
      color_primary: '#F97316',
      color_secondary: '#EA580C',
      is_active: 1
    }
  ];

  beforeEach(() => {
    env = createMockEnv();
    badgeService = new BadgeService(env);
    
    // Reset mock
    mockQuery.mockReset();
    
    // Default mock implementations
    mockQuery.mockImplementation(async (query: string, params?: any[]) => {
      // Badge definitions query
      if (query.includes('achievement_definitions') && query.includes('is_active = 1')) {
        return { success: true, results: mockBadgeDefinitions, meta: { changes: 0 } };
      }
      
      // User badges query (empty by default)
      if (query.includes('user_badges') && query.includes('ORDER BY unlocked_at DESC')) {
        return { success: true, results: [], meta: { changes: 0 } };
      }
      
      // Task count queries (default to 0)
      if (query.includes('COUNT(*) as count FROM tasks')) {
        return { success: true, results: [{ count: 0 }], meta: { changes: 0 } };
      }
      
      // User creation date query
      if (query.includes('SELECT created_at FROM users')) {
        return { success: true, results: [{ created_at: Date.now() - (8 * 24 * 60 * 60 * 1000) }], meta: { changes: 0 } };
      }
      
      // Insert queries (badge unlocking)
      if (query.includes('INSERT INTO user_badges')) {
        return { success: true, results: [], meta: { changes: 1 } };
      }
      
      // Default empty result
      return { success: true, results: [], meta: { changes: 0 } };
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Badge Checking', () => {
    it('should unlock first task badge when user completes first task', async () => {
      // Mock task count to 1
      mockQuery.mockImplementation(async (query: string, params?: any[]) => {
        if (query.includes('achievement_definitions')) {
          return { success: true, results: mockBadgeDefinitions, meta: { changes: 0 } };
        }
        if (query.includes('user_badges') && query.includes('ORDER BY unlocked_at DESC')) {
          return { success: true, results: [], meta: { changes: 0 } };
        }
        if (query.includes('COUNT(*) as count FROM tasks') && params?.includes('done')) {
          return { success: true, results: [{ count: 1 }], meta: { changes: 0 } };
        }
        if (query.includes('INSERT INTO user_badges')) {
          return { success: true, results: [], meta: { changes: 1 } };
        }
        return { success: true, results: [], meta: { changes: 0 } };
      });
      
      const newBadges = await badgeService.checkAndUnlockBadges(testUserId);
      
      expect(newBadges).toHaveLength(1);
      expect(newBadges[0].badge_id).toBe('first_task');
      expect(newBadges[0].user_id).toBe(testUserId);
    });

    it('should not unlock same badge twice', async () => {
      // Mock that user already has the first_task badge
      mockQuery.mockImplementation(async (query: string, params?: any[]) => {
        if (query.includes('achievement_definitions')) {
          return { success: true, results: mockBadgeDefinitions, meta: { changes: 0 } };
        }
        if (query.includes('user_badges') && query.includes('ORDER BY unlocked_at DESC')) {
          return { 
            success: true, 
            results: [{
              id: 'existing_badge',
              user_id: testUserId,
              badge_id: 'first_task',
              unlocked_at: Date.now() - 1000,
              tier: 'common',
              progress_percentage: 100
            }], 
            meta: { changes: 0 } 
          };
        }
        if (query.includes('COUNT(*) as count FROM tasks') && params?.includes('done')) {
          return { success: true, results: [{ count: 1 }], meta: { changes: 0 } };
        }
        return { success: true, results: [], meta: { changes: 0 } };
      });
      
      const newBadges = await badgeService.checkAndUnlockBadges(testUserId);
      
      expect(newBadges).toHaveLength(0);
    });

    it('should unlock task master badge after 10 completed tasks', async () => {
      // Mock task count to 10
      mockQuery.mockImplementation(async (query: string, params?: any[]) => {
        if (query.includes('achievement_definitions')) {
          return { success: true, results: mockBadgeDefinitions, meta: { changes: 0 } };
        }
        if (query.includes('user_badges') && query.includes('ORDER BY unlocked_at DESC')) {
          return { success: true, results: [], meta: { changes: 0 } };
        }
        if (query.includes('COUNT(*) as count FROM tasks') && params?.includes('done')) {
          return { success: true, results: [{ count: 10 }], meta: { changes: 0 } };
        }
        if (query.includes('INSERT INTO user_badges')) {
          return { success: true, results: [], meta: { changes: 1 } };
        }
        return { success: true, results: [], meta: { changes: 0 } };
      });
      
      const newBadges = await badgeService.checkAndUnlockBadges(testUserId);
      
      expect(newBadges.length).toBeGreaterThan(0);
      const badgeIds = newBadges.map(b => b.badge_id);
      expect(badgeIds).toContain('first_task');
      expect(badgeIds).toContain('task_master_10');
    });
  });

  describe('Badge Progress', () => {
    it('should track progress towards badges', async () => {
      // Mock task count to 5
      mockQuery.mockImplementation(async (query: string, params?: any[]) => {
        if (query.includes('achievement_definitions')) {
          return { success: true, results: mockBadgeDefinitions, meta: { changes: 0 } };
        }
        if (query.includes('user_badges') && query.includes('ORDER BY unlocked_at DESC')) {
          return { success: true, results: [], meta: { changes: 0 } };
        }
        if (query.includes('COUNT(*) as count FROM tasks') && params?.includes('done')) {
          return { success: true, results: [{ count: 5 }], meta: { changes: 0 } };
        }
        return { success: true, results: [], meta: { changes: 0 } };
      });
      
      const progress = await badgeService.getBadgeProgress(testUserId);
      
      expect(progress).toBeInstanceOf(Array);
      expect(progress.length).toBeGreaterThan(0);
      
      const taskMasterProgress = progress.find(p => p.badge_id === 'task_master_10');
      expect(taskMasterProgress).toBeDefined();
      expect(taskMasterProgress?.current_value).toBe(5);
      expect(taskMasterProgress?.target_value).toBe(10);
      expect(taskMasterProgress?.progress_percentage).toBe(50);
    });

    it('should show 100% progress for completed badges', async () => {
      // Mock that user has the first_task badge
      mockQuery.mockImplementation(async (query: string, params?: any[]) => {
        if (query.includes('achievement_definitions')) {
          return { success: true, results: mockBadgeDefinitions, meta: { changes: 0 } };
        }
        if (query.includes('user_badges') && query.includes('ORDER BY unlocked_at DESC')) {
          return { 
            success: true, 
            results: [{
              id: 'existing_badge',
              user_id: testUserId,
              badge_id: 'first_task',
              unlocked_at: Date.now() - 1000,
              tier: 'common',
              progress_percentage: 100
            }], 
            meta: { changes: 0 } 
          };
        }
        return { success: true, results: [], meta: { changes: 0 } };
      });
      
      const progress = await badgeService.getBadgeProgress(testUserId);
      
      const firstTaskProgress = progress.find(p => p.badge_id === 'first_task');
      expect(firstTaskProgress).toBeDefined();
      expect(firstTaskProgress?.progress_percentage).toBe(100);
      expect(firstTaskProgress?.is_complete).toBe(true);
    });
  });

  describe('Time-based Badges', () => {
    it('should unlock early adopter badge after 7 days', async () => {
      // Mock user created 8 days ago
      mockQuery.mockImplementation(async (query: string, params?: any[]) => {
        if (query.includes('achievement_definitions')) {
          return { success: true, results: mockBadgeDefinitions, meta: { changes: 0 } };
        }
        if (query.includes('user_badges') && query.includes('ORDER BY unlocked_at DESC')) {
          return { success: true, results: [], meta: { changes: 0 } };
        }
        if (query.includes('SELECT created_at FROM users')) {
          return { success: true, results: [{ created_at: Date.now() - (8 * 24 * 60 * 60 * 1000) }], meta: { changes: 0 } };
        }
        if (query.includes('INSERT INTO user_badges')) {
          return { success: true, results: [], meta: { changes: 1 } };
        }
        return { success: true, results: [], meta: { changes: 0 } };
      });
      
      const newBadges = await badgeService.checkAndUnlockBadges(testUserId);
      
      const badgeIds = newBadges.map(b => b.badge_id);
      expect(badgeIds).toContain('early_adopter');
    });
  });

  describe('Custom Criteria Badges', () => {
    it('should unlock early bird badge for tasks completed before 9 AM', async () => {
      // Mock 5 tasks completed before 9 AM
      mockQuery.mockImplementation(async (query: string, params?: any[]) => {
        if (query.includes('achievement_definitions')) {
          return { success: true, results: mockBadgeDefinitions, meta: { changes: 0 } };
        }
        if (query.includes('user_badges') && query.includes('ORDER BY unlocked_at DESC')) {
          return { success: true, results: [], meta: { changes: 0 } };
        }
        if (query.includes('strftime') && query.includes('< ?') && params?.includes(9)) {
          return { success: true, results: [{ count: 5 }], meta: { changes: 0 } };
        }
        if (query.includes('INSERT INTO user_badges')) {
          return { success: true, results: [], meta: { changes: 1 } };
        }
        return { success: true, results: [], meta: { changes: 0 } };
      });
      
      const newBadges = await badgeService.checkAndUnlockBadges(testUserId);
      
      const badgeIds = newBadges.map(b => b.badge_id);
      expect(badgeIds).toContain('early_bird');
    });
  });

  describe('Badge Sharing', () => {
    it('should generate shareable badge content', async () => {
      // Mock badge sharing scenario
      mockQuery.mockImplementation(async (query: string, params?: any[]) => {
        if (query.includes('user_badges') && query.includes('badge_id = ?')) {
          return { 
            success: true, 
            results: [{
              id: 'test_badge_id',
              user_id: testUserId,
              badge_id: 'first_task',
              unlocked_at: Date.now(),
              tier: 'common',
              progress_percentage: 100
            }], 
            meta: { changes: 0 } 
          };
        }
        if (query.includes('achievement_definitions') && query.includes('achievement_key = ?')) {
          return { 
            success: true, 
            results: [mockBadgeDefinitions[0]], 
            meta: { changes: 0 } 
          };
        }
        if (query.includes('INSERT INTO badge_shares')) {
          return { success: true, results: [], meta: { changes: 1 } };
        }
        if (query.includes('UPDATE user_badges SET share_count')) {
          return { success: true, results: [], meta: { changes: 1 } };
        }
        return { success: true, results: [], meta: { changes: 0 } };
      });

      const shareContent = await badgeService.generateBadgeShare('first_task', testUserId, 'twitter');
      
      expect(shareContent).toBeDefined();
      expect(shareContent.shareUrl).toContain('wellnessapp.com');
      expect(shareContent.message).toContain('First Task');
      expect(shareContent.message).toContain('#WellnessApp');
    });
  });
});