// Real-Time Events Service for Polling-Based Updates
// Replaces SSE with database-backed event storage for Cloudflare Workers compatibility

import { DatabaseService } from './db';

export interface RealtimeEvent {
  id: string;
  userId: string;
  eventType: string;
  eventData: any;
  createdAt: number;
  expiresAt: number;
}

export class RealtimeEventsService {
  constructor(private db: DatabaseService) {}

  /**
   * Create a new real-time event
   */
  async createEvent(
    userId: string, 
    eventType: string, 
    eventData: any,
    ttlMinutes: number = 60
  ): Promise<string> {
    const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    const expiresAt = now + (ttlMinutes * 60 * 1000);

    await this.db.execute(`
      INSERT INTO realtime_events (id, user_id, event_type, event_data, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      eventId,
      userId,
      eventType,
      JSON.stringify(eventData),
      now,
      expiresAt
    ]);

    console.log('Real-time event created:', {
      eventId,
      userId,
      eventType,
      ttlMinutes
    });

    return eventId;
  }

  /**
   * Get events for a user since a specific time
   */
  async getEventsForUser(
    userId: string, 
    since: number, 
    limit: number = 50
  ): Promise<RealtimeEvent[]> {
    const result = await this.db.query(`
      SELECT * FROM realtime_events 
      WHERE user_id = ? 
      AND created_at > ?
      ORDER BY created_at ASC
      LIMIT ?
    `, [userId, since, limit]);

    return (result.results || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      eventType: row.event_type,
      eventData: JSON.parse(row.event_data),
      createdAt: row.created_at,
      expiresAt: row.expires_at
    }));
  }

  /**
   * Get events for a user since last event ID
   */
  async getEventsSinceLastId(
    userId: string, 
    lastEventId: string, 
    limit: number = 50
  ): Promise<RealtimeEvent[]> {
    // First get the timestamp of the last event
    const lastEventResult = await this.db.query(`
      SELECT created_at FROM realtime_events WHERE id = ? AND user_id = ?
    `, [lastEventId, userId]);

    const lastEventTime = lastEventResult.results?.[0]?.created_at || Date.now() - 60000;
    
    return this.getEventsForUser(userId, lastEventTime, limit);
  }

  /**
   * Clean up expired events
   */
  async cleanupExpiredEvents(): Promise<number> {
    const result = await this.db.execute(`
      DELETE FROM realtime_events 
      WHERE expires_at < ?
    `, [Date.now()]);

    console.log('Cleaned up expired real-time events:', result.changes);
    return result.changes || 0;
  }

  /**
   * Clean up old events (older than specified hours)
   */
  async cleanupOldEvents(hoursOld: number = 24): Promise<number> {
    const cutoffTime = Date.now() - (hoursOld * 60 * 60 * 1000);
    
    const result = await this.db.execute(`
      DELETE FROM realtime_events 
      WHERE created_at < ?
    `, [cutoffTime]);

    console.log('Cleaned up old real-time events:', result.changes);
    return result.changes || 0;
  }

  /**
   * Get event statistics
   */
  async getEventStats(): Promise<{
    totalEvents: number;
    activeEvents: number;
    expiredEvents: number;
    eventsByType: Record<string, number>;
  }> {
    const totalResult = await this.db.query('SELECT COUNT(*) as count FROM realtime_events');
    const activeResult = await this.db.query('SELECT COUNT(*) as count FROM realtime_events WHERE expires_at > ?', [Date.now()]);
    const expiredResult = await this.db.query('SELECT COUNT(*) as count FROM realtime_events WHERE expires_at <= ?', [Date.now()]);
    const typeResult = await this.db.query(`
      SELECT event_type, COUNT(*) as count 
      FROM realtime_events 
      WHERE expires_at > ?
      GROUP BY event_type
    `, [Date.now()]);

    const eventsByType: Record<string, number> = {};
    (typeResult.results || []).forEach((row: any) => {
      eventsByType[row.event_type] = row.count;
    });

    return {
      totalEvents: totalResult.results?.[0]?.count || 0,
      activeEvents: activeResult.results?.[0]?.count || 0,
      expiredEvents: expiredResult.results?.[0]?.count || 0,
      eventsByType
    };
  }
}

// Event Types for real-time updates
export const REALTIME_EVENT_TYPES = {
  // Calendar Events
  CALENDAR_EVENT_CREATED: 'calendar.event.created',
  CALENDAR_EVENT_UPDATED: 'calendar.event.updated',
  CALENDAR_EVENT_DELETED: 'calendar.event.deleted',
  CALENDAR_SYNC_STARTED: 'calendar.sync.started',
  CALENDAR_SYNC_COMPLETED: 'calendar.sync.completed',
  CALENDAR_CONFLICT_DETECTED: 'calendar.conflict.detected',

  // Task Events
  TASK_CREATED: 'task.created',
  TASK_UPDATED: 'task.updated',
  TASK_COMPLETED: 'task.completed',
  TASK_DELETED: 'task.deleted',
  TASK_REMINDER: 'task.reminder',

  // Focus Session Events
  FOCUS_SESSION_STARTED: 'focus.session.started',
  FOCUS_SESSION_COMPLETED: 'focus.session.completed',
  FOCUS_SESSION_PAUSED: 'focus.session.paused',

  // Health Events
  HEALTH_DATA_SYNCED: 'health.data.synced',
  HEALTH_GOAL_ACHIEVED: 'health.goal.achieved',
  HEALTH_INSIGHT_GENERATED: 'health.insight.generated',

  // Badge Events
  BADGE_UNLOCKED: 'badge.unlocked',
  ACHIEVEMENT_EARNED: 'achievement.earned',

  // Notification Events
  NOTIFICATION_RECEIVED: 'notification.received',
  NOTIFICATION_READ: 'notification.read',

  // System Events
  SYSTEM_MAINTENANCE: 'system.maintenance',
  SYSTEM_ERROR: 'system.error'
} as const;

export type RealtimeEventType = typeof REALTIME_EVENT_TYPES[keyof typeof REALTIME_EVENT_TYPES];
