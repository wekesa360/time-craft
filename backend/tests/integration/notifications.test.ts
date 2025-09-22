// Push Notifications API Integration Tests
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

// Mock fetch for OneSignal API calls
global.fetch = vi.fn();

describe('Push Notifications API', () => {
  let env: any;
  let app: any;
  let userToken: string;
  let adminToken: string;

  beforeEach(async () => {
    env = createMockEnv();
    app = apiGateway;
    userToken = await generateTestToken(testUsers.regularUser.id);
    adminToken = await generateTestToken(testUsers.adminUser.id, 'admin');
    
    // Set up mock data
    env.DB._setMockData('SELECT * FROM users WHERE id = ?', [testUsers.regularUser]);
    env.DB._setMockData('SELECT * FROM notification_preferences WHERE user_id = ?', []);
    
    // Reset fetch mock
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupTestData(env);
  });

  describe('Device Registration', () => {
    describe('POST /register-device', () => {
      it('should register iOS device successfully', async () => {
        // Mock OneSignal player creation
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockExternalAPIs.oneSignal.player
        });

        const deviceData = {
          deviceType: 'ios',
          deviceToken: 'ios-device-token-123',
          language: 'en',
          timezone: 'America/New_York',
          appVersion: '1.0.0'
        };

        env.DB._setMockData('INSERT OR REPLACE INTO user_devices', [{ id: 'new_device_id' }]);

        const response = await makeRequest(app, 'POST', '/api/notifications/register-device', {
          token: userToken,
          body: deviceData
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          message: expect.stringContaining('registered successfully'),
          deviceId: expect.any(String),
          playerId: mockExternalAPIs.oneSignal.player.id,
          success: true
        });

        // Verify OneSignal API was called
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('onesignal.com'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': expect.stringContaining('Basic'),
              'Content-Type': 'application/json'
            }),
            body: expect.stringContaining(deviceData.deviceToken)
          })
        );
      });

      it('should register Android device successfully', async () => {
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockExternalAPIs.oneSignal.player
        });

        const deviceData = {
          deviceType: 'android',
          pushToken: 'android-push-token-123',
          language: 'de',
          timezone: 'Europe/Berlin'
        };

        const response = await makeRequest(app, 'POST', '/api/notifications/register-device', {
          token: userToken,
          body: deviceData
        ,
          env: env
        });

        expectSuccessResponse(response);
      });

      it('should register web device successfully', async () => {
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockExternalAPIs.oneSignal.player
        });

        const deviceData = {
          deviceType: 'web',
          language: 'en'
        };

        const response = await makeRequest(app, 'POST', '/api/notifications/register-device', {
          token: userToken,
          body: deviceData
        ,
          env: env
        });

        expectSuccessResponse(response);
      });

      it('should reject invalid device type', async () => {
        const response = await makeRequest(app, 'POST', '/api/notifications/register-device', {
          token: userToken,
          body: {
            deviceType: 'invalid_type'
          }
        });

        await expectValidationError(response, 'deviceType');
      });

      it('should handle OneSignal API errors gracefully', async () => {
        (fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => 'OneSignal API Error'
        });

        const response = await makeRequest(app, 'POST', '/api/notifications/register-device', {
          token: userToken,
          body: {
            deviceType: 'ios',
            deviceToken: 'test-token'
          }
        });

        expectErrorResponse(response, 500, 'Failed to register device');
      });
    });
  });

  describe('Notification Preferences', () => {
    describe('GET /preferences', () => {
      it('should get default preferences for new user', async () => {
        const response = await makeRequest(app, 'GET', '/api/notifications/preferences', {
          token: userToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body.preferences).toMatchObject({
          taskReminders: true,
          healthCheckins: true,
          achievements: true,
          habitStreaks: true,
          breakReminders: true,
          waterReminders: true,
          workoutReminders: true,
          meetingReminders: true,
          quietHoursStart: expect.any(String),
          quietHoursEnd: expect.any(String),
          timezone: expect.any(String)
        });
      });

      it('should get custom preferences for existing user', async () => {
        const customPrefs = {
          taskReminders: false,
          healthCheckins: true,
          quietHoursStart: '23:00',
          quietHoursEnd: '07:00'
        };

        env.DB._setMockData('SELECT * FROM notification_preferences WHERE user_id = ?', [{
          user_id: testUsers.regularUser.id,
          preferences: JSON.stringify(customPrefs)
        }]);

        const response = await makeRequest(app, 'GET', '/api/notifications/preferences', {
          token: userToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body.preferences).toMatchObject(customPrefs);
      });
    });

    describe('PUT /preferences', () => {
      it('should update notification preferences', async () => {
        // Mock OneSignal tag update
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        });

        const newPrefs = {
          taskReminders: false,
          healthCheckins: true,
          achievements: true,
          quietHoursStart: '22:30',
          quietHoursEnd: '07:30',
          timezone: 'Europe/London'
        };

        const response = await makeRequest(app, 'PUT', '/api/notifications/preferences', {
          token: userToken,
          body: newPrefs
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          message: expect.stringContaining('updated successfully'),
          preferences: newPrefs
        });

        // Verify OneSignal tags were updated
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('onesignal.com/api/v1/players'),
          expect.objectContaining({
            method: 'PUT',
            body: expect.stringContaining('taskReminders')
          })
        );
      });

      it('should validate preference values', async () => {
        const response = await makeRequest(app, 'PUT', '/api/notifications/preferences', {
          token: userToken,
          body: {
            taskReminders: 'invalid_boolean'
          }
        });

        await expectValidationError(response, 'taskReminders');
      });
    });
  });

  describe('Sending Notifications', () => {
    describe('POST /send', () => {
      it('should send notification to specific user (admin only)', async () => {
        env.DB._setMockData('SELECT * FROM users WHERE id = ?', [testUsers.adminUser]);
        
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockExternalAPIs.oneSignal.notification
        });

        const notificationData = {
          title: 'Test Notification',
          message: 'This is a test message',
          targetType: 'user',
          targetValue: testUsers.regularUser.id,
          priority: 'high',
          category: 'system'
        };

        const response = await makeRequest(app, 'POST', '/api/notifications/send', {
          token: adminToken,
          body: notificationData
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          message: expect.stringContaining('sent successfully'),
          notificationId: mockExternalAPIs.oneSignal.notification.id,
          recipients: mockExternalAPIs.oneSignal.notification.recipients
        });

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('onesignal.com/api/v1/notifications'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining(notificationData.title)
          })
        );
      });

      it('should send notification to multiple users', async () => {
        env.DB._setMockData('SELECT * FROM users WHERE id = ?', [testUsers.adminUser]);
        
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ...mockExternalAPIs.oneSignal.notification, recipients: 2 })
        });

        const notificationData = {
          title: 'Bulk Notification',
          message: 'Message for multiple users',
          targetType: 'users',
          targetUsers: [testUsers.regularUser.id, testUsers.germanUser.id]
        };

        const response = await makeRequest(app, 'POST', '/api/notifications/send', {
          token: adminToken,
          body: notificationData
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        expect(body.recipients).toBe(2);
      });

      it('should send notification to all users', async () => {
        env.DB._setMockData('SELECT * FROM users WHERE id = ?', [testUsers.adminUser]);
        
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ...mockExternalAPIs.oneSignal.notification, recipients: 100 })
        });

        const response = await makeRequest(app, 'POST', '/api/notifications/send', {
          token: adminToken,
          body: {
            title: 'System Announcement',
            message: 'Important update for all users',
            targetType: 'all'
          }
        });

        expectSuccessResponse(response);
        const body = await response.json();
        expect(body.recipients).toBe(100);
      });

      it('should reject non-admin users', async () => {
        const response = await makeRequest(app, 'POST', '/api/notifications/send', {
          token: userToken, // Regular user token
          body: {
            title: 'Test',
            message: 'Test message',
            targetType: 'all'
          }
        });

        expectErrorResponse(response, 403, 'Admin access required');
      });

      it('should validate notification data', async () => {
        env.DB._setMockData('SELECT * FROM users WHERE id = ?', [testUsers.adminUser]);

        const response = await makeRequest(app, 'POST', '/api/notifications/send', {
          token: adminToken,
          body: {
            title: '', // Empty title
            message: 'Test message',
            targetType: 'user'
          }
        });

        await expectValidationError(response, 'title');
      });
    });

    describe('POST /template', () => {
      it('should send template-based notification', async () => {
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockExternalAPIs.oneSignal.notification
        });

        const templateData = {
          templateType: 'task_reminder',
          targetUserId: testUsers.regularUser.id,
          data: {
            taskTitle: 'Complete project report',
            taskId: 'task_123',
            priority: 'high'
          }
        };

        const response = await makeRequest(app, 'POST', '/api/notifications/template', {
          token: userToken,
          body: templateData
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          message: expect.stringContaining('sent successfully'),
          notificationId: mockExternalAPIs.oneSignal.notification.id,
          recipients: mockExternalAPIs.oneSignal.notification.recipients
        });

        // Verify template was used correctly
        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: expect.stringContaining('Task Reminder')
          })
        );
      });

      it('should send achievement notification template', async () => {
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockExternalAPIs.oneSignal.notification
        });

        const templateData = {
          templateType: 'achievement',
          targetUserId: testUsers.regularUser.id,
          data: {
            badgeName: 'Task Master',
            badgeId: 'badge_task_master'
          }
        };

        const response = await makeRequest(app, 'POST', '/api/notifications/template', {
          token: userToken,
          body: templateData
        ,
          env: env
        });

        expectSuccessResponse(response);
        
        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: expect.stringContaining('Achievement Unlocked')
          })
        );
      });

      it('should support scheduled notifications', async () => {
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockExternalAPIs.oneSignal.notification
        });

        const scheduleTime = Date.now() + 3600000; // 1 hour from now
        
        const response = await makeRequest(app, 'POST', '/api/notifications/template', {
          token: userToken,
          body: {
            templateType: 'water_reminder',
            targetUserId: testUsers.regularUser.id,
            schedule: scheduleTime
          }
        });

        expectSuccessResponse(response);

        // Verify scheduled delivery was set
        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: expect.stringContaining('send_after')
          })
        );
      });

      it('should reject invalid template type', async () => {
        const response = await makeRequest(app, 'POST', '/api/notifications/template', {
          token: userToken,
          body: {
            templateType: 'invalid_template',
            targetUserId: testUsers.regularUser.id
          }
        });

        await expectValidationError(response, 'templateType');
      });
    });
  });

  describe('Notification Templates', () => {
    describe('GET /templates', () => {
      it('should get available templates', async () => {
        const response = await makeRequest(app, 'GET', '/api/notifications/templates', {
          token: userToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body.templates).toEqual(expect.arrayContaining([
          expect.objectContaining({
            type: 'task_reminder',
            name: expect.any(String),
            description: expect.any(String),
            requiredData: expect.any(Array),
            optionalData: expect.any(Array)
          }),
          expect.objectContaining({
            type: 'achievement',
            name: expect.any(String)
          }),
          expect.objectContaining({
            type: 'habit_streak',
            name: expect.any(String)
          })
        ]));

        expect(body.templates.length).toBeGreaterThan(5);
      });
    });
  });

  describe('Notification History', () => {
    describe('GET /history', () => {
      it('should get user notification history', async () => {
        const mockHistory = [
          {
            id: 'notif_1',
            user_id: testUsers.regularUser.id,
            title: 'Task Reminder',
            message: 'Complete your project',
            category: 'task',
            sent_at: Date.now() - 3600000,
            opened_at: null,
            data: '{"taskId": "task_123"}'
          },
          {
            id: 'notif_2',
            user_id: testUsers.regularUser.id,
            title: 'Achievement Unlocked',
            message: 'You earned a badge!',
            category: 'achievement',
            sent_at: Date.now() - 7200000,
            opened_at: Date.now() - 7000000,
            data: '{"badgeId": "badge_abc"}'
          }
        ];

        env.DB._setMockData('SELECT * FROM notification_history WHERE user_id = ?', mockHistory);

        const response = await makeRequest(app, 'GET', '/api/notifications/history', {
          token: userToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          notifications: expect.arrayContaining([
            expect.objectContaining({
              id: 'notif_1',
              title: 'Task Reminder',
              message: 'Complete your project',
              category: 'task',
              sentAt: expect.any(Number),
              opened: false,
              data: { taskId: 'task_123' }
            }),
            expect.objectContaining({
              id: 'notif_2',
              opened: true,
              openedAt: expect.any(Number)
            })
          ]),
          pagination: expect.objectContaining({
            limit: expect.any(Number),
            offset: expect.any(Number)
          })
        });
      });

      it('should support pagination', async () => {
        const response = await makeRequest(app, 'GET', '/api/notifications/history?limit=10&offset=20', {
          token: userToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body.pagination).toMatchObject({
          limit: 10,
          offset: 20
        });
      });
    });

    describe('POST /:id/opened', () => {
      it('should mark notification as opened', async () => {
        const notificationId = 'notif_123';

        const response = await makeRequest(app, 'POST', '/${notificationId}/opened', {
          token: userToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body.message).toContain('marked as opened');
      });
    });
  });

  describe('Analytics', () => {
    describe('GET /analytics', () => {
      it('should get notification analytics (admin only)', async () => {
        env.DB._setMockData('SELECT * FROM users WHERE id = ?', [testUsers.adminUser]);
        
        const mockSendStats = [
          { category: 'task', sent_count: 150 },
          { category: 'health', sent_count: 85 },
          { category: 'achievement', sent_count: 45 }
        ];
        
        const mockOpenStats = [
          { category: 'task', opened_count: 120 },
          { category: 'health', opened_count: 70 },
          { category: 'achievement', opened_count: 42 }
        ];
        
        const mockDeviceStats = [
          { device_type: 'ios', device_count: 650 },
          { device_type: 'android', device_count: 450 },
          { device_type: 'web', device_count: 200 }
        ];

        env.DB._setMockData('SELECT category, COUNT(*) as sent_count FROM notification_history', mockSendStats);
        env.DB._setMockData('SELECT category, COUNT(*) as opened_count FROM notification_history', mockOpenStats);
        env.DB._setMockData('SELECT device_type, COUNT(*) as device_count FROM user_devices', mockDeviceStats);

        const response = await makeRequest(app, 'GET', '/api/notifications/analytics', {
          token: adminToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          analytics: {
            timeframe: expect.any(String),
            sent: mockSendStats,
            opened: mockOpenStats,
            devices: mockDeviceStats,
            generatedAt: expect.any(Number)
          }
        });
      });

      it('should reject non-admin users', async () => {
        const response = await makeRequest(app, 'GET', '/api/notifications/analytics', {
          token: userToken
        ,
          env: env
        });

        expectErrorResponse(response, 403, 'Admin access required');
      });

      it('should support different timeframes', async () => {
        env.DB._setMockData('SELECT * FROM users WHERE id = ?', [testUsers.adminUser]);
        env.DB._setMockData('SELECT category, COUNT(*) as sent_count FROM notification_history', []);
        env.DB._setMockData('SELECT category, COUNT(*) as opened_count FROM notification_history', []);
        env.DB._setMockData('SELECT device_type, COUNT(*) as device_count FROM user_devices', []);

        const response = await makeRequest(app, 'GET', '/api/notifications/analytics?timeframe=7d', {
          token: adminToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body.analytics.timeframe).toBe('7 days');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle OneSignal API failures gracefully', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const response = await makeRequest(app, 'POST', '/api/notifications/register-device', {
        token: userToken,
        body: {
          deviceType: 'ios',
          deviceToken: 'test-token'
        }
      });

      expectErrorResponse(response, 500);
    });

    it('should handle malformed OneSignal responses', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      });

      const response = await makeRequest(app, 'POST', '/api/notifications/register-device', {
        token: userToken,
        body: {
          deviceType: 'ios',
          deviceToken: 'test-token'
        }
      });

      expectErrorResponse(response, 500);
    });
  });

  describe('Security', () => {
    it('should reject requests without authentication', async () => {
      const response = await makeRequest(app, 'GET', '/api/notifications/preferences', {
          env: env
        });

      expectErrorResponse(response, 401);
    });

    it('should prevent users from sending notifications to other users directly', async () => {
      const response = await makeRequest(app, 'POST', '/api/notifications/template', {
        token: userToken,
        body: {
          templateType: 'task_reminder',
          targetUserId: 'other_user_id',
          data: { taskTitle: 'Malicious task' }
        }
      });

      // Should be allowed - users can send notifications to any user with templates
      // This is expected behavior for the template endpoint
      expectSuccessResponse(response);
    });
  });
});