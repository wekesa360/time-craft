// Apple Health Integration
// Handles Apple HealthKit data processing and sync

import { logger } from './logger';

export interface HealthDataPoint {
  id: string;
  type: HealthDataType;
  value: number;
  unit: string;
  startDate: string;
  endDate: string;
  sourceName: string;
  sourceVersion?: string;
  device?: string;
  metadata?: Record<string, any>;
}

export type HealthDataType = 
  | 'steps'
  | 'heartRate'
  | 'bloodPressure'
  | 'weight'
  | 'height'
  | 'bodyMassIndex'
  | 'activeEnergyBurned'
  | 'basalEnergyBurned'
  | 'distanceWalkingRunning'
  | 'flightsClimbed'
  | 'sleepAnalysis'
  | 'mindfulSession'
  | 'workout';

export interface HealthSummary {
  date: string;
  steps: number;
  activeCalories: number;
  restingCalories: number;
  heartRate: {
    average: number;
    resting: number;
    max: number;
  };
  sleep: {
    duration: number; // minutes
    quality: 'poor' | 'fair' | 'good' | 'excellent';
  };
  workouts: Array<{
    type: string;
    duration: number;
    calories: number;
    distance?: number;
  }>;
  mindfulness: {
    sessions: number;
    totalMinutes: number;
  };
}

export class AppleHealthService {
  private encryptionKey: string;

  constructor(encryptionKey: string) {
    this.encryptionKey = encryptionKey;
  }

  /**
   * Process raw Apple Health data from mobile app
   */
  async processHealthData(rawData: any[]): Promise<HealthDataPoint[]> {
    try {
      const processedData: HealthDataPoint[] = [];

      for (const item of rawData) {
        const dataPoint = this.parseHealthDataItem(item);
        if (dataPoint) {
          processedData.push(dataPoint);
        }
      }

      logger.info('Processed Apple Health data', {
        totalItems: rawData.length,
        processedItems: processedData.length
      });

      return processedData;
    } catch (error) {
      logger.error('Failed to process Apple Health data', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Parse individual health data item
   */
  private parseHealthDataItem(item: any): HealthDataPoint | null {
    try {
      // Validate required fields
      if (!item.type || !item.startDate || !item.endDate || !item.sourceName) {
        logger.warn('Skipping health data item with missing required fields', { item });
        return null;
      }

      // Map Apple Health types to our internal types
      const typeMapping: Record<string, HealthDataType> = {
        'HKQuantityTypeIdentifierStepCount': 'steps',
        'HKQuantityTypeIdentifierHeartRate': 'heartRate',
        'HKQuantityTypeIdentifierBloodPressureSystolic': 'bloodPressure',
        'HKQuantityTypeIdentifierBodyMass': 'weight',
        'HKQuantityTypeIdentifierHeight': 'height',
        'HKQuantityTypeIdentifierBodyMassIndex': 'bodyMassIndex',
        'HKQuantityTypeIdentifierActiveEnergyBurned': 'activeEnergyBurned',
        'HKQuantityTypeIdentifierBasalEnergyBurned': 'basalEnergyBurned',
        'HKQuantityTypeIdentifierDistanceWalkingRunning': 'distanceWalkingRunning',
        'HKQuantityTypeIdentifierFlightsClimbed': 'flightsClimbed',
        'HKCategoryTypeIdentifierSleepAnalysis': 'sleepAnalysis',
        'HKCategoryTypeIdentifierMindfulSession': 'mindfulSession',
        'HKWorkoutTypeIdentifier': 'workout'
      };

      const healthType = typeMapping[item.type];
      if (!healthType) {
        logger.warn('Unknown health data type', { type: item.type });
        return null;
      }

      // Validate value is a number
      const value = typeof item.value === 'number' ? item.value : 0;
      
      return {
        id: item.uuid || `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: healthType,
        value,
        unit: item.unit || 'count',
        startDate: item.startDate,
        endDate: item.endDate,
        sourceName: item.sourceName,
        sourceVersion: item.sourceVersion,
        device: item.device,
        metadata: item.metadata
      };
    } catch (error) {
      logger.error('Failed to parse health data item', {
        item,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Generate daily health summary
   */
  async generateHealthSummary(dataPoints: HealthDataPoint[], date: string): Promise<HealthSummary> {
    const dayData = dataPoints.filter(dp => 
      dp.startDate.startsWith(date.split('T')[0])
    );

    const steps = this.aggregateData(dayData, 'steps', 'sum');
    const activeCalories = this.aggregateData(dayData, 'activeEnergyBurned', 'sum');
    const restingCalories = this.aggregateData(dayData, 'basalEnergyBurned', 'sum');
    
    const heartRateData = dayData.filter(dp => dp.type === 'heartRate');
    const heartRate = {
      average: this.aggregateData(heartRateData, 'heartRate', 'average'),
      resting: this.aggregateData(heartRateData, 'heartRate', 'min'),
      max: this.aggregateData(heartRateData, 'heartRate', 'max')
    };

    const sleepData = dayData.filter(dp => dp.type === 'sleepAnalysis');
    const sleepDuration = this.aggregateData(sleepData, 'sleepAnalysis', 'sum');
    const sleep = {
      duration: sleepDuration,
      quality: this.assessSleepQuality(sleepDuration, sleepData)
    };

    const workoutData = dayData.filter(dp => dp.type === 'workout');
    const workouts = this.processWorkouts(workoutData);

    const mindfulnessData = dayData.filter(dp => dp.type === 'mindfulSession');
    const mindfulness = {
      sessions: mindfulnessData.length,
      totalMinutes: this.aggregateData(mindfulnessData, 'mindfulSession', 'sum')
    };

    return {
      date,
      steps,
      activeCalories,
      restingCalories,
      heartRate,
      sleep,
      workouts,
      mindfulness
    };
  }

  /**
   * Aggregate data points by type and operation
   */
  private aggregateData(dataPoints: HealthDataPoint[], type: HealthDataType, operation: 'sum' | 'average' | 'min' | 'max'): number {
    const filtered = dataPoints.filter(dp => dp.type === type);
    
    if (filtered.length === 0) return 0;

    const values = filtered.map(dp => dp.value);
    
    switch (operation) {
      case 'sum':
        return values.reduce((sum, val) => sum + val, 0);
      case 'average':
        return values.reduce((sum, val) => sum + val, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      default:
        return 0;
    }
  }

  /**
   * Assess sleep quality based on duration and patterns
   */
  private assessSleepQuality(duration: number, sleepData: HealthDataPoint[]): 'poor' | 'fair' | 'good' | 'excellent' {
    const hours = duration / 60;
    
    if (hours < 6) return 'poor';
    if (hours < 7) return 'fair';
    if (hours < 8) return 'good';
    return 'excellent';
  }

  /**
   * Process workout data
   */
  private processWorkouts(workoutData: HealthDataPoint[]): Array<{
    type: string;
    duration: number;
    calories: number;
    distance?: number;
  }> {
    return workoutData.map(workout => ({
      type: workout.metadata?.workoutType || 'Unknown',
      duration: workout.value,
      calories: workout.metadata?.calories || 0,
      distance: workout.metadata?.distance
    }));
  }

  /**
   * Encrypt sensitive health data
   */
  async encryptHealthData(data: HealthDataPoint[]): Promise<string> {
    // In a real implementation, use proper encryption
    // For now, return base64 encoded JSON
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  /**
   * Decrypt health data
   */
  async decryptHealthData(encryptedData: string): Promise<HealthDataPoint[]> {
    try {
      const jsonData = Buffer.from(encryptedData, 'base64').toString('utf-8');
      return JSON.parse(jsonData);
    } catch (error) {
      logger.error('Failed to decrypt health data', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to decrypt health data');
    }
  }

  /**
   * Validate health data integrity
   */
  validateHealthData(data: HealthDataPoint[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const item of data) {
      if (!item.id) errors.push('Missing ID');
      if (!item.type) errors.push('Missing type');
      if (typeof item.value !== 'number') errors.push('Invalid value');
      if (!item.startDate) errors.push('Missing start date');
      if (!item.endDate) errors.push('Missing end date');
      if (!item.sourceName) errors.push('Missing source name');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Create Apple Health service instance
 */
export function createAppleHealthService(env: any): AppleHealthService {
  const encryptionKey = env.ENCRYPTION_KEY;
  
  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY is required for Apple Health service');
  }
  
  return new AppleHealthService(encryptionKey);
}
