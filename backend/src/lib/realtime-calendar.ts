// Real-Time Calendar Synchronization Service
// Handles real-time calendar sync, conflict detection, and live updates

import { logger } from './logger';
import { DatabaseService } from './db';
import { createGoogleCalendarService } from './google-calendar';
import { sseService, SSE_EVENT_TYPES } from './realtime-sse';

export interface CalendarSyncStatus {
  userId: string;
  provider: 'google' | 'outlook' | 'apple';
  status: 'idle' | 'syncing' | 'error' | 'conflict';
  lastSyncAt?: number;
  nextSyncAt?: number;
  conflictsCount: number;
  errorMessage?: string;
}

export interface CalendarConflict {
  id: string;
  userId: string;
  localEvent: {
    id: string;
    title: string;
    startTime: number;
    endTime: number;
    lastModified: number;
  };
  remoteEvent: {
    id: string;
    title: string;
    startTime: number;
    endTime: number;
    lastModified: number;
  };
  conflictType: 'time_overlap' | 'title_mismatch' | 'deletion_conflict';
  resolution: 'pending' | 'local_wins' | 'remote_wins' | 'manual';
  createdAt: number;
}

export interface RecurringEventRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: number;
  count?: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
}

export class RealtimeCalendarService {
  private db: DatabaseService;
  private syncStatuses: Map<string, CalendarSyncStatus> = new Map();
  private activeSyncs: Set<string> = new Set();

  constructor(db: DatabaseService) {
    this.db = db;
  }

  /**
   * Start real-time calendar synchronization
   */
  async startRealtimeSync(userId: string, provider: 'google' | 'outlook' | 'apple'): Promise<void> {
    const syncKey = `${userId}_${provider}`;
    
    if (this.activeSyncs.has(syncKey)) {
      logger.warn('Sync already active', { userId, provider });
      return;
    }

    this.activeSyncs.add(syncKey);
    
    // Update sync status
    this.syncStatuses.set(syncKey, {
      userId,
      provider,
      status: 'syncing',
      conflictsCount: 0
    });

    // Notify client
    sseService.sendToUser(userId, {
      type: SSE_EVENT_TYPES.CALENDAR_SYNC_STARTED,
      data: { provider, timestamp: Date.now() }
    });

    try {
      await this.performSync(userId, provider);
      
      // Update status to idle
      const status = this.syncStatuses.get(syncKey);
      if (status) {
        status.status = 'idle';
        status.lastSyncAt = Date.now();
        status.nextSyncAt = Date.now() + (15 * 60 * 1000); // Next sync in 15 minutes
      }

      // Notify client
      sseService.sendToUser(userId, {
        type: SSE_EVENT_TYPES.CALENDAR_SYNC_COMPLETED,
        data: { 
          provider, 
          timestamp: Date.now(),
          conflictsCount: status?.conflictsCount || 0
        }
      });

    } catch (error) {
      // Update status to error
      const status = this.syncStatuses.get(syncKey);
      if (status) {
        status.status = 'error';
        status.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      }

      // Notify client
      sseService.sendToUser(userId, {
        type: SSE_EVENT_TYPES.ERROR,
        data: { 
          provider, 
          error: error instanceof Error ? error.message : 'Sync failed',
          timestamp: Date.now()
        }
      });

      logger.error('Calendar sync failed', {
        userId,
        provider,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      this.activeSyncs.delete(syncKey);
    }
  }

  /**
   * Perform actual calendar synchronization
   */
  private async performSync(userId: string, provider: 'google' | 'outlook' | 'apple'): Promise<void> {
    // Get user's calendar connections
    const connections = await this.db.query(`
      SELECT * FROM calendar_connections 
      WHERE user_id = ? AND provider = ? AND is_active = true
    `, [userId, provider]);

    if (connections.results.length === 0) {
      throw new Error(`No active ${provider} calendar connection found`);
    }

    for (const connection of connections.results as any[]) {
      await this.syncProviderCalendar(userId, connection);
    }
  }

  /**
   * Sync specific provider calendar
   */
  private async syncProviderCalendar(userId: string, connection: any): Promise<void> {
    try {
      let externalEvents: any[] = [];

      // Get events from external provider
      if (connection.provider === 'google') {
        const googleService = createGoogleCalendarService({} as any);
        const eventsResponse = await googleService.getEvents(
          connection.access_token,
          connection.provider_id,
          {
            timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
            timeMax: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // Next 90 days
            singleEvents: true,
            orderBy: 'startTime'
          }
        );
        externalEvents = eventsResponse.items;
      }

      // Get local events
      const localEvents = await this.db.query(`
        SELECT * FROM calendar_events 
        WHERE user_id = ? AND external_provider = ? AND external_calendar_id = ?
      `, [userId, connection.provider, connection.provider_id]);

      // Detect conflicts and sync
      await this.detectAndResolveConflicts(userId, localEvents.results as any[], externalEvents);
      
      // Update local events with external changes
      await this.updateLocalEvents(userId, connection, externalEvents);
      
      // Push local changes to external provider
      await this.pushLocalChanges(userId, connection, localEvents.results as any[]);

    } catch (error) {
      logger.error('Provider calendar sync failed', {
        userId,
        provider: connection.provider,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Detect and resolve calendar conflicts
   */
  private async detectAndResolveConflicts(
    userId: string, 
    localEvents: any[], 
    externalEvents: any[]
  ): Promise<void> {
    const conflicts: CalendarConflict[] = [];

    // Create maps for easier lookup
    const localMap = new Map(localEvents.map(e => [e.external_event_id, e]));
    const externalMap = new Map(externalEvents.map(e => [e.id, e]));

    // Check for conflicts
    for (const localEvent of localEvents) {
      if (!localEvent.external_event_id) continue;

      const externalEvent = externalMap.get(localEvent.external_event_id);
      if (!externalEvent) continue;

      // Check for time conflicts
      if (this.hasTimeConflict(localEvent, externalEvent)) {
        conflicts.push({
          id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          localEvent: {
            id: localEvent.id,
            title: localEvent.title,
            startTime: localEvent.start_time,
            endTime: localEvent.end_time,
            lastModified: localEvent.updated_at
          },
          remoteEvent: {
            id: externalEvent.id,
            title: externalEvent.summary,
            startTime: new Date(externalEvent.start.dateTime || externalEvent.start.date).getTime(),
            endTime: new Date(externalEvent.end.dateTime || externalEvent.end.date).getTime(),
            lastModified: new Date(externalEvent.updated).getTime()
          },
          conflictType: 'time_overlap',
          resolution: 'pending',
          createdAt: Date.now()
        });
      }

      // Check for title conflicts
      if (localEvent.title !== externalEvent.summary) {
        conflicts.push({
          id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          localEvent: {
            id: localEvent.id,
            title: localEvent.title,
            startTime: localEvent.start_time,
            endTime: localEvent.end_time,
            lastModified: localEvent.updated_at
          },
          remoteEvent: {
            id: externalEvent.id,
            title: externalEvent.summary,
            startTime: new Date(externalEvent.start.dateTime || externalEvent.start.date).getTime(),
            endTime: new Date(externalEvent.end.dateTime || externalEvent.end.date).getTime(),
            lastModified: new Date(externalEvent.updated).getTime()
          },
          conflictType: 'title_mismatch',
          resolution: 'pending',
          createdAt: Date.now()
        });
      }
    }

    // Store conflicts in database
    for (const conflict of conflicts) {
      await this.db.execute(`
        INSERT INTO calendar_conflicts (
          id, user_id, local_event_id, remote_event_id, conflict_type, 
          resolution, local_event_data, remote_event_data, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        conflict.id,
        conflict.userId,
        conflict.localEvent.id,
        conflict.remoteEvent.id,
        conflict.conflictType,
        conflict.resolution,
        JSON.stringify(conflict.localEvent),
        JSON.stringify(conflict.remoteEvent),
        conflict.createdAt
      ]);
    }

    // Update sync status with conflict count
    const syncKey = `${userId}_google`; // Assuming Google for now
    const status = this.syncStatuses.get(syncKey);
    if (status) {
      status.conflictsCount = conflicts.length;
      if (conflicts.length > 0) {
        status.status = 'conflict';
      }
    }

    // Notify client about conflicts
    if (conflicts.length > 0) {
      sseService.sendToUser(userId, {
        type: SSE_EVENT_TYPES.CALENDAR_CONFLICT_DETECTED,
        data: { 
          conflictsCount: conflicts.length,
          conflicts: conflicts.map(c => ({
            id: c.id,
            type: c.conflictType,
            localTitle: c.localEvent.title,
            remoteTitle: c.remoteEvent.title
          }))
        }
      });
    }
  }

  /**
   * Check if two events have time conflicts
   */
  private hasTimeConflict(localEvent: any, externalEvent: any): boolean {
    const localStart = localEvent.start_time;
    const localEnd = localEvent.end_time;
    const externalStart = new Date(externalEvent.start.dateTime || externalEvent.start.date).getTime();
    const externalEnd = new Date(externalEvent.end.dateTime || externalEvent.end.date).getTime();

    // Check for overlap
    return (localStart < externalEnd && localEnd > externalStart);
  }

  /**
   * Update local events with external changes
   */
  private async updateLocalEvents(
    userId: string, 
    connection: any, 
    externalEvents: any[]
  ): Promise<void> {
    for (const externalEvent of externalEvents) {
      // Check if event exists locally
      const existingEvent = await this.db.query(`
        SELECT * FROM calendar_events 
        WHERE user_id = ? AND external_event_id = ? AND external_provider = ?
      `, [userId, externalEvent.id, connection.provider]);

      const eventData = {
        title: externalEvent.summary || 'Untitled Event',
        description: externalEvent.description || '',
        start_time: new Date(externalEvent.start.dateTime || externalEvent.start.date).getTime(),
        end_time: new Date(externalEvent.end.dateTime || externalEvent.end.date).getTime(),
        location: externalEvent.location || '',
        external_event_id: externalEvent.id,
        external_provider: connection.provider,
        external_calendar_id: connection.provider_id,
        last_synced_at: Date.now(),
        updated_at: Date.now()
      };

      if (existingEvent.results.length > 0) {
        // Update existing event
        await this.db.execute(`
          UPDATE calendar_events 
          SET title = ?, description = ?, start_time = ?, end_time = ?, 
              location = ?, last_synced_at = ?, updated_at = ?
          WHERE id = ?
        `, [
          eventData.title,
          eventData.description,
          eventData.start_time,
          eventData.end_time,
          eventData.location,
          eventData.last_synced_at,
          eventData.updated_at,
          (existingEvent.results[0] as any).id
        ]);

        // Notify client
        sseService.sendToUser(userId, {
          type: SSE_EVENT_TYPES.CALENDAR_EVENT_UPDATED,
          data: { eventId: (existingEvent.results[0] as any).id, ...eventData }
        });
      } else {
        // Create new event
        const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await this.db.execute(`
          INSERT INTO calendar_events (
            id, user_id, title, description, start_time, end_time, location,
            external_event_id, external_provider, external_calendar_id,
            last_synced_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          eventId,
          userId,
          eventData.title,
          eventData.description,
          eventData.start_time,
          eventData.end_time,
          eventData.location,
          eventData.external_event_id,
          eventData.external_provider,
          eventData.external_calendar_id,
          eventData.last_synced_at,
          Date.now(),
          eventData.updated_at
        ]);

        // Notify client
        sseService.sendToUser(userId, {
          type: SSE_EVENT_TYPES.CALENDAR_EVENT_CREATED,
          data: { eventId, ...eventData }
        });
      }
    }
  }

  /**
   * Push local changes to external provider
   */
  private async pushLocalChanges(
    userId: string, 
    connection: any, 
    localEvents: any[]
  ): Promise<void> {
    // This would implement pushing local changes to external calendar
    // For now, just log the action
    logger.info('Pushing local changes to external provider', {
      userId,
      provider: connection.provider,
      eventsCount: localEvents.length
    });
  }

  /**
   * Get sync status for user
   */
  getSyncStatus(userId: string): CalendarSyncStatus[] {
    const statuses: CalendarSyncStatus[] = [];
    
    for (const [key, status] of this.syncStatuses) {
      if (status.userId === userId) {
        statuses.push(status);
      }
    }
    
    return statuses;
  }

  /**
   * Resolve calendar conflict
   */
  async resolveConflict(
    conflictId: string, 
    resolution: 'local_wins' | 'remote_wins' | 'manual'
  ): Promise<void> {
    const conflict = await this.db.query(`
      SELECT * FROM calendar_conflicts WHERE id = ?
    `, [conflictId]);

    if (conflict.results.length === 0) {
      throw new Error('Conflict not found');
    }

    const conflictData = conflict.results[0] as any;
    
    // Update conflict resolution
    await this.db.execute(`
      UPDATE calendar_conflicts 
      SET resolution = ?, resolved_at = ?
      WHERE id = ?
    `, [resolution, Date.now(), conflictId]);

    // Apply resolution
    if (resolution === 'local_wins') {
      // Keep local version, update external
      logger.info('Resolving conflict: local wins', { conflictId });
    } else if (resolution === 'remote_wins') {
      // Update local with remote version
      logger.info('Resolving conflict: remote wins', { conflictId });
    }

    // Notify client
    sseService.sendToUser(conflictData.user_id, {
      type: 'calendar.conflict.resolved',
      data: { conflictId, resolution }
    });
  }

  /**
   * Create recurring event
   */
  async createRecurringEvent(
    userId: string,
    eventData: {
      title: string;
      description?: string;
      startTime: number;
      endTime: number;
      location?: string;
      recurrence: RecurringEventRule;
    }
  ): Promise<string> {
    const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create master event
    await this.db.execute(`
      INSERT INTO calendar_events (
        id, user_id, title, description, start_time, end_time, location,
        is_recurring, recurrence_rule, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      eventId,
      userId,
      eventData.title,
      eventData.description || '',
      eventData.startTime,
      eventData.endTime,
      eventData.location || '',
      true,
      JSON.stringify(eventData.recurrence),
      Date.now(),
      Date.now()
    ]);

    // Generate recurring instances
    await this.generateRecurringInstances(eventId, eventData);

    // Notify client
    sseService.sendToUser(userId, {
      type: SSE_EVENT_TYPES.CALENDAR_EVENT_CREATED,
      data: { eventId, ...eventData, isRecurring: true }
    });

    return eventId;
  }

  /**
   * Generate recurring event instances
   */
  private async generateRecurringInstances(
    masterEventId: string,
    eventData: any
  ): Promise<void> {
    const { recurrence } = eventData;
    const instances: any[] = [];
    
    let currentTime = eventData.startTime;
    const endTime = eventData.endTime;
    const duration = endTime - eventData.startTime;
    
    let count = 0;
    const maxInstances = recurrence.count || 100; // Default max 100 instances
    
    while (count < maxInstances) {
      if (recurrence.endDate && currentTime > recurrence.endDate) break;
      
      instances.push({
        id: `${masterEventId}_${count}`,
        master_event_id: masterEventId,
        start_time: currentTime,
        end_time: currentTime + duration,
        created_at: Date.now()
      });
      
      // Calculate next occurrence
      currentTime = this.calculateNextOccurrence(currentTime, recurrence);
      count++;
    }
    
    // Insert instances
    for (const instance of instances) {
      await this.db.execute(`
        INSERT INTO calendar_event_instances (
          id, master_event_id, start_time, end_time, created_at
        ) VALUES (?, ?, ?, ?, ?)
      `, [
        instance.id,
        instance.master_event_id,
        instance.start_time,
        instance.end_time,
        instance.created_at
      ]);
    }
  }

  /**
   * Calculate next occurrence based on recurrence rule
   */
  private calculateNextOccurrence(currentTime: number, recurrence: RecurringEventRule): number {
    const date = new Date(currentTime);
    
    switch (recurrence.frequency) {
      case 'daily':
        date.setDate(date.getDate() + recurrence.interval);
        break;
      case 'weekly':
        date.setDate(date.getDate() + (7 * recurrence.interval));
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + recurrence.interval);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + recurrence.interval);
        break;
    }
    
    return date.getTime();
  }
}
