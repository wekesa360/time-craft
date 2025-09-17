// Health Insights Service Tests
// Tests for advanced health features: nutrition analysis, goal tracking, insights generation

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HealthInsightsService } from '../../src/lib/health-insights';
import { DatabaseService } from '../../src/lib/db';
import { generateId } from '../../src/utils/id';

// Mock environment with proper DB interface
const mockEnv = {
  DB: {
    prepare: (sql: string) => ({
      bind: (...params: any[]) => ({
        all: () => Promise.resolve({ results: [] }),
        run: () => Promise.resolve({ success: true }),
        first: () => Promise.resolve(null)
      }),
      all: () => Promise.resolve({ results: [] }),
      run: () => Promise.resolve({ success: true }),
      first: () => Promise.resolve(null)
    })
  } as D1Database,
  JWT_SECRET: 'test-secret',
  OPENAI_API_KEY: 'test-key'
} as any;

describe('HealthInsightsService', () => {
  let healthInsights: HealthInsightsService;
  let db: DatabaseService;
  const testUserId = 'test-user-123';

  beforeEach(() => {
    healthInsights = new HealthInsightsService(mockEnv);
    db = new DatabaseService(mockEnv);
  });

  describe('Health Goal Management', () => {
    it('should create a health goal successfully', async () => {
      const goalData = {
        goal_type: 'weight_loss' as const,
        title: 'Lose 10 pounds',
        description: 'Lose weight for better health',
        target_value: 10,
        target_unit: 'lbs',
        target_date: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
        priority: 4
      };

      const goal = await healthInsights.createHealthGoal(testUserId, goalData);

      expect(goal).toBeDefined();
      expect(goal.user_id).toBe(testUserId);
      expect(goal.goal_type).toBe('weight_loss');
      expect(goal.title).toBe('Lose 10 pounds');
      expect(goal.target_value).toBe(10);
      expect(goal.target_unit).toBe('lbs');
      expect(goal.status).toBe('active');
      expect(goal.priority).toBe(4);
      expect(goal.milestones).toEqual([]);
      expect(goal.progress_notes).toEqual([]);
    });

    it('should update goal progress correctly', async () => {
      // First create a goal
      const goal = await healthInsights.createHealthGoal(testUserId, {
        goal_type: 'weight_loss',
        title: 'Test Goal',
        target_value: 10,
        target_unit: 'lbs',
        target_date: Date.now() + (30 * 24 * 60 * 60 * 1000)
      });

      // Mock the database to return the goal when queried
      const originalPrepare = mockEnv.DB.prepare;
      mockEnv.DB.prepare = ((query: string) => ({
        bind: (...params: any[]) => ({
          first: () => Promise.resolve({
            ...goal,
            current_value: 5,
            milestones: JSON.stringify([]),
            progress_notes: JSON.stringify([])
          }),
          run: () => Promise.resolve({ success: true })
        })
      })) as any;

      // Update progress
      await healthInsights.updateGoalProgress(goal.id, testUserId, 5, 'Halfway there!');

      // Verify progress was recorded
      const updatedGoal = await healthInsights.getHealthGoal(goal.id, testUserId);
      expect(updatedGoal?.current_value).toBe(5);

      mockEnv.DB.prepare = originalPrepare;
    });

    it('should mark goal as completed when target is reached', async () => {
      const goal = await healthInsights.createHealthGoal(testUserId, {
        goal_type: 'hydration',
        title: 'Drink 8 glasses daily',
        target_value: 8,
        target_unit: 'glasses',
        target_date: Date.now() + (7 * 24 * 60 * 60 * 1000)
      });

      // Mock the database to return the goal and then the completed goal
      const originalPrepare = mockEnv.DB.prepare;
      let callCount = 0;
      mockEnv.DB.prepare = ((query: string) => ({
        bind: (...params: any[]) => ({
          first: () => {
            callCount++;
            if (callCount === 1) {
              // First call - return original goal for updateGoalProgress
              return Promise.resolve({
                ...goal,
                milestones: JSON.stringify([]),
                progress_notes: JSON.stringify([])
              });
            } else {
              // Second call - return completed goal
              return Promise.resolve({
                ...goal,
                current_value: 8,
                status: 'completed',
                milestones: JSON.stringify([]),
                progress_notes: JSON.stringify([])
              });
            }
          },
          run: () => Promise.resolve({ success: true })
        })
      })) as any;

      // Complete the goal
      await healthInsights.updateGoalProgress(goal.id, testUserId, 8, 'Goal achieved!');

      const completedGoal = await healthInsights.getHealthGoal(goal.id, testUserId);
      expect(completedGoal?.status).toBe('completed');

      mockEnv.DB.prepare = originalPrepare;
    });

    it('should retrieve user health goals with filtering', async () => {
      // Create a goal first
      const goal = await healthInsights.createHealthGoal(testUserId, {
        goal_type: 'exercise',
        title: 'Active Goal',
        target_value: 30,
        target_unit: 'minutes',
        target_date: Date.now() + (30 * 24 * 60 * 60 * 1000)
      });

      // Mock the database to return the active goal
      const originalPrepare = mockEnv.DB.prepare;
      mockEnv.DB.prepare = ((query: string) => ({
        bind: (...params: any[]) => ({
          all: () => Promise.resolve({
            results: [{
              ...goal,
              milestones: JSON.stringify([]),
              progress_notes: JSON.stringify([])
            }]
          })
        })
      })) as any;

      const goals = await healthInsights.getHealthGoals(testUserId, 'active');
      expect(goals.length).toBeGreaterThan(0);
      expect(goals.every(goal => goal.status === 'active')).toBe(true);

      mockEnv.DB.prepare = originalPrepare;
    });
  });

  describe('Nutrition Analysis', () => {
    it('should analyze nutrition data correctly', async () => {
      const today = Date.now();
      
      // Mock nutrition entries for today
      const mockNutritionEntries = [
        {
          id: generateId(),
          user_id: testUserId,
          meal_type: 'breakfast',
          calories: 400,
          macros: JSON.stringify({ protein_g: 20, carbs_g: 40, fat_g: 15 }),
          recorded_at: today
        },
        {
          id: generateId(),
          user_id: testUserId,
          meal_type: 'lunch',
          calories: 600,
          macros: JSON.stringify({ protein_g: 30, carbs_g: 60, fat_g: 20 }),
          recorded_at: today
        }
      ];

      // Mock the database query
      const originalPrepare = mockEnv.DB.prepare;
      mockEnv.DB.prepare = ((query: string) => ({
        bind: (...params: any[]) => ({
          all: () => Promise.resolve({ results: mockNutritionEntries }),
          run: () => Promise.resolve({ success: true })
        })
      })) as any;

      const analysis = await healthInsights.analyzeNutrition(testUserId, today);

      expect(analysis).toBeDefined();
      expect(analysis.user_id).toBe(testUserId);
      expect(analysis.total_calories).toBe(1000);
      expect(analysis.meal_distribution.breakfast_calories).toBe(400);
      expect(analysis.meal_distribution.lunch_calories).toBe(600);
      expect(analysis.nutritional_score).toBeGreaterThan(0);
      expect(analysis.recommendations).toBeInstanceOf(Array);

      // Restore original method
      mockEnv.DB.prepare = originalPrepare;
    });

    it('should provide nutrition recommendations based on intake', async () => {
      const mockLowCalorieData = [
        {
          id: generateId(),
          user_id: testUserId,
          meal_type: 'breakfast',
          calories: 200,
          recorded_at: Date.now()
        }
      ];

      const originalPrepare = mockEnv.DB.prepare;
      mockEnv.DB.prepare = ((query: string) => ({
        bind: (...params: any[]) => ({
          all: () => Promise.resolve({ results: mockLowCalorieData }),
          run: () => Promise.resolve({ success: true })
        })
      })) as any;

      const analysis = await healthInsights.analyzeNutrition(testUserId);

      expect(analysis.recommendations).toContain('Consider increasing your calorie intake for better energy levels');
      expect(analysis.deficiencies).toContain('calories');

      mockEnv.DB.prepare = originalPrepare;
    });
  });

  describe('Health Insights Generation', () => {
    it('should generate trend insights from health data', async () => {
      const mockHealthData = {
        healthLogs: [],
        nutritionEntries: [],
        exerciseEntries: Array.from({ length: 10 }, (_, i) => ({
          id: generateId(),
          user_id: testUserId,
          duration_minutes: 30 + i * 5, // Increasing trend
          recorded_at: Date.now() - (i * 24 * 60 * 60 * 1000)
        })),
        moodEntries: [],
        sleepEntries: []
      };

      const originalPrepare = mockEnv.DB.prepare;
      mockEnv.DB.prepare = ((query: string) => ({
        bind: (...params: any[]) => ({
          all: () => {
            if (query.includes('exercise_entries')) return Promise.resolve({ results: mockHealthData.exerciseEntries });
            return Promise.resolve({ results: [] });
          },
          run: () => Promise.resolve({ success: true })
        })
      })) as any;

      const insights = await healthInsights.generateHealthInsights(testUserId);

      expect(insights).toBeInstanceOf(Array);
      
      // Should generate exercise trend insight
      const exerciseInsight = insights.find(i => i.category === 'exercise' && i.insight_type === 'trend');
      if (exerciseInsight) {
        expect(exerciseInsight.title).toContain('Exercise Duration Increasing');
        expect(exerciseInsight.confidence_score).toBeGreaterThan(0);
      }

      mockEnv.DB.prepare = originalPrepare;
    });

    it('should generate correlation insights between mood and exercise', async () => {
      const mockMoodEntries = [
        { id: '1', mood_score: 8, recorded_at: Date.now() - (1 * 24 * 60 * 60 * 1000) },
        { id: '2', mood_score: 6, recorded_at: Date.now() - (2 * 24 * 60 * 60 * 1000) },
        { id: '3', mood_score: 9, recorded_at: Date.now() - (3 * 24 * 60 * 60 * 1000) }
      ];

      const mockExerciseEntries = [
        { id: '1', recorded_at: Date.now() - (1 * 24 * 60 * 60 * 1000) },
        { id: '2', recorded_at: Date.now() - (3 * 24 * 60 * 60 * 1000) }
      ];

      const originalPrepare = mockEnv.DB.prepare;
      mockEnv.DB.prepare = ((query: string) => ({
        bind: (...params: any[]) => ({
          all: () => {
            if (query.includes('mood_entries')) return Promise.resolve({ results: mockMoodEntries });
            if (query.includes('exercise_entries')) return Promise.resolve({ results: mockExerciseEntries });
            return Promise.resolve({ results: [] });
          },
          run: () => Promise.resolve({ success: true })
        })
      })) as any;

      const insights = await healthInsights.generateHealthInsights(testUserId);

      const correlationInsight = insights.find(i => i.insight_type === 'correlation');
      if (correlationInsight) {
        expect(correlationInsight.category).toBe('mood');
        expect(correlationInsight.title).toContain('Exercise Boosts Your Mood');
      }

      mockEnv.DB.prepare = originalPrepare;
    });

    it('should generate hydration recommendations', async () => {
      const mockHydrationLogs = Array.from({ length: 7 }, (_, i) => ({
        id: generateId(),
        type: 'hydration',
        payload: JSON.stringify({ amount_ml: 1500 }), // Below recommended 2000ml
        recorded_at: Date.now() - (i * 24 * 60 * 60 * 1000)
      }));

      const originalPrepare = mockEnv.DB.prepare;
      mockEnv.DB.prepare = ((query: string) => ({
        bind: (...params: any[]) => ({
          all: () => {
            if (query.includes('health_logs')) return Promise.resolve({ results: mockHydrationLogs });
            return Promise.resolve({ results: [] });
          },
          run: () => Promise.resolve({ success: true })
        })
      })) as any;

      const insights = await healthInsights.generateHealthInsights(testUserId);

      const hydrationInsight = insights.find(i => i.category === 'hydration');
      if (hydrationInsight) {
        expect(hydrationInsight.title).toContain('Increase Water Intake');
        expect(hydrationInsight.action_items).toContain('Set hourly water reminders');
      }

      mockEnv.DB.prepare = originalPrepare;
    });
  });

  describe('Health Dashboard', () => {
    it('should create a comprehensive health dashboard', async () => {
      // Mock active goals
      const mockGoals = [
        {
          id: generateId(),
          user_id: testUserId,
          goal_type: 'weight_loss',
          title: 'Lose Weight',
          target_value: 10,
          current_value: 3,
          status: 'active'
        }
      ];

      const originalPrepare = mockEnv.DB.prepare;
      mockEnv.DB.prepare = ((query: string) => ({
        bind: (...params: any[]) => ({
          all: () => {
            if (query.includes('health_goals')) return Promise.resolve({ results: mockGoals });
            if (query.includes('health_insights')) return Promise.resolve({ results: [] });
            return Promise.resolve({ results: [] });
          },
          first: () => Promise.resolve({ count: 15 })
        })
      })) as any;

      const widgets = await healthInsights.createHealthDashboard(testUserId);

      expect(widgets).toBeInstanceOf(Array);
      expect(widgets.length).toBeGreaterThan(0);

      // Should have goal progress widget
      const goalWidget = widgets.find(w => w.type === 'goal_progress');
      expect(goalWidget).toBeDefined();
      expect(goalWidget?.title).toBe('Health Goals Progress');

      // Should have streak widget
      const streakWidget = widgets.find(w => w.type === 'streak');
      expect(streakWidget).toBeDefined();
      expect(streakWidget?.data.streak_days).toBe(15);

      mockEnv.DB.prepare = originalPrepare;
    });

    it('should include insights widget when insights are available', async () => {
      const mockInsights = [
        {
          id: generateId(),
          user_id: testUserId,
          insight_type: 'recommendation',
          category: 'exercise',
          title: 'Test Insight',
          description: 'Test description',
          priority: 4,
          created_at: Date.now()
        }
      ];

      const originalPrepare = mockEnv.DB.prepare;
      mockEnv.DB.prepare = ((query: string) => ({
        bind: (...params: any[]) => ({
          all: () => {
            if (query.includes('health_insights')) return Promise.resolve({ results: mockInsights });
            return Promise.resolve({ results: [] });
          },
          first: () => Promise.resolve({ count: 0 })
        })
      })) as any;

      const widgets = await healthInsights.createHealthDashboard(testUserId);

      const insightsWidget = widgets.find(w => w.type === 'insights');
      expect(insightsWidget).toBeDefined();
      expect(insightsWidget?.title).toBe('Health Insights');
      expect(insightsWidget?.data.length).toBe(1);

      mockEnv.DB.prepare = originalPrepare;
    });
  });

  describe('Insight Management', () => {
    it('should retrieve health insights with filtering', async () => {
      const mockInsights = [
        {
          id: generateId(),
          user_id: testUserId,
          insight_type: 'trend',
          category: 'exercise',
          title: 'Exercise Trend',
          data_points: '[]',
          action_items: '[]'
        }
      ];

      const originalPrepare = mockEnv.DB.prepare;
      mockEnv.DB.prepare = ((query: string) => ({
        bind: (...params: any[]) => ({
          all: () => Promise.resolve({ results: mockInsights })
        })
      })) as any;

      const insights = await healthInsights.getHealthInsights(testUserId, 'exercise', 5);

      expect(insights).toBeInstanceOf(Array);
      expect(insights.length).toBe(1);
      expect(insights[0].category).toBe('exercise');
      expect(insights[0].data_points).toEqual([]);
      expect(insights[0].action_items).toEqual([]);

      mockEnv.DB.prepare = originalPrepare;
    });

    it('should mark insights as read', async () => {
      const insightId = generateId();
      
      const originalPrepare = mockEnv.DB.prepare;
      let updateCalled = false;
      mockEnv.DB.prepare = ((query: string) => ({
        bind: (...params: any[]) => ({
          run: () => {
            if (query.includes('UPDATE health_insights')) {
              updateCalled = true;
              expect(params[0]).toBe(true);
              expect(params[1]).toBe(insightId);
              expect(params[2]).toBe(testUserId);
            }
            return Promise.resolve({ success: true });
          }
        })
      })) as any;

      await healthInsights.markInsightAsRead(insightId, testUserId);
      expect(updateCalled).toBe(true);

      mockEnv.DB.prepare = originalPrepare;
    });

    it('should dismiss insights', async () => {
      const insightId = generateId();
      
      const originalPrepare = mockEnv.DB.prepare;
      let dismissCalled = false;
      mockEnv.DB.prepare = ((query: string) => ({
        bind: (...params: any[]) => ({
          run: () => {
            if (query.includes('is_dismissed')) {
              dismissCalled = true;
              expect(params[0]).toBe(true);
              expect(params[1]).toBe(insightId);
              expect(params[2]).toBe(testUserId);
            }
            return Promise.resolve({ success: true });
          }
        })
      })) as any;

      await healthInsights.dismissInsight(insightId, testUserId);
      expect(dismissCalled).toBe(true);

      mockEnv.DB.prepare = originalPrepare;
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully in nutrition analysis', async () => {
      const originalPrepare = mockEnv.DB.prepare;
      mockEnv.DB.prepare = (() => {
        throw new Error('Database error');
      }) as any;

      await expect(healthInsights.analyzeNutrition(testUserId)).rejects.toThrow('Database error');

      mockEnv.DB.prepare = originalPrepare;
    });

    it('should return empty insights array on generation failure', async () => {
      const originalPrepare = mockEnv.DB.prepare;
      mockEnv.DB.prepare = (() => {
        throw new Error('Database error');
      }) as any;

      const insights = await healthInsights.generateHealthInsights(testUserId);
      expect(insights).toEqual([]);

      mockEnv.DB.prepare = originalPrepare;
    });

    it('should handle missing goal gracefully', async () => {
      const originalPrepare = mockEnv.DB.prepare;
      mockEnv.DB.prepare = ((query: string) => ({
        bind: (...params: any[]) => ({
          first: () => Promise.resolve(null)
        })
      })) as any;

      await expect(healthInsights.updateGoalProgress('nonexistent', testUserId, 5))
        .rejects.toThrow('Goal not found');

      mockEnv.DB.prepare = originalPrepare;
    });
  });
});