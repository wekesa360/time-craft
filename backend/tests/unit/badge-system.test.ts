// Badge System Tests
import { describe, it, expect, beforeEach } from 'vitest';
import { BadgeService } from '../../src/lib/badges';
import { createMockEnv, createTestUser, createTestTask } from '../utils/test-helpers';

describe('Badge System', () => {
  let env: any;
  let badgeService: BadgeService;
  let testUserId: string;

  beforeEach(async () => {
    env = createMockEnv();
    badgeService = new BadgeService(env);
    testUserId = await createTestUser(env);

    // Set up mock badge definitions
    const mockBadgeDefinitions = [
      {
        id: 'badge_first_task',
        achievement_key: 'first_task',
        category: 'tasks',
        title_en: 'First Task',
        description_en: 'Complete your first task',
        criteria: JSON.stringify({ type: 'task_completion', count: 1 }),
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
        criteria: JSON.stringify({ type: 'task_completion', count: 10 }),
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
        criteria: JSON.stringify({ type: 'consecutive_days', count: 7 }),
        points_awarded: 25,
        rarity: 'uncommon',
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
        criteria: JSON.stringify({ type: 'early_completion', before_hour: 9, count: 5 }),
        points_awarded: 20,
        rarity: 'uncommon',
        icon_emoji: '🐦',
        color_primary: '#10B981',
        color_secondary: '#059669',
        is_active: 1
      }
    ];

    env.DB._setMockData('SELECT * FROM achievement_definitions WHERE is_active = 1 ORDER BY points_awarded ASC', mockBadgeDefinitions);
    env.DB._setMockData('SELECT * FROM user_badges WHERE user_id = ?', []);
    env.DB._setMockData('INSERT INTO user_badges', [{ id: 'new_badge_id' }]);
    env.DB._setMockData('SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = ?', [{ count: 1 }]);
    env.DB._setMockData('SELECT * FROM users WHERE id = ?', [{ 
      id: testUserId, 
      badge_points: 0, 
      total_badges: 0, 
      badge_tier: 'bronze',
      created_at: Date.now() - (8 * 24 * 60 * 60 * 1000) // 8 days ago for early adopter test
    }]);
    env.DB._setMockData('UPDATE users SET badge_points = ?, total_badges = ?, badge_tier = ? WHERE id = ?', [{ id: testUserId }]);
  });

  describe('Badge Checking', () => {
    it('should unlock first task badge when user completes first task', async () => {
      // Create and complete a task
      const taskId = await createTestTask(env, testUserId, {
        title: 'Test Task',
        status: 'done'
      });

      // Check for new badges
      const newBadges = await badgeService.checkAndUnlockBadges(testUserId);

      // Should unlock the "first_task" badge
      expect(newBadges).toHaveLength(1);
      expect(newBadges[0].badge_id).toBe('first_task');
    });

    it('should not unlock same badge twice', async () => {
      // Complete first task and unlock badge
      await createTestTask(env, testUserId, { title: 'Task 1', status: 'done' });
      const firstCheck = await badgeService.checkAndUnlockBadges(testUserId);
      expect(firstCheck).toHaveLength(1);

      // Complete second task
      await createTestTask(env, testUserId, { title: 'Task 2', status: 'done' });
      const secondCheck = await badgeService.checkAndUnlockBadges(testUserId);
      
      // Should not unlock first_task badge again
      expect(secondCheck.find(b => b.badge_id === 'first_task')).toBeUndefined();
    });

    it('should unlock task master badge after 10 completed tasks', async () => {
      // Create 10 completed tasks
      for (let i = 1; i <= 10; i++) {
        await createTestTask(env, testUserId, {
          title: `Task ${i}`,
          status: 'done'
        });
      }

      const newBadges = await badgeService.checkAndUnlockBadges(testUserId);
      
      // Should unlock both first_task and task_master_10 badges
      const badgeIds = newBadges.map(b => b.badge_id);
      expect(badgeIds).toContain('first_task');
      expect(badgeIds).toContain('task_master_10');
    });
  });

  describe('Badge Progress', () => {
    it('should track progress towards badges', async () => {
      // Create 5 completed tasks (halfway to task_master_10)
      for (let i = 1; i <= 5; i++) {
        await createTestTask(env, testUserId, {
          title: `Task ${i}`,
          status: 'done'
        });
      }

      const progress = await badgeService.getBadgeProgress(testUserId);
      
      // Find task_master_10 progress
      const taskMasterProgress = progress.find(p => p.badge_id === 'task_master_10');
      expect(taskMasterProgress).toBeDefined();
      expect(taskMasterProgress?.current_value).toBe(5);
      expect(taskMasterProgress?.target_value).toBe(10);
      expect(taskMasterProgress?.progress_percentage).toBe(50);
      expect(taskMasterProgress?.is_complete).toBe(false);
    });

    it('should show 100% progress for completed badges', async () => {
      // Complete one task to unlock first_task badge
      await createTestTask(env, testUserId, { title: 'Task 1', status: 'done' });
      await badgeService.checkAndUnlockBadges(testUserId);

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
      // Complete task and unlock badge
      await createTestTask(env, testUserId, { title: 'Task 1', status: 'done' });
      const newBadges = await badgeService.checkAndUnlockBadges(testUserId);
      expect(newBadges).toHaveLength(1);

      // Generate share content
      const shareData = await badgeService.generateBadgeShare(
        'first_task',
        testUserId,
        'instagram',
        'Just got my first badge! 🎉'
      );

      expect(shareData.shareUrl).toContain('wellnessapp.com/badges/shared/');
      expect(shareData.message).toContain('Just got my first badge! 🎉');
      expect(shareData.message).toContain('#WellnessJourney');
    });

    it('should fail to share unearned badge', async () => {
      // Try to share a badge that hasn't been unlocked
      await expect(
        badgeService.generateBadgeShare('task_master_100', testUserId, 'twitter')
      ).rejects.toThrow('Badge not found or not unlocked');
    });
  });

  describe('Time-based Badges', () => {
    it('should unlock early adopter badge after 7 days', async () => {
      // Mock user created 8 days ago
      const eightDaysAgo = Date.now() - (8 * 24 * 60 * 60 * 1000);
      await env.DB.prepare(`
        UPDATE users SET created_at = ? WHERE id = ?
      `).bind(eightDaysAgo, testUserId).run();

      const newBadges = await badgeService.checkAndUnlockBadges(testUserId);
      
      const badgeIds = newBadges.map(b => b.badge_id);
      expect(badgeIds).toContain('early_adopter');
    });
  });

  describe('Custom Criteria Badges', () => {
    it('should unlock early bird badge for tasks completed before 9 AM', async () => {
      // Mock 10 tasks completed at 8 AM (before 9 AM)
      const eightAM = new Date();
      eightAM.setHours(8, 0, 0, 0);
      
      for (let i = 1; i <= 10; i++) {
        const taskId = await createTestTask(env, testUserId, {
          title: `Early Task ${i}`,
          status: 'done'
        });
        
        // Update the completion time to 8 AM
        await env.DB.prepare(`
          UPDATE tasks SET updated_at = ? WHERE id = ?
        `).bind(eightAM.getTime(), taskId).run();
      }

      const newBadges = await badgeService.checkAndUnlockBadges(testUserId);
      
      const badgeIds = newBadges.map(b => b.badge_id);
      expect(badgeIds).toContain('early_bird');
    });
  });
});

describe('Badge Integration with Core System', () => {
  let env: any;
  let testUserId: string;

  beforeEach(async () => {
    env = createMockEnv();
    testUserId = await createTestUser(env);
  });

  it('should update user badge stats when badge is unlocked', async () => {
    const badgeService = new BadgeService(env);
    
    // Complete task to unlock badge
    await createTestTask(env, testUserId, { title: 'Task 1', status: 'done' });
    await badgeService.checkAndUnlockBadges(testUserId);

    // Check user stats were updated
    const user = await env.DB.prepare(`
      SELECT badge_points, total_badges, badge_tier FROM users WHERE id = ?
    `).bind(testUserId).first();

    expect(user.badge_points).toBeGreaterThan(0);
    expect(user.total_badges).toBeGreaterThan(0);
    expect(user.badge_tier).toBeDefined();
  });

  it('should handle badge checking errors gracefully', async () => {
    const badgeService = new BadgeService(env);
    
    // Try to check badges for non-existent user
    const result = await badgeService.checkAndUnlockBadges('non-existent-user');
    
    // Should return empty array, not throw error
    expect(result).toEqual([]);
  });
});