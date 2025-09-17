// AI Integration API Tests
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import apiGateway from '../../src/workers/api-gateway';
import { 
  createMockEnv, 
  testUsers, 
  testTasks,
  testHealthLogs,
  generateTestToken,
  makeRequest, 
  expectSuccessResponse, 
  expectErrorResponse,
  expectValidationError,
  cleanupTestData,
  mockExternalAPIs
} from '../utils/test-helpers';

// Mock fetch for external API calls
global.fetch = vi.fn();

describe('AI Integration API', () => {
  let env: any;
  let app: any;
  let userToken: string;
  let premiumToken: string;

  beforeEach(async () => {
    env = createMockEnv();
    app = apiGateway;
    userToken = await generateTestToken(testUsers.regularUser.id);
    premiumToken = await generateTestToken(testUsers.germanUser.id);
    
    // Set up mock data
    env.DB._setMockData('SELECT * FROM users WHERE id = ?', [testUsers.regularUser]);
    env.DB._setMockData('SELECT * FROM tasks WHERE user_id = ?', testTasks);
    env.DB._setMockData('SELECT * FROM health_logs WHERE user_id = ?', testHealthLogs);
    
    // Reset fetch mock
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupTestData(env);
  });

  describe('Task Priority Analysis', () => {
    describe('POST /tasks/analyze-priority', () => {
      it('should analyze task priorities successfully', async () => {
        // Mock OpenAI API response
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockExternalAPIs.openai.success
        });

        const requestData = {
          taskIds: [testTasks[0].id, testTasks[1].id],
          context: {
            workingHours: '9:00-17:00',
            preferences: { focus_time: 'morning' }
          }
        };

        const response = await makeRequest(app, 'POST', '/api/ai/tasks/analyze-priority', {
          token: userToken,
          body: requestData
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          message: expect.stringContaining('analysis completed'),
          analysis: expect.arrayContaining([
            expect.objectContaining({
              taskId: expect.any(String),
              priority: expect.any(Number),
              reasoning: expect.any(String),
              confidence: expect.any(Number),
              suggestedTimeSlot: expect.any(String)
            })
          ])
        });

        // Verify OpenAI API was called
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('openai.com'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': expect.stringContaining('Bearer'),
              'Content-Type': 'application/json'
            })
          })
        );
      });

      it('should handle AI API errors gracefully', async () => {
        // Mock OpenAI API error
        (fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => 'OpenAI API Error'
        });

        const response = await makeRequest(app, 'POST', '/api/ai/tasks/analyze-priority', {
          token: userToken,
          body: { taskIds: [testTasks[0].id] }
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        // Should fallback to non-AI analysis
        expect(body.analysis).toBeDefined();
        expect(body.analysis.length).toBeGreaterThan(0);
      });

      it('should analyze all pending tasks when no taskIds provided', async () => {
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockExternalAPIs.openai.success
        });

        const response = await makeRequest(app, 'POST', '/api/ai/tasks/analyze-priority', {
          token: userToken,
          body: {}
        });

        expectSuccessResponse(response);
        const body = await response.json();
        expect(body.analysis.length).toBeGreaterThan(0);
      });

      it('should support German language analysis', async () => {
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockExternalAPIs.openai.success
        });

        const germanUser = { ...testUsers.germanUser };
        env.DB._setMockData('SELECT * FROM users WHERE id = ?', [germanUser]);

        const response = await makeRequest(app, 'POST', '/api/ai/tasks/analyze-priority', {
          token: await generateTestToken(germanUser.id),
          body: { taskIds: [testTasks[0].id] }
        });

        expectSuccessResponse(response);
        
        // Verify German language was used in API call
        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: expect.stringContaining('Deutsch') // Should contain German instructions
          })
        );
      });
    });
  });

  describe('Health Insights', () => {
    describe('POST /health/insights', () => {
      it('should generate health insights successfully', async () => {
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{
              message: {
                content: JSON.stringify([
                  {
                    category: 'exercise',
                    insight: 'Your exercise consistency has improved',
                    recommendations: ['Continue current routine', 'Add strength training'],
                    confidence: 0.85,
                    dataPoints: 10
                  }
                ])
              }
            }]
          })
        });

        const requestData = {
          timeframeDays: 30,
          categories: ['exercise', 'mood']
        };

        const response = await makeRequest(app, 'POST', '/api/ai/health/insights', {
          token: userToken,
          body: requestData
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          message: expect.stringContaining('insights generated'),
          insights: expect.arrayContaining([
            expect.objectContaining({
              category: expect.any(String),
              insight: expect.any(String),
              recommendations: expect.any(Array),
              confidence: expect.any(Number),
              dataPoints: expect.any(Number)
            })
          ]),
          timeframe: expect.objectContaining({
            days: requestData.timeframeDays
          })
        });
      });

      it('should handle insufficient health data', async () => {
        // Mock empty health logs
        env.DB._setMockData('SELECT * FROM health_logs WHERE user_id = ?', []);

        const response = await makeRequest(app, 'POST', '/api/ai/health/insights', {
          token: userToken,
          body: { timeframeDays: 30 }
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body.message).toContain('Insufficient data');
        expect(body.insights).toEqual([]);
      });
    });
  });

  describe('Meeting Scheduling', () => {
    describe('POST /calendar/schedule-meeting', () => {
      it('should schedule meeting with AI optimization', async () => {
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{
              message: {
                content: JSON.stringify({
                  title: 'Team Sync',
                  participants: 3,
                  suggestedSlots: [
                    {
                      start: Date.now() + 86400000,
                      end: Date.now() + 86400000 + 3600000,
                      confidence: 0.9,
                      reasoning: 'All participants available, optimal time zone'
                    }
                  ],
                  conflictAnalysis: {
                    conflicts: 0,
                    alternatives: 3
                  }
                })
              }
            }]
          })
        });

        const meetingData = {
          title: 'Team Sync Meeting',
          participants: ['colleague1@company.com', 'colleague2@company.com'],
          duration: 60,
          preferences: {
            timeOfDay: 'morning',
            urgency: 'medium'
          }
        };

        const response = await makeRequest(app, 'POST', '/api/ai/calendar/schedule-meeting', {
          token: userToken,
          body: meetingData
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          message: expect.stringContaining('analyzed successfully'),
          requestId: expect.any(String),
          meeting: expect.objectContaining({
            title: expect.any(String),
            duration: meetingData.duration,
            participants: expect.any(Number)
          }),
          suggestedSlots: expect.arrayContaining([
            expect.objectContaining({
              start: expect.any(Number),
              end: expect.any(Number),
              confidence: expect.any(Number),
              reasoning: expect.any(String)
            })
          ])
        });
      });

      it('should validate meeting request parameters', async () => {
        const response = await makeRequest(app, 'POST', '/api/ai/calendar/schedule-meeting', {
          token: userToken,
          body: {
            title: '',  // Empty title
            participants: [],  // No participants
            duration: 10  // Too short
          }
        });

        await expectValidationError(response);
      });
    });
  });

  describe('Smart Planning', () => {
    describe('POST /planning/create-plan', () => {
      it('should create smart plan from natural language', async () => {
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{
              message: {
                content: JSON.stringify({
                  planId: 'plan_123',
                  confidenceScore: 0.88,
                  reasoning: 'Optimized based on your schedule and energy patterns',
                  totalEstimatedTime: 180,
                  tasks: [
                    {
                      title: 'Write report',
                      description: 'Complete quarterly report draft',
                      priority: 85,
                      estimatedDuration: 120,
                      suggestedTime: Date.now() + 3600000,
                      energyLevel: 'high',
                      context: 'work'
                    },
                    {
                      title: 'Buy groceries',
                      description: 'Weekly grocery shopping',
                      priority: 60,
                      estimatedDuration: 60,
                      suggestedTime: Date.now() + 7200000,
                      energyLevel: 'medium',
                      context: 'personal'
                    }
                  ]
                })
              }
            }]
          })
        });

        const planInput = {
          input: 'I need to write the quarterly report and go grocery shopping today',
          context: {
            workingHours: '9:00-17:00',
            includeExisting: true
          }
        };

        const response = await makeRequest(app, 'POST', '/api/ai/planning/create-plan', {
          token: userToken,
          body: planInput
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          message: expect.stringContaining('created successfully'),
          plan: expect.objectContaining({
            id: expect.any(String),
            confidence: expect.any(Number),
            reasoning: expect.any(String),
            totalEstimatedTime: expect.any(Number),
            tasks: expect.arrayContaining([
              expect.objectContaining({
                title: expect.any(String),
                description: expect.any(String),
                priority: expect.any(Number),
                estimatedDuration: expect.any(Number),
                suggestedTime: expect.any(Number),
                energyLevel: expect.any(String)
              })
            ])
          }),
          actions: expect.objectContaining({
            canCreateTasks: true,
            canSchedule: true,
            canModify: true
          })
        });
      });

      it('should reject insufficient input', async () => {
        const response = await makeRequest(app, 'POST', '/api/ai/planning/create-plan', {
          token: userToken,
          body: {
            input: 'too short'  // Below minimum length
          }
        });

        await expectValidationError(response, 'input');
      });
    });

    describe('POST /planning/execute-plan/:planId', () => {
      it('should execute plan and create tasks', async () => {
        const planId = 'test_plan_123';
        const mockPlan = {
          userId: testUsers.regularUser.id,
          originalInput: 'Test planning input',
          plan: {
            planId,
            tasks: [
              {
                title: 'Test Task 1',
                description: 'First test task',
                priority: 75,
                estimatedDuration: 60,
                suggestedTime: Date.now() + 3600000,
                energyLevel: 'high',
                context: 'work'
              }
            ]
          },
          createdAt: Date.now()
        };

        // Mock stored plan
        env.CACHE.put(`smart_plan_${planId}`, JSON.stringify(mockPlan));
        env.DB._setMockData('INSERT INTO tasks', [{ id: 'new_task_from_plan' }]);

        const response = await makeRequest(app, 'POST', `/planning/execute-plan/${planId}`, {
          token: userToken
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          message: expect.stringContaining('created'),
          createdTasks: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              title: 'Test Task 1',
              priority: expect.any(Number),
              aiPriority: expect.any(Number)
            })
          ]),
          executedAt: expect.any(Number)
        });
      });

      it('should reject non-existent plan', async () => {
        const response = await makeRequest(app, 'POST', '/api/ai/planning/execute-plan/nonexistent', {
          token: userToken
        });

        expectErrorResponse(response, 404, 'not found');
      });
    });
  });

  describe('Voice Analysis', () => {
    describe('POST /voice/analyze', () => {
      it('should analyze voice input successfully', async () => {
        // Mock Deepgram response
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockExternalAPIs.deepgram.success
        });

        // Mock OpenAI analysis
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockExternalAPIs.openai.success
        });

        const voiceData = {
          audioUrl: 'https://example.com/audio.mp3',
          context: 'task_creation',
          language: 'en'
        };

        const response = await makeRequest(app, 'POST', '/api/ai/voice/analyze', {
          token: userToken,
          body: voiceData
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          message: expect.stringContaining('completed successfully'),
          transcription: expect.any(String),
          analysis: expect.any(Object),
          context: voiceData.context,
          language: voiceData.language,
          processedAt: expect.any(Number)
        });

        // Verify both APIs were called
        expect(fetch).toHaveBeenCalledTimes(2);
      });

      it('should validate audio URL format', async () => {
        const response = await makeRequest(app, 'POST', '/api/ai/voice/analyze', {
          token: userToken,
          body: {
            audioUrl: 'invalid-url',
            context: 'reflection'
          }
        });

        await expectValidationError(response, 'audioUrl');
      });
    });
  });

  describe('Usage Statistics', () => {
    describe('GET /usage/stats', () => {
      it('should get AI usage statistics', async () => {
        const response = await makeRequest(app, 'GET', '/api/ai/usage/stats', {
          token: userToken
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          usage: expect.objectContaining({
            thisMonth: expect.objectContaining({
              taskAnalyses: expect.any(Number),
              healthInsights: expect.any(Number),
              meetingSchedules: expect.any(Number),
              smartPlans: expect.any(Number),
              voiceAnalyses: expect.any(Number)
            }),
            allTime: expect.any(Object),
            limits: expect.any(Object)
          }),
          generatedAt: expect.any(Number)
        });
      });
    });
  });

  describe('Rate Limiting and Usage Limits', () => {
    it('should enforce AI usage limits for free users', async () => {
      // Mock a free user exceeding limits
      const freeUser = { ...testUsers.regularUser, subscription_status: 'free' };
      env.DB._setMockData('SELECT * FROM users WHERE id = ?', [freeUser]);

      // Mock usage tracking showing user has exceeded free limits
      env.ANALYTICS._clear();
      // Add mock data points showing heavy usage
      for (let i = 0; i < 15; i++) {
        env.ANALYTICS.writeDataPoint({
          blobs: [freeUser.id, 'ai_task_analysis', 'success'],
          doubles: [Date.now() - (i * 3600000), 1],
          indexes: ['ai_usage']
        });
      }

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockExternalAPIs.openai.success
      });

      const response = await makeRequest(app, 'POST', '/api/ai/tasks/analyze-priority', {
        token: await generateTestToken(freeUser.id),
        body: { taskIds: [testTasks[0].id] }
      });

      // Should still work but potentially with limited features
      expectSuccessResponse(response);
    });

    it('should allow unlimited usage for premium users', async () => {
      const premiumUser = { ...testUsers.germanUser, subscription_status: 'premium' };
      env.DB._setMockData('SELECT * FROM users WHERE id = ?', [premiumUser]);

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockExternalAPIs.openai.success
      });

      const response = await makeRequest(app, 'POST', '/api/ai/tasks/analyze-priority', {
        token: await generateTestToken(premiumUser.id),
        body: { taskIds: [testTasks[0].id] }
      });

      expectSuccessResponse(response);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should gracefully handle OpenAI API timeouts', async () => {
      // Mock timeout
      (fetch as any).mockRejectedValueOnce(new Error('Request timeout'));

      const response = await makeRequest(app, 'POST', '/api/ai/tasks/analyze-priority', {
        token: userToken,
        body: { taskIds: [testTasks[0].id] }
      });

      expectSuccessResponse(response);
      const body = await response.json();
      
      // Should provide fallback analysis
      expect(body.analysis).toBeDefined();
      expect(body.analysis.length).toBeGreaterThan(0);
    });

    it('should handle malformed AI responses', async () => {
      // Mock malformed JSON response
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'invalid json{' } }] })
      });

      const response = await makeRequest(app, 'POST', '/api/ai/tasks/analyze-priority', {
        token: userToken,
        body: { taskIds: [testTasks[0].id] }
      });

      expectSuccessResponse(response);
      // Should provide fallback even when AI response is malformed
    });
  });

  describe('Performance', () => {
    it('should respond to AI requests within reasonable time', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockExternalAPIs.openai.success
      });

      const start = Date.now();
      const response = await makeRequest(app, 'POST', '/api/ai/tasks/analyze-priority', {
        token: userToken,
        body: { taskIds: [testTasks[0].id] }
      });
      const duration = Date.now() - start;

      expectSuccessResponse(response);
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
    });
  });
});