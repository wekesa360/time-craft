// AI Integration Worker for Time & Wellness Application
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { verify } from 'hono/jwt';

import type { Env } from '../lib/env';
import { 
  TaskRepository, 
  HealthRepository, 
  UserRepository,
  DatabaseService 
} from '../lib/db';
import { AIService } from '../lib/ai';
import type { SupportedLanguage, Task } from '../types/database';

const ai = new Hono<{ Bindings: Env }>();

// Middleware to extract user from JWT
const getUserFromToken = async (c: any): Promise<{ userId: string; language?: SupportedLanguage } | null> => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const payload = await verify(token, c.env.JWT_SECRET);
    
    return { 
      userId: payload.userId as string,
      language: (payload.preferredLanguage as SupportedLanguage) || 'en'
    };
  } catch {
    return null;
  }
};

// Validation schemas
const taskPrioritySchema = z.object({
  taskIds: z.array(z.string()).optional(),
  context: z.object({
    workingHours: z.string().optional(),
    preferences: z.any().optional()
  }).optional()
});

const healthInsightsSchema = z.object({
  timeframeDays: z.number().min(7).max(365).optional().default(30),
  categories: z.array(z.enum(['exercise', 'mood', 'nutrition', 'sleep', 'hydration', 'overall'])).optional()
});

const meetingScheduleSchema = z.object({
  title: z.string().min(1, 'Meeting title is required'),
  participants: z.array(z.string().email()).min(1, 'At least one participant is required'),
  duration: z.number().min(15).max(480), // 15 minutes to 8 hours
  preferences: z.object({
    timeOfDay: z.enum(['morning', 'afternoon', 'evening']).optional(),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    urgency: z.enum(['low', 'medium', 'high']).optional()
  }).optional()
});

const smartPlanningSchema = z.object({
  input: z.string().min(10, 'Please provide more detailed input'),
  context: z.object({
    workingHours: z.string().optional(),
    preferences: z.any().optional(),
    includeExisting: z.boolean().optional()
  }).optional()
});

const voiceAnalysisSchema = z.object({
  audioUrl: z.string().url('Invalid audio URL'),
  context: z.enum(['reflection', 'voice_note', 'task_creation']),
  language: z.enum(['en', 'de']).optional()
});

// ========== TASK PRIORITY ANALYSIS ==========

// POST /ai/tasks/analyze-priority
ai.post('/tasks/analyze-priority', zValidator('json', taskPrioritySchema), async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { taskIds, context } = c.req.valid('json');
    const aiService = new AIService(c.env);
    const taskRepo = new TaskRepository(c.env);
    const userRepo = new UserRepository(c.env);

    // Get user context
    const user = await userRepo.findById(auth.userId);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Get tasks to analyze
    let tasks;
    if (taskIds && taskIds.length > 0) {
      // Get specific tasks
      const db = new DatabaseService(c.env);
      const taskPromises = taskIds.map(id => db.getUserData(auth.userId, 'tasks', { id }));
      const taskResults = await Promise.all(taskPromises);
      tasks = taskResults.flat().filter(task => task);
    } else {
      // Get all pending tasks
      const result = await taskRepo.getTasks(auth.userId, { 
        status: 'pending', 
        limit: 20 
      });
      tasks = result.data;
    }

    if (tasks.length === 0) {
      return c.json({ 
        message: 'No tasks to analyze',
        analysis: [] 
      });
    }

    // Build user context
    const userContext = {
      timezone: user.timezone,
      workingHours: context?.workingHours || '9:00-17:00',
      preferences: context?.preferences || {}
    };

    // Analyze task priorities
    const analysis = await aiService.analyzeTaskPriority(
      tasks as Task[], 
      userContext, 
      auth.language
    );

    // Update tasks with AI priority scores
    for (const taskAnalysis of analysis) {
      await taskRepo.updateTask(taskAnalysis.taskId, auth.userId, {
        ai_priority_score: taskAnalysis.priority / 100
      });
    }

    // Log AI usage
    c.env.ANALYTICS?.writeDataPoint({
      blobs: [auth.userId, 'ai_task_analysis', 'success'],
      doubles: [Date.now(), tasks.length],
      indexes: ['ai_usage']
    });

    return c.json({
      message: 'Task priority analysis completed',
      analysis: analysis.map(a => ({
        taskId: a.taskId,
        priority: a.priority,
        reasoning: a.reasoning,
        confidence: Math.round(a.confidenceScore * 100),
        suggestedTimeSlot: a.suggestedTimeSlot
      }))
    });
  } catch (error) {
    console.error('AI task analysis error:', error);
    return c.json({ error: 'AI analysis failed' }, 500);
  }
});

// ========== HEALTH INSIGHTS ==========

// POST /ai/health/insights
ai.post('/health/insights', zValidator('json', healthInsightsSchema), async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { timeframeDays, categories } = c.req.valid('json');
    const aiService = new AIService(c.env);
    const healthRepo = new HealthRepository(c.env);

    // Get health data for the specified timeframe
    const startDate = Date.now() - (timeframeDays * 24 * 60 * 60 * 1000);
    const healthLogs = await healthRepo.getHealthLogs(auth.userId, {
      start_date: startDate,
      limit: 500 // Get comprehensive data
    });

    if (healthLogs.data.length < 5) {
      return c.json({
        message: 'Insufficient data for insights. Please log more health activities.',
        insights: [],
        dataPoints: healthLogs.data.length
      });
    }

    // Generate AI insights
    const insights = await aiService.generateHealthInsights(
      auth.userId,
      healthLogs.data,
      timeframeDays,
      auth.language
    );

    // Filter by requested categories if specified
    const filteredInsights = categories 
      ? insights.filter(insight => categories.includes(insight.category))
      : insights;

    // Log AI usage
    c.env.ANALYTICS?.writeDataPoint({
      blobs: [auth.userId, 'ai_health_insights', 'success'],
      doubles: [Date.now(), filteredInsights.length, healthLogs.data.length],
      indexes: ['ai_usage']
    });

    return c.json({
      message: 'Health insights generated successfully',
      insights: filteredInsights.map(insight => ({
        category: insight.category,
        insight: insight.insight,
        recommendations: insight.recommendations,
        confidence: Math.round(insight.confidence * 100),
        dataPoints: insight.dataPoints
      })),
      timeframe: {
        days: timeframeDays,
        startDate,
        endDate: Date.now()
      },
      totalDataPoints: healthLogs.data.length
    });
  } catch (error) {
    console.error('AI health insights error:', error);
    return c.json({ error: 'Health insights generation failed' }, 500);
  }
});

// ========== AI MEETING SCHEDULING ==========

// POST /ai/calendar/schedule-meeting
ai.post('/calendar/schedule-meeting', zValidator('json', meetingScheduleSchema), async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const meetingRequest = c.req.valid('json');
    const aiService = new AIService(c.env);
    const db = new DatabaseService(c.env);

    // Get user's calendar events for the next 30 days
    const startDate = Date.now();
    const endDate = startDate + (30 * 24 * 60 * 60 * 1000);
    
    const userEvents = await db.getUserData(auth.userId, 'calendar_events', {
      'start >=': startDate,
      'start <=': endDate
    });

    // For now, we'll use a simple availability analysis
    // In a full implementation, you'd integrate with external calendars
    const participantAvailability = meetingRequest.participants.map(email => ({
      email,
      availability: 'limited', // Placeholder - would come from calendar integration
      timezone: 'UTC' // Placeholder
    }));

    // Generate AI meeting schedule
    const schedule = await aiService.scheduleAIMeeting(
      meetingRequest as any,
      userEvents,
      participantAvailability,
      auth.language
    );

    // Store the meeting request for tracking
    const requestId = `meeting_req_${Date.now()}`;
    await c.env.CACHE.put(
      `meeting_request_${requestId}`,
      JSON.stringify({
        userId: auth.userId,
        request: meetingRequest,
        schedule,
        createdAt: Date.now()
      }),
      { expirationTtl: 7 * 24 * 60 * 60 } // 7 days
    );

    // Log AI usage
    c.env.ANALYTICS?.writeDataPoint({
      blobs: [auth.userId, 'ai_meeting_scheduling', 'success'],
      doubles: [Date.now(), meetingRequest.participants.length, schedule.suggestedSlots.length],
      indexes: ['ai_usage']
    });

    return c.json({
      message: 'Meeting slots analyzed successfully',
      requestId,
      meeting: {
        title: schedule.title,
        duration: meetingRequest.duration,
        participants: schedule.participants.length
      },
      suggestedSlots: schedule.suggestedSlots.map(slot => ({
        start: slot.start,
        end: slot.end,
        confidence: Math.round(slot.confidence * 100),
        reasoning: slot.reasoning,
        formatted: {
          start: new Date(slot.start).toISOString(),
          end: new Date(slot.end).toISOString()
        }
      })),
      conflictAnalysis: schedule.conflictAnalysis
    });
  } catch (error) {
    console.error('AI meeting scheduling error:', error);
    return c.json({ error: 'Meeting scheduling failed' }, 500);
  }
});

// ========== SMART PLANNING ==========

// POST /ai/planning/create-plan
ai.post('/planning/create-plan', zValidator('json', smartPlanningSchema), async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { input, context } = c.req.valid('json');
    const aiService = new AIService(c.env);
    const taskRepo = new TaskRepository(c.env);
    const userRepo = new UserRepository(c.env);

    // Get user context
    const user = await userRepo.findById(auth.userId);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Get existing tasks if requested
    let existingTasks: Task[] = [];
    if (context?.includeExisting) {
      const result = await taskRepo.getTasks(auth.userId, { 
        status: 'pending', 
        limit: 50 
      });
      existingTasks = result.data;
    }

    // Build planning context
    const planningContext = {
      timezone: user.timezone,
      workingHours: context?.workingHours || '9:00-17:00',
      preferences: context?.preferences || {},
      existingTasks
    };

    // Generate smart plan
    const plan = await aiService.createSmartPlan(
      input,
      planningContext,
      auth.language
    );

    // Store the plan for later reference
    await c.env.CACHE.put(
      `smart_plan_${plan.planId}`,
      JSON.stringify({
        userId: auth.userId,
        originalInput: input,
        plan,
        createdAt: Date.now()
      }),
      { expirationTtl: 30 * 24 * 60 * 60 } // 30 days
    );

    // Log AI usage
    c.env.ANALYTICS?.writeDataPoint({
      blobs: [auth.userId, 'ai_smart_planning', 'success'],
      doubles: [Date.now(), plan.tasks.length, plan.totalEstimatedTime],
      indexes: ['ai_usage']
    });

    return c.json({
      message: 'Smart plan created successfully',
      plan: {
        id: plan.planId,
        confidence: Math.round(plan.confidenceScore * 100),
        reasoning: plan.reasoning,
        totalEstimatedTime: plan.totalEstimatedTime,
        tasks: plan.tasks.map((task, index) => ({
          id: `planned_task_${index}`,
          title: task.title,
          description: task.description,
          priority: task.priority,
          estimatedDuration: task.estimatedDuration,
          suggestedTime: task.suggestedTime,
          energyLevel: task.energyLevel,
          context: task.context,
          formattedTime: new Date(task.suggestedTime).toISOString()
        }))
      },
      actions: {
        canCreateTasks: true,
        canSchedule: true,
        canModify: true
      }
    });
  } catch (error) {
    console.error('AI smart planning error:', error);
    return c.json({ error: 'Smart planning failed' }, 500);
  }
});

// POST /ai/planning/execute-plan/:planId
ai.post('/planning/execute-plan/:planId', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const planId = c.req.param('planId');
    
    // Retrieve the stored plan
    const storedPlan = await c.env.CACHE.get(`smart_plan_${planId}`);
    if (!storedPlan) {
      return c.json({ error: 'Plan not found or expired' }, 404);
    }

    const planData = JSON.parse(storedPlan);
    if (planData.userId !== auth.userId) {
      return c.json({ error: 'Unauthorized access to plan' }, 403);
    }

    // Create tasks from the plan
    const taskRepo = new TaskRepository(c.env);
    const createdTasks = [];

    for (const plannedTask of planData.plan.tasks) {
      const task = await taskRepo.createTask({
        user_id: auth.userId,
        title: plannedTask.title,
        description: plannedTask.description,
        priority: Math.min(4, Math.max(1, Math.round(plannedTask.priority / 25))) as 1 | 2 | 3 | 4,
        status: 'pending',
        due_date: null, // Could be set based on suggestedTime
        estimated_duration: plannedTask.estimatedDuration,
        ai_priority_score: plannedTask.priority / 100,
        ai_planning_session_id: planId,
        energy_level_required: plannedTask.energyLevel,
        context_type: plannedTask.context
      });

      createdTasks.push(task);
    }

    // Remove the plan from cache since it's been executed
    await c.env.CACHE.delete(`smart_plan_${planId}`);

    // Log execution
    c.env.ANALYTICS?.writeDataPoint({
      blobs: [auth.userId, 'ai_plan_executed', 'success'],
      doubles: [Date.now(), createdTasks.length],
      indexes: ['ai_usage']
    });

    return c.json({
      message: `Successfully created ${createdTasks.length} tasks from plan`,
      createdTasks: createdTasks.map(task => ({
        id: task.id,
        title: task.title,
        priority: task.priority,
        aiPriority: Math.round((task.ai_priority_score || 0) * 100)
      })),
      executedAt: Date.now()
    });
  } catch (error) {
    console.error('Plan execution error:', error);
    return c.json({ error: 'Plan execution failed' }, 500);
  }
});

// ========== VOICE ANALYSIS ==========

// POST /ai/voice/analyze
ai.post('/voice/analyze', zValidator('json', voiceAnalysisSchema), async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { audioUrl, context, language } = c.req.valid('json');
    const aiService = new AIService(c.env);

    // Transcribe and analyze the audio
    const result = await aiService.transcribeAndAnalyze(
      audioUrl,
      context,
      language || auth.language || 'en'
    );

    // Log AI usage
    c.env.ANALYTICS?.writeDataPoint({
      blobs: [auth.userId, 'ai_voice_analysis', context],
      doubles: [Date.now(), result.transcription.length],
      indexes: ['ai_usage']
    });

    return c.json({
      message: 'Voice analysis completed successfully',
      transcription: result.transcription,
      analysis: result.analysis,
      context,
      language: language || auth.language,
      processedAt: Date.now()
    });
  } catch (error) {
    console.error('Voice analysis error:', error);
    return c.json({ error: 'Voice analysis failed' }, 500);
  }
});

// ========== AI USAGE STATS ==========

// GET /ai/usage/stats
ai.get('/usage/stats', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // Get AI usage statistics from analytics
    // This would require querying the analytics dataset
    // For now, return placeholder data
    
    const stats = {
      thisMonth: {
        taskAnalyses: 12,
        healthInsights: 5,
        meetingSchedules: 3,
        smartPlans: 2,
        voiceAnalyses: 8
      },
      allTime: {
        taskAnalyses: 45,
        healthInsights: 18,
        meetingSchedules: 12,
        smartPlans: 7,
        voiceAnalyses: 23
      },
      limits: {
        taskAnalyses: 100, // per month
        healthInsights: 20,
        meetingSchedules: 50,
        smartPlans: 25,
        voiceAnalyses: 100
      }
    };

    return c.json({
      usage: stats,
      generatedAt: Date.now()
    });
  } catch (error) {
    console.error('AI usage stats error:', error);
    return c.json({ error: 'Failed to get usage statistics' }, 500);
  }
});

export default ai;