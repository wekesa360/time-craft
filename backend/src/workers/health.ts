// Health tracking API routes for Time & Wellness Application
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { verify } from 'hono/jwt';

import type { Env } from '../lib/env';
import { HealthRepository, DatabaseService } from '../lib/db';
import { HealthInsightsService } from '../lib/health-insights';
import type { 
  HealthLogType, 
  HealthLogSource,
  HealthLogFilters,
  ExercisePayload,
  NutritionPayload,
  MoodPayload,
  HydrationPayload
} from '../types/database';

const health = new Hono<{ Bindings: Env }>();

// Middleware to extract user from JWT
const getUserFromToken = async (c: any): Promise<{ userId: string } | null> => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const payload = await verify(token, c.env.JWT_SECRET);
    
    return { userId: payload.userId as string };
  } catch {
    return null;
  }
};

// Validation schemas
const exerciseLogSchema = z.object({
  activity: z.string().min(1, 'Activity name is required').max(100),
  durationMinutes: z.number().int().min(1).max(600),
  intensity: z.number().int().min(1).max(10),
  caloriesBurned: z.number().int().min(1).optional(),
  distance: z.number().min(0).optional(),
  heartRateAvg: z.number().int().min(40).max(220).optional(),
  heartRateMax: z.number().int().min(40).max(220).optional(),
  notes: z.string().max(500).optional(),
  recordedAt: z.number().optional(),
  source: z.enum(['manual', 'auto', 'device']).default('manual'),
  deviceType: z.string().max(50).optional()
});

const nutritionLogSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  foods: z.array(z.object({
    name: z.string().min(1).max(100),
    quantity: z.string().max(50),
    calories: z.number().int().min(0).optional()
  })).min(1, 'At least one food item is required'),
  totalCalories: z.number().int().min(0).optional(),
  waterMl: z.number().int().min(0).optional(),
  recordedAt: z.number().optional(),
  source: z.enum(['manual', 'auto', 'device']).default('manual'),
  notes: z.string().max(500).optional()
});

const moodLogSchema = z.object({
  score: z.number().int().min(1).max(10),
  energy: z.number().int().min(1).max(10).optional(),
  stress: z.number().int().min(1).max(10).optional(),
  notes: z.string().max(500).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  recordedAt: z.number().optional(),
  source: z.enum(['manual', 'auto', 'device']).default('manual')
});

const hydrationLogSchema = z.object({
  amountMl: z.number().int().min(1).max(5000),
  type: z.enum(['water', 'coffee', 'tea', 'juice', 'sports_drink', 'other']).default('water'),
  notes: z.string().max(200).optional(),
  recordedAt: z.number().optional(),
  source: z.enum(['manual', 'auto', 'device']).default('manual')
});

const healthFiltersSchema = z.object({
  type: z.enum(['exercise', 'nutrition', 'mood', 'hydration']).optional(),
  source: z.enum(['manual', 'auto', 'device']).optional(),
  startDate: z.number().optional(),
  endDate: z.number().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional()
});

const healthGoalSchema = z.object({
  goalType: z.enum(['weight_loss', 'weight_gain', 'muscle_gain', 'endurance', 'strength', 'nutrition', 'hydration', 'sleep', 'mood', 'custom']),
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  targetValue: z.number().min(0),
  targetUnit: z.string().min(1).max(20),
  targetDate: z.number(),
  priority: z.number().int().min(1).max(5).optional()
});

const goalProgressSchema = z.object({
  value: z.number().min(0),
  notes: z.string().max(500).optional()
});

// ========== EXERCISE TRACKING ==========

// POST /api/health/exercise - Log exercise activity
health.post('/exercise', zValidator('json', exerciseLogSchema), async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const data = c.req.valid('json');
    console.log('📝 Exercise log request received:', { 
      activity: data.activity, 
      duration: data.durationMinutes,
      intensity: data.intensity,
      userId: auth.userId 
    });
    
    const healthRepo = new HealthRepository(c.env);

    const exercisePayload: ExercisePayload = {
      activity: data.activity,
      duration_minutes: data.durationMinutes,
      intensity: data.intensity,
      calories_burned: data.caloriesBurned || undefined,
      distance: data.distance || undefined,
      notes: data.notes || undefined
    };

    console.log('✅ Exercise payload created:', exercisePayload);

    const healthLog = await healthRepo.logHealthData({
      user_id: auth.userId,
      type: 'exercise',
      payload: exercisePayload,
      recorded_at: data.recordedAt || Date.now(),
      source: data.source as HealthLogSource,
      device_type: data.deviceType || null
    });

    console.log('✅ Exercise log saved to database:', healthLog.id);

    // Log activity for analytics
    c.env.ANALYTICS?.writeDataPoint({
      blobs: [auth.userId, 'exercise_logged', data.activity],
      doubles: [Date.now(), data.durationMinutes, data.intensity],
      indexes: ['health_activities']
    });

    // Return response matching frontend expectation
    return c.json({
      log: healthLog
    }, 201);
  } catch (error) {
    console.error('❌ Log exercise error:', error);
    return c.json({ 
      error: 'Failed to log exercise',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// ========== NUTRITION TRACKING ==========

// POST /api/health/nutrition - Log nutrition/meal data
health.post('/nutrition', zValidator('json', nutritionLogSchema), async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const data = c.req.valid('json');
    const healthRepo = new HealthRepository(c.env);

    const nutritionPayload: NutritionPayload = {
      meal_type: data.mealType,
      foods: data.foods,
      total_calories: data.totalCalories,
      water_ml: data.waterMl
    };

    const healthLog = await healthRepo.logHealthData({
      user_id: auth.userId,
      type: 'nutrition',
      payload: nutritionPayload,
      recorded_at: data.recordedAt || Date.now(),
      source: data.source as HealthLogSource,
      device_type: null
    });

    // Log activity for analytics
    c.env.ANALYTICS?.writeDataPoint({
      blobs: [auth.userId, 'nutrition_logged', data.mealType],
      doubles: [Date.now(), data.totalCalories || 0],
      indexes: ['health_activities']
    });

    return c.json({
      message: 'Nutrition logged successfully',
      log: healthLog
    }, 201);
  } catch (error) {
    console.error('Log nutrition error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ========== MOOD TRACKING ==========

// POST /api/health/mood - Log mood data
health.post('/mood', zValidator('json', moodLogSchema), async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const data = c.req.valid('json');
    const healthRepo = new HealthRepository(c.env);

    const moodPayload: MoodPayload = {
      score: data.score,
      energy: data.energy,
      stress: data.stress,
      notes: data.notes,
      tags: data.tags
    };

    const healthLog = await healthRepo.logHealthData({
      user_id: auth.userId,
      type: 'mood',
      payload: moodPayload,
      recorded_at: data.recordedAt || Date.now(),
      source: data.source as HealthLogSource,
      device_type: null
    });

    // Log activity for analytics
    c.env.ANALYTICS?.writeDataPoint({
      blobs: [auth.userId, 'mood_logged'],
      doubles: [Date.now(), data.score, data.energy || 0, data.stress || 0],
      indexes: ['health_activities']
    });

    return c.json({
      message: 'Mood logged successfully',
      log: healthLog
    }, 201);
  } catch (error) {
    console.error('Log mood error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ========== HYDRATION TRACKING ==========

// POST /api/health/hydration - Log hydration data
health.post('/hydration', zValidator('json', hydrationLogSchema), async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const data = c.req.valid('json');
    const healthRepo = new HealthRepository(c.env);

    const hydrationPayload: HydrationPayload = {
      amount_ml: data.amountMl,
      type: data.type,
      notes: data.notes
    };

    const healthLog = await healthRepo.logHealthData({
      user_id: auth.userId,
      type: 'hydration',
      payload: hydrationPayload,
      recorded_at: data.recordedAt || Date.now(),
      source: data.source as HealthLogSource,
      device_type: null
    });

    // Log activity for analytics
    c.env.ANALYTICS?.writeDataPoint({
      blobs: [auth.userId, 'hydration_logged', data.type],
      doubles: [Date.now(), data.amountMl],
      indexes: ['health_activities']
    });

    return c.json({
      message: 'Hydration logged successfully',
      log: healthLog
    }, 201);
  } catch (error) {
    console.error('Log hydration error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ========== HEALTH DATA RETRIEVAL ==========

// GET /api/health/logs - Get health logs with filtering
health.get('/logs', zValidator('query', healthFiltersSchema), async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const filters = c.req.valid('query');
    const healthRepo = new HealthRepository(c.env);
    
    // Convert query params to database filters
    const dbFilters: HealthLogFilters = {
      type: filters.type as HealthLogType,
      source: filters.source as HealthLogSource,
      start_date: filters.startDate,
      end_date: filters.endDate,
      limit: filters.limit,
      offset: filters.offset
    };
    
    const result = await healthRepo.getHealthLogs(auth.userId, dbFilters);
    
    return c.json({
      logs: result.data,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor,
      total: result.total
    });
  } catch (error) {
    console.error('Get health logs error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/health/summary - Get health summary
health.get('/summary', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const days = parseInt(c.req.query('days') || '7');
    if (days < 1 || days > 365) {
      return c.json({ error: 'Days must be between 1 and 365' }, 400);
    }

    const healthRepo = new HealthRepository(c.env);
    const summary = await healthRepo.getHealthSummary(auth.userId, days);
    
    return c.json({ 
      summary,
      period: {
        days,
        startDate: Date.now() - (days * 24 * 60 * 60 * 1000),
        endDate: Date.now()
      }
    });
  } catch (error) {
    console.error('Get health summary error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/health/stats - Get detailed health statistics
health.get('/stats', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const db = new DatabaseService(c.env);
    const period = c.req.query('period') || '30'; // days
    const startDate = Date.now() - (parseInt(period) * 24 * 60 * 60 * 1000);

    // Get exercise statistics
    const exerciseStats = await db.getUserData(auth.userId, 'health_logs', {
      type: 'exercise',
      'recorded_at >=': startDate
    });

    // Get nutrition statistics
    const nutritionStats = await db.getUserData(auth.userId, 'health_logs', {
      type: 'nutrition',
      'recorded_at >=': startDate
    });

    // Get mood statistics
    const moodStats = await db.getUserData(auth.userId, 'health_logs', {
      type: 'mood',
      'recorded_at >=': startDate
    });

    // Get hydration statistics
    const hydrationStats = await db.getUserData(auth.userId, 'health_logs', {
      type: 'hydration',
      'recorded_at >=': startDate
    });

    // Calculate aggregated stats
    const stats = {
      exercise: {
        totalSessions: exerciseStats.length,
        totalDuration: exerciseStats.reduce((sum: number, log: any) => {
          const payload = typeof log.payload === 'string' ? JSON.parse(log.payload) : log.payload;
          return sum + (payload.duration_minutes || 0);
        }, 0),
        averageIntensity: exerciseStats.length > 0 ? exerciseStats.reduce((sum: number, log: any) => {
          const payload = typeof log.payload === 'string' ? JSON.parse(log.payload) : log.payload;
          return sum + (payload.intensity || 0);
        }, 0) / exerciseStats.length : 0
      },
      nutrition: {
        totalEntries: nutritionStats.length,
        averageCaloriesPerDay: nutritionStats.length > 0 ? nutritionStats.reduce((sum: number, log: any) => {
          const payload = typeof log.payload === 'string' ? JSON.parse(log.payload) : log.payload;
          return sum + (payload.total_calories || 0);
        }, 0) / Math.max(1, parseInt(period)) : 0
      },
      mood: {
        totalEntries: moodStats.length,
        averageMoodScore: moodStats.length > 0 ? moodStats.reduce((sum: number, log: any) => {
          const payload = typeof log.payload === 'string' ? JSON.parse(log.payload) : log.payload;
          return sum + (payload.score || 0);
        }, 0) / moodStats.length : 0,
        averageEnergyLevel: moodStats.length > 0 ? moodStats.reduce((sum: number, log: any) => {
          const payload = typeof log.payload === 'string' ? JSON.parse(log.payload) : log.payload;
          return sum + (payload.energy || 0);
        }, 0) / moodStats.length : 0
      },
      hydration: {
        totalEntries: hydrationStats.length,
        totalWaterMl: hydrationStats.reduce((sum: number, log: any) => {
          const payload = typeof log.payload === 'string' ? JSON.parse(log.payload) : log.payload;
          return sum + (payload.amount_ml || 0);
        }, 0),
        averageDailyWaterMl: hydrationStats.length > 0 ? hydrationStats.reduce((sum: number, log: any) => {
          const payload = typeof log.payload === 'string' ? JSON.parse(log.payload) : log.payload;
          return sum + (payload.amount_ml || 0);
        }, 0) / Math.max(1, parseInt(period)) : 0
      }
    };
    
    return c.json({
      stats,
      period: {
        days: parseInt(period),
        startDate,
        endDate: Date.now()
      }
    });
  } catch (error) {
    console.error('Get health stats error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// DELETE /api/health/logs/:id - Delete a health log entry
health.delete('/logs/:id', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const logId = c.req.param('id');
    const db = new DatabaseService(c.env);
    
    await db.softDelete('health_logs', logId, auth.userId);
    
    return c.json({ message: 'Health log deleted successfully' });
  } catch (error) {
    console.error('Delete health log error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ========== ADVANCED HEALTH FEATURES ==========

// POST /api/health/goals - Create a health goal
health.post('/goals', zValidator('json', healthGoalSchema), async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const data = c.req.valid('json');
    const healthInsights = new HealthInsightsService(c.env);

    const goal = await healthInsights.createHealthGoal(auth.userId, {
      goal_type: data.goalType,
      title: data.title,
      description: data.description,
      target_value: data.targetValue,
      target_unit: data.targetUnit,
      target_date: data.targetDate,
      priority: data.priority || 3
    });

    return c.json({
      message: 'Health goal created successfully',
      goal
    }, 201);
  } catch (error) {
    console.error('Create health goal error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/health/goals - Get user's health goals
health.get('/goals', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const status = c.req.query('status');
    const healthInsights = new HealthInsightsService(c.env);
    
    const goals = await healthInsights.getHealthGoals(auth.userId, status);
    
    return c.json({ goals });
  } catch (error) {
    console.error('Get health goals error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// PUT /api/health/goals/:id/progress - Update goal progress
health.put('/goals/:id/progress', zValidator('json', goalProgressSchema), async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const goalId = c.req.param('id');
    const data = c.req.valid('json');
    const healthInsights = new HealthInsightsService(c.env);

    await healthInsights.updateGoalProgress(goalId, auth.userId, data.value, data.notes);
    
    return c.json({ message: 'Goal progress updated successfully' });
  } catch (error) {
    console.error('Update goal progress error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/health/nutrition/analysis - Get nutrition analysis
health.get('/nutrition/analysis', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const date = c.req.query('date') ? parseInt(c.req.query('date')!) : undefined;
    const healthInsights = new HealthInsightsService(c.env);
    
    const analysis = await healthInsights.analyzeNutrition(auth.userId, date);
    
    return c.json({ analysis });
  } catch (error) {
    console.error('Nutrition analysis error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/health/insights - Get health insights
health.get('/insights', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const category = c.req.query('category');
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : 10;
    const healthInsights = new HealthInsightsService(c.env);
    
    const insights = await healthInsights.getHealthInsights(auth.userId, category, limit);
    
    return c.json({ insights });
  } catch (error) {
    console.error('Get health insights error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /api/health/insights/generate - Generate new health insights
health.post('/insights/generate', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const healthInsights = new HealthInsightsService(c.env);
    
    const insights = await healthInsights.generateHealthInsights(auth.userId);
    
    return c.json({ 
      message: 'Health insights generated successfully',
      insights,
      count: insights.length
    });
  } catch (error) {
    console.error('Generate health insights error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// PUT /api/health/insights/:id/read - Mark insight as read
health.put('/insights/:id/read', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const insightId = c.req.param('id');
    const healthInsights = new HealthInsightsService(c.env);
    
    await healthInsights.markInsightAsRead(insightId, auth.userId);
    
    return c.json({ message: 'Insight marked as read' });
  } catch (error) {
    console.error('Mark insight as read error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/health/dashboard - Get health dashboard
health.get('/dashboard', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const healthInsights = new HealthInsightsService(c.env);
    
    const widgets = await healthInsights.createHealthDashboard(auth.userId);
    
    return c.json({ 
      dashboard: {
        widgets,
        layout: 'grid',
        last_updated: Date.now()
      }
    });
  } catch (error) {
    console.error('Get health dashboard error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default health;