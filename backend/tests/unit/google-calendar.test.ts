// Google Calendar Integration Unit Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleCalendarService, createGoogleCalendarService } from '../../src/lib/google-calendar';
import { createMockEnv } from '../utils/test-helpers';

// Mock fetch globally
global.fetch = vi.fn();

describe('Google Calendar Integration', () => {
  let googleService: GoogleCalendarService;
  let mockEnv: any;

  beforeEach(() => {
    mockEnv = createMockEnv();
    googleService = createGoogleCalendarService(mockEnv);
    vi.clearAllMocks();
  });

  describe('GoogleCalendarService', () => {
    it('should create service with valid credentials', () => {
      expect(googleService).toBeInstanceOf(GoogleCalendarService);
    });

    it('should throw error when credentials are missing', () => {
      const invalidEnv = { ...mockEnv, GOOGLE_CLIENT_ID: undefined };
      expect(() => createGoogleCalendarService(invalidEnv)).toThrow('Google Calendar credentials not configured');
    });

    it('should generate authorization URL', () => {
      const authUrl = googleService.getAuthorizationUrl('test-state');
      
      expect(authUrl).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(authUrl).toContain('client_id=test-google-client-id');
      expect(authUrl).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fcalendar%2Fgoogle%2Fcallback');
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain('scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar');
      expect(authUrl).toContain('access_type=offline');
      expect(authUrl).toContain('prompt=consent');
      expect(authUrl).toContain('state=test-state');
    });

    it('should exchange code for tokens successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          access_token: 'test_access_token',
          refresh_token: 'test_refresh_token',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'https://www.googleapis.com/auth/calendar'
        })
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const tokens = await googleService.exchangeCodeForTokens('test_code');

      expect(tokens.access_token).toBe('test_access_token');
      expect(tokens.refresh_token).toBe('test_refresh_token');
      expect(tokens.expires_in).toBe(3600);
      expect(tokens.token_type).toBe('Bearer');
      expect(tokens.scope).toBe('https://www.googleapis.com/auth/calendar');
    });

    it('should handle token exchange errors', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          error: 'invalid_grant',
          error_description: 'Invalid authorization code'
        })
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await expect(googleService.exchangeCodeForTokens('invalid_code'))
        .rejects.toThrow('Token exchange failed: 400 - Invalid authorization code');
    });

    it('should refresh access token successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          access_token: 'new_access_token',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'https://www.googleapis.com/auth/calendar'
        })
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const tokens = await googleService.refreshAccessToken('test_refresh_token');

      expect(tokens.access_token).toBe('new_access_token');
      expect(tokens.expires_in).toBe(3600);
      expect(tokens.token_type).toBe('Bearer');
    });

    it('should get calendar list successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          items: [
            {
              id: 'primary',
              summary: 'Primary Calendar',
              timeZone: 'America/New_York',
              colorId: '1',
              backgroundColor: '#a4bdfc',
              foregroundColor: '#1d1d1d',
              accessRole: 'owner',
              selected: true,
              primary: true
            },
            {
              id: 'work@example.com',
              summary: 'Work Calendar',
              timeZone: 'America/New_York',
              colorId: '2',
              backgroundColor: '#7ae7bf',
              foregroundColor: '#1d1d1d',
              accessRole: 'reader',
              selected: false
            }
          ]
        })
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const calendarList = await googleService.getCalendarList('test_access_token');

      expect(calendarList.items).toHaveLength(2);
      expect(calendarList.items[0].id).toBe('primary');
      expect(calendarList.items[0].summary).toBe('Primary Calendar');
      expect(calendarList.items[0].primary).toBe(true);
    });

    it('should get events successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          items: [
            {
              id: 'event_1',
              summary: 'Team Meeting',
              description: 'Weekly team sync',
              start: {
                dateTime: '2025-01-20T10:00:00-05:00',
                timeZone: 'America/New_York'
              },
              end: {
                dateTime: '2025-01-20T11:00:00-05:00',
                timeZone: 'America/New_York'
              },
              location: 'Conference Room A',
              status: 'confirmed',
              created: '2025-01-15T09:00:00.000Z',
              updated: '2025-01-15T09:00:00.000Z'
            }
          ]
        })
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const events = await googleService.getEvents('test_access_token', 'primary');

      expect(events.items).toHaveLength(1);
      expect(events.items[0].id).toBe('event_1');
      expect(events.items[0].summary).toBe('Team Meeting');
      expect(events.items[0].start.dateTime).toBe('2025-01-20T10:00:00-05:00');
    });

    it('should create event successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          id: 'new_event_123',
          summary: 'New Meeting',
          start: {
            dateTime: '2025-01-20T14:00:00-05:00',
            timeZone: 'America/New_York'
          },
          end: {
            dateTime: '2025-01-20T15:00:00-05:00',
            timeZone: 'America/New_York'
          },
          created: '2025-01-15T10:00:00.000Z',
          updated: '2025-01-15T10:00:00.000Z'
        })
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const eventData = {
        summary: 'New Meeting',
        start: {
          dateTime: '2025-01-20T14:00:00-05:00',
          timeZone: 'America/New_York'
        },
        end: {
          dateTime: '2025-01-20T15:00:00-05:00',
          timeZone: 'America/New_York'
        }
      };

      const createdEvent = await googleService.createEvent('test_access_token', 'primary', eventData);

      expect(createdEvent.id).toBe('new_event_123');
      expect(createdEvent.summary).toBe('New Meeting');
    });

    it('should update event successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          id: 'event_123',
          summary: 'Updated Meeting',
          start: {
            dateTime: '2025-01-20T15:00:00-05:00',
            timeZone: 'America/New_York'
          },
          end: {
            dateTime: '2025-01-20T16:00:00-05:00',
            timeZone: 'America/New_York'
          },
          updated: '2025-01-15T11:00:00.000Z'
        })
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const eventData = {
        summary: 'Updated Meeting',
        start: {
          dateTime: '2025-01-20T15:00:00-05:00',
          timeZone: 'America/New_York'
        },
        end: {
          dateTime: '2025-01-20T16:00:00-05:00',
          timeZone: 'America/New_York'
        }
      };

      const updatedEvent = await googleService.updateEvent('test_access_token', 'primary', 'event_123', eventData);

      expect(updatedEvent.id).toBe('event_123');
      expect(updatedEvent.summary).toBe('Updated Meeting');
    });

    it('should delete event successfully', async () => {
      const mockResponse = {
        ok: true,
        status: 204
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await expect(googleService.deleteEvent('test_access_token', 'primary', 'event_123'))
        .resolves.not.toThrow();
    });

    it('should validate token successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ items: [] })
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const isValid = await googleService.validateToken('valid_token');
      expect(isValid).toBe(true);
    });

    it('should return false for invalid token', async () => {
      const mockResponse = {
        ok: false,
        status: 401
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const isValid = await googleService.validateToken('invalid_token');
      expect(isValid).toBe(false);
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(googleService.getCalendarList('test_token'))
        .rejects.toThrow('Network error');
    });
  });
});
