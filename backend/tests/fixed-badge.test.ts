// Fixed Badge System Tests
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadgeService } from '../src/lib/badges';
import { createMockEnv, setupTestDatabase, setupBadgeTestScenario } from './utils/test-helpers';

describe('Fixed Badge System', () => {
  let env: any;
  let badgeService: BadgeService;
  const testUserId = 'test-user-123';

  beforeEach(() => {
    env = createMockEnv();
    setupTestDatabase(env.DB);
    badgeService = new BadgeService(env);
  });

  describe('Badge Checking', () => {
    it('should unlock first task badge when user completes first task', async () => {
      // Set up scenario where user has completed 1 task
      setupBadgeTestScenario(env.DB, 'first_task');
      
      // Mock the INSERT query for unlocking badge
      env.DB.query.mockResolvedValueOnce({ success: true, results: [], meta: { changes: 1 } });
      
      const newBadges = await badgeService.checkAndUnlockBadges(testUserId);
      
      // Should unlock the "first_task" badge
      expect(newBadges).toHaveLength(1);
      expect(newBadges[0].badge_id).toBe('first_task');
    });

    it('should not unlock same badge twice', async () => {
      // Set up scenario where user has completed 1 task
      setupBadgeTestScenario(env.DB, 'first_task');
      
      // Mock that user already has the badge
      env.DB._setMockData('SELECT * FROM user_badges WHERE user_id = ? ORDER BY unlocked_at DESC', [
        {
          id: 'existing_badge',
          user_id: testUserId,
          badge_id: 'first_task',
          unlocked_at: Date.now() - 1000,
          tier: 'common',
          progress_percentage: 100
        }
      ]);
      
      const newBadges = await badgeService.checkAndUnlockBadges(testUserId);
      
      // Should not unlock any new badges
      expect(newBadges).toHaveLength(0);
    });

    it('should unlock task master badge after 10 completed tasks', async () => {
      // Set up scenario where user has completed 10 tasks
      setupBadgeTestScenario(env.DB, 'task_master');
      
      // Mock the INSERT queries for unlocking badges
      env.DB.query.mockResolvedValue({ success: true, results: [], meta: { changes: 1 } });
      
      const newBadges = await badgeService.checkAndUnlockBadges(testUserId);
      
      // Should unlock both first_task and task_master_10 badges
      expect(newBadges.length).toBeGreaterThan(0);
      const badgeIds = newBadges.map(b => b.badge_id);
      expect(badgeIds).toContain('task_master_10');
    });
  });

  describe('Badge Progress', () => {
    it('should track progress towards badges', async () => {
      // Set up scenario where user has completed 5 tasks
      env.DB._setMockData('SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = ?', [{ count: 5 }]);
      
      const progress = await badgeService.getBadgeProgress(testUserId);
      
      expect(progress).toBeInstanceOf(Array);
      expect(progress.length).toBeGreaterThan(0);
      
      // Find task_master_10 progress
      const taskMasterProgress = progress.find(p => p.badge_id === 'task_master_10');
      expect(taskMasterProgress).toBeDefined();
      expect(taskMasterProgress?.current_value).toBe(5);
      expect(taskMasterProgress?.target_value).toBe(10);
      expect(taskMasterProgress?.progress_percentage).toBe(50);
    });

    it('should show 100% progress for completed badges', async () => {
      // Set up scenario where user has completed 1 task and has the badge
      setupBadgeTestScenario(env.DB, 'first_task');
      
      // Mock that user already has the badge
      env.DB._setMockData('SELECT * FROM user_badges WHERE user_id = ? ORDER BY unlocked_at DESC', [
        {
          id: 'existing_badge',
          user_id: testUserId,
          badge_id: 'first_task',
          unlocked_at: Date.now() - 1000,
          tier: 'common',
          progress_percentage: 100
        }
      ]);
      
      const progress = await badgeService.getBadgeProgress(testUserId);
      
      // Find first_task progress
      const firstTaskProgress = progress.find(p => p.badge_id === 'first_task');
      expect(firstTaskProgress).toBeDefined();
      expect(firstTaskProgress?.progress_percentage).toBe(100);
      expect(firstTaskProgress?.is_complete).toBe(true);
    });
  });

  describe('Badge Sharing', () => {
    it('should generate shareable badge content', async () => {
      // Set up scenario where user has completed 1 task
      setupBadgeTestScenario(env.DB, 'first_task');
      
      // Mock the INSERT query for unlocking badge
      env.DB.query.mockResolvedValue({ success: true, results: [], meta: { changes: 1 } });
      
      const newBadges = await badgeService.checkAndUnlockBadges(testUserId);
      expect(newBadges).toHaveLength(1);

      // Mock badge sharing queries
      env.DB.query.mockResolvedValue({ success: true, results: [], meta: { changes: 1 } });
      
      // Mock getUserBadge query
      env.DB._setMockData('SELECT * FROM user_badges WHERE user_id = ? AND badge_id = ?', [
        {
          id: newBadges[0].id,
          user_id: testUserId,
          badge_id: 'first_task',
          unlocked_at: Date.now(),
          tier: 'common',
          progress_percentage: 100
        }
      ]);
      
      // Mock getBadgeDefinition query
      env.DB._setMockData('SELECT * FROM achievement_definitions WHERE achievement_key = ?', [
        {
          id: 'badge_first_task',
          achievement_key: 'first_task',
          title_en: 'First Task',
          description_en: 'Complete your first task',
          points_awarded: 10,
          rarity: 'common',
          color_primary: '#3B82F6',
          color_secondary: '#1E40AF'
        }
      ]);

      const shareContent = await badgeService.generateBadgeShare('first_task', testUserId, 'twitter');
      
      expect(shareContent).toBeDefined();
      expect(shareContent.shareUrl).toContain('wellnessapp.com');
      expect(shareContent.message).toContain('First Task');
    });
  });

  describe('Time-based Badges', () => {
    it('should unlock early adopter badge after 7 days', async () => {
      // Set up scenario where user registered 8 days ago
      setupBadgeTestScenario(env.DB, 'early_adopter');
      
      // Mock the INSERT query for unlocking badge
      env.DB.query.mockResolvedValue({ success: true, results: [], meta: { changes: 1 } });
      
      const newBadges = await badgeService.checkAndUnlockBadges(testUserId);
      
      const badgeIds = newBadges.map(b => b.badge_id);
      expect(badgeIds).toContain('early_adopter');
    });
  });

  describe('Custom Criteria Badges', () => {
    it('should unlock early bird badge for tasks completed before 9 AM', async () => {
      // Set up scenario where user has completed 5 tasks before 9 AM
      setupBadgeTestScenario(env.DB, 'early_bird');
      
      // Mock the INSERT query for unlocking badge
      env.DB.query.mockResolvedValue({ success: true, results: [], meta: { changes: 1 } });
      
      const newBadges = await badgeService.checkAndUnlockBadges(testUserId);
      
      const badgeIds = newBadges.map(b => b.badge_id);
      expect(badgeIds).toContain('early_bird');
    });
  });
});