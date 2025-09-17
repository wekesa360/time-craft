// Badge System Library for Time & Wellness Application
import type { Env } from './env';
import { DatabaseService } from './db';
import { queueNotification } from './notifications';
import type { SupportedLanguage } from '../types/database';

export interface Badge {
  id: string;
  achievement_key: string;
  category: string;
  title: string;
  description: string;
  criteria: BadgeCriteria;
  points_awarded: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon_emoji: string;
  color_primary: string;
  color_secondary: string;
  is_active: boolean;
}

export interface BadgeCriteria {
  type: 'count' | 'streak' | 'percentage' | 'time_based' | 'custom';
  threshold: number;
  timeframe?: number; // days
  metric: string;
  conditions?: Record<string, any>;
  requirements?: Array<{ metric: string; threshold: number }>;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  unlocked_at: number;
  tier: string;
  progress_percentage: number;
  metadata?: Record<string, any>;
}

export interface BadgeProgress {
  badge_id: string;
  current_value: number;
  target_value: number;
  progress_percentage: number;
  is_complete: boolean;
}

export class BadgeService {
  private db: DatabaseService;
  private env: Env;

  constructor(env: Env) {
    this.env = env;
    this.db = new DatabaseService(env);
  }

  // Check all badges for a user and unlock any newly earned badges
  async checkAndUnlockBadges(userId: string): Promise<UserBadge[]> {
    const newlyUnlocked: UserBadge[] = [];
    
    try {
      // Get user's existing badges
      const existingBadges = await this.getUserBadges(userId);
      const existingBadgeIds = new Set(existingBadges.map(b => b.badge_id));

      // Get all active badge definitions
      const badgeDefinitions = await this.getActiveBadgeDefinitions();

      // Check each badge definition
      for (const badge of badgeDefinitions) {
        if (existingBadgeIds.has(badge.achievement_key)) {
          continue; // Already unlocked
        }

        const qualifies = await this.checkBadgeCriteria(userId, badge);
        if (qualifies) {
          const userBadge = await this.unlockBadge(userId, badge);
          newlyUnlocked.push(userBadge);
        }
      }

      return newlyUnlocked;
    } catch (error) {
      console.error('Badge checking failed:', error);
      return [];
    }
  }

  // Get user's progress on all badges
  async getBadgeProgress(userId: string): Promise<BadgeProgress[]> {
    const badgeDefinitions = await this.getActiveBadgeDefinitions();
    const existingBadges = await this.getUserBadges(userId);
    const existingBadgeIds = new Set(existingBadges.map(b => b.badge_id));

    const progress: BadgeProgress[] = [];

    for (const badge of badgeDefinitions) {
      if (existingBadgeIds.has(badge.achievement_key)) {
        // Already unlocked
        progress.push({
          badge_id: badge.achievement_key,
          current_value: badge.criteria.threshold,
          target_value: badge.criteria.threshold,
          progress_percentage: 100,
          is_complete: true
        });
        continue;
      }

      const currentValue = await this.getCurrentMetricValue(userId, badge.criteria);
      const progressPercentage = Math.min(100, Math.round((currentValue / badge.criteria.threshold) * 100));

      progress.push({
        badge_id: badge.achievement_key,
        current_value: currentValue,
        target_value: badge.criteria.threshold,
        progress_percentage: progressPercentage,
        is_complete: false
      });
    }

    return progress;
  }

  // Generate shareable badge content
  async generateBadgeShare(
    badgeId: string, 
    userId: string, 
    platform: string,
    customMessage?: string
  ): Promise<{
    shareUrl: string;
    imageUrl?: string;
    message: string;
  }> {
    const userBadge = await this.getUserBadge(userId, badgeId);
    if (!userBadge) {
      throw new Error('Badge not found or not unlocked');
    }

    const badgeDefinition = await this.getBadgeDefinition(badgeId);
    if (!badgeDefinition) {
      throw new Error('Badge definition not found');
    }

    // Create share record
    const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const shareUrl = `https://wellnessapp.com/badges/shared/${shareId}`;

    await this.db.query(`
      INSERT INTO badge_shares (id, badge_id, user_id, platform, share_url, custom_message, shared_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [shareId, userBadge.id, userId, platform, shareUrl, customMessage || '', Date.now()]);

    // Update share count
    await this.db.query(`
      UPDATE user_badges SET share_count = share_count + 1 WHERE id = ?
    `, [userBadge.id]);

    // Generate platform-specific message
    const defaultMessage = customMessage || 
      `I just earned the "${badgeDefinition.title}" badge in my wellness journey! 🎉`;

    const platformMessages = {
      instagram: `${defaultMessage} #WellnessJourney #Achievement #Productivity`,
      twitter: `${defaultMessage} #WellnessApp #Achievement`,
      whatsapp: defaultMessage,
      facebook: defaultMessage,
      linkedin: `Proud to share: ${defaultMessage}`,
      email: `Hi! I wanted to share my latest achievement: ${defaultMessage}`
    };

    return {
      shareUrl,
      imageUrl: await this.generateBadgeImage(badgeDefinition, userBadge),
      message: platformMessages[platform as keyof typeof platformMessages] || defaultMessage
    };
  }

  // Private helper methods
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
        case 'custom':
          return await this.checkCustomCriteria(userId, criteria);
        default:
          return false;
      }
    } catch (error) {
      console.error(`Error checking badge criteria for ${badge.achievement_key}:`, error);
      return false;
    }
  }

  private async checkCountCriteria(userId: string, criteria: BadgeCriteria): Promise<boolean> {
    const currentValue = await this.getCurrentMetricValue(userId, criteria);
    return currentValue >= criteria.threshold;
  }

  private async checkStreakCriteria(userId: string, criteria: BadgeCriteria): Promise<boolean> {
    const { metric, threshold } = criteria;
    
    if (metric === 'daily_task_completion') {
      const streak = await this.calculateTaskCompletionStreak(userId);
      return streak >= threshold;
    }

    if (metric === 'health_logs') {
      const streak = await this.calculateHealthLogStreak(userId);
      return streak >= threshold;
    }

    if (metric === 'daily_activity') {
      const streak = await this.calculateDailyActivityStreak(userId);
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

  private async checkCustomCriteria(userId: string, criteria: BadgeCriteria): Promise<boolean> {
    const { metric, threshold, conditions, requirements } = criteria;

    // Handle special custom criteria
    if (metric === 'early_tasks' && conditions?.before_hour) {
      const count = await this.countTasksCompletedBeforeHour(userId, conditions.before_hour);
      return count >= threshold;
    }

    if (metric === 'late_tasks' && conditions?.after_hour) {
      const count = await this.countTasksCompletedAfterHour(userId, conditions.after_hour);
      return count >= threshold;
    }

    if (metric === 'badge_points') {
      const user = await this.db.query('SELECT badge_points FROM users WHERE id = ?', [userId]);
      const points = user.results?.[0]?.badge_points || 0;
      return points >= threshold;
    }

    // Handle multi-requirement criteria
    if (requirements && requirements.length > 0) {
      for (const req of requirements) {
        const value = await this.getCurrentMetricValue(userId, { ...criteria, metric: req.metric });
        if (value < req.threshold) {
          return false;
        }
      }
      return true;
    }

    return false;
  }

  private async getCurrentMetricValue(userId: string, criteria: BadgeCriteria): Promise<number> {
    const { metric, timeframe, conditions } = criteria;

    let query = '';
    let params: any[] = [userId];

    switch (metric) {
      case 'tasks_completed':
        query = 'SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = ?';
        params.push('done');
        break;
      case 'health_logs':
        query = 'SELECT COUNT(*) as count FROM health_logs WHERE user_id = ?';
        break;
      default:
        return 0;
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
        if (key !== 'before_hour' && key !== 'after_hour') {
          query += ` AND ${key} = ?`;
          params.push(value);
        }
      }
    }

    const result = await this.db.query(query, params);
    return result.results?.[0]?.count || 0;
  }

  private async calculateTaskCompletionStreak(userId: string): Promise<number> {
    // Get tasks completed in the last 30 days, grouped by date
    const result = await this.db.query(`
      SELECT DATE(datetime(updated_at/1000, 'unixepoch')) as date
      FROM tasks 
      WHERE user_id = ? AND status = 'done' 
        AND updated_at > ?
      GROUP BY DATE(datetime(updated_at/1000, 'unixepoch'))
      ORDER BY date DESC
    `, [userId, Date.now() - (30 * 24 * 60 * 60 * 1000)]);

    const dates = (result.results || []).map((row: any) => row.date);
    return this.calculateConsecutiveDays(dates);
  }

  private async calculateHealthLogStreak(userId: string): Promise<number> {
    const result = await this.db.query(`
      SELECT DATE(datetime(created_at/1000, 'unixepoch')) as date
      FROM health_logs 
      WHERE user_id = ? 
        AND created_at > ?
      GROUP BY DATE(datetime(created_at/1000, 'unixepoch'))
      ORDER BY date DESC
    `, [userId, Date.now() - (30 * 24 * 60 * 60 * 1000)]);

    const dates = (result.results || []).map((row: any) => row.date);
    return this.calculateConsecutiveDays(dates);
  }

  private async calculateDailyActivityStreak(userId: string): Promise<number> {
    // Combine tasks and health logs for overall activity
    const result = await this.db.query(`
      SELECT DATE(datetime(created_at/1000, 'unixepoch')) as date
      FROM (
        SELECT created_at FROM tasks WHERE user_id = ? AND status = 'done'
        UNION
        SELECT created_at FROM health_logs WHERE user_id = ?
      ) activities
      WHERE created_at > ?
      GROUP BY DATE(datetime(created_at/1000, 'unixepoch'))
      ORDER BY date DESC
    `, [userId, userId, Date.now() - (30 * 24 * 60 * 60 * 1000)]);

    const dates = (result.results || []).map((row: any) => row.date);
    return this.calculateConsecutiveDays(dates);
  }

  private calculateConsecutiveDays(dates: string[]): number {
    if (dates.length === 0) return 0;

    let streak = 1;
    const today = new Date().toISOString().split('T')[0];
    
    // Check if today or yesterday is included (allow for timezone differences)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    if (!dates.includes(today) && !dates.includes(yesterday)) {
      return 0; // Streak is broken
    }

    // Count consecutive days
    for (let i = 1; i < dates.length; i++) {
      const currentDate = new Date(dates[i]);
      const previousDate = new Date(dates[i - 1]);
      const dayDiff = (previousDate.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000);
      
      if (dayDiff === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private async countTasksCompletedBeforeHour(userId: string, hour: number): Promise<number> {
    const result = await this.db.query(`
      SELECT COUNT(*) as count
      FROM tasks 
      WHERE user_id = ? AND status = 'done'
        AND CAST(strftime('%H', datetime(updated_at/1000, 'unixepoch')) AS INTEGER) < ?
    `, [userId, hour]);

    return result.results?.[0]?.count || 0;
  }

  private async countTasksCompletedAfterHour(userId: string, hour: number): Promise<number> {
    const result = await this.db.query(`
      SELECT COUNT(*) as count
      FROM tasks 
      WHERE user_id = ? AND status = 'done'
        AND CAST(strftime('%H', datetime(updated_at/1000, 'unixepoch')) AS INTEGER) > ?
    `, [userId, hour]);

    return result.results?.[0]?.count || 0;
  }

  private async unlockBadge(userId: string, badge: Badge): Promise<UserBadge> {
    const userBadgeId = `badge_${userId}_${badge.achievement_key}_${Date.now()}`;
    
    const userBadge: UserBadge = {
      id: userBadgeId,
      user_id: userId,
      badge_id: badge.achievement_key,
      unlocked_at: Date.now(),
      tier: badge.rarity,
      progress_percentage: 100
    };

    // Store in database
    await this.db.query(`
      INSERT INTO user_badges (id, user_id, badge_id, unlocked_at, tier, progress_percentage)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [userBadge.id, userId, badge.achievement_key, userBadge.unlocked_at, badge.rarity, 100]);

    // Send achievement notification
    try {
      await queueNotification(this.env, {
        type: 'badge_unlocked',
        userId,
        badgeId: badge.achievement_key,
        badgeName: badge.title,
        points: badge.points_awarded
      });
    } catch (error) {
      console.error('Failed to send badge notification:', error);
      // Don't fail badge unlock if notification fails
    }

    return userBadge;
  }

  private async getUserBadges(userId: string): Promise<UserBadge[]> {
    const result = await this.db.query(`
      SELECT * FROM user_badges WHERE user_id = ? ORDER BY unlocked_at DESC
    `, [userId]);

    return (result.results || []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      badge_id: row.badge_id,
      unlocked_at: row.unlocked_at,
      tier: row.tier,
      progress_percentage: row.progress_percentage || 100,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    }));
  }

  private async getUserBadge(userId: string, badgeId: string): Promise<UserBadge | null> {
    const result = await this.db.query(`
      SELECT * FROM user_badges WHERE user_id = ? AND badge_id = ?
    `, [userId, badgeId]);

    const row = result.results?.[0];
    if (!row) return null;

    return {
      id: row.id,
      user_id: row.user_id,
      badge_id: row.badge_id,
      unlocked_at: row.unlocked_at,
      tier: row.tier,
      progress_percentage: row.progress_percentage || 100,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    };
  }

  private async getActiveBadgeDefinitions(): Promise<Badge[]> {
    const result = await this.db.query(`
      SELECT * FROM achievement_definitions WHERE is_active = 1 ORDER BY points_awarded ASC
    `);

    return (result.results || []).map((row: any) => ({
      id: row.id,
      achievement_key: row.achievement_key,
      category: row.category,
      title: row.title_en, // TODO: Use user's preferred language
      description: row.description_en,
      criteria: JSON.parse(row.criteria),
      points_awarded: row.points_awarded,
      rarity: row.rarity,
      icon_emoji: row.icon_emoji || '🏅',
      color_primary: row.color_primary || '#3B82F6',
      color_secondary: row.color_secondary || '#1E40AF',
      is_active: row.is_active
    }));
  }

  private async getBadgeDefinition(achievementKey: string): Promise<Badge | null> {
    const result = await this.db.query(`
      SELECT * FROM achievement_definitions WHERE achievement_key = ?
    `, [achievementKey]);

    const row = result.results?.[0];
    if (!row) return null;

    return {
      id: row.id,
      achievement_key: row.achievement_key,
      category: row.category,
      title: row.title_en,
      description: row.description_en,
      criteria: JSON.parse(row.criteria),
      points_awarded: row.points_awarded,
      rarity: row.rarity,
      icon_emoji: row.icon_emoji || '🏅',
      color_primary: row.color_primary || '#3B82F6',
      color_secondary: row.color_secondary || '#1E40AF',
      is_active: row.is_active
    };
  }

  private async generateBadgeImage(badge: Badge, userBadge: UserBadge): Promise<string> {
    // For now, return a placeholder URL
    // In a full implementation, this would generate an SVG or use a service like Bannerbear
    return `https://via.placeholder.com/400x300/${badge.color_primary.replace('#', '')}/${badge.color_secondary.replace('#', '')}.png?text=${encodeURIComponent(badge.title)}`;
  }
}

// Utility function to trigger badge checking after user actions
export async function triggerBadgeCheck(env: Env, userId: string): Promise<void> {
  try {
    const badgeService = new BadgeService(env);
    const newBadges = await badgeService.checkAndUnlockBadges(userId);
    
    if (newBadges.length > 0) {
      console.log(`User ${userId} unlocked ${newBadges.length} new badge(s):`, 
        newBadges.map(b => b.badge_id));
    }
  } catch (error) {
    console.error('Badge check trigger failed:', error);
    // Don't throw - badge checking should not break main functionality
  }
}