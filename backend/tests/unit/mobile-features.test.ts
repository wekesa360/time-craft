// Unit tests for Mobile Features Service

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MobileFeaturesService } from '../../src/lib/mobile-features';
import { DatabaseService } from '../../src/lib/db';

// Mock DatabaseService
const mockDb = {
  query: vi.fn(),
  execute: vi.fn()
} as unknown as DatabaseService;

// Mock fetch for OneSignal API
global.fetch = vi.fn();

describe('Mobile Features Service', () => {
  let mobileService: MobileFeaturesService;

  beforeEach(() => {
    vi.clearAllMocks();
    mobileService = new MobileFeaturesService(mockDb, 'test-app-id', 'test-api-key');
  });

  describe('Device Registration', () => {
    it('should register mobile device', async () => {
      mockDb.execute.mockResolvedValueOnce({ changes: 1 });

      const deviceId = await mobileService.registerDevice({
        userId: 'user123',
        deviceToken: 'device-token-123',
        platform: 'ios',
        appVersion: '1.0.0',
        osVersion: '17.0',
        capabilities: {
          pushNotifications: true,
          backgroundSync: true,
          hapticFeedback: true,
          camera: true,
          voice: true
        }
      });

      expect(deviceId).toMatch(/^device_\d+_[a-z0-9]+$/);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO mobile_devices'),
        expect.arrayContaining([
          expect.any(String), // deviceId
          'user123',
          'device-token-123',
          'ios',
          '1.0.0',
          '17.0',
          expect.any(Number), // lastSeen
          true,
          expect.any(String), // capabilities JSON
          expect.any(Number), // created_at
          expect.any(Number)  // updated_at
        ])
      );
    });
  });

  describe('Push Notifications', () => {
    it('should send push notification', async () => {
      mockDb.execute.mockResolvedValueOnce({ changes: 1 });
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'onesignal-123' })
      });

      const notificationId = await mobileService.sendPushNotification({
        userId: 'user123',
        title: 'Test Notification',
        body: 'This is a test',
        type: 'general',
        platform: 'ios'
      });

      expect(notificationId).toMatch(/^notif_\d+_[a-z0-9]+$/);
      expect(mockDb.execute).toHaveBeenCalledTimes(2); // Insert notification + update status
    });

    it('should schedule task reminder', async () => {
      mockDb.execute.mockResolvedValueOnce({ changes: 1 });
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'onesignal-123' })
      });

      const notificationId = await mobileService.scheduleTaskReminder(
        'user123',
        'task123',
        'Complete project',
        Date.now() + 3600000, // 1 hour from now
        'ios'
      );

      expect(notificationId).toMatch(/^notif_\d+_[a-z0-9]+$/);
    });

    it('should send achievement notification', async () => {
      mockDb.execute.mockResolvedValueOnce({ changes: 1 });
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'onesignal-123' })
      });

      const notificationId = await mobileService.sendAchievementNotification(
        'user123',
        'First Task Complete!',
        'You completed your first task',
        'ios'
      );

      expect(notificationId).toMatch(/^notif_\d+_[a-z0-9]+$/);
    });
  });

  describe('Offline Sync', () => {
    it('should handle offline sync data', async () => {
      mockDb.query.mockResolvedValueOnce({ results: [{ last_offline_sync: 0 }] });
      mockDb.execute.mockResolvedValueOnce({ changes: 1 }); // Update last sync time

      const result = await mobileService.handleOfflineSync('user123', {
        userId: 'user123',
        lastSyncAt: 0,
        pendingChanges: {
          tasks: [{ id: 'task1', title: 'Test task' }],
          events: [],
          healthData: [],
          habits: []
        },
        conflicts: []
      });

      expect(result.success).toBe(true);
      expect(result.syncedItems).toBe(1);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should get offline sync data', async () => {
      mockDb.query
        .mockResolvedValueOnce({ results: [{ last_offline_sync: 1234567890 }] })
        .mockResolvedValueOnce({ results: [{ id: 'task1', title: 'Test task' }] })
        .mockResolvedValueOnce({ results: [] });

      const syncData = await mobileService.getOfflineSyncData('user123');

      expect(syncData.userId).toBe('user123');
      expect(syncData.lastSyncAt).toBe(1234567890);
      expect(syncData.pendingChanges.tasks).toHaveLength(1);
    });
  });

  describe('Camera Integration', () => {
    it('should process camera data', async () => {
      const result = await mobileService.processCameraData('user123', {
        type: 'food',
        imageBase64: 'base64-encoded-image-data',
        metadata: { timestamp: Date.now() }
      });

      expect(result.success).toBe(true);
      expect(result.extractedData).toBeDefined();
      expect(result.extractedData.type).toBe('food');
    });
  });

  describe('Voice Commands', () => {
    it('should process voice command', async () => {
      const result = await mobileService.processVoiceCommand('user123', {
        audioBase64: 'base64-encoded-audio-data',
        language: 'en',
        context: 'task_creation'
      });

      expect(result.success).toBe(true);
      expect(result.intent).toBe('create_task');
      expect(result.response).toBe('Task created successfully from voice command');
    });
  });

  describe('Device Capabilities', () => {
    it('should get device capabilities', async () => {
      mockDb.query.mockResolvedValueOnce({
        results: [{ capabilities: '{"pushNotifications":true,"camera":true}' }]
      });

      const capabilities = await mobileService.getDeviceCapabilities('device123');

      expect(capabilities).toEqual({
        pushNotifications: true,
        camera: true
      });
    });

    it('should update device capabilities', async () => {
      mockDb.query.mockResolvedValueOnce({
        results: [{ capabilities: '{"pushNotifications":true}' }]
      });
      mockDb.execute.mockResolvedValueOnce({ changes: 1 });

      await mobileService.updateDeviceCapabilities('device123', {
        pushNotifications: false,
        camera: true
      });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE mobile_devices'),
        expect.arrayContaining([
          expect.any(String), // capabilities JSON
          expect.any(Number), // updated_at
          'device123'
        ])
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle device registration failure', async () => {
      mockDb.execute.mockRejectedValueOnce(new Error('Database error'));

      await expect(mobileService.registerDevice({
        userId: 'user123',
        deviceToken: 'device-token-123',
        platform: 'ios',
        appVersion: '1.0.0',
        osVersion: '17.0',
        capabilities: {
          pushNotifications: true,
          backgroundSync: true,
          hapticFeedback: true,
          camera: true,
          voice: true
        }
      })).rejects.toThrow('Database error');
    });

    it('should handle push notification failure', async () => {
      mockDb.execute.mockResolvedValueOnce({ changes: 1 });
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const notificationId = await mobileService.sendPushNotification({
        userId: 'user123',
        title: 'Test Notification',
        body: 'This is a test',
        type: 'general',
        platform: 'ios'
      });

      expect(notificationId).toMatch(/^notif_\d+_[a-z0-9]+$/);
      // Should still create notification record even if sending fails
    });
  });
});
