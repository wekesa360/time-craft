// Google Calendar Integration
// Handles OAuth flow and API interactions with Google Calendar

import { logger } from './logger';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  recurrence?: string[];
  transparency?: 'opaque' | 'transparent';
  visibility?: 'default' | 'public' | 'private';
  status?: 'confirmed' | 'tentative' | 'cancelled';
  created: string;
  updated: string;
  htmlLink?: string;
}

export interface GoogleCalendarList {
  items: Array<{
    id: string;
    summary: string;
    description?: string;
    timeZone: string;
    colorId: string;
    backgroundColor: string;
    foregroundColor: string;
    accessRole: string;
    selected: boolean;
    primary?: boolean;
  }>;
}

export interface GoogleCalendarAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export class GoogleCalendarService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private baseUrl = 'https://www.googleapis.com/calendar/v3';

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
      access_type: 'offline',
      prompt: 'consent',
      ...(state && { state })
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GoogleCalendarAuthTokens> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Token exchange failed: ${response.status} - ${errorData.error_description || response.statusText}`);
      }

      const tokens = await response.json();
      
      logger.info('Google Calendar tokens obtained', {
        scope: tokens.scope,
        expiresIn: tokens.expires_in
      });

      return tokens;
    } catch (error) {
      logger.error('Failed to exchange code for tokens', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<GoogleCalendarAuthTokens> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Token refresh failed: ${response.status} - ${errorData.error_description || response.statusText}`);
      }

      const tokens = await response.json();
      
      logger.info('Google Calendar tokens refreshed', {
        scope: tokens.scope,
        expiresIn: tokens.expires_in
      });

      return tokens;
    } catch (error) {
      logger.error('Failed to refresh access token', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Get user's calendar list
   */
  async getCalendarList(accessToken: string): Promise<GoogleCalendarList> {
    try {
      const response = await fetch(`${this.baseUrl}/users/me/calendarList`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get calendar list: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      logger.info('Retrieved Google Calendar list', {
        calendarCount: data.items?.length || 0
      });

      return data;
    } catch (error) {
      logger.error('Failed to get calendar list', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Get events from a specific calendar
   */
  async getEvents(
    accessToken: string,
    calendarId: string = 'primary',
    options: {
      timeMin?: string;
      timeMax?: string;
      maxResults?: number;
      singleEvents?: boolean;
      orderBy?: 'startTime' | 'updated';
    } = {}
  ): Promise<{ items: GoogleCalendarEvent[] }> {
    try {
      const params = new URLSearchParams({
        ...(options.timeMin && { timeMin: options.timeMin }),
        ...(options.timeMax && { timeMax: options.timeMax }),
        ...(options.maxResults && { maxResults: options.maxResults.toString() }),
        ...(options.singleEvents && { singleEvents: 'true' }),
        ...(options.orderBy && { orderBy: options.orderBy }),
      });

      const response = await fetch(`${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events?${params}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get events: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      logger.info('Retrieved Google Calendar events', {
        calendarId,
        eventCount: data.items?.length || 0
      });

      return data;
    } catch (error) {
      logger.error('Failed to get events', { 
        calendarId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Create a new event
   */
  async createEvent(
    accessToken: string,
    calendarId: string = 'primary',
    event: Partial<GoogleCalendarEvent>
  ): Promise<GoogleCalendarEvent> {
    try {
      const response = await fetch(`${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to create event: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const createdEvent = await response.json();
      
      logger.info('Created Google Calendar event', {
        eventId: createdEvent.id,
        calendarId,
        summary: createdEvent.summary
      });

      return createdEvent;
    } catch (error) {
      logger.error('Failed to create event', { 
        calendarId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Update an existing event
   */
  async updateEvent(
    accessToken: string,
    calendarId: string = 'primary',
    eventId: string,
    event: Partial<GoogleCalendarEvent>
  ): Promise<GoogleCalendarEvent> {
    try {
      const response = await fetch(`${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to update event: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const updatedEvent = await response.json();
      
      logger.info('Updated Google Calendar event', {
        eventId: updatedEvent.id,
        calendarId,
        summary: updatedEvent.summary
      });

      return updatedEvent;
    } catch (error) {
      logger.error('Failed to update event', { 
        eventId,
        calendarId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(
    accessToken: string,
    calendarId: string = 'primary',
    eventId: string
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete event: ${response.status} - ${response.statusText}`);
      }

      logger.info('Deleted Google Calendar event', {
        eventId,
        calendarId
      });
    } catch (error) {
      logger.error('Failed to delete event', { 
        eventId,
        calendarId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Check if access token is valid
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/users/me/calendarList?maxResults=1`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Create Google Calendar service instance
 */
export function createGoogleCalendarService(env: any): GoogleCalendarService {
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  const redirectUri = env.GOOGLE_REDIRECT_URI || `${env.APP_BASE_URL}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Google Calendar credentials not configured');
  }

  return new GoogleCalendarService(clientId, clientSecret, redirectUri);
}
