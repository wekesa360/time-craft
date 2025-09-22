// Apple Health Integration Unit Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppleHealthService, createAppleHealthService } from '../../src/lib/apple-health';
import { createMockEnv } from '../utils/test-helpers';

describe('Apple Health Integration', () => {
  let appleHealthService: AppleHealthService;
  let mockEnv: any;

  beforeEach(() => {
    mockEnv = createMockEnv();
    appleHealthService = createAppleHealthService(mockEnv);
    vi.clearAllMocks();
  });

  describe('AppleHealthService', () => {
    it('should create service with valid encryption key', () => {
      expect(appleHealthService).toBeInstanceOf(AppleHealthService);
    });

    it('should throw error when encryption key is missing', () => {
      const invalidEnv = { ...mockEnv, ENCRYPTION_KEY: undefined };
      expect(() => createAppleHealthService(invalidEnv)).toThrow('ENCRYPTION_KEY is required');
    });

    it('should process raw Apple Health data successfully', async () => {
      const rawData = [
        {
          type: 'HKQuantityTypeIdentifierStepCount',
          value: 8500,
          unit: 'count',
          startDate: '2025-01-20T00:00:00Z',
          endDate: '2025-01-20T23:59:59Z',
          sourceName: 'Apple Health',
          uuid: 'step-uuid-123'
        },
        {
          type: 'HKQuantityTypeIdentifierHeartRate',
          value: 72,
          unit: 'bpm',
          startDate: '2025-01-20T10:00:00Z',
          endDate: '2025-01-20T10:01:00Z',
          sourceName: 'Apple Watch',
          uuid: 'heart-uuid-456'
        }
      ];

      const processedData = await appleHealthService.processHealthData(rawData);

      expect(processedData).toHaveLength(2);
      expect(processedData[0].type).toBe('steps');
      expect(processedData[0].value).toBe(8500);
      expect(processedData[1].type).toBe('heartRate');
      expect(processedData[1].value).toBe(72);
    });

    it('should handle invalid data gracefully', async () => {
      const rawData = [
        {
          type: 'HKQuantityTypeIdentifierStepCount',
          value: 5000,
          unit: 'count',
          startDate: '2025-01-20T00:00:00Z',
          endDate: '2025-01-20T23:59:59Z',
          sourceName: 'Apple Health'
        },
        {
          // Missing required fields
          type: 'HKQuantityTypeIdentifierHeartRate'
        }
      ];

      const processedData = await appleHealthService.processHealthData(rawData);

      expect(processedData).toHaveLength(1);
      expect(processedData[0].type).toBe('steps');
    });

    it('should generate health summary correctly', async () => {
      const dataPoints = [
        {
          id: '1',
          type: 'steps' as const,
          value: 8500,
          unit: 'count',
          startDate: '2025-01-20T00:00:00Z',
          endDate: '2025-01-20T23:59:59Z',
          sourceName: 'Apple Health'
        },
        {
          id: '2',
          type: 'activeEnergyBurned' as const,
          value: 450,
          unit: 'kcal',
          startDate: '2025-01-20T00:00:00Z',
          endDate: '2025-01-20T23:59:59Z',
          sourceName: 'Apple Health'
        },
        {
          id: '3',
          type: 'heartRate' as const,
          value: 72,
          unit: 'bpm',
          startDate: '2025-01-20T10:00:00Z',
          endDate: '2025-01-20T10:01:00Z',
          sourceName: 'Apple Watch'
        },
        {
          id: '4',
          type: 'sleepAnalysis' as const,
          value: 480, // 8 hours in minutes
          unit: 'min',
          startDate: '2025-01-20T22:00:00Z',
          endDate: '2025-01-21T06:00:00Z',
          sourceName: 'Apple Health'
        }
      ];

      const summary = await appleHealthService.generateHealthSummary(dataPoints, '2025-01-20');

      expect(summary.date).toBe('2025-01-20');
      expect(summary.steps).toBe(8500);
      expect(summary.activeCalories).toBe(450);
      expect(summary.heartRate.average).toBe(72);
      expect(summary.heartRate.resting).toBe(72);
      expect(summary.heartRate.max).toBe(72);
      expect(summary.sleep.duration).toBe(480);
      expect(summary.sleep.quality).toBe('excellent');
    });

    it('should assess sleep quality correctly', async () => {
      const testCases = [
        { duration: 300, expected: 'poor' },   // 5 hours
        { duration: 360, expected: 'fair' },   // 6 hours
        { duration: 420, expected: 'good' },   // 7 hours
        { duration: 480, expected: 'excellent' } // 8 hours
      ];

      for (const testCase of testCases) {
        const dataPoints = [{
          id: '1',
          type: 'sleepAnalysis' as const,
          value: testCase.duration,
          unit: 'min',
          startDate: '2025-01-20T22:00:00Z',
          endDate: '2025-01-21T06:00:00Z',
          sourceName: 'Apple Health'
        }];

        const summary = await appleHealthService.generateHealthSummary(dataPoints, '2025-01-20');
        expect(summary.sleep.quality).toBe(testCase.expected);
      }
    });

    it('should process workout data correctly', async () => {
      const dataPoints = [
        {
          id: '1',
          type: 'workout' as const,
          value: 30, // 30 minutes
          unit: 'min',
          startDate: '2025-01-20T08:00:00Z',
          endDate: '2025-01-20T08:30:00Z',
          sourceName: 'Apple Watch',
          metadata: {
            workoutType: 'Running',
            calories: 300,
            distance: 5.2
          }
        }
      ];

      const summary = await appleHealthService.generateHealthSummary(dataPoints, '2025-01-20');

      expect(summary.workouts).toHaveLength(1);
      expect(summary.workouts[0].type).toBe('Running');
      expect(summary.workouts[0].duration).toBe(30);
      expect(summary.workouts[0].calories).toBe(300);
      expect(summary.workouts[0].distance).toBe(5.2);
    });

    it('should encrypt and decrypt health data', async () => {
      const dataPoints = [
        {
          id: '1',
          type: 'steps' as const,
          value: 5000,
          unit: 'count',
          startDate: '2025-01-20T00:00:00Z',
          endDate: '2025-01-20T23:59:59Z',
          sourceName: 'Apple Health'
        }
      ];

      const encrypted = await appleHealthService.encryptHealthData(dataPoints);
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);

      const decrypted = await appleHealthService.decryptHealthData(encrypted);
      expect(decrypted).toHaveLength(1);
      expect(decrypted[0].id).toBe('1');
      expect(decrypted[0].value).toBe(5000);
    });

    it('should validate health data correctly', () => {
      const validData = [
        {
          id: '1',
          type: 'steps' as const,
          value: 5000,
          unit: 'count',
          startDate: '2025-01-20T00:00:00Z',
          endDate: '2025-01-20T23:59:59Z',
          sourceName: 'Apple Health'
        }
      ];

      const invalidData = [
        {
          id: '1',
          type: 'steps' as const,
          value: 'invalid', // Should be number
          unit: 'count',
          startDate: '2025-01-20T00:00:00Z',
          endDate: '2025-01-20T23:59:59Z',
          sourceName: 'Apple Health'
        },
        {
          // Missing required fields
          type: 'heartRate' as const,
          value: 72
        }
      ];

      const validResult = appleHealthService.validateHealthData(validData);
      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      const invalidResult = appleHealthService.validateHealthData(invalidData);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty data gracefully', async () => {
      const summary = await appleHealthService.generateHealthSummary([], '2025-01-20');

      expect(summary.date).toBe('2025-01-20');
      expect(summary.steps).toBe(0);
      expect(summary.activeCalories).toBe(0);
      expect(summary.heartRate.average).toBe(0);
      expect(summary.sleep.duration).toBe(0);
      expect(summary.workouts).toHaveLength(0);
      expect(summary.mindfulness.sessions).toBe(0);
    });
  });
});
