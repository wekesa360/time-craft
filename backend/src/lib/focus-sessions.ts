// Focus Sessions Service - Pomodoro Timer and Productivity Tracking
// Comprehensive service for managing focus sessions, breaks, and productivity analytics

import { DatabaseService } from './db';
import { generateId } from '../utils/id';
import { logger } from './logger';
import { PushNotificationService } from './notifications';

export interface FocusSessionTemplate {
  id: string;
  template_key: string;
  name_en: string;
  name_de: string;
  description_en?: string;
  description_de?: string;
  session_type: 'pomodoro' | 'deep_work' | 'custom' | 'sprint' | 'flow';
  default_duration: number;
  break_duration: number;
  long_break_duration: number;
  cycles_before_long_break: number;
  suggested_tasks: string[];
  productivity_tips_en: string[];
  productivity_tips_de: string[];
  environment_suggestions: Record<string, any>;
  is_active: boolean;
  created_at: number;
}

export interface FocusSession {
  id: string;
  user_id: string;
  session_type: 'pomodoro' | 'deep_work' | 'custom' | 'sprint' | 'flow';
  session_name?: string;
  planned_duration: number;
  actual_duration?: number;
  task_id?: string;
  planned_task_count: number;
  completed_task_count: number;
  break_duration: number;
  interruptions: number;
  distraction_count: number;
  distraction_details?: Record<string, any>;
  environment_data?: Record<string, any>;
  mood_before?: number;
  mood_after?: number;
  energy_before?: number;
  energy_after?: number;
  focus_quality?: number;
  session_tags?: string[];
  productivity_rating?: number;
  notes?: string;
  is_successful: boolean;
  cancellation_reason?: string;
  started_at: number;
  completed_at?: number;
  created_at: number;
  updated_at: number;
}

export interface BreakReminder {
  id: string;
  user_id: string;
  reminder_type: 'pomodoro_break' | 'long_break' | 'eye_rest' | 'movement' | 'hydration' | 'posture';
  trigger_condition: Record<string, any>;
  reminder_text_en: string;
  reminder_text_de: string;
  is_enabled: boolean;
  frequency_minutes?: number;
  last_triggered?: number;
  trigger_count: number;
  user_response_rate: number;
  created_at: number;
  updated_at: number;
}

export interface FocusAnalytics {
  id: string;
  user_id: string;
  session_id?: string;
  metric_type: 'productivity_score' | 'focus_duration' | 'distraction_rate' | 'completion_rate' | 'mood_improvement' | 'energy_change';
  metric_value: number;
  metric_unit?: string;
  measurement_date: number;
  session_type?: string;
  additional_data?: Record<string, any>;
  created_at: number;
}

export interface ProductivityPattern {
  id: string;
  user_id: string;
  pattern_type: 'optimal_duration' | 'best_time_of_day' | 'productive_environment' | 'effective_breaks' | 'task_types';
  pattern_data: Record<string, any>;
  confidence_score: number;
  sample_size: number;
  effectiveness_score?: number;
  last_validated?: number;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

export interface FocusStreak {
  id: string;
  user_id: string;
  streak_type: 'daily_sessions' | 'weekly_hours' | 'monthly_consistency' | 'session_completion';
  current_streak: number;
  longest_streak: number;
  last_session_date?: number;
  streak_start_date?: number;
  streak_data?: Record<string, any>;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

export interface FocusDistraction {
  id: string;
  session_id: string;
  user_id: string;
  distraction_type: 'notification' | 'phone_call' | 'interruption' | 'internal_thought' | 'external_noise' | 'website' | 'social_media' | 'other';
  distraction_source?: string;
  duration_seconds?: number;
  impact_level: number; // 1-5
  occurred_at: number;
  user_response?: 'ignored' | 'addressed' | 'postponed' | 'gave_in';
  notes?: string;
  created_at: number;
}

export interface FocusEnvironment {
  id: string;
  user_id: string;
  environment_name: string;
  location_type: 'home' | 'office' | 'cafe' | 'library' | 'coworking' | 'outdoor' | 'other';
  noise_level: number; // 1-5
  lighting_quality: number; // 1-5
  temperature_comfort: number; // 1-5
  ergonomics_rating: number; // 1-5
  distraction_level: number; // 1-5
  productivity_rating?: number;
  session_count: number;
  total_duration: number;
  is_favorite: boolean;
  created_at: number;
  updated_at: number;
}

export class FocusSessionService {
  constructor(
    private db: DatabaseService,
    private notificationService: PushNotificationService
  ) {}

  // Template Management
  async getTemplates(language: 'en' | 'de' = 'en'): Promise<FocusSessionTemplate[]> {
    try {
      const result = await this.db.query(`
        SELECT * FROM focus_templates 
        WHERE is_active = 1 
        ORDER BY session_type, default_duration
      `);

      return (result.results || []).map((template: any) => ({
        ...template,
        suggested_tasks: JSON.parse(template.suggested_tasks || '[]'),
        productivity_tips_en: JSON.parse(template.productivity_tips_en || '[]'),
        productivity_tips_de: JSON.parse(template.productivity_tips_de || '[]'),
        environment_suggestions: JSON.parse(template.environment_suggestions || '{}')
      }));
    } catch (error) {
      logger.error('Failed to get focus templates:', error);
      throw new Error('Failed to retrieve focus templates');
    }
  }

  async getTemplate(templateKey: string): Promise<FocusSessionTemplate | null> {
    try {
      const result = await this.db.query(`
        SELECT * FROM focus_templates 
        WHERE template_key = ? AND is_active = 1
      `, [templateKey]);

      const template = (result.results || [])[0];
      if (!template) return null;

      return {
        ...template,
        suggested_tasks: JSON.parse(template.suggested_tasks || '[]'),
        productivity_tips_en: JSON.parse(template.productivity_tips_en || '[]'),
        productivity_tips_de: JSON.parse(template.productivity_tips_de || '[]'),
        environment_suggestions: JSON.parse(template.environment_suggestions || '{}')
      };
    } catch (error) {
      logger.error('Failed to get focus template:', error);
      throw new Error('Failed to retrieve focus template');
    }
  }

  // Session Management
  async startSession(userId: string, sessionData: {
    session_type: 'pomodoro' | 'deep_work' | 'custom' | 'sprint' | 'flow';
    session_name?: string;
    planned_duration: number;
    task_id?: string;
    planned_task_count?: number;
    environment_data?: Record<string, any>;
    mood_before?: number;
    energy_before?: number;
    session_tags?: string[];
  }): Promise<FocusSession> {
    try {
      const sessionId = generateId('session');
      const now = Date.now();

      const session: FocusSession = {
        id: sessionId,
        user_id: userId,
        session_type: sessionData.session_type,
        session_name: sessionData.session_name,
        planned_duration: sessionData.planned_duration,
        task_id: sessionData.task_id,
        planned_task_count: sessionData.planned_task_count || 1,
        completed_task_count: 0,
        break_duration: 0,
        interruptions: 0,
        distraction_count: 0,
        environment_data: sessionData.environment_data,
        mood_before: sessionData.mood_before,
        energy_before: sessionData.energy_before,
        session_tags: sessionData.session_tags,
        is_successful: true,
        started_at: now,
        created_at: now,
        updated_at: now
      };

      await this.db.execute(`
        INSERT INTO focus_sessions (
          id, user_id, session_type, session_name, planned_duration, task_id,
          planned_task_count, completed_task_count, break_duration, interruptions,
          distraction_count, environment_data, mood_before, energy_before,
          session_tags, is_successful, started_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        sessionId, userId, sessionData.session_type, sessionData.session_name,
        sessionData.planned_duration, sessionData.task_id,
        sessionData.planned_task_count || 1, 0, 0, 0, 0,
        JSON.stringify(sessionData.environment_data || {}),
        sessionData.mood_before, sessionData.energy_before,
        JSON.stringify(sessionData.session_tags || []),
        1, now, now, now
      ]);

      // Schedule break reminder if it's a pomodoro session
      if (sessionData.session_type === 'pomodoro') {
        await this.scheduleBreakReminder(userId, sessionId, sessionData.planned_duration);
      }

      logger.info(`Focus session started: ${sessionId} for user ${userId}`);
      return session;
    } catch (error) {
      logger.error('Failed to start focus session:', error);
      throw new Error('Failed to start focus session');
    }
  }

  async completeSession(userId: string, sessionId: string, completionData: {
    actual_duration: number;
    completed_task_count?: number;
    break_duration?: number;
    mood_after?: number;
    energy_after?: number;
    focus_quality?: number;
    productivity_rating?: number;
    notes?: string;
    is_successful?: boolean;
  }): Promise<FocusSession> {
    try {
      const now = Date.now();

      await this.db.execute(`
        UPDATE focus_sessions SET
          actual_duration = ?,
          completed_task_count = ?,
          break_duration = ?,
          mood_after = ?,
          energy_after = ?,
          focus_quality = ?,
          productivity_rating = ?,
          notes = ?,
          is_successful = ?,
          completed_at = ?,
          updated_at = ?
        WHERE id = ? AND user_id = ?
      `, [
        completionData.actual_duration,
        completionData.completed_task_count || 0,
        completionData.break_duration || 0,
        completionData.mood_after,
        completionData.energy_after,
        completionData.focus_quality,
        completionData.productivity_rating,
        completionData.notes,
        completionData.is_successful !== false ? 1 : 0,
        now,
        now,
        sessionId,
        userId
      ]);

      // Update streaks and analytics (handled by database triggers)
      
      const session = await this.getSession(userId, sessionId);
      if (!session) {
        throw new Error('Session not found after completion');
      }

      logger.info(`Focus session completed: ${sessionId} for user ${userId}`);
      return session;
    } catch (error) {
      logger.error('Failed to complete focus session:', error);
      throw new Error('Failed to complete focus session');
    }
  }

  async cancelSession(userId: string, sessionId: string, reason: string): Promise<void> {
    try {
      const now = Date.now();

      await this.db.execute(`
        UPDATE focus_sessions SET
          is_successful = 0,
          cancellation_reason = ?,
          completed_at = ?,
          updated_at = ?
        WHERE id = ? AND user_id = ?
      `, [reason, now, now, sessionId, userId]);

      logger.info(`Focus session cancelled: ${sessionId} for user ${userId}, reason: ${reason}`);
    } catch (error) {
      logger.error('Failed to cancel focus session:', error);
      throw new Error('Failed to cancel focus session');
    }
  }

  async getSession(userId: string, sessionId: string): Promise<FocusSession | null> {
    try {
      const result = await this.db.query(`
        SELECT * FROM focus_sessions 
        WHERE id = ? AND user_id = ?
      `, [sessionId, userId]);

      const session = (result.results || [])[0];
      if (!session) return null;

      return {
        ...session,
        environment_data: JSON.parse(session.environment_data || '{}'),
        session_tags: JSON.parse(session.session_tags || '[]'),
        distraction_details: JSON.parse(session.distraction_details || '{}'),
        is_successful: Boolean(session.is_successful)
      };
    } catch (error) {
      logger.error('Failed to get focus session:', error);
      throw new Error('Failed to retrieve focus session');
    }
  }

  async getUserSessions(userId: string, options: {
    limit?: number;
    offset?: number;
    session_type?: string;
    start_date?: number;
    end_date?: number;
  } = {}): Promise<{ sessions: FocusSession[]; total: number }> {
    try {
      const { limit = 50, offset = 0, session_type, start_date, end_date } = options;
      
      let whereClause = 'WHERE user_id = ?';
      const params: any[] = [userId];

      if (session_type) {
        whereClause += ' AND session_type = ?';
        params.push(session_type);
      }

      if (start_date) {
        whereClause += ' AND started_at >= ?';
        params.push(start_date);
      }

      if (end_date) {
        whereClause += ' AND started_at <= ?';
        params.push(end_date);
      }

      const sessions = await this.db.query(`
        SELECT * FROM focus_sessions 
        ${whereClause}
        ORDER BY started_at DESC 
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]);

      const totalResult = await this.db.query(`
        SELECT COUNT(*) as count FROM focus_sessions ${whereClause}
      `, params);

      return {
        sessions: (sessions.results || []).map(session => ({
          ...session,
          environment_data: JSON.parse(session.environment_data || '{}'),
          session_tags: JSON.parse(session.session_tags || '[]'),
          distraction_details: JSON.parse(session.distraction_details || '{}'),
          is_successful: Boolean(session.is_successful)
        })),
        total: (totalResult.results || [])[0]?.count || 0
      };
    } catch (error) {
      logger.error('Failed to get user sessions:', error);
      throw new Error('Failed to retrieve user sessions');
    }
  }

  // Distraction Tracking
  async recordDistraction(userId: string, sessionId: string, distraction: {
    distraction_type: 'notification' | 'phone_call' | 'interruption' | 'internal_thought' | 'external_noise' | 'website' | 'social_media' | 'other';
    distraction_source?: string;
    duration_seconds?: number;
    impact_level: number;
    user_response?: 'ignored' | 'addressed' | 'postponed' | 'gave_in';
    notes?: string;
  }): Promise<FocusDistraction> {
    try {
      const distractionId = generateId('distraction');
      const now = Date.now();

      const distractionRecord: FocusDistraction = {
        id: distractionId,
        session_id: sessionId,
        user_id: userId,
        distraction_type: distraction.distraction_type,
        distraction_source: distraction.distraction_source,
        duration_seconds: distraction.duration_seconds,
        impact_level: distraction.impact_level,
        occurred_at: now,
        user_response: distraction.user_response,
        notes: distraction.notes,
        created_at: now
      };

      await this.db.execute(`
        INSERT INTO focus_distractions (
          id, session_id, user_id, distraction_type, distraction_source,
          duration_seconds, impact_level, occurred_at, user_response, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        distractionId, sessionId, userId, distraction.distraction_type,
        distraction.distraction_source, distraction.duration_seconds,
        distraction.impact_level, now, distraction.user_response,
        distraction.notes, now
      ]);

      // Update session distraction count
      await this.db.execute(`
        UPDATE focus_sessions SET 
          distraction_count = distraction_count + 1,
          updated_at = ?
        WHERE id = ? AND user_id = ?
      `, [now, sessionId, userId]);

      logger.info(`Distraction recorded: ${distractionId} for session ${sessionId}`);
      return distractionRecord;
    } catch (error) {
      logger.error('Failed to record distraction:', error);
      throw new Error('Failed to record distraction');
    }
  }

  // Break Reminders
  async getUserBreakReminders(userId: string): Promise<BreakReminder[]> {
    try {
      const results = await this.db.query(`
        SELECT * FROM break_reminders 
        WHERE user_id = ? AND is_enabled = 1
        ORDER BY reminder_type
      `, [userId]);

      return (results.results || []).map(reminder => ({
        ...reminder,
        trigger_condition: JSON.parse(reminder.trigger_condition || '{}'),
        is_enabled: Boolean(reminder.is_enabled)
      }));
    } catch (error) {
      logger.error('Failed to get break reminders:', error);
      throw new Error('Failed to retrieve break reminders');
    }
  }

  async updateBreakReminder(userId: string, reminderId: string, updates: {
    is_enabled?: boolean;
    frequency_minutes?: number;
    reminder_text_en?: string;
    reminder_text_de?: string;
  }): Promise<void> {
    try {
      const now = Date.now();
      
      await this.db.execute(`
        UPDATE break_reminders SET
          is_enabled = COALESCE(?, is_enabled),
          frequency_minutes = COALESCE(?, frequency_minutes),
          reminder_text_en = COALESCE(?, reminder_text_en),
          reminder_text_de = COALESCE(?, reminder_text_de),
          updated_at = ?
        WHERE id = ? AND user_id = ?
      `, [
        updates.is_enabled !== undefined ? (updates.is_enabled ? 1 : 0) : null,
        updates.frequency_minutes,
        updates.reminder_text_en,
        updates.reminder_text_de,
        now,
        reminderId,
        userId
      ]);

      logger.info(`Break reminder updated: ${reminderId} for user ${userId}`);
    } catch (error) {
      logger.error('Failed to update break reminder:', error);
      throw new Error('Failed to update break reminder');
    }
  }

  // Analytics and Insights
  async getFocusDashboard(userId: string): Promise<{
    total_sessions: number;
    successful_sessions: number;
    total_focus_minutes: number;
    avg_productivity_rating: number;
    avg_session_duration: number;
    total_interruptions: number;
    avg_interruptions_per_session: number;
    last_session_at?: number;
    today_sessions: number;
    today_minutes: number;
    current_streaks: FocusStreak[];
    productivity_trends: any[];
  }> {
    try {
      const dashboardResult = await this.db.query(`
        SELECT * FROM focus_dashboard_view WHERE user_id = ?
      `, [userId]);

      const streaks = await this.db.query(`
        SELECT * FROM focus_streaks 
        WHERE user_id = ? AND is_active = 1
        ORDER BY current_streak DESC
      `, [userId]);

      const trends = await this.db.query(`
        SELECT 
          DATE(datetime(measurement_date/1000, 'unixepoch')) as date,
          metric_type,
          AVG(metric_value) as avg_value
        FROM focus_analytics 
        WHERE user_id = ? AND measurement_date > ?
        GROUP BY DATE(datetime(measurement_date/1000, 'unixepoch')), metric_type
        ORDER BY date DESC
        LIMIT 30
      `, [userId, Date.now() - (30 * 24 * 60 * 60 * 1000)]);

      const dashboard = (dashboardResult.results || [])[0] || {};
      
      return {
        total_sessions: dashboard.total_sessions || 0,
        successful_sessions: dashboard.successful_sessions || 0,
        total_focus_minutes: dashboard.total_focus_minutes || 0,
        avg_productivity_rating: dashboard.avg_productivity_rating || 0,
        avg_session_duration: dashboard.avg_session_duration || 0,
        total_interruptions: dashboard.total_interruptions || 0,
        avg_interruptions_per_session: dashboard.avg_interruptions_per_session || 0,
        last_session_at: dashboard.last_session_at,
        today_sessions: dashboard.today_sessions || 0,
        today_minutes: dashboard.today_minutes || 0,
        current_streaks: (streaks.results || []).map(streak => ({
          ...streak,
          streak_data: JSON.parse(streak.streak_data || '{}'),
          is_active: Boolean(streak.is_active)
        })),
        productivity_trends: trends.results || []
      };
    } catch (error) {
      logger.error('Failed to get focus dashboard:', error);
      throw new Error('Failed to retrieve focus dashboard');
    }
  }

  async getProductivityPatterns(userId: string): Promise<ProductivityPattern[]> {
    try {
      const results = await this.db.query(`
        SELECT * FROM productivity_patterns 
        WHERE user_id = ? AND is_active = 1
        ORDER BY confidence_score DESC, effectiveness_score DESC
      `, [userId]);

      return (results.results || []).map(pattern => ({
        ...pattern,
        pattern_data: JSON.parse(pattern.pattern_data || '{}'),
        is_active: Boolean(pattern.is_active)
      }));
    } catch (error) {
      logger.error('Failed to get productivity patterns:', error);
      throw new Error('Failed to retrieve productivity patterns');
    }
  }

  // Private helper methods
  private async scheduleBreakReminder(userId: string, sessionId: string, durationMinutes: number): Promise<void> {
    try {
      // This would integrate with the notification system
      // For now, we'll just log the scheduling
      logger.info(`Break reminder scheduled for session ${sessionId} in ${durationMinutes} minutes`);
      
      // In a real implementation, this would schedule a notification
      // await this.notificationService.scheduleNotification(userId, {
      //   type: 'pomodoro_break',
      //   scheduledFor: Date.now() + (durationMinutes * 60 * 1000),
      //   data: { sessionId }
      // });
    } catch (error) {
      logger.error('Failed to schedule break reminder:', error);
      // Don't throw here as it's not critical to session creation
    }
  }
}