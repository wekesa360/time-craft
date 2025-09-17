// Health API Integration Tests
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import apiGateway from '../../src/workers/api-gateway';
import { 
  createMockEnv, 
  testUsers, 
  testHealthLogs,
  generateTestToken,
  makeRequest, 
  expectSuccessResponse, 
  expectErrorResponse,
  expectValidationError,
  cleanupTestData
} from '../utils/test-helpers';

describe('Health API', () => {
  let env: any;
  let app: any;
  let userToken: string;

  beforeEach(async () => {
    env = createMockEnv();
    app = apiGateway;
    userToken = await generateTestToken(testUsers.regularUser.id);
    
    // Set up mock data
    env.DB._setMockData('SELECT * FROM users WHERE id = ?', [testUsers.regularUser]);
    env.DB._setMockData('SELECT * FROM health_logs WHERE user_id = ?', testHealthLogs);
  });

  afterEach(() => {
    cleanupTestData(env);
  });

  describe('Health Logging', () => {
    describe('POST /manual-entry', () => {
      it('should log exercise activity successfully', async () => {
        const exerciseData = {
          type: 'exercise',
          value: 45,
          unit: 'minutes',
          notes: 'Morning gym session',
          category: 'strength_training'
        };

        env.DB._setMockData('INSERT INTO health_logs', [{ id: 'new_health_log_id' }]);

        const response = await makeRequest(app, 'POST', '/api/health/manual-entry', {
          token: userToken,
          body: exerciseData
        });

        expectSuccessResponse(response, 201);
        const body = await response.json();
        
        expect(body).toMatchObject({
          message: expect.stringContaining('logged successfully'),
          healthLog: {
            type: exerciseData.type,
            value: exerciseData.value,
            unit: exerciseData.unit,
            notes: exerciseData.notes
          }
        });
      });

      it('should log mood successfully', async () => {
        const moodData = {
          type: 'mood',
          value: 8,
          unit: 'scale',
          notes: 'Feeling great today!',
          mood_type: 'happy'
        };

        env.DB._setMockData('INSERT INTO health_logs', [{ id: 'new_mood_log_id' }]);

        const response = await makeRequest(app, 'POST', '/api/health/manual-entry', {
          token: userToken,
          body: moodData
        });

        expectSuccessResponse(response, 201);
        const body = await response.json();
        
        expect(body.healthLog).toMatchObject({
          type: 'mood',
          value: 8,
          notes: 'Feeling great today!'
        });
      });

      it('should reject invalid health type', async () => {
        const response = await makeRequest(app, 'POST', '/api/health/manual-entry', {
          token: userToken,
          body: {
            type: 'invalid_type',
            value: 5,
            unit: 'scale'
          }
        });

        await expectValidationError(response, 'type');
      });

      it('should reject missing required fields', async () => {
        const response = await makeRequest(app, 'POST', '/api/health/manual-entry', {
          token: userToken,
          body: {
            value: 10
            // Missing type and unit
          }
        });

        await expectValidationError(response);
      });
    });

    describe('POST /nutrition', () => {
      it('should log nutrition successfully', async () => {
        const nutritionData = {
          meal_type: 'breakfast',
          description: 'Oatmeal with berries and honey',
          calories: 350,
          protein: 12,
          carbs: 58,
          fat: 8
        };

        env.DB._setMockData('INSERT INTO health_logs', [{ id: 'new_nutrition_log_id' }]);

        const response = await makeRequest(app, 'POST', '/api/health/nutrition', {
          token: userToken,
          body: nutritionData
        });

        expectSuccessResponse(response, 201);
        const body = await response.json();
        
        expect(body.healthLog).toMatchObject({
          type: 'nutrition',
          notes: expect.stringContaining(nutritionData.description)
        });
      });

      it('should handle voice input for nutrition', async () => {
        const response = await makeRequest(app, 'POST', '/api/health/nutrition', {
          token: userToken,
          body: {
            voice_input: 'I had scrambled eggs and toast for breakfast',
            meal_type: 'breakfast'
          }
        });

        expectSuccessResponse(response, 201);
      });
    });

    describe('POST /exercise', () => {
      it('should log exercise successfully', async () => {
        const exerciseData = {
          activity_type: 'running',
          duration: 30,
          intensity: 'moderate',
          calories_burned: 300,
          distance: 5,
          notes: 'Morning run in the park'
        };

        env.DB._setMockData('INSERT INTO health_logs', [{ id: 'new_exercise_log_id' }]);

        const response = await makeRequest(app, 'POST', '/api/health/exercise', {
          token: userToken,
          body: exerciseData
        });

        expectSuccessResponse(response, 201);
        const body = await response.json();
        
        expect(body.healthLog).toMatchObject({
          type: 'exercise',
          value: exerciseData.duration
        });
      });

      it('should accept device sync data', async () => {
        const response = await makeRequest(app, 'POST', '/api/health/exercise', {
          token: userToken,
          body: {
            device_data: {
              source: 'apple_watch',
              workout_type: 'cycling',
              duration: 45,
              heart_rate_avg: 145,
              calories: 400
            }
          }
        });

        expectSuccessResponse(response, 201);
      });
    });

    describe('POST /hydration', () => {
      it('should log hydration successfully', async () => {
        const hydrationData = {
          amount: 500,
          unit: 'ml',
          drink_type: 'water'
        };

        env.DB._setMockData('INSERT INTO health_logs', [{ id: 'new_hydration_log_id' }]);

        const response = await makeRequest(app, 'POST', '/api/health/hydration', {
          token: userToken,
          body: hydrationData
        });

        expectSuccessResponse(response, 201);
        const body = await response.json();
        
        expect(body.healthLog).toMatchObject({
          type: 'hydration',
          value: hydrationData.amount,
          unit: hydrationData.unit
        });
      });

      it('should convert units automatically', async () => {
        const response = await makeRequest(app, 'POST', '/api/health/hydration', {
          token: userToken,
          body: {
            amount: 2,
            unit: 'cups'
          }
        });

        expectSuccessResponse(response, 201);
        const body = await response.json();
        
        // Should convert cups to ml
        expect(body.healthLog.value).toBeGreaterThan(400);
        expect(body.healthLog.unit).toBe('ml');
      });
    });
  });

  describe('Health Data Retrieval', () => {
    describe('GET /summary', () => {
      it('should get health summary successfully', async () => {
        // Mock summary data
        env.DB._setMockData('SELECT type, COUNT(*) as count, AVG(value) as avg FROM health_logs', [
          { type: 'exercise', count: 5, avg: 40 },
          { type: 'mood', count: 7, avg: 7.5 },
          { type: 'hydration', count: 10, avg: 2000 }
        ]);

        const response = await makeRequest(app, 'GET', '/api/health/summary', {
          token: userToken
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          summary: {
            exercise: expect.objectContaining({
              totalSessions: expect.any(Number),
              averageMinutes: expect.any(Number)
            }),
            mood: expect.objectContaining({
              averageScore: expect.any(Number),
              totalEntries: expect.any(Number)
            }),
            hydration: expect.objectContaining({
              averageDaily: expect.any(Number),
              totalEntries: expect.any(Number)
            })
          },
          timeframe: expect.any(String)
        });
      });

      it('should filter summary by date range', async () => {
        const startDate = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days ago
        const endDate = Date.now();

        const response = await makeRequest(app, 'GET', `/summary?start=${startDate}&end=${endDate}`, {
          token: userToken
        });

        expectSuccessResponse(response);
        const body = await response.json();
        expect(body.timeframe).toContain('7 days');
      });
    });

    describe('GET /logs', () => {
      it('should get health logs successfully', async () => {
        const response = await makeRequest(app, 'GET', '/api/health/logs', {
          token: userToken
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          logs: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              type: expect.any(String),
              value: expect.any(Number),
              createdAt: expect.any(Number)
            })
          ]),
          pagination: expect.objectContaining({
            total: expect.any(Number),
            page: expect.any(Number)
          })
        });
      });

      it('should filter logs by type', async () => {
        const response = await makeRequest(app, 'GET', '/api/health/logs?type=exercise', {
          token: userToken
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        body.logs.forEach((log: any) => {
          expect(log.type).toBe('exercise');
        });
      });
    });
  });

  describe('Device Integration', () => {
    describe('POST /device-sync', () => {
      it('should sync Apple Health data successfully', async () => {
        const appleHealthData = {
          source: 'apple_health',
          data: [
            {
              type: 'steps',
              value: 8500,
              date: Date.now() - 86400000,
              source_name: 'iPhone'
            },
            {
              type: 'heart_rate',
              value: 72,
              date: Date.now() - 3600000,
              source_name: 'Apple Watch'
            }
          ]
        };

        env.DB._setMockData('INSERT INTO health_logs', [
          { id: 'synced_steps_id' },
          { id: 'synced_hr_id' }
        ]);

        const response = await makeRequest(app, 'POST', '/api/health/device-sync', {
          token: userToken,
          body: appleHealthData
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          message: expect.stringContaining('synced successfully'),
          synced: {
            imported: appleHealthData.data.length,
            duplicates: 0
          }
        });
      });

      it('should handle Google Fit data', async () => {
        const googleFitData = {
          source: 'google_fit',
          data: [
            {
              dataTypeName: 'com.google.step_count.delta',
              value: 7200,
              startTimeMillis: Date.now() - 86400000,
              endTimeMillis: Date.now()
            }
          ]
        };

        const response = await makeRequest(app, 'POST', '/api/health/device-sync', {
          token: userToken,
          body: googleFitData
        });

        expectSuccessResponse(response);
      });

      it('should reject invalid device data format', async () => {
        const response = await makeRequest(app, 'POST', '/api/health/device-sync', {
          token: userToken,
          body: {
            source: 'unknown_device',
            data: 'invalid_format'
          }
        });

        await expectValidationError(response, 'data');
      });
    });
  });

  describe('Wellness Features', () => {
    describe('POST /wellness/mood', () => {
      it('should track mood with context', async () => {
        const moodData = {
          mood_value: 7,
          energy_level: 8,
          stress_level: 3,
          sleep_quality: 7,
          context: ['work_success', 'good_weather'],
          notes: 'Had a productive day at work'
        };

        env.DB._setMockData('INSERT INTO health_logs', [{ id: 'new_mood_context_id' }]);

        const response = await makeRequest(app, 'POST', '/api/health/wellness/mood', {
          token: userToken,
          body: moodData
        });

        expectSuccessResponse(response, 201);
        const body = await response.json();
        
        expect(body.healthLog).toMatchObject({
          type: 'mood',
          value: moodData.mood_value,
          notes: expect.stringContaining('energy_level: 8')
        });
      });
    });

    describe('POST /wellness/reflection', () => {
      it('should save daily reflection', async () => {
        const reflectionData = {
          reflection_type: 'daily',
          content: 'Today was a good day. I accomplished my main goals and felt energetic.',
          prompts_answered: {
            'what_went_well': 'Finished the project presentation',
            'what_to_improve': 'Better time management for emails'
          }
        };

        env.DB._setMockData('INSERT INTO health_logs', [{ id: 'new_reflection_id' }]);

        const response = await makeRequest(app, 'POST', '/api/health/wellness/reflection', {
          token: userToken,
          body: reflectionData
        });

        expectSuccessResponse(response, 201);
        const body = await response.json();
        
        expect(body.healthLog.type).toBe('reflection');
        expect(body.healthLog.notes).toContain(reflectionData.content);
      });
    });

    describe('POST /wellness/gratitude', () => {
      it('should save gratitude entries', async () => {
        const gratitudeData = {
          gratitude_items: [
            'Supportive family',
            'Good health',
            'Beautiful weather'
          ],
          reflection: 'Feeling thankful for the simple things in life'
        };

        env.DB._setMockData('INSERT INTO health_logs', [{ id: 'new_gratitude_id' }]);

        const response = await makeRequest(app, 'POST', '/api/health/wellness/gratitude', {
          token: userToken,
          body: gratitudeData
        });

        expectSuccessResponse(response, 201);
        const body = await response.json();
        
        expect(body.healthLog.type).toBe('gratitude');
        expect(body.healthLog.notes).toContain('Supportive family');
      });
    });
  });

  describe('Analytics and Insights', () => {
    describe('GET /analytics/patterns', () => {
      it('should analyze health patterns', async () => {
        // Mock pattern data
        env.DB._setMockData('SELECT * FROM health_logs WHERE user_id = ? AND created_at > ?', testHealthLogs);

        const response = await makeRequest(app, 'GET', '/api/health/analytics/patterns', {
          token: userToken
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          patterns: {
            mood: expect.objectContaining({
              trend: expect.any(String),
              average: expect.any(Number)
            }),
            exercise: expect.objectContaining({
              frequency: expect.any(Number),
              consistency: expect.any(Number)
            })
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

    describe('GET /analytics/correlations', () => {
      it('should find health correlations', async () => {
        const response = await makeRequest(app, 'GET', '/api/health/analytics/correlations', {
          token: userToken
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          correlations: expect.arrayContaining([
            expect.objectContaining({
              factor1: expect.any(String),
              factor2: expect.any(String),
              correlation: expect.any(Number),
              significance: expect.any(String)
            })
          ])
        });
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle bulk health data import efficiently', async () => {
      const bulkData = Array.from({ length: 100 }, (_, i) => ({
        type: 'steps',
        value: 8000 + i,
        date: Date.now() - (i * 3600000), // hourly data
        source: 'device_sync'
      }));

      const start = Date.now();
      const response = await makeRequest(app, 'POST', '/api/health/device-sync', {
        token: userToken,
        body: {
          source: 'apple_health',
          data: bulkData
        }
      });
      const duration = Date.now() - start;

      expectSuccessResponse(response);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});