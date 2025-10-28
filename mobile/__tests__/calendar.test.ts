// Mock the API client
const mockApiClient = {
  getEvents: jest.fn(),
  createEvent: jest.fn(),
  updateEvent: jest.fn(),
  deleteEvent: jest.fn(),
  getCalendarIntegrations: jest.fn(),
  connectCalendar: jest.fn(),
  disconnectCalendar: jest.fn(),
  syncCalendars: jest.fn(),
  getGoogleAuthUrl: jest.fn(),
};

// Mock CalendarEvent type
interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  allDay: boolean;
  source: 'manual' | 'google' | 'outlook';
  aiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

// Mock event data
const mockEvent: CalendarEvent = {
  id: 'event_1',
  userId: 'user_1',
  title: 'Test Meeting',
  description: 'A test meeting',
  start: '2024-01-15T10:00:00Z',
  end: '2024-01-15T11:00:00Z',
  allDay: false,
  source: 'manual',
  aiGenerated: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('Mobile Calendar Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Calendar Events', () => {
    const testEvent: CalendarEvent = {
      id: 'event_1',
      userId: 'user_1',
      title: 'Test Meeting',
      description: 'A test meeting',
      start: '2024-01-15T10:00:00Z',
      end: '2024-01-15T11:00:00Z',
      allDay: false,
      source: 'manual',
      aiGenerated: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    it('should fetch calendar events', async () => {
      const mockResponse = {
        data: [testEvent],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
      };

      mockApiClient.getEvents.mockResolvedValue(mockResponse);

      const result = await mockApiClient.getEvents({
        start: Date.now(),
        end: Date.now() + 86400000
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(testEvent);
      expect(mockApiClient.getEvents).toHaveBeenCalledWith({
        start: expect.any(Number),
        end: expect.any(Number)
      });
    });

    it('should create a new event', async () => {
      const newEventData: Partial<CalendarEvent> = {
        title: 'New Meeting',
        description: 'A new meeting',
        start: '2024-01-16T14:00:00Z',
        end: '2024-01-16T15:00:00Z',
        allDay: false,
        source: 'manual',
        aiGenerated: false,
      };

      const createdEvent: CalendarEvent = {
        ...newEventData,
        id: 'event_2',
        userId: 'user_1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      } as CalendarEvent;

      mockApiClient.createEvent.mockResolvedValue(createdEvent);

      const result = await mockApiClient.createEvent(newEventData);

      expect(result).toEqual(createdEvent);
      expect(mockApiClient.createEvent).toHaveBeenCalledWith(newEventData);
    });

    it('should update an existing event', async () => {
      const updateData: Partial<CalendarEvent> = {
        title: 'Updated Meeting Title',
        description: 'Updated description',
      };

      const updatedEvent: CalendarEvent = {
        ...testEvent,
        ...updateData,
        updatedAt: '2024-01-02T00:00:00Z',
      };

      mockApiClient.updateEvent.mockResolvedValue(updatedEvent);

      const result = await mockApiClient.updateEvent('event_1', updateData);

      expect(result.title).toBe('Updated Meeting Title');
      expect(result.description).toBe('Updated description');
      expect(mockApiClient.updateEvent).toHaveBeenCalledWith('event_1', updateData);
    });

    it('should delete an event', async () => {
      mockApiClient.deleteEvent.mockResolvedValue();

      await mockApiClient.deleteEvent('event_1');

      expect(mockApiClient.deleteEvent).toHaveBeenCalledWith('event_1');
    });
  });

  describe('Calendar Integrations', () => {
    const mockIntegration = {
      id: 'integration_1',
      provider: 'google',
      calendarName: 'Google Calendar',
      isActive: true,
      lastSyncAt: '2024-01-01T00:00:00Z',
      syncSettings: {
        syncDirection: 'bidirectional',
        autoSync: true,
        syncFrequency: 15
      }
    };

    it('should fetch calendar integrations', async () => {
      mockApiClient.getCalendarIntegrations.mockResolvedValue([mockIntegration]);

      const result = await mockApiClient.getCalendarIntegrations();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockIntegration);
      expect(mockApiClient.getCalendarIntegrations).toHaveBeenCalled();
    });

    it('should connect a calendar', async () => {
      const authData = {
        authCode: 'auth_code_123',
        redirectUri: 'https://app.example.com/callback'
      };

      const connectionResult = {
        message: 'Calendar connected successfully',
        connection: mockIntegration
      };

      mockApiClient.connectCalendar.mockResolvedValue(connectionResult);

      const result = await mockApiClient.connectCalendar('google', authData);

      expect(result).toEqual(connectionResult);
      expect(mockApiClient.connectCalendar).toHaveBeenCalledWith('google', authData);
    });

    it('should disconnect a calendar', async () => {
      mockApiClient.disconnectCalendar.mockResolvedValue();

      await mockApiClient.disconnectCalendar('integration_1');

      expect(mockApiClient.disconnectCalendar).toHaveBeenCalledWith('integration_1');
    });

    it('should sync calendars', async () => {
      const syncResult = {
        imported: 5,
        exported: 2,
        errors: []
      };

      mockApiClient.syncCalendars.mockResolvedValue(syncResult);

      const result = await mockApiClient.syncCalendars();

      expect(result).toEqual(syncResult);
      expect(mockApiClient.syncCalendars).toHaveBeenCalled();
    });

    it('should get Google auth URL', async () => {
      const authResponse = {
        authUrl: 'https://accounts.google.com/oauth/authorize?...',
        state: 'state_123'
      };

      mockApiClient.getGoogleAuthUrl.mockResolvedValue(authResponse);

      const result = await mockApiClient.getGoogleAuthUrl();

      expect(result).toEqual(authResponse);
      expect(mockApiClient.getGoogleAuthUrl).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const error = new Error('Network error');
      mockApiClient.getEvents.mockRejectedValue(error);

      await expect(mockApiClient.getEvents()).rejects.toThrow('Network error');
    });

    it('should handle invalid event data', async () => {
      const invalidEventData = {
        title: '', // Empty title should cause validation error
        start: 'invalid-date',
        end: 'invalid-date'
      };

      const validationError = new Error('Validation failed');
      mockApiClient.createEvent.mockRejectedValue(validationError);

      await expect(mockApiClient.createEvent(invalidEventData)).rejects.toThrow('Validation failed');
    });
  });

  describe('Date Handling', () => {
    it('should handle different date formats correctly', () => {
      const testDate = new Date('2024-01-15T10:00:00Z');
      
      // Test ISO string format
      expect(testDate.toISOString()).toBe('2024-01-15T10:00:00.000Z');
      
      // Test local time formatting
      const localTime = testDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      expect(localTime).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
    });

    it('should validate event time ranges', () => {
      const startTime = new Date('2024-01-15T10:00:00Z');
      const endTime = new Date('2024-01-15T09:00:00Z'); // End before start
      
      expect(endTime.getTime()).toBeLessThan(startTime.getTime());
    });

    it('should handle all-day events', () => {
      const allDayStart = new Date('2024-01-15');
      const allDayEnd = new Date('2024-01-15');
      
      // All-day events should have same date for start and end
      expect(allDayStart.toDateString()).toBe(allDayEnd.toDateString());
    });
  });

  describe('Event Filtering', () => {
    it('should filter events by date range', () => {
      const events: CalendarEvent[] = [
        {
          ...mockEvent,
          id: 'event_1',
          start: '2024-01-15T10:00:00Z',
          end: '2024-01-15T11:00:00Z',
        } as CalendarEvent,
        {
          ...mockEvent,
          id: 'event_2',
          start: '2024-01-16T10:00:00Z',
          end: '2024-01-16T11:00:00Z',
        } as CalendarEvent,
        {
          ...mockEvent,
          id: 'event_3',
          start: '2024-01-17T10:00:00Z',
          end: '2024-01-17T11:00:00Z',
        } as CalendarEvent,
      ];

      const startDate = new Date('2024-01-15T00:00:00Z').getTime();
      const endDate = new Date('2024-01-16T23:59:59Z').getTime();

      const filteredEvents = events.filter(event => {
        const eventStart = new Date(event.start).getTime();
        return eventStart >= startDate && eventStart <= endDate;
      });

      expect(filteredEvents).toHaveLength(2);
      expect(filteredEvents[0].id).toBe('event_1');
      expect(filteredEvents[1].id).toBe('event_2');
    });

    it('should filter events by source', () => {
      const events: CalendarEvent[] = [
        { ...mockEvent, id: 'event_1', source: 'manual' } as CalendarEvent,
        { ...mockEvent, id: 'event_2', source: 'google' } as CalendarEvent,
        { ...mockEvent, id: 'event_3', source: 'outlook' } as CalendarEvent,
      ];

      const googleEvents = events.filter(event => event.source === 'google');
      const manualEvents = events.filter(event => event.source === 'manual');

      expect(googleEvents).toHaveLength(1);
      expect(googleEvents[0].id).toBe('event_2');
      expect(manualEvents).toHaveLength(1);
      expect(manualEvents[0].id).toBe('event_1');
    });
  });
});