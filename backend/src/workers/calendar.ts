// External Calendar Sync Worker for Time & Wellness Application
import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import type { Env } from '../lib/env';
import { DatabaseService, UserRepository } from '../lib/db';
import type { SupportedLanguage } from '../types/database';
import { MeetingScheduler, type MeetingRequest } from '../lib/meeting-scheduler';
import { queueNotification } from '../lib/notifications';
import { createGoogleCalendarService } from '../lib/google-calendar';

const calendar = new Hono<{ Bindings: Env }>();

// Calendar Provider Types
type CalendarProvider = 'google' | 'outlook' | 'apple' | 'caldav';

interface CalendarConnection {
  id: string;
  userId: string;
  provider: CalendarProvider;
  providerId: string; // External calendar/account ID
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: number;
  calendarName: string;
  isActive: boolean;
  lastSyncAt?: number;
  syncSettings: CalendarSyncSettings;
  createdAt: number;
  updatedAt: number;
}

interface CalendarSyncSettings {
  syncDirection: 'import' | 'export' | 'bidirectional';
  syncTasks: boolean;
  syncHealthReminders: boolean;
  syncMeetings: boolean;
  autoSync: boolean;
  syncFrequency: number; // minutes
  conflictResolution: 'local_wins' | 'remote_wins' | 'manual';
}

interface ExternalCalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: number;
  endTime: number;
  location?: string;
  attendees?: string[];
  isAllDay: boolean;
  recurrence?: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  source: CalendarProvider;
  externalId: string;
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

// Calendar API Integration Classes
class GoogleCalendarAPI {
  private accessToken: string;
  private baseUrl = 'https://www.googleapis.com/calendar/v3';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getCalendars(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/users/me/calendarList`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.status}`);
    }

    const data = await response.json();
    return data.items || [];
  }

  async getEvents(calendarId: string = 'primary', timeMin?: string, timeMax?: string): Promise<any[]> {
    const params = new URLSearchParams({
      singleEvents: 'true',
      orderBy: 'startTime'
    });

    if (timeMin) params.append('timeMin', timeMin);
    if (timeMax) params.append('timeMax', timeMax);

    const response = await fetch(`${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.status}`);
    }

    const data = await response.json();
    return data.items || [];
  }

  async createEvent(calendarId: string, event: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.status}`);
    }

    return response.json();
  }

  async updateEvent(calendarId: string, eventId: string, event: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.status}`);
    }

    return response.json();
  }

  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.status}`);
    }
  }
}

class OutlookCalendarAPI {
  private accessToken: string;
  private baseUrl = 'https://graph.microsoft.com/v1.0';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getCalendars(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/me/calendars`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Outlook Calendar API error: ${response.status}`);
    }

    const data = await response.json();
    return data.value || [];
  }

  async getEvents(calendarId?: string, startTime?: string, endTime?: string): Promise<any[]> {
    const calendar = calendarId || 'calendar';
    const params = new URLSearchParams();
    
    if (startTime && endTime) {
      params.append('startDateTime', startTime);
      params.append('endDateTime', endTime);
    }

    const response = await fetch(`${this.baseUrl}/me/${calendar}/events?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Outlook Calendar API error: ${response.status}`);
    }

    const data = await response.json();
    return data.value || [];
  }

  async createEvent(calendarId: string, event: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/me/calendars/${calendarId}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      throw new Error(`Outlook Calendar API error: ${response.status}`);
    }

    return response.json();
  }
}

// Calendar Sync Engine
class CalendarSyncEngine {
  private db: DatabaseService;
  private env: Env;

  constructor(env: Env) {
    this.env = env;
    this.db = new DatabaseService(env);
  }

  async syncUserCalendars(userId: string): Promise<{ imported: number; exported: number; errors: string[] }> {
    const connections = await this.getUserCalendarConnections(userId);
    const errors: string[] = [];
    let imported = 0;
    let exported = 0;

    for (const connection of connections) {
      if (!connection.isActive) continue;

      try {
        const api = this.getCalendarAPI(connection);
        
        if (connection.syncSettings.syncDirection === 'import' || 
            connection.syncSettings.syncDirection === 'bidirectional') {
          const importCount = await this.importFromExternal(userId, connection, api);
          imported += importCount;
        }

        if (connection.syncSettings.syncDirection === 'export' || 
            connection.syncSettings.syncDirection === 'bidirectional') {
          const exportCount = await this.exportToExternal(userId, connection, api);
          exported += exportCount;
        }

        // Update last sync time
        await this.updateConnectionLastSync(connection.id);
        
      } catch (error) {
        console.error(`Sync error for connection ${connection.id}:`, error);
        errors.push(`${connection.provider}: ${(error as Error).message}`);
      }
    }

    return { imported, exported, errors };
  }

  private getCalendarAPI(connection: CalendarConnection): GoogleCalendarAPI | OutlookCalendarAPI {
    switch (connection.provider) {
      case 'google':
        return new GoogleCalendarAPI(connection.accessToken);
      case 'outlook':
        return new OutlookCalendarAPI(connection.accessToken);
      default:
        throw new Error(`Unsupported calendar provider: ${connection.provider}`);
    }
  }

  private async importFromExternal(
    userId: string, 
    connection: CalendarConnection, 
    api: GoogleCalendarAPI | OutlookCalendarAPI
  ): Promise<number> {
    // Get events from last sync or last 30 days
    const lastSync = connection.lastSyncAt || (Date.now() - 30 * 24 * 60 * 60 * 1000);
    const timeMin = new Date(lastSync).toISOString();
    const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    let events: any[] = [];
    
    if (connection.provider === 'google') {
      events = await (api as GoogleCalendarAPI).getEvents('primary', timeMin, timeMax);
    } else if (connection.provider === 'outlook') {
      events = await (api as OutlookCalendarAPI).getEvents(undefined, timeMin, timeMax);
    }

    let importCount = 0;

    for (const externalEvent of events) {
      try {
        const event = this.normalizeExternalEvent(externalEvent, connection.provider);
        await this.saveImportedEvent(userId, connection.id, event);
        importCount++;
      } catch (error) {
        console.error('Failed to import event:', error);
      }
    }

    return importCount;
  }

  private async exportToExternal(
    userId: string, 
    connection: CalendarConnection, 
    api: GoogleCalendarAPI | OutlookCalendarAPI
  ): Promise<number> {
    // Get local events that need to be exported
    const localEvents = await this.getEventsForExport(userId, connection);
    let exportCount = 0;

    for (const localEvent of localEvents) {
      try {
        const externalEvent = this.formatEventForProvider(localEvent, connection.provider);
        
        if (connection.provider === 'google') {
          if (localEvent.externalId) {
            await (api as GoogleCalendarAPI).updateEvent('primary', localEvent.externalId, externalEvent);
          } else {
            const created = await (api as GoogleCalendarAPI).createEvent('primary', externalEvent);
            await this.updateLocalEventExternalId(localEvent.id, created.id);
          }
        } else if (connection.provider === 'outlook') {
          // Similar logic for Outlook
          const created = await (api as OutlookCalendarAPI).createEvent(connection.providerId, externalEvent);
          await this.updateLocalEventExternalId(localEvent.id, created.id);
        }
        
        exportCount++;
      } catch (error) {
        console.error('Failed to export event:', error);
      }
    }

    return exportCount;
  }

  private normalizeExternalEvent(externalEvent: any, provider: CalendarProvider): ExternalCalendarEvent {
    // Normalize event format from different providers
    switch (provider) {
      case 'google':
        return {
          id: `google_${externalEvent.id}`,
          title: externalEvent.summary || 'Untitled',
          description: externalEvent.description,
          startTime: new Date(externalEvent.start.dateTime || externalEvent.start.date).getTime(),
          endTime: new Date(externalEvent.end.dateTime || externalEvent.end.date).getTime(),
          location: externalEvent.location,
          attendees: externalEvent.attendees?.map((a: any) => a.email) || [],
          isAllDay: Boolean(externalEvent.start.date),
          status: externalEvent.status || 'confirmed',
          source: 'google',
          externalId: externalEvent.id
        };
      
      case 'outlook':
        return {
          id: `outlook_${externalEvent.id}`,
          title: externalEvent.subject || 'Untitled',
          description: externalEvent.body?.content,
          startTime: new Date(externalEvent.start.dateTime).getTime(),
          endTime: new Date(externalEvent.end.dateTime).getTime(),
          location: externalEvent.location?.displayName,
          attendees: externalEvent.attendees?.map((a: any) => a.emailAddress.address) || [],
          isAllDay: externalEvent.isAllDay,
          status: 'confirmed',
          source: 'outlook',
          externalId: externalEvent.id
        };
      
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private formatEventForProvider(event: any, provider: CalendarProvider): any {
    // Format internal event for external provider
    switch (provider) {
      case 'google':
        return {
          summary: event.title,
          description: event.description,
          start: event.isAllDay 
            ? { date: new Date(event.startTime).toISOString().split('T')[0] }
            : { dateTime: new Date(event.startTime).toISOString() },
          end: event.isAllDay 
            ? { date: new Date(event.endTime).toISOString().split('T')[0] }
            : { dateTime: new Date(event.endTime).toISOString() },
          location: event.location
        };
      
      case 'outlook':
        return {
          subject: event.title,
          body: { content: event.description, contentType: 'text' },
          start: { dateTime: new Date(event.startTime).toISOString() },
          end: { dateTime: new Date(event.endTime).toISOString() },
          isAllDay: event.isAllDay,
          location: { displayName: event.location }
        };
      
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private async getUserCalendarConnections(userId: string): Promise<CalendarConnection[]> {
    const result = await this.db.query(`
      SELECT * FROM calendar_connections 
      WHERE user_id = ? AND is_active = true
    `, [userId]);

    return (result.results || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      provider: row.provider,
      providerId: row.provider_id,
      accessToken: row.access_token,
      refreshToken: row.refresh_token,
      tokenExpiresAt: row.token_expires_at,
      calendarName: row.calendar_name,
      isActive: row.is_active,
      lastSyncAt: row.last_sync_at,
      syncSettings: JSON.parse(row.sync_settings || '{}'),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  private async saveImportedEvent(userId: string, connectionId: string, event: ExternalCalendarEvent): Promise<void> {
    // Check if event already exists
    const existing = await this.db.query(`
      SELECT id FROM calendar_events 
      WHERE user_id = ? AND external_id = ? AND source = ?
    `, [userId, event.externalId, event.source]);

    if (existing.results?.length) {
      // Update existing event
      await this.db.query(`
        UPDATE calendar_events 
        SET title = ?, description = ?, "start" = ?, "end" = ?, 
            location = ?, is_all_day = ?, status = ?, updated_at = ?
        WHERE user_id = ? AND external_id = ? AND source = ?
      `, [
        event.title, event.description, event.startTime, event.endTime,
        event.location, event.isAllDay, event.status, Date.now(),
        userId, event.externalId, event.source
      ]);
    } else {
      // Create new event
      const eventId = `cal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await this.db.query(`
        INSERT INTO calendar_events (
          id, user_id, connection_id, title, description, "start", "end",
          location, is_all_day, status, source, external_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        eventId, userId, connectionId, event.title, event.description,
        event.startTime, event.endTime, event.location, event.isAllDay,
        event.status, event.source, event.externalId, Date.now(), Date.now()
      ]);
    }
  }

  private async getEventsForExport(userId: string, connection: CalendarConnection): Promise<any[]> {
    const result = await this.db.query(`
      SELECT * FROM calendar_events 
      WHERE user_id = ? AND (source = 'local' OR external_id IS NULL)
        AND updated_at > ?
    `, [userId, connection.lastSyncAt || 0]);

    return result.results || [];
  }

  private async updateLocalEventExternalId(eventId: string, externalId: string): Promise<void> {
    await this.db.query(`
      UPDATE calendar_events 
      SET external_id = ?, updated_at = ?
      WHERE id = ?
    `, [externalId, Date.now(), eventId]);
  }

  private async updateConnectionLastSync(connectionId: string): Promise<void> {
    await this.db.query(`
      UPDATE calendar_connections 
      SET last_sync_at = ?, updated_at = ?
      WHERE id = ?
    `, [Date.now(), Date.now(), connectionId]);
  }
}

// ========== GOOGLE CALENDAR OAUTH ==========

// GET /calendar/google/auth - Start Google Calendar OAuth flow
calendar.get('/google/auth', async (c) => {
  try {
    const auth = await getUserFromToken(c);
    if (!auth) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const googleService = createGoogleCalendarService(c.env);
    const state = crypto.randomUUID(); // Generate state for CSRF protection
    
    // Store state in cache for verification
    await c.env.CACHE.put(`google_oauth_state_${state}`, auth.userId, { expirationTtl: 600 }); // 10 minutes
    
    const authUrl = googleService.getAuthorizationUrl(state);
    
    return c.json({
      authUrl,
      state
    });
  } catch (error) {
    console.error('Google OAuth initiation error:', error);
    return c.json({ error: 'Failed to initiate Google OAuth' }, 500);
  }
});

// GET /calendar/google/callback - Handle Google OAuth callback
calendar.get('/google/callback', async (c) => {
  try {
    const code = c.req.query('code');
    const state = c.req.query('state');
    const error = c.req.query('error');

    if (error) {
      return c.json({ error: `OAuth error: ${error}` }, 400);
    }

    if (!code || !state) {
      return c.json({ error: 'Missing authorization code or state' }, 400);
    }

    // Verify state parameter
    const userId = await c.env.CACHE.get(`google_oauth_state_${state}`);
    if (!userId) {
      return c.json({ error: 'Invalid or expired state parameter' }, 400);
    }

    // Clean up state
    await c.env.CACHE.delete(`google_oauth_state_${state}`);

    const googleService = createGoogleCalendarService(c.env);
    const tokens = await googleService.exchangeCodeForTokens(code);
    
    // Store tokens in database
    const db = new DatabaseService(c.env);
    const connectionId = `google_${Date.now()}_${crypto.randomUUID()}`;
    
    await db.execute(`
      INSERT INTO calendar_connections (
        id, user_id, provider, provider_id, access_token, refresh_token,
        token_expires_at, calendar_name, is_active, sync_settings, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      connectionId,
      userId,
      'google',
      'primary', // We'll update this with actual calendar ID after getting calendar list
      tokens.access_token,
      tokens.refresh_token,
      Date.now() + (tokens.expires_in * 1000),
      'Google Calendar',
      true,
      JSON.stringify({
        syncDirection: 'bidirectional',
        syncTasks: true,
        syncHealthReminders: true,
        syncMeetings: true,
        autoSync: true,
        syncFrequency: 15,
        conflictResolution: 'local_wins'
      }),
      Date.now(),
      Date.now()
    ]);

    // Get calendar list to update provider_id
    try {
      const calendarList = await googleService.getCalendarList(tokens.access_token);
      const primaryCalendar = calendarList.items.find(cal => cal.primary) || calendarList.items[0];
      
      if (primaryCalendar) {
        await db.execute(`
          UPDATE calendar_connections 
          SET provider_id = ?, calendar_name = ?, updated_at = ?
          WHERE id = ?
        `, [primaryCalendar.id, primaryCalendar.summary, Date.now(), connectionId]);
      }
    } catch (error) {
      console.error('Failed to get calendar list:', error);
      // Don't fail the connection if we can't get calendar list
    }

    return c.json({
      success: true,
      message: 'Google Calendar connected successfully',
      connectionId
    });
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return c.json({ error: 'Failed to complete Google OAuth' }, 500);
  }
});

// ========== API ENDPOINTS ==========

// GET /calendar/connections - Get user's calendar connections
calendar.get('/connections', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const syncEngine = new CalendarSyncEngine(c.env);
    const connections = await syncEngine.getUserCalendarConnections(auth.userId);

    return c.json({
      connections: connections.map(conn => ({
        id: conn.id,
        provider: conn.provider,
        calendarName: conn.calendarName,
        isActive: conn.isActive,
        lastSyncAt: conn.lastSyncAt,
        syncSettings: conn.syncSettings
      }))
    });
  } catch (error) {
    console.error('Get connections error:', error);
    return c.json({ error: 'Failed to fetch calendar connections' }, 500);
  }
});

// POST /calendar/connect - Connect to external calendar
const connectSchema = z.object({
  provider: z.enum(['google', 'outlook', 'apple', 'caldav']),
  authCode: z.string().min(1, 'Authorization code is required'),
  redirectUri: z.string().url('Valid redirect URI is required'),
  syncSettings: z.object({
    syncDirection: z.enum(['import', 'export', 'bidirectional']).default('bidirectional'),
    syncTasks: z.boolean().default(true),
    syncHealthReminders: z.boolean().default(false),
    syncMeetings: z.boolean().default(true),
    autoSync: z.boolean().default(true),
    syncFrequency: z.number().min(5).max(1440).default(60), // 5 min to 24 hours
    conflictResolution: z.enum(['local_wins', 'remote_wins', 'manual']).default('manual')
  }).optional()
});

calendar.post('/connect', zValidator('json', connectSchema), async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { provider, authCode, redirectUri, syncSettings } = c.req.valid('json');
    
    // Exchange auth code for access token (implementation depends on provider)
    // For now, we'll simulate the token exchange
    const tokenData = await exchangeAuthCodeForTokens(provider, authCode, redirectUri, c.env);
    
    if (!tokenData.access_token) {
      return c.json({ error: 'Failed to obtain access token' }, 400);
    }

    // Create calendar connection record
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const db = new DatabaseService(c.env);
    
    await db.query(`
      INSERT INTO calendar_connections (
        id, user_id, provider, provider_id, access_token, refresh_token,
        token_expires_at, calendar_name, is_active, sync_settings,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      connectionId, auth.userId, provider, tokenData.provider_id || 'primary',
      tokenData.access_token, tokenData.refresh_token,
      tokenData.expires_at, tokenData.calendar_name || `${provider} Calendar`,
      true, JSON.stringify(syncSettings || {}), Date.now(), Date.now()
    ]);

    return c.json({
      message: 'Calendar connected successfully',
      connection: {
        id: connectionId,
        provider,
        calendarName: tokenData.calendar_name || `${provider} Calendar`,
        isActive: true
      }
    });
  } catch (error) {
    console.error('Calendar connection error:', error);
    return c.json({ error: 'Failed to connect calendar' }, 500);
  }
});

// POST /calendar/sync - Manually trigger sync
calendar.post('/sync', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const syncEngine = new CalendarSyncEngine(c.env);
    const result = await syncEngine.syncUserCalendars(auth.userId);

    return c.json({
      message: 'Calendar sync completed',
      result: {
        imported: result.imported,
        exported: result.exported,
        errors: result.errors
      },
      syncedAt: Date.now()
    });
  } catch (error) {
    console.error('Calendar sync error:', error);
    return c.json({ error: 'Calendar sync failed' }, 500);
  }
});

// GET /calendar/events - Get synchronized calendar events
calendar.get('/events', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const startDate = Number(c.req.query('start')) || Date.now();
    const endDate = Number(c.req.query('end')) || (Date.now() + 30 * 24 * 60 * 60 * 1000);
    const source = c.req.query('source') || 'all';

    const db = new DatabaseService(c.env);
    let query = `
      SELECT * FROM calendar_events 
      WHERE user_id = ? AND "start" >= ? AND "start" <= ?
    `;
    const params = [auth.userId, startDate, endDate];

    if (source !== 'all') {
      query += ' AND source = ?';
      params.push(source);
    }

    query += ' ORDER BY "start" ASC';

    const result = await db.query(query, params);

    const events = (result.results || []).map((event: any) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startTime: event.start,
      endTime: event.end,
      location: event.location,
      isAllDay: event.is_all_day,
      status: event.status,
      source: event.source,
      externalId: event.external_id
    }));

    return c.json({
      events,
      count: events.length,
      timeframe: {
        start: startDate,
        end: endDate
      }
    });
  } catch (error) {
    console.error('Get calendar events error:', error);
    return c.json({ error: 'Failed to fetch calendar events' }, 500);
  }
});

// Helper function to exchange auth code for tokens
async function exchangeAuthCodeForTokens(
  provider: CalendarProvider, 
  authCode: string, 
  redirectUri: string, 
  env: Env
): Promise<any> {
  switch (provider) {
    case 'google':
      return exchangeGoogleAuthCode(authCode, redirectUri, env);
    case 'outlook':
      return exchangeOutlookAuthCode(authCode, redirectUri, env);
    default:
      throw new Error(`Token exchange not implemented for ${provider}`);
  }
}

async function exchangeGoogleAuthCode(authCode: string, redirectUri: string, env: Env): Promise<any> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      code: authCode,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    })
  });

  if (!response.ok) {
    throw new Error(`Google token exchange failed: ${response.status}`);
  }

  const tokenData = await response.json();
  return {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_at: Date.now() + (tokenData.expires_in * 1000),
    provider_id: 'primary',
    calendar_name: 'Google Calendar'
  };
}

async function exchangeOutlookAuthCode(authCode: string, redirectUri: string, env: Env): Promise<any> {
  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.OUTLOOK_CLIENT_ID,
      client_secret: env.OUTLOOK_CLIENT_SECRET,
      code: authCode,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      scope: 'https://graph.microsoft.com/calendars.readwrite offline_access'
    })
  });

  if (!response.ok) {
    throw new Error(`Outlook token exchange failed: ${response.status}`);
  }

  const tokenData = await response.json();
  return {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_at: Date.now() + (tokenData.expires_in * 1000),
    provider_id: 'calendar',
    calendar_name: 'Outlook Calendar'
  };
}

// ========== AI MEETING SCHEDULING ==========

// POST /calendar/ai-schedule-meeting - AI-powered meeting scheduling
const aiScheduleMeetingSchema = z.object({
  title: z.string().min(1, 'Meeting title is required').max(200),
  participants: z.array(z.string().email()).min(1, 'At least one participant is required'),
  duration: z.number().int().min(15).max(480), // 15 minutes to 8 hours
  meetingType: z.enum(['one_on_one', 'team', 'interview', 'presentation', 'workshop', 'standup']).default('team'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  locationType: z.enum(['in_person', 'video_call', 'phone', 'hybrid']).default('video_call'),
  locationDetails: z.string().max(500).optional(),
  agenda: z.string().max(2000).optional(),
  preparationTime: z.number().int().min(0).max(120).default(0), // minutes
  bufferTime: z.number().int().min(0).max(60).default(15), // minutes
  preferences: z.object({
    preferredTimes: z.array(z.object({
      start: z.string().regex(/^\d{2}:\d{2}$/), // "09:00"
      end: z.string().regex(/^\d{2}:\d{2}$/)    // "17:00"
    })).optional(),
    avoidTimes: z.array(z.object({
      start: z.string().regex(/^\d{2}:\d{2}$/),
      end: z.string().regex(/^\d{2}:\d{2}$/)
    })).optional(),
    preferredDays: z.array(z.number().int().min(0).max(6)).optional(), // 0-6, Sunday-Saturday
    avoidDays: z.array(z.number().int().min(0).max(6)).optional(),
    timezone: z.string().default('UTC'),
    requireAllParticipants: z.boolean().default(true)
  }).optional()
});

calendar.post('/ai-schedule-meeting', zValidator('json', aiScheduleMeetingSchema), async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const requestData = c.req.valid('json');
    const meetingScheduler = new MeetingScheduler(c.env);

    // Build meeting request
    const meetingRequest: MeetingRequest = {
      id: '', // Will be generated by scheduler
      organizer_id: auth.userId,
      title: requestData.title,
      participants: requestData.participants,
      duration_minutes: requestData.duration,
      meeting_type: requestData.meetingType,
      priority: requestData.priority,
      location_type: requestData.locationType,
      location_details: requestData.locationDetails,
      agenda: requestData.agenda,
      preparation_time: requestData.preparationTime,
      buffer_time: requestData.bufferTime,
      preferences: requestData.preferences
    };

    // Schedule the meeting using AI
    const result = await meetingScheduler.scheduleMeeting(meetingRequest);

    // Send notifications to participants
    for (const participantEmail of requestData.participants) {
      try {
        await queueNotification(c.env, {
          type: 'social_update',
          userId: auth.userId, // We'll need to look up participant user IDs
          data: {
            message: `You've been invited to "${requestData.title}" - AI is finding the best time for everyone!`
          }
        });
      } catch (notificationError) {
        console.warn('Failed to send meeting invitation notification:', notificationError);
      }
    }

    // Log AI usage
    c.env.ANALYTICS?.writeDataPoint({
      blobs: [auth.userId, 'ai_meeting_scheduled', requestData.meetingType],
      doubles: [Date.now(), requestData.participants.length, result.suggested_slots.length],
      indexes: ['ai_usage']
    });

    return c.json({
      message: 'Meeting scheduling analysis completed',
      meetingRequestId: result.meeting_request_id,
      suggestedSlots: result.suggested_slots.map(slot => ({
        id: slot.id,
        startTime: slot.start_time,
        endTime: slot.end_time,
        score: slot.ai_score,
        confidence: Math.round(slot.confidence_level * 100),
        reasoning: slot.reasoning,
        conflicts: slot.participant_conflicts,
        availabilitySummary: slot.availability_summary,
        optimalFactors: slot.optimal_factors,
        formatted: {
          start: new Date(slot.start_time).toISOString(),
          end: new Date(slot.end_time).toISOString(),
          date: new Date(slot.start_time).toDateString(),
          time: new Date(slot.start_time).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: requestData.preferences?.timezone || 'UTC'
          })
        }
      })),
      analysis: result.analysis,
      participantFeedback: result.participant_feedback
    });
  } catch (error) {
    console.error('AI meeting scheduling error:', error);
    return c.json({ error: 'Failed to schedule meeting with AI' }, 500);
  }
});

// POST /calendar/confirm-meeting-slot - Confirm a suggested meeting slot
const confirmSlotSchema = z.object({
  meetingRequestId: z.string().min(1),
  selectedSlotId: z.string().min(1),
  customMessage: z.string().max(500).optional()
});

calendar.post('/confirm-meeting-slot', zValidator('json', confirmSlotSchema), async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { meetingRequestId, selectedSlotId, customMessage } = c.req.valid('json');
    const db = new DatabaseService(c.env);

    // Get the meeting request and selected slot
    const [meetingResult, slotResult] = await Promise.all([
      db.query(`
        SELECT * FROM meeting_requests WHERE id = ? AND organizer_id = ?
      `, [meetingRequestId, auth.userId]),
      db.query(`
        SELECT * FROM meeting_time_slots WHERE id = ? AND meeting_request_id = ?
      `, [selectedSlotId, meetingRequestId])
    ]);

    if (!meetingResult.results?.[0]) {
      return c.json({ error: 'Meeting request not found' }, 404);
    }

    if (!slotResult.results?.[0]) {
      return c.json({ error: 'Meeting slot not found' }, 404);
    }

    const meeting = meetingResult.results[0];
    const slot = slotResult.results[0];

    // Update meeting request status
    await db.query(`
      UPDATE meeting_requests 
      SET status = 'scheduled', selected_slot = ?, updated_at = ?
      WHERE id = ?
    `, [JSON.stringify({
      slot_id: selectedSlotId,
      start_time: slot.start_time,
      end_time: slot.end_time,
      confirmed_at: Date.now()
    }), Date.now(), meetingRequestId]);

    // Create calendar event
    const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.query(`
      INSERT INTO calendar_events (
        id, user_id, title, "start", "end", source, external_id,
        description, location, is_all_day, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      eventId, auth.userId, meeting.title, slot.start_time, slot.end_time,
      'ai_scheduled', null, meeting.agenda, meeting.location_details,
      false, 'confirmed', Date.now(), Date.now()
    ]);

    // Send confirmation notifications
    const participants = JSON.parse(meeting.participants || '[]');
    for (const participantEmail of participants) {
      try {
        await queueNotification(c.env, {
          type: 'social_update',
          userId: auth.userId,
          data: {
            message: `Meeting "${meeting.title}" has been scheduled for ${new Date(slot.start_time).toLocaleString()}. ${customMessage || ''}`
          }
        });
      } catch (notificationError) {
        console.warn('Failed to send meeting confirmation notification:', notificationError);
      }
    }

    return c.json({
      message: 'Meeting slot confirmed successfully',
      eventId,
      meeting: {
        id: meetingRequestId,
        title: meeting.title,
        startTime: slot.start_time,
        endTime: slot.end_time,
        participants: participants,
        location: meeting.location_details,
        agenda: meeting.agenda
      },
      calendarEvent: {
        id: eventId,
        formatted: {
          start: new Date(slot.start_time).toISOString(),
          end: new Date(slot.end_time).toISOString(),
          date: new Date(slot.start_time).toDateString(),
          time: new Date(slot.start_time).toLocaleTimeString()
        }
      }
    });
  } catch (error) {
    console.error('Confirm meeting slot error:', error);
    return c.json({ error: 'Failed to confirm meeting slot' }, 500);
  }
});

// GET /calendar/meeting-requests - Get user's meeting requests
calendar.get('/meeting-requests', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const status = c.req.query('status') || 'all';
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);
    const offset = parseInt(c.req.query('offset') || '0');

    const db = new DatabaseService(c.env);
    let query = `
      SELECT mr.*, COUNT(mts.id) as suggested_slots_count
      FROM meeting_requests mr
      LEFT JOIN meeting_time_slots mts ON mr.id = mts.meeting_request_id
      WHERE mr.organizer_id = ?
    `;
    const params = [auth.userId];

    if (status !== 'all') {
      query += ' AND mr.status = ?';
      params.push(status);
    }

    query += ' GROUP BY mr.id ORDER BY mr.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await db.query(query, params);

    const meetingRequests = (result.results || []).map((meeting: any) => ({
      id: meeting.id,
      title: meeting.title,
      participants: JSON.parse(meeting.participants || '[]'),
      duration: meeting.duration_minutes,
      meetingType: meeting.meeting_type,
      priority: meeting.priority,
      status: meeting.status,
      suggestedSlotsCount: meeting.suggested_slots_count,
      createdAt: meeting.created_at,
      updatedAt: meeting.updated_at
    }));

    return c.json({
      meetingRequests,
      pagination: {
        limit,
        offset,
        total: meetingRequests.length
      }
    });
  } catch (error) {
    console.error('Get meeting requests error:', error);
    return c.json({ error: 'Failed to get meeting requests' }, 500);
  }
});

// GET /calendar/meeting-requests/:id - Get specific meeting request with slots
calendar.get('/meeting-requests/:id', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const meetingRequestId = c.req.param('id');
    const db = new DatabaseService(c.env);

    const [meetingResult, slotsResult] = await Promise.all([
      db.query(`
        SELECT * FROM meeting_requests WHERE id = ? AND organizer_id = ?
      `, [meetingRequestId, auth.userId]),
      db.query(`
        SELECT * FROM meeting_time_slots 
        WHERE meeting_request_id = ? 
        ORDER BY ai_score DESC
        LIMIT 10
      `, [meetingRequestId])
    ]);

    if (!meetingResult.results?.[0]) {
      return c.json({ error: 'Meeting request not found' }, 404);
    }

    const meeting = meetingResult.results[0];
    const slots = slotsResult.results || [];

    return c.json({
      meeting: {
        id: meeting.id,
        title: meeting.title,
        participants: JSON.parse(meeting.participants || '[]'),
        duration: meeting.duration_minutes,
        meetingType: meeting.meeting_type,
        priority: meeting.priority,
        status: meeting.status,
        agenda: meeting.agenda,
        preferences: meeting.preferences ? JSON.parse(meeting.preferences) : null,
        createdAt: meeting.created_at
      },
      suggestedSlots: slots.map((slot: any) => ({
        id: slot.id,
        startTime: slot.start_time,
        endTime: slot.end_time,
        score: slot.ai_score,
        confidence: Math.round(slot.confidence_level * 100),
        reasoning: slot.reasoning,
        conflicts: JSON.parse(slot.participant_conflicts || '[]'),
        availabilitySummary: JSON.parse(slot.availability_summary || '{}'),
        optimalFactors: JSON.parse(slot.optimal_factors || '[]'),
        formatted: {
          start: new Date(slot.start_time).toISOString(),
          end: new Date(slot.end_time).toISOString(),
          date: new Date(slot.start_time).toDateString(),
          time: new Date(slot.start_time).toLocaleTimeString()
        }
      }))
    });
  } catch (error) {
    console.error('Get meeting request error:', error);
    return c.json({ error: 'Failed to get meeting request' }, 500);
  }
});

export default calendar;