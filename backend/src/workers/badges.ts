// Badge and Achievement System Worker for Time & Wellness Application
import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import type { Env } from '../lib/env';
import { 
  DatabaseService, 
  UserRepository, 
  TaskRepository, 
  HealthRepository 
} from '../lib/db';
import type { SupportedLanguage } from '../types/database';
import { queueNotification } from '../lib/notifications';
import { BadgeService } from '../lib/badges';

const badges = new Hono<{ Bindings: Env }>();

// Badge and Achievement Types
interface Badge {
  id: string;
  name: string;
  description: string;
  category: 'tasks' | 'health' | 'streak' | 'milestone' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  icon: string;
  criteria: BadgeCriteria;
  points: number;
  isActive: boolean;
}

interface BadgeCriteria {
  type: 'count' | 'streak' | 'percentage' | 'time_based' | 'custom';
  threshold: number;
  timeframe?: number; // days
  metric: string; // e.g., 'tasks_completed', 'exercise_logs', 'consecutive_days'
  conditions?: Record<string, any>;
}

interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  unlockedAt: number;
  progress?: number; // 0-100 percentage
  tier?: string;
  metadata?: Record<string, any>;
}

// Authentication middleware
const getUserFromToken = async (c: any): Promise<{ userId: string; language?: SupportedLanguage } | null> => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const payload = await verify(token, c.env.JWT_SECRET);
    
    return { 
      userId: payload.userId as string,
      language: (payload.preferredLanguage as SupportedLanguage) || 'en'
    };
  } catch {
    return null;
  }
};

// Badge definitions - would typically be stored in database
const BADGE_DEFINITIONS: Badge[] = [
  // Task-based badges
  {
    id: 'first_task',
    name: 'Getting Started',
    description: 'Complete your first task',
    category: 'milestone',
    tier: 'bronze',
    icon: '🎯',
    criteria: { type: 'count', threshold: 1, metric: 'tasks_completed' },
    points: 10,
    isActive: true
  },
  {
    id: 'task_veteran',
    name: 'Task Master',
    description: 'Complete 100 tasks',
    category: 'tasks',
    tier: 'gold',
    icon: '🏆',
    criteria: { type: 'count', threshold: 100, metric: 'tasks_completed' },
    points: 100,
    isActive: true
  },
  {
    id: 'productive_day',
    name: 'Productive Day',
    description: 'Complete 10 tasks in a single day',
    category: 'tasks',
    tier: 'silver',
    icon: '⚡',
    criteria: { type: 'count', threshold: 10, timeframe: 1, metric: 'tasks_completed' },
    points: 25,
    isActive: true
  },

  // Health-based badges
  {
    id: 'health_tracker',
    name: 'Health Conscious',
    description: 'Log your first health activity',
    category: 'milestone',
    tier: 'bronze',
    icon: '🌱',
    criteria: { type: 'count', threshold: 1, metric: 'health_logs' },
    points: 10,
    isActive: true
  },
  {
    id: 'wellness_warrior',
    name: 'Wellness Warrior',
    description: 'Log health activities for 30 consecutive days',
    category: 'streak',
    tier: 'gold',
    icon: '💪',
    criteria: { type: 'streak', threshold: 30, metric: 'health_logs' },
    points: 150,
    isActive: true
  },
  {
    id: 'exercise_enthusiast',
    name: 'Exercise Enthusiast',
    description: 'Log 50 exercise activities',
    category: 'health',
    tier: 'silver',
    icon: '🏃',
    criteria: { 
      type: 'count', 
      threshold: 50, 
      metric: 'health_logs',
      conditions: { type: 'exercise' }
    },
    points: 75,
    isActive: true
  },

  // Streak-based badges
  {
    id: 'consistency_king',
    name: 'Consistency King',
    description: 'Complete tasks for 7 consecutive days',
    category: 'streak',
    tier: 'silver',
    icon: '🔥',
    criteria: { type: 'streak', threshold: 7, metric: 'daily_task_completion' },
    points: 50,
    isActive: true
  },
  {
    id: 'habit_master',
    name: 'Habit Master',
    description: 'Maintain a 21-day habit streak',
    category: 'streak',
    tier: 'gold',
    icon: '🎭',
    criteria: { type: 'streak', threshold: 21, metric: 'daily_activity' },
    points: 125,
    isActive: true
  },

  // Time-based badges
  {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Active for your first week',
    category: 'milestone',
    tier: 'bronze',
    icon: '🚀',
    criteria: { type: 'time_based', threshold: 7, metric: 'days_since_registration' },
    points: 15,
    isActive: true
  },
  {
    id: 'loyal_user',
    name: 'Loyal User',
    description: 'Active for 6 months',
    category: 'milestone',
    tier: 'platinum',
    icon: '👑',
    criteria: { type: 'time_based', threshold: 180, metric: 'days_since_registration' },
    points: 300,
    isActive: true
  }
];

// ========== BADGE CHECKING ENGINE ==========

class BadgeEngine {
  private db: DatabaseService;
  private env: Env;

  constructor(env: Env) {
    this.env = env;
    this.db = new DatabaseService(env);
  }

  // Check all badges for a user and unlock any newly earned badges
  async checkAndUnlockBadges(userId: string): Promise<UserBadge[]> {
    const newlyUnlocked: UserBadge[] = [];
    
    // Get user's existing badges
    const existingBadges = await this.getUserBadges(userId);
    const existingBadgeIds = new Set(existingBadges.map(b => b.badgeId));

    // Check each badge definition
    for (const badge of BADGE_DEFINITIONS) {
      if (!badge.isActive || existingBadgeIds.has(badge.id)) {
        continue; // Skip inactive badges or already unlocked
      }

      const qualifies = await this.checkBadgeCriteria(userId, badge);
      if (qualifies) {
        const userBadge = await this.unlockBadge(userId, badge);
        newlyUnlocked.push(userBadge);
      }
    }

    return newlyUnlocked;
  }

  // Check if user meets criteria for a specific badge
  private async checkBadgeCriteria(userId: string, badge: Badge): Promise<boolean> {
    const { criteria } = badge;

    try {
      switch (criteria.type) {
        case 'count':
          return await this.checkCountCriteria(userId, criteria);
        case 'streak':
          return await this.checkStreakCriteria(userId, criteria);
        case 'time_based':
          return await this.checkTimeCriteria(userId, criteria);
        case 'percentage':
          return await this.checkPercentageCriteria(userId, criteria);
        default:
          return false;
      }
    } catch (error) {
      console.error(`Error checking badge criteria for ${badge.id}:`, error);
      return false;
    }
  }

  private async checkCountCriteria(userId: string, criteria: BadgeCriteria): Promise<boolean> {
    const { metric, threshold, timeframe, conditions } = criteria;
    
    let query: string;
    let params: any[] = [userId];

    // Build query based on metric
    switch (metric) {
      case 'tasks_completed':
        query = 'SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = \'completed\'';
        break;
      case 'health_logs':
        query = 'SELECT COUNT(*) as count FROM health_logs WHERE user_id = ?';
        break;
      default:
        return false;
    }

    // Add timeframe filter
    if (timeframe) {
      const timeframeMills = Date.now() - (timeframe * 24 * 60 * 60 * 1000);
      query += ' AND created_at > ?';
      params.push(timeframeMills);
    }

    // Add conditions filter
    if (conditions) {
      for (const [key, value] of Object.entries(conditions)) {
        query += ` AND ${key} = ?`;
        params.push(value);
      }
    }

    const result = await this.db.query(query, params);
    const count = result.results?.[0]?.count || 0;
    
    return count >= threshold;
  }

  private async checkStreakCriteria(userId: string, criteria: BadgeCriteria): Promise<boolean> {
    const { metric, threshold } = criteria;
    
    // This would require more complex logic to check consecutive days
    // For now, simplified check
    if (metric === 'daily_task_completion') {
      // Check if user has completed tasks for required consecutive days
      const streak = await this.calculateTaskCompletionStreak(userId);
      return streak >= threshold;
    }

    if (metric === 'health_logs') {
      const streak = await this.calculateHealthLogStreak(userId);
      return streak >= threshold;
    }

    return false;
  }

  private async checkTimeCriteria(userId: string, criteria: BadgeCriteria): Promise<boolean> {
    const { metric, threshold } = criteria;
    
    if (metric === 'days_since_registration') {
      const user = await this.db.query('SELECT created_at FROM users WHERE id = ?', [userId]);
      const createdAt = user.results?.[0]?.created_at;
      if (!createdAt) return false;
      
      const daysSince = (Date.now() - createdAt) / (24 * 60 * 60 * 1000);
      return daysSince >= threshold;
    }

    return false;
  }

  private async checkPercentageCriteria(userId: string, criteria: BadgeCriteria): Promise<boolean> {
    // Implementation for percentage-based criteria
    return false;
  }

  // Calculate consecutive days of task completion
  private async calculateTaskCompletionStreak(userId: string): Promise<number> {
    // Simplified streak calculation
    // In real implementation, would check day-by-day completion
    const recentTasks = await this.db.query(`
      SELECT DATE(datetime(updated_at/1000, 'unixepoch')) as date
      FROM tasks 
      WHERE user_id = ? AND status = 'completed' 
        AND updated_at > ?
      GROUP BY DATE(datetime(updated_at/1000, 'unixepoch'))
      ORDER BY date DESC
    `, [userId, Date.now() - (30 * 24 * 60 * 60 * 1000)]);

    // Count consecutive days (simplified)
    return Math.min((recentTasks.results || []).length, 30);
  }

  private async calculateHealthLogStreak(userId: string): Promise<number> {
    // Similar to task streak but for health logs
    const recentLogs = await this.db.query(`
      SELECT DATE(datetime(created_at/1000, 'unixepoch')) as date
      FROM health_logs 
      WHERE user_id = ? 
        AND created_at > ?
      GROUP BY DATE(datetime(created_at/1000, 'unixepoch'))
      ORDER BY date DESC
    `, [userId, Date.now() - (30 * 24 * 60 * 60 * 1000)]);

    return Math.min((recentLogs.results || []).length, 30);
  }

  // Unlock a badge for a user
  private async unlockBadge(userId: string, badge: Badge): Promise<UserBadge> {
    const userBadge: UserBadge = {
      id: `badge_${userId}_${badge.id}_${Date.now()}`,
      userId,
      badgeId: badge.id,
      unlockedAt: Date.now(),
      tier: badge.tier
    };

    // Store in database
    await this.db.query(`
      INSERT INTO user_badges (id, user_id, badge_id, unlocked_at, tier)
      VALUES (?, ?, ?, ?, ?)
    `, [userBadge.id, userId, badge.id, userBadge.unlockedAt, badge.tier]);

    // Update user's total points (skip if column doesn't exist)
    try {
      await this.db.query(`
        UPDATE users 
        SET badge_points = COALESCE(badge_points, 0) + ?
        WHERE id = ?
      `, [badge.points, userId]);
    } catch (error) {
      console.log('badge_points column not found, skipping points update');
    }

    // Send achievement notification
    try {
      await queueNotification(this.env, {
        type: 'achievement',
        badgeId: badge.id,
        badgeName: badge.name,
        userId
      });
    } catch (error) {
      console.error('Failed to send achievement notification:', error);
      // Don't fail badge unlock if notification fails
    }

    return userBadge;
  }

  // Get user's badges
  private async getUserBadges(userId: string): Promise<UserBadge[]> {
    const result = await this.db.query(`
      SELECT * FROM user_badges WHERE user_id = ?
    `, [userId]);

    return (result.results || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      badgeId: row.badge_id,
      unlockedAt: row.unlocked_at,
      tier: row.tier,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    }));
  }
}

// ========== API ENDPOINTS ==========

// GET /badges/available - Get all available badges
badges.get('/available', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const badgeService = new BadgeService(c.env);
    const db = new DatabaseService(c.env);
    
    // Get all badge definitions
    const badgeDefinitions = await db.query(`
      SELECT * FROM achievement_definitions WHERE is_active = 1 ORDER BY points_awarded ASC
    `);

    // Get user's unlocked badges
    const userBadges = await db.query(`
      SELECT badge_id, unlocked_at FROM user_badges WHERE user_id = ?
    `, [auth.userId]);

    const unlockedBadgeIds = new Set(userBadges.results?.map((b: any) => b.badge_id) || []);

    // Get badge progress for locked badges
    const badgeProgress = await badgeService.getBadgeProgress(auth.userId);
    const progressMap = new Map(badgeProgress.map(p => [p.badge_id, p]));

    const badgesWithStatus = (badgeDefinitions.results || []).map((badge: any) => {
      const isUnlocked = unlockedBadgeIds.has(badge.achievement_key);
      const progress = progressMap.get(badge.achievement_key);
      const unlockedBadge = userBadges.results?.find((ub: any) => ub.badge_id === badge.achievement_key);

      return {
        id: badge.achievement_key,
        name: badge.title_en, // TODO: Use user's preferred language
        description: badge.description_en,
        category: badge.category,
        rarity: badge.rarity,
        icon: badge.icon_emoji || '🏅',
        points: badge.points_awarded,
        colorPrimary: badge.color_primary,
        colorSecondary: badge.color_secondary,
        isUnlocked,
        unlockedAt: unlockedBadge?.unlocked_at,
        progress: progress ? {
          current: progress.current_value,
          target: progress.target_value,
          percentage: progress.progress_percentage
        } : null
      };
    });

    return c.json({
      badges: badgesWithStatus,
      totalAvailable: badgeDefinitions.results?.length || 0,
      totalUnlocked: userBadges.results?.length || 0
    });
  } catch (error) {
    console.error('Available badges error:', error);
    return c.json({ error: 'Failed to fetch badges' }, 500);
  }
});

// GET /badges/user - Get user's unlocked badges
badges.get('/user', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const badgeEngine = new BadgeEngine(c.env);
    const userBadges = await badgeEngine.getUserBadges(auth.userId);
    
    const badgesWithDetails = userBadges.map(userBadge => {
      const badgeDefinition = BADGE_DEFINITIONS.find(b => b.id === userBadge.badgeId);
      return {
        ...userBadge,
        name: badgeDefinition?.name || 'Unknown Badge',
        description: badgeDefinition?.description || '',
        category: badgeDefinition?.category || 'unknown',
        icon: badgeDefinition?.icon || '🏅',
        points: badgeDefinition?.points || 0
      };
    });

    // Get user's total points
    const db = new DatabaseService(c.env);
    let userPoints;
    try {
      userPoints = await db.query(
        'SELECT badge_points FROM users WHERE id = ?',
        [auth.userId]
      );
    } catch (error) {
      // Handle missing badge_points column gracefully
      console.log('badge_points column not found, using fallback');
      userPoints = { results: [{ badge_points: 0 }] };
    }

    return c.json({
      badges: badgesWithDetails,
      totalBadges: userBadges.length,
      totalPoints: userPoints.results?.[0]?.badge_points || 0,
      recentlyUnlocked: badgesWithDetails
        .filter(b => b.unlockedAt > Date.now() - (7 * 24 * 60 * 60 * 1000))
        .sort((a, b) => b.unlockedAt - a.unlockedAt)
    });
  } catch (error) {
    console.error('User badges error:', error);
    return c.json({ error: 'Failed to fetch user badges' }, 500);
  }
});

// POST /badges/check - Manually trigger badge checking
badges.post('/check', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const badgeService = new BadgeService(c.env);
    const newBadges = await badgeService.checkAndUnlockBadges(auth.userId);
    
    // Get badge definitions for the new badges
    const db = new DatabaseService(c.env);
    const newBadgesWithDetails = await Promise.all(
      newBadges.map(async (userBadge) => {
        const badgeDefinition = await db.query(`
          SELECT * FROM achievement_definitions WHERE achievement_key = ?
        `, [userBadge.badge_id]);

        const badge = badgeDefinition.results?.[0];
        return {
          id: userBadge.id,
          badgeId: userBadge.badge_id,
          name: badge?.title_en || 'Unknown Badge',
          description: badge?.description_en || '',
          icon: badge?.icon_emoji || '🏅',
          points: badge?.points_awarded || 0,
          rarity: badge?.rarity || 'common',
          unlockedAt: userBadge.unlocked_at
        };
      })
    );

    return c.json({
      message: `${newBadges.length} new badge(s) unlocked`,
      newBadges: newBadgesWithDetails,
      totalNewPoints: newBadgesWithDetails.reduce((sum, badge) => sum + badge.points, 0)
    });
  } catch (error) {
    console.error('Badge check error:', error);
    return c.json({ error: 'Failed to check badges' }, 500);
  }
});

// POST /badges/:badgeId/share - Generate shareable badge content
badges.post('/:badgeId/share', zValidator('json', z.object({
  platform: z.enum(['instagram', 'whatsapp', 'twitter', 'facebook', 'linkedin', 'email']),
  customMessage: z.string().max(500).optional()
})), async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const badgeId = c.req.param('badgeId');
    const { platform, customMessage } = c.req.valid('json');
    
    const badgeService = new BadgeService(c.env);
    const shareData = await badgeService.generateBadgeShare(
      badgeId, 
      auth.userId, 
      platform, 
      customMessage
    );

    return c.json({
      message: 'Badge share generated successfully',
      shareUrl: shareData.shareUrl,
      imageUrl: shareData.imageUrl,
      shareMessage: shareData.message,
      platform
    });
  } catch (error) {
    console.error('Badge share error:', error);
    return c.json({ error: 'Failed to generate badge share' }, 500);
  }
});

// GET /badges/leaderboard - Get badge leaderboard
badges.get('/leaderboard', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const db = new DatabaseService(c.env);
    let leaderboard, userRank;
    
    try {
      leaderboard = await db.query(`
        SELECT 
          u.first_name,
          u.last_name,
          u.email,
          COALESCE(u.badge_points, 0) as points,
          COALESCE(u.total_badges, 0) as badge_count,
          u.badge_tier
        FROM users u
        WHERE u.id != 'template' -- Exclude template user
        ORDER BY points DESC, badge_count DESC
        LIMIT 50
      `);

      userRank = await db.query(`
        SELECT COUNT(*) + 1 as rank
        FROM users 
        WHERE COALESCE(badge_points, 0) > (
          SELECT COALESCE(badge_points, 0) FROM users WHERE id = ?
        ) AND id != 'template'
      `, [auth.userId]);
    } catch (columnError) {
      // Handle missing badge_points column gracefully
      console.log('badge_points column not found, returning empty leaderboard');
      leaderboard = { results: [] };
      userRank = { results: [{ rank: 1 }] };
    }

    return c.json({
      leaderboard: (leaderboard.results || []).map((user: any, index: number) => ({
        rank: index + 1,
        displayName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Anonymous',
        email: user.email.substring(0, 3) + '***', // Privacy protection
        points: user.points,
        badgeCount: user.badge_count,
        tier: user.badge_tier || 'bronze'
      })),
      userRank: userRank.results?.[0]?.rank || 0
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return c.json({ error: 'Failed to fetch leaderboard' }, 500);
  }
});

export default badges;