// Calendar and Scheduling Integration Tests
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import apiGateway from '../../src/workers/api-gateway';
import { 
  createMockEnv, 
  testUsers,
  generateTestToken,
  makeRequest, 
  expectSuccessResponse, 
  expectErrorResponse,
  expectValidationError,
  cleanupTestData,
  mockExternalAPIs
} from '../utils/test-helpers';

const testEvents = [
  {
    id: 'event_1',
    user_id: testUsers.regularUser.id,
    title: 'Team Meeting',
    description: 'Weekly team sync',
    start_time: Date.now() + 3600000, // 1 hour from now
    end_time: Date.now() + 7200000, // 2 hours from now
    location: 'Conference Room A',
    event_type: 'meeting',
    status: 'confirmed',
    created_at: Date.now() - 86400000
  },
  {
    id: 'event_2',
    user_id: testUsers.regularUser.id,
    title: 'Doctor Appointment',
    start_time: Date.now() + 172800000, // 2 days from now
    end_time: Date.now() + 176400000,
    event_type: 'appointment',
    status: 'confirmed',
    created_at: Date.now() - 43200000
  }
];

describe('Calendar and Scheduling API', () => {
  let env: any;
  let app: any;
  let userToken: string;

  // Helper function to make requests with the test environment
  const testRequest = (method: string, path: string, options: any = {}) => {
    return makeRequest(app, method, path, { ...options, env });
  };

  beforeEach(async () => {
    env = createMockEnv();
    app = apiGateway;
    userToken = await generateTestToken(testUsers.regularUser.id);
    
    // Set up mock data
    env.DB._setMockData('SELECT * FROM users WHERE id = ?', [testUsers.regularUser]);
    env.DB._setMockData('SELECT * FROM calendar_events WHERE user_id = ?', testEvents);
    env.DB._setMockData('SELECT * FROM calendar_integrations WHERE user_id = ?', []);
    
    // Mock external calendar APIs
    global.fetch = vi.fn();
  });

  afterEach(() => {
    cleanupTestData(env);
    vi.clearAllMocks();
  });

  describe('Event Management', () => {
    describe('GET /api/calendar/events', () => {
      it('should get user events successfully', async () => {
        const response = await testRequest('GET', '/api/calendar/events', {
          token: userToken
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          events: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              title: expect.any(String),
              startTime: expect.any(Number),
              endTime: expect.any(Number),
              eventType: expect.any(String),
              status: expect.any(String)
            })
          ]),
          pagination: expect.objectContaining({
            total: expect.any(Number),
            page: expect.any(Number)
          })
        });
      });

      it('should filter events by date range', async () => {
        const startDate = Date.now();
        const endDate = Date.now() + 604800000; // 1 week

        const response = await testRequest( 'GET', `/api/calendar/events?start=${startDate}&end=${endDate}`, {
          token: userToken
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        body.events.forEach((event: any) => {
          expect(event.startTime).toBeGreaterThanOrEqual(startDate);
          expect(event.startTime).toBeLessThanOrEqual(endDate);
        });
      });

      it('should filter events by type', async () => {
        const response = await testRequest( 'GET', '/api/calendar/events?type=meeting', {
          token: userToken
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        body.events.forEach((event: any) => {
          expect(event.eventType).toBe('meeting');
        });
      });
    });

    describe('POST /api/calendar/events', () => {
      it('should create event successfully', async () => {
        const newEvent = {
          title: 'New Meeting',
          description: 'Important client meeting',
          startTime: Date.now() + 86400000, // Tomorrow
          endTime: Date.now() + 90000000,
          location: 'Client Office',
          eventType: 'meeting',
          attendees: ['client@example.com']
        };

        env.DB._setMockData('INSERT INTO calendar_events', [{ id: 'new_event_id' }]);

        const response = await testRequest( 'POST', '/api/calendar/events', {
          token: userToken,
          body: newEvent
        });

        expectSuccessResponse(response, 201);
        const body = await response.json();
        
        expect(body).toMatchObject({
          message: expect.stringContaining('created'),
          event: {
            title: newEvent.title,
            description: newEvent.description,
            location: newEvent.location,
            eventType: newEvent.eventType,
            status: 'confirmed'
          }
        });
      });

      it('should reject event with invalid time range', async () => {
        const response = await testRequest( 'POST', '/api/calendar/events', {
          token: userToken,
          body: {
            title: 'Invalid Event',
            startTime: Date.now() + 7200000, // 2 hours from now
            endTime: Date.now() + 3600000   // 1 hour from now (before start)
          }
        });

        await expectValidationError(response, 'endTime');
      });

      it('should reject overlapping events', async () => {
        // Mock existing event at same time
        const overlappingTime = Date.now() + 3600000;
        env.DB._setMockData('SELECT * FROM calendar_events WHERE user_id = ? AND start_time <= ? AND end_time >= ?', [{
          id: 'existing_event',
          title: 'Existing Event',
          start_time: overlappingTime,
          end_time: overlappingTime + 3600000
        }]);

        const response = await testRequest( 'POST', '/api/calendar/events', {
          token: userToken,
          body: {
            title: 'Overlapping Event',
            startTime: overlappingTime + 1800000, // 30 minutes into existing event
            endTime: overlappingTime + 5400000
          }
        });

        expectErrorResponse(response, 409, 'conflicts with existing event');
      });
    });

    describe('PUT /api/calendar/events/:id', () => {
      it('should update event successfully', async () => {
        const eventId = testEvents[0].id;
        const updateData = {
          title: 'Updated Meeting Title',
          location: 'New Location',
          description: 'Updated description'
        };

        env.DB._setMockData('SELECT * FROM calendar_events WHERE id = ? AND user_id = ?', [testEvents[0]]);
        env.DB._setMockData('UPDATE calendar_events', [{ id: eventId }]);

        const response = await testRequest( 'PUT', `/api/calendar/events/${eventId}`, {
          token: userToken,
          body: updateData
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body.message).toContain('updated');
        expect(body.event).toMatchObject({
          id: eventId,
          title: updateData.title,
          location: updateData.location,
          description: updateData.description
        });
      });

      it('should reject updating non-existent event', async () => {
        env.DB._setMockData('SELECT * FROM calendar_events WHERE id = ? AND user_id = ?', []);

        const response = await testRequest( 'PUT', '/api/calendar/events/nonexistent', {
          token: userToken,
          body: { title: 'Updated Title' }
        });

        expectErrorResponse(response, 404, 'not found');
      });
    });

    describe('DELETE /api/calendar/events/:id', () => {
      it('should delete event successfully', async () => {
        const eventId = testEvents[0].id;
        env.DB._setMockData('SELECT * FROM calendar_events WHERE id = ? AND user_id = ?', [testEvents[0]]);

        const response = await testRequest( 'DELETE', `/api/calendar/events/${eventId}`, {
          token: userToken
        });

        expectSuccessResponse(response);
        const body = await response.json();
        expect(body.message).toContain('deleted');
      });
    });
  });

  describe('Calendar Integration', () => {
    describe('GET /api/calendar/integrations', () => {
      it('should get available integrations', async () => {
        const response = await testRequest( 'GET', '/api/calendar/integrations', {
          token: userToken
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          integrations: expect.arrayContaining([
            expect.objectContaining({
              provider: 'google_calendar',
              name: 'Google Calendar',
              isConnected: expect.any(Boolean),
              features: expect.any(Array)
            }),
            expect.objectContaining({
              provider: 'outlook',
              name: 'Microsoft Outlook',
              isConnected: expect.any(Boolean)
            })
          ])
        });
      });
    });

    describe('POST /api/calendar/integrations/:provider/connect', () => {
      it('should initiate Google Calendar connection', async () => {
        const response = await testRequest( 'POST', '/api/calendar/integrations/google_calendar/connect', {
          token: userToken
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          authUrl: expect.stringContaining('accounts.google.com'),
          state: expect.any(String)
        });
      });

      it('should initiate Outlook connection', async () => {
        const response = await testRequest( 'POST', '/api/calendar/integrations/outlook/connect', {
          token: userToken
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          authUrl: expect.stringContaining('login.microsoftonline.com'),
          state: expect.any(String)
        });
      });
    });

    describe('POST /api/calendar/integrations/:provider/callback', () => {
      it('should complete Google Calendar OAuth', async () => {
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockExternalAPIs.google.tokenResponse
        });

        env.DB._setMockData('INSERT INTO calendar_integrations', [{ id: 'new_integration_id' }]);

        const response = await testRequest( 'POST', '/api/calendar/integrations/google_calendar/callback', {
          token: userToken,
          body: {
            code: 'auth_code_123',
            state: 'state_token_123'
          }
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body.message).toContain('connected successfully');
        expect(body.integration.provider).toBe('google_calendar');
      });
    });

    describe('POST /api/calendar/integrations/:provider/sync', () => {
      it('should sync events from Google Calendar', async () => {
        // Mock integration exists
        const mockIntegration = {
          id: 'integration_1',
          user_id: testUsers.regularUser.id,
          provider: 'google_calendar',
          access_token: 'valid_token'
        };
        env.DB._setMockData('SELECT * FROM calendar_integrations WHERE user_id = ? AND provider = ?', [mockIntegration]);

        // Mock Google Calendar API response
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockExternalAPIs.google.calendarEvents
        });

        env.DB._setMockData('INSERT INTO calendar_events', [
          { id: 'synced_event_1' },
          { id: 'synced_event_2' }
        ]);

        const response = await testRequest( 'POST', '/api/calendar/integrations/google_calendar/sync', {
          token: userToken
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          message: expect.stringContaining('synced'),
          synced: {
            imported: expect.any(Number),
            updated: expect.any(Number)
          }
        });
      });

      it('should handle sync errors gracefully', async () => {
        env.DB._setMockData('SELECT * FROM calendar_integrations WHERE user_id = ? AND provider = ?', []);

        const response = await testRequest( 'POST', '/api/calendar/integrations/google_calendar/sync', {
          token: userToken
        });

        expectErrorResponse(response, 404, 'Integration not found');
      });
    });
  });

  describe('Smart Scheduling', () => {
    describe('POST /api/calendar/smart-schedule', () => {
      it('should suggest optimal meeting times', async () => {
        const scheduleRequest = {
          title: 'Team Planning Meeting',
          duration: 60, // minutes
          attendees: ['colleague@example.com'],
          preferences: {
            preferredTimes: ['morning'],
            daysAhead: 7,
            excludeWeekends: true
          }
        };

        // Mock availability check
        env.DB._setMockData('SELECT * FROM calendar_events WHERE user_id = ? AND start_time BETWEEN ? AND ?', []);

        const response = await testRequest( 'POST', '/api/calendar/smart-schedule', {
          token: userToken,
          body: scheduleRequest
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          suggestions: expect.arrayContaining([
            expect.objectContaining({
              startTime: expect.any(Number),
              endTime: expect.any(Number),
              confidence: expect.any(Number),
              reason: expect.any(String)
            })
          ]),
          criteria: expect.objectContaining({
            duration: scheduleRequest.duration,
            preferences: expect.any(Object)
          })
        });
      });

      it('should handle no available slots', async () => {
        // Mock fully booked schedule
        const busySlots = Array.from({ length: 48 }, (_, i) => ({
          id: `busy_${i}`,
          start_time: Date.now() + (i * 1800000), // 30-min slots
          end_time: Date.now() + ((i + 1) * 1800000)
        }));
        
        env.DB._setMockData('SELECT * FROM calendar_events WHERE user_id = ? AND start_time BETWEEN ? AND ?', busySlots);

        const response = await testRequest( 'POST', '/api/calendar/smart-schedule', {
          token: userToken,
          body: {
            title: 'Meeting',
            duration: 60,
            preferences: { daysAhead: 1 }
          }
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body.suggestions).toEqual([]);
        expect(body.message).toContain('no available slots');
      });
    });

    describe('POST /api/calendar/find-common-time', () => {
      it('should find mutual availability', async () => {
        const request = {
          attendees: ['user1@example.com', 'user2@example.com'],
          duration: 30,
          timeRange: {
            start: Date.now(),
            end: Date.now() + 604800000 // 1 week
          }
        };

        // Mock external calendar availability check
        (fetch as any)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ busy: [] })
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ busy: [] })
          });

        const response = await testRequest( 'POST', '/api/calendar/find-common-time', {
          token: userToken,
          body: request
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          commonSlots: expect.arrayContaining([
            expect.objectContaining({
              startTime: expect.any(Number),
              endTime: expect.any(Number),
              allAvailable: true
            })
          ])
        });
      });
    });
  });

  describe('Reminders and Notifications', () => {
    describe('GET /api/calendar/reminders', () => {
      it('should get upcoming reminders', async () => {
        const mockReminders = [
          {
            id: 'reminder_1',
            event_id: testEvents[0].id,
            user_id: testUsers.regularUser.id,
            reminder_time: Date.now() + 900000, // 15 minutes
            type: 'notification',
            sent: false
          }
        ];

        env.DB._setMockData('SELECT * FROM event_reminders WHERE user_id = ? AND reminder_time > ?', mockReminders);

        const response = await testRequest( 'GET', '/api/calendar/reminders', {
          token: userToken
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          reminders: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              eventId: expect.any(String),
              reminderTime: expect.any(Number),
              type: expect.any(String)
            })
          ])
        });
      });
    });

    describe('POST /api/calendar/events/:id/reminders', () => {
      it('should set event reminder', async () => {
        const eventId = testEvents[0].id;
        const reminderData = {
          minutes: 15,
          type: 'notification'
        };

        env.DB._setMockData('SELECT * FROM calendar_events WHERE id = ? AND user_id = ?', [testEvents[0]]);
        env.DB._setMockData('INSERT INTO event_reminders', [{ id: 'new_reminder_id' }]);

        const response = await testRequest( 'POST', `/api/calendar/events/${eventId}/reminders`, {
          token: userToken,
          body: reminderData
        });

        expectSuccessResponse(response, 201);
        const body = await response.json();
        
        expect(body.message).toContain('reminder set');
        expect(body.reminder.minutes).toBe(reminderData.minutes);
      });
    });
  });

  describe('Calendar Analytics', () => {
    describe('GET /api/calendar/analytics/time-usage', () => {
      it('should analyze time usage patterns', async () => {
        const response = await testRequest( 'GET', '/api/calendar/analytics/time-usage', {
          token: userToken
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          timeUsage: {
            byCategory: expect.objectContaining({
              meetings: expect.any(Number),
              appointments: expect.any(Number)
            }),
            byTimeOfDay: expect.any(Object),
            totalScheduled: expect.any(Number),
            averageEventDuration: expect.any(Number)
          },
          insights: expect.arrayContaining([
            expect.objectContaining({
              type: expect.any(String),
              message: expect.any(String)
            })
          ])
        });
      });
    });

    describe('GET /api/calendar/analytics/productivity', () => {
      it('should analyze productivity patterns', async () => {
        const response = await testRequest( 'GET', '/api/calendar/analytics/productivity', {
          token: userToken
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          productivity: {
            focusTimeBlocks: expect.any(Number),
            meetingRatio: expect.any(Number),
            fragmentation: expect.any(Number)
          },
          recommendations: expect.any(Array)
        });
      });
    });
  });

  describe('Security and Privacy', () => {
    it('should require authentication for all endpoints', async () => {
      const endpoints = [
        { method: 'GET', path: '/api/calendar/events' },
        { method: 'POST', path: '/api/calendar/events' },
        { method: 'GET', path: '/api/calendar/integrations' },
        { method: 'POST', path: '/api/calendar/smart-schedule' }
      ];

      for (const endpoint of endpoints) {
        const response = await testRequest( endpoint.method, endpoint.path);
        expectErrorResponse(response, 401);
      }
    });

    it('should not expose other users\' events', async () => {
      env.DB._setMockData('SELECT * FROM calendar_events WHERE user_id = ?', []);

      const response = await testRequest( 'GET', '/api/calendar/events', {
        token: userToken
      });

      expectSuccessResponse(response);
      const body = await response.json();
      
      // Should only return events for the authenticated user
      body.events.forEach((event: any) => {
        expect(event.userId).toBe(testUsers.regularUser.id);
      });
    });
  });

  describe('Performance', () => {
    it('should respond quickly to event list requests', async () => {
      const start = Date.now();
      const response = await testRequest( 'GET', '/api/calendar/events', {
        token: userToken
      });
      const duration = Date.now() - start;

      expectSuccessResponse(response);
      expect(duration).toBeLessThan(300);
    });

    it('should handle large calendar sync efficiently', async () => {
      const mockIntegration = {
        id: 'integration_1',
        user_id: testUsers.regularUser.id,
        provider: 'google_calendar',
        access_token: 'valid_token'
      };
      env.DB._setMockData('SELECT * FROM calendar_integrations WHERE user_id = ? AND provider = ?', [mockIntegration]);

      // Mock large dataset
      const largeEventSet = Array.from({ length: 100 }, (_, i) => ({
        id: `event_${i}`,
        summary: `Event ${i}`,
        start: { dateTime: new Date(Date.now() + i * 3600000).toISOString() },
        end: { dateTime: new Date(Date.now() + (i + 1) * 3600000).toISOString() }
      }));

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: largeEventSet })
      });

      const start = Date.now();
      const response = await testRequest( 'POST', '/api/calendar/integrations/google_calendar/sync', {
        token: userToken
      });
      const duration = Date.now() - start;

      expectSuccessResponse(response);
      expect(duration).toBeLessThan(3000); // Should handle 100 events within 3 seconds
    });
  });
});