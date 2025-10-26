// Core API routes for Time & Wellness Application
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { verify } from 'hono/jwt';

import type { Env } from '../lib/env';
import { 
  UserRepository, 
  TaskRepository, 
  LocalizationRepository,
  DatabaseService
} from '../lib/db';
import type { 
  User, 
  TaskPriority, 
  SupportedLanguage,
  TaskFilters 
} from '../types/database';
import { queueNotification } from '../lib/notifications';
import { triggerBadgeCheck } from '../lib/badges';

const core = new Hono<{ Bindings: Env }>();

// Middleware to extract user from JWT
const getUserFromToken = async (c: any): Promise<{ userId: string; user?: User } | null> => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const payload = await verify(token, c.env.JWT_SECRET);
    
    return { 
      userId: payload.userId as string,
      user: payload as any 
    };
  } catch {
    return null;
  }
};

// Validation schemas
const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  timezone: z.string().optional(),
  preferredLanguage: z.enum(['en', 'de']).optional()
});

const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200),
  description: z.string().max(1000).optional(),
  priority: z.number().int().min(1).max(4).default(1),
  dueDate: z.number().optional(),
  estimatedDuration: z.number().int().min(1).optional(),
  energyLevelRequired: z.number().int().min(1).max(10).optional(),
  contextType: z.string().max(50).optional(),
  // Eisenhower Matrix fields
  urgency: z.number().int().min(1).max(4).optional(),
  importance: z.number().int().min(1).max(4).optional(),
  matrixNotes: z.string().max(500).optional(),
  isDelegated: z.boolean().default(false),
  delegatedTo: z.string().max(100).optional(),
  delegationNotes: z.string().max(500).optional()
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  priority: z.number().int().min(1).max(4).optional(),
  status: z.enum(['pending', 'done', 'archived']).optional(),
  dueDate: z.number().optional(),
  estimatedDuration: z.number().int().min(1).optional(),
  energyLevelRequired: z.number().int().min(1).max(10).optional(),
  contextType: z.string().max(50).optional(),
  // Eisenhower Matrix fields
  urgency: z.number().int().min(1).max(4).optional(),
  importance: z.number().int().min(1).max(4).optional(),
  matrixNotes: z.string().max(500).optional(),
  isDelegated: z.boolean().optional(),
  delegatedTo: z.string().max(100).optional(),
  delegationNotes: z.string().max(500).optional()
});

const taskFiltersSchema = z.object({
  status: z.enum(['pending', 'done', 'archived', 'completed']).optional().transform(val => val === 'completed' ? 'done' : val),
  priority: z.coerce.number().int().min(1).max(4).optional(),
  contextType: z.string().optional(),
  search: z.string().optional(),
  startDate: z.coerce.number().optional(),
  endDate: z.coerce.number().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  // Eisenhower Matrix filters
  quadrant: z.enum(['do', 'decide', 'delegate', 'delete']).optional(),
  urgency: z.coerce.number().int().min(1).max(4).optional(),
  importance: z.coerce.number().int().min(1).max(4).optional(),
  isDelegated: z.coerce.boolean().optional()
});

// ========== USER MANAGEMENT ENDPOINTS ==========

// GET /api/user/profile - Get current user profile
core.get('/user/profile', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const userRepo = new UserRepository(c.env);
    const user = await userRepo.findById(auth.userId);

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Exclude sensitive data
    const { password_hash, ...userProfile } = user;
    
    return c.json({ user: userProfile });
  } catch (error) {
    console.error('Get profile error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// PUT /api/user/profile - Update user profile
core.put('/user/profile', zValidator('json', updateUserSchema), async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const updates = c.req.valid('json');
    const userRepo = new UserRepository(c.env);

    // Convert camelCase to snake_case for database
    const dbUpdates: any = {};
    if (updates.firstName) dbUpdates.first_name = updates.firstName;
    if (updates.lastName) dbUpdates.last_name = updates.lastName;
    if (updates.timezone) dbUpdates.timezone = updates.timezone;
    if (updates.preferredLanguage) dbUpdates.preferred_language = updates.preferredLanguage;

    await userRepo.updateUser(auth.userId, dbUpdates);

    // Get updated user
    const updatedUser = await userRepo.findById(auth.userId);
    if (!updatedUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    const { password_hash, ...userProfile } = updatedUser;
    
    return c.json({ 
      message: 'Profile updated successfully',
      user: userProfile 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// DELETE /api/user/account - Delete user account
core.delete('/user/account', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const db = new DatabaseService(c.env);
    
    // Soft delete user and related data
    await db.softDelete('users', auth.userId);
    
    // Log account deletion
    c.env.ANALYTICS?.writeDataPoint({
      blobs: [auth.userId, 'account_deleted'],
      doubles: [Date.now()],
      indexes: ['user_events']
    });

    return c.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// PUT /api/user/password - Change user password
core.put('/user/password', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { currentPassword, newPassword } = await c.req.json();

    // Validate input
    if (!currentPassword || !newPassword) {
      return c.json({ error: 'Current password and new password are required' }, 400);
    }

    if (newPassword.length < 8) {
      return c.json({ error: 'New password must be at least 8 characters long' }, 400);
    }

    const db = new DatabaseService(c.env);
    
    // Get current user to verify current password
    const user = await db.getOne('users', { user_id: auth.userId });
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Verify current password (assuming password is hashed)
    const bcrypt = await import('bcryptjs');
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    
    if (!isCurrentPasswordValid) {
      return c.json({ error: 'Current password is incorrect' }, 400);
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await db.update('users', 
      { user_id: auth.userId }, 
      { 
        password_hash: hashedNewPassword,
        password_updated_at: Date.now(),
        updated_at: Date.now()
      }
    );

    // Log password change
    console.log(`Password changed for user: ${auth.userId}`);

    return c.json({ 
      success: true, 
      message: 'Password updated successfully' 
    });
  } catch (error) {
    console.error('Change password error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /api/user/avatar - Upload user avatar
core.post('/user/avatar', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // Parse multipart form data
    const formData = await c.req.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' }, 400);
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return c.json({ error: 'File too large. Maximum size is 5MB' }, 400);
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `avatars/${auth.userId}-${Date.now()}.${fileExtension}`;

    // Upload to R2 storage
    const fileBuffer = await file.arrayBuffer();
    await c.env.ASSETS.put(fileName, fileBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Update user record with avatar URL
    const db = new DatabaseService(c.env);
    const avatarUrl = `https://assets.timeandwellness.app/${fileName}`; // Adjust domain as needed
    
    await db.update('users', 
      { user_id: auth.userId }, 
      { 
        avatar_url: avatarUrl,
        updated_at: Date.now()
      }
    );

    console.log(`Avatar uploaded for user: ${auth.userId}`);

    return c.json({ 
      success: true,
      message: 'Avatar uploaded successfully',
      avatarUrl 
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ========== TASK MANAGEMENT ENDPOINTS ==========

// GET /api/tasks - Get user tasks with filtering
core.get('/tasks', zValidator('query', taskFiltersSchema), async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const filters = c.req.valid('query') as TaskFilters;
    const taskRepo = new TaskRepository(c.env);
    
    const result = await taskRepo.getTasks(auth.userId, filters);
    
    return c.json({
      tasks: result.data,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor,
      total: result.total
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /api/tasks - Create new task
core.post('/tasks', zValidator('json', createTaskSchema), async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const taskData = c.req.valid('json');
    const taskRepo = new TaskRepository(c.env);
    
    const newTask = await taskRepo.createTask({
      user_id: auth.userId,
      title: taskData.title,
      description: taskData.description || null,
      priority: taskData.priority as TaskPriority,
      status: 'pending',
      due_date: taskData.dueDate || null,
      estimated_duration: taskData.estimatedDuration || null,
      ai_priority_score: null,
      ai_planning_session_id: null,
      energy_level_required: taskData.energyLevelRequired || null,
      context_type: taskData.contextType || null,
      // Eisenhower Matrix fields
      urgency: taskData.urgency || null,
      importance: taskData.importance || null,
      matrix_notes: taskData.matrixNotes || null,
      is_delegated: taskData.isDelegated || false,
      delegated_to: taskData.delegatedTo || null,
      delegation_notes: taskData.delegationNotes || null,
      matrix_last_reviewed: Date.now()
    });

    // Log task creation
    c.env.ANALYTICS?.writeDataPoint({
      blobs: [auth.userId, 'task_created'],
      doubles: [Date.now()],
      indexes: ['user_actions']
    });

    // Trigger badge check for task creation
    triggerBadgeCheck(c.env, auth.userId);

    return c.json({ 
      message: 'Task created successfully',
      task: newTask 
    }, 201);
  } catch (error) {
    console.error('Create task error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/tasks/stats - Get task statistics
core.get('/tasks/stats', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const taskRepo = new TaskRepository(c.env);
    const stats = await taskRepo.getTaskStats(auth.userId);
    
    return c.json({ stats });
  } catch (error) {
    console.error('Get task stats error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/tasks/matrix - Alias for /api/matrix
core.get('/tasks/matrix', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const taskRepo = new TaskRepository(c.env);
    const tasks = await taskRepo.getTasks(auth.userId, { status: 'pending' });

    // Organize tasks by Eisenhower Matrix quadrants
    const doTasks = tasks.data.filter((task: any) => (task.urgency || 2) >= 3 && (task.importance || 2) >= 3);
    const decideTasks = tasks.data.filter((task: any) => (task.urgency || 2) < 3 && (task.importance || 2) >= 3);
    const delegateTasks = tasks.data.filter((task: any) => (task.urgency || 2) >= 3 && (task.importance || 2) < 3);
    const deleteTasks = tasks.data.filter((task: any) => (task.urgency || 2) < 3 && (task.importance || 2) < 3);

    const matrix = {
      do: doTasks,
      decide: decideTasks,
      delegate: delegateTasks,
      delete: deleteTasks,
      stats: {
        do: doTasks.length,
        decide: decideTasks.length,
        delegate: delegateTasks.length,
        delete: deleteTasks.length
      }
    };

    return c.json({ matrix });
  } catch (error) {
    console.error('Get matrix error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/tasks/:id - Get specific task
core.get('/tasks/:id', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const taskId = c.req.param('id');
    const db = new DatabaseService(c.env);
    
    const tasks = await db.getUserData(auth.userId, 'tasks', { id: taskId });
    
    if (tasks.length === 0) {
      return c.json({ error: 'Task not found' }, 404);
    }

    return c.json({ task: tasks[0] });
  } catch (error) {
    console.error('Get task error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// PUT /api/tasks/:id - Update task
core.put('/tasks/:id', zValidator('json', updateTaskSchema), async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const taskId = c.req.param('id');
    const updates = c.req.valid('json');
    const taskRepo = new TaskRepository(c.env);

    // Convert camelCase to snake_case for database
    const dbUpdates: any = {};
    if (updates.title) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.priority) dbUpdates.priority = updates.priority;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
    if (updates.estimatedDuration !== undefined) dbUpdates.estimated_duration = updates.estimatedDuration;
    if (updates.energyLevelRequired !== undefined) dbUpdates.energy_level_required = updates.energyLevelRequired;
    if (updates.contextType !== undefined) dbUpdates.context_type = updates.contextType;
    // Eisenhower Matrix updates
    if (updates.urgency !== undefined) dbUpdates.urgency = updates.urgency;
    if (updates.importance !== undefined) dbUpdates.importance = updates.importance;
    if (updates.matrixNotes !== undefined) dbUpdates.matrix_notes = updates.matrixNotes;
    if (updates.isDelegated !== undefined) dbUpdates.is_delegated = updates.isDelegated;
    if (updates.delegatedTo !== undefined) dbUpdates.delegated_to = updates.delegatedTo;
    if (updates.delegationNotes !== undefined) dbUpdates.delegation_notes = updates.delegationNotes;
    
    // Update matrix review timestamp if matrix fields changed
    if (updates.urgency !== undefined || updates.importance !== undefined) {
      dbUpdates.matrix_last_reviewed = Date.now();
    }

    await taskRepo.updateTask(taskId, auth.userId, dbUpdates);

    // Get updated task
    const db = new DatabaseService(c.env);
    const tasks = await db.getUserData(auth.userId, 'tasks', { id: taskId });
    
    if (tasks.length === 0) {
      return c.json({ error: 'Task not found' }, 404);
    }

    return c.json({ 
      message: 'Task updated successfully',
      task: tasks[0] 
    });
  } catch (error) {
    console.error('Update task error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// DELETE /api/tasks/:id - Delete task
core.delete('/tasks/:id', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const taskId = c.req.param('id');
    const db = new DatabaseService(c.env);
    
    await db.softDelete('tasks', taskId, auth.userId);
    
    return c.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// PATCH /api/tasks/:id/complete - Complete a task
core.patch('/tasks/:id/complete', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const taskId = c.req.param('id');
    const taskRepo = new TaskRepository(c.env);
    
    await taskRepo.completeTask(taskId, auth.userId);
    
    // Log task completion
    c.env.ANALYTICS?.writeDataPoint({
      blobs: [auth.userId, 'task_completed'],
      doubles: [Date.now()],
      indexes: ['user_actions']
    });

    // Trigger badge check for task completion
    triggerBadgeCheck(c.env, auth.userId);

    return c.json({ message: 'Task completed successfully' });
  } catch (error) {
    console.error('Complete task error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ========== LOCALIZATION ENDPOINTS ==========
// Note: Localization endpoints are now handled by the dedicated localization worker

// ========== EISENHOWER MATRIX ENDPOINTS ==========

// GET /api/matrix - Get tasks organized by Eisenhower Matrix
core.get('/matrix', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const db = new DatabaseService(c.env);
    
    // Get tasks organized by quadrant
    const matrixTasks = await db.getUserData(auth.userId, 'task_matrix_view', {
      status: 'pending'
    });

    // Organize by quadrant
    const matrix = {
      do: matrixTasks.filter((t: any) => t.eisenhower_quadrant === 'do'),
      decide: matrixTasks.filter((t: any) => t.eisenhower_quadrant === 'decide'),
      delegate: matrixTasks.filter((t: any) => t.eisenhower_quadrant === 'delegate'),
      delete: matrixTasks.filter((t: any) => t.eisenhower_quadrant === 'delete')
    };

    // Get matrix statistics
    const stats = {
      total: matrixTasks.length,
      do: matrix.do.length,
      decide: matrix.decide.length,
      delegate: matrix.delegate.length,
      delete: matrix.delete.length
    };

    return c.json({
      matrix,
      stats,
      recommendations: {
        focus: stats.do > 10 ? 'Too many urgent tasks - consider better planning' : 
               stats.decide < 3 ? 'Add more important long-term tasks' : 'Good balance',
        delegation: stats.delegate > 5 ? 'Consider delegating more tasks' : 'Delegation looks manageable',
        elimination: stats.delete > 3 ? 'Review and eliminate unnecessary tasks' : 'Task list is clean'
      }
    });
  } catch (error) {
    console.error('Get matrix error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/matrix/stats - Get matrix statistics and insights
core.get('/matrix/stats', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const db = new DatabaseService(c.env);
    const days = parseInt(c.req.query('days') || '30');
    
    // Get matrix stats for the period
    const startDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    const matrixStats = await db.getUserData(auth.userId, 'matrix_stats', {
      'date_recorded >=': startDate
    });

    // Calculate averages and trends
    const avgStats = matrixStats.reduce((acc: any, stat: any) => {
      acc.do += stat.quadrant_do_count || 0;
      acc.decide += stat.quadrant_decide_count || 0;
      acc.delegate += stat.quadrant_delegate_count || 0;
      acc.delete += stat.quadrant_delete_count || 0;
      acc.productivity += stat.productivity_score || 0;
      return acc;
    }, { do: 0, decide: 0, delegate: 0, delete: 0, productivity: 0 });

    const statCount = matrixStats.length || 1;
    Object.keys(avgStats).forEach(key => {
      avgStats[key] = Math.round((avgStats[key] / statCount) * 100) / 100;
    });

    // Get active insights
    const insights = await db.getUserData(auth.userId, 'matrix_insights', {
      is_active: true,
      'expires_at >': Date.now()
    });

    return c.json({
      period: { days, startDate, endDate: Date.now() },
      averages: avgStats,
      trends: matrixStats.slice(-7), // Last 7 days for trend analysis
      insights: insights.map((insight: any) => ({
        type: insight.insight_type,
        text: insight.insight_text_en, // TODO: Use user's preferred language
        recommendation: insight.recommendation_en,
        confidence: insight.confidence_score
      })),
      totalDataPoints: statCount
    });
  } catch (error) {
    console.error('Get matrix stats error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /api/matrix/categorize - AI-powered task categorization
core.post('/matrix/categorize', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const taskRepo = new TaskRepository(c.env);
    
    // Get uncategorized tasks (no urgency/importance set)
    const uncategorizedTasks = await taskRepo.getTasks(auth.userId, {
      status: 'pending',
      limit: 20
    });

    const tasksToAnalyze = uncategorizedTasks.data.filter((task: any) => 
      !task.urgency || !task.importance
    );

    if (tasksToAnalyze.length === 0) {
      return c.json({
        message: 'All tasks are already categorized',
        categorized: 0
      });
    }

    // Simple AI-like categorization based on keywords and due dates
    const categorizations = tasksToAnalyze.map((task: any) => {
      let urgency = 2;
      let importance = 2;
      let confidence = 0.7;

      // Analyze due date for urgency
      if (task.due_date) {
        const daysUntilDue = (task.due_date - Date.now()) / (24 * 60 * 60 * 1000);
        if (daysUntilDue < 0) urgency = 4; // Overdue
        else if (daysUntilDue < 1) urgency = 4; // Due today
        else if (daysUntilDue < 3) urgency = 3; // Due soon
        else if (daysUntilDue < 7) urgency = 2; // Due this week
        else urgency = 1; // Due later
      }

      // Analyze title/description for importance keywords
      const text = `${task.title} ${task.description || ''}`.toLowerCase();
      const highImportanceKeywords = ['critical', 'important', 'urgent', 'deadline', 'meeting', 'client', 'boss'];
      const lowImportanceKeywords = ['maybe', 'someday', 'nice to have', 'optional', 'when possible'];

      if (highImportanceKeywords.some(keyword => text.includes(keyword))) {
        importance = Math.min(4, importance + 1);
        confidence += 0.1;
      }
      if (lowImportanceKeywords.some(keyword => text.includes(keyword))) {
        importance = Math.max(1, importance - 1);
        confidence += 0.1;
      }

      // Use existing priority as importance indicator
      if (task.priority >= 3) importance = Math.min(4, importance + 1);
      if (task.priority <= 2) importance = Math.max(1, importance - 1);

      return {
        taskId: task.id,
        urgency: Math.min(4, Math.max(1, urgency)),
        importance: Math.min(4, Math.max(1, importance)),
        confidence: Math.min(1, confidence)
      };
    });

    // Update tasks with categorizations
    for (const cat of categorizations) {
      await taskRepo.updateTask(cat.taskId, auth.userId, {
        urgency: cat.urgency,
        importance: cat.importance,
        ai_matrix_confidence: cat.confidence,
        matrix_last_reviewed: Date.now()
      });
    }

    return c.json({
      message: `Categorized ${categorizations.length} tasks`,
      categorized: categorizations.length,
      categorizations: categorizations.map(cat => ({
        taskId: cat.taskId,
        quadrant: cat.urgency >= 3 && cat.importance >= 3 ? 'do' :
                 cat.urgency < 3 && cat.importance >= 3 ? 'decide' :
                 cat.urgency >= 3 && cat.importance < 3 ? 'delegate' : 'delete',
        confidence: Math.round(cat.confidence * 100)
      }))
    });
  } catch (error) {
    console.error('Matrix categorization error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ========== MATRIX ROUTE ALIASES ==========
// For compatibility with frontend expectations

// GET /api/tasks/matrix/stats - Alias for /api/matrix/stats
core.get('/tasks/matrix/stats', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const taskRepo = new TaskRepository(c.env);
    const tasks = await taskRepo.getTasks(auth.userId, { status: 'pending' });

    const stats = {
      total: tasks.data.length,
      do: tasks.data.filter((task: any) => (task.urgency || 2) >= 3 && (task.importance || 2) >= 3).length,
      decide: tasks.data.filter((task: any) => (task.urgency || 2) < 3 && (task.importance || 2) >= 3).length,
      delegate: tasks.data.filter((task: any) => (task.urgency || 2) >= 3 && (task.importance || 2) < 3).length,
      delete: tasks.data.filter((task: any) => (task.urgency || 2) < 3 && (task.importance || 2) < 3).length
    };

    return c.json({ stats });
  } catch (error) {
    console.error('Get matrix stats error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// PATCH /api/tasks/:id/matrix - Update task matrix position
core.patch('/tasks/:id/matrix', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const taskId = c.req.param('id');
    const { urgency, importance } = await c.req.json();

    // Validate input
    if (typeof urgency !== 'number' || urgency < 1 || urgency > 4 || 
        typeof importance !== 'number' || importance < 1 || importance > 4) {
      return c.json({ 
        error: 'Invalid input', 
        message: 'Urgency and importance must be numbers between 1 and 4' 
      }, 400);
    }

    const taskRepo = new TaskRepository(c.env);
    
    // Verify task belongs to user
    const existingTask = await taskRepo.getTask(taskId, auth.userId);
    if (!existingTask.data) {
      return c.json({ error: 'Task not found' }, 404);
    }

    // Update task matrix position
    const updatedTask = await taskRepo.updateTask(taskId, auth.userId, {
      urgency,
      importance,
      matrix_last_reviewed: Date.now(),
      updated_at: Date.now()
    });

    // Determine quadrant
    const quadrant = urgency >= 3 && importance >= 3 ? 'do' :
                    urgency < 3 && importance >= 3 ? 'decide' :
                    urgency >= 3 && importance < 3 ? 'delegate' : 'delete';

    return c.json({
      success: true,
      task: updatedTask.data,
      quadrant,
      matrix: {
        urgency,
        importance
      }
    });
  } catch (error) {
    console.error('Update task matrix error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ========== DASHBOARD ENDPOINTS ==========

// GET /api/dashboard - Get dashboard overview
core.get('/dashboard', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const taskRepo = new TaskRepository(c.env);
    const db = new DatabaseService(c.env);

    // Get various statistics in parallel
    const [taskStats, recentTasks, upcomingTasks] = await Promise.all([
      taskRepo.getTaskStats(auth.userId),
      taskRepo.getTasks(auth.userId, { limit: 5, status: 'pending' }),
      taskRepo.getTasks(auth.userId, { 
        limit: 5, 
        status: 'pending',
        start_date: Date.now(),
        end_date: Date.now() + (7 * 24 * 60 * 60 * 1000) // Next 7 days
      })
    ]);

    // Get matrix overview with fallback for missing view
    let matrixOverview = [];
    try {
      matrixOverview = await db.getUserData(auth.userId, 'task_matrix_view', { status: 'pending' });
    } catch (error) {
      console.log('task_matrix_view not found, using fallback matrix calculation');
      // Fallback: calculate matrix from regular tasks
      const allTasks = await taskRepo.getTasks(auth.userId, { status: 'pending' });
      matrixOverview = allTasks.data.map((task: any) => ({
        ...task,
        eisenhower_quadrant: (task.urgency || 2) >= 3 && (task.importance || 2) >= 3 ? 'do' :
                           (task.urgency || 2) < 3 && (task.importance || 2) >= 3 ? 'decide' :
                           (task.urgency || 2) >= 3 && (task.importance || 2) < 3 ? 'delegate' : 'delete'
      }));
    }

    // Calculate matrix distribution
    const matrixStats = {
      do: matrixOverview.filter((t: any) => t.eisenhower_quadrant === 'do').length,
      decide: matrixOverview.filter((t: any) => t.eisenhower_quadrant === 'decide').length,
      delegate: matrixOverview.filter((t: any) => t.eisenhower_quadrant === 'delegate').length,
      delete: matrixOverview.filter((t: any) => t.eisenhower_quadrant === 'delete').length
    };

    return c.json({
      taskStats,
      recentTasks: recentTasks.data,
      upcomingTasks: upcomingTasks.data,
      matrixStats,
      lastUpdated: Date.now()
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/analytics/overview - Analytics overview endpoint
core.get('/analytics/overview', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  
  try {
    const period = c.req.query('period') || '30';
    const days = parseInt(period);
    const startTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    const taskRepo = new TaskRepository(c.env);
    const db = new DatabaseService(c.env);
    
    // Get all tasks for the period
    const allTasks = await taskRepo.getTasks(auth.userId);
    const recentTasks = allTasks.data.filter((task: any) => task.created_at >= startTime);
    
    // Task analytics
    const taskStats = {
      total: allTasks.data.length,
      completed: allTasks.data.filter((task: any) => task.status === 'completed').length,
      pending: allTasks.data.filter((task: any) => task.status === 'pending').length,
      inProgress: allTasks.data.filter((task: any) => task.status === 'in_progress').length,
      recentlyCreated: recentTasks.length
    };
    
    // Focus analytics - get focus sessions
    const focusSessions = await db.query(`
      SELECT COUNT(*) as sessions, SUM(duration) as totalDuration, AVG(duration) as avgDuration
      FROM focus_sessions 
      WHERE user_id = ? AND created_at >= ?
    `, [auth.userId, startTime]);
    
    // Productivity metrics
    const completedToday = allTasks.data.filter((task: any) => 
      task.status === 'completed' && 
      task.updated_at >= Date.now() - (24 * 60 * 60 * 1000)
    ).length;
    
    const completionRate = taskStats.total > 0 ? 
      Math.round((taskStats.completed / taskStats.total) * 100) : 0;
    
    // Matrix distribution
    const matrixStats = {
      do: allTasks.data.filter((task: any) => (task.urgency || 2) >= 3 && (task.importance || 2) >= 3).length,
      decide: allTasks.data.filter((task: any) => (task.urgency || 2) < 3 && (task.importance || 2) >= 3).length,
      delegate: allTasks.data.filter((task: any) => (task.urgency || 2) >= 3 && (task.importance || 2) < 3).length,
      delete: allTasks.data.filter((task: any) => (task.urgency || 2) < 3 && (task.importance || 2) < 3).length
    };
    
    const overview = {
      tasks: taskStats,
      focus: {
        sessions: focusSessions[0]?.sessions || 0,
        totalMinutes: Math.round((focusSessions[0]?.totalDuration || 0) / 60),
        avgMinutes: Math.round((focusSessions[0]?.avgDuration || 0) / 60)
      },
      productivity: {
        completionRate,
        completedToday,
        totalCompleted: taskStats.completed,
        matrixDistribution: matrixStats
      },
      period: {
        days,
        startDate: new Date(startTime).toISOString(),
        endDate: new Date().toISOString()
      }
    };
    
    return c.json({ overview });
  } catch (error) {
    console.error('Analytics overview error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ========== HABIT TRACKING ENDPOINTS ==========
// Basic habit tracking functionality

// GET /api/habits - Get user habits
core.get('/habits', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  
  try {
    const db = new DatabaseService(c.env);
    
    const habits = await db.query(`
      SELECT * FROM habits 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `, [auth.userId]);
    
    return c.json({ habits: habits || [] });
  } catch (error) {
    console.error('Get habits error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /api/habits - Create new habit
core.post('/habits', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  
  try {
    const { name, description, frequency, target_days } = await c.req.json();
    
    if (!name) {
      return c.json({ error: 'Habit name is required' }, 400);
    }
    
    const db = new DatabaseService(c.env);
    const now = Date.now();
    const habitId = `habit_${Math.random().toString(36).substr(2, 16)}${now}`;
    
    const habit = {
      habit_id: habitId,
      user_id: auth.userId,
      name,
      description: description || '',
      frequency: frequency || 'daily',
      target_days: target_days || 7,
      current_streak: 0,
      longest_streak: 0,
      is_active: true,
      created_at: now,
      updated_at: now
    };
    
    // Create habits table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS habits (
        habit_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        frequency TEXT DEFAULT 'daily',
        target_days INTEGER DEFAULT 7,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);
    
    await db.insert('habits', habit);
    
    return c.json({ habit }, 201);
  } catch (error) {
    console.error('Create habit error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /api/habits/:id/check-in - Log habit completion
core.post('/habits/:id/check-in', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  
  try {
    const habitId = c.req.param('id');
    const { completed_date } = await c.req.json();
    
    const db = new DatabaseService(c.env);
    const now = Date.now();
    const checkDate = completed_date || now;
    
    // Verify habit belongs to user
    const habit = await db.getOne('habits', { 
      habit_id: habitId, 
      user_id: auth.userId 
    });
    
    if (!habit) {
      return c.json({ error: 'Habit not found' }, 404);
    }
    
    // Create habit_logs table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS habit_logs (
        log_id TEXT PRIMARY KEY,
        habit_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        completed_date INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        UNIQUE(habit_id, completed_date)
      )
    `);
    
    const logId = `log_${Math.random().toString(36).substr(2, 16)}${now}`;
    
    // Check if already logged for this date
    const existingLog = await db.getOne('habit_logs', { 
      habit_id: habitId, 
      completed_date: checkDate 
    });
    
    if (existingLog) {
      return c.json({ error: 'Already logged for this date' }, 400);
    }
    
    const log = {
      log_id: logId,
      habit_id: habitId,
      user_id: auth.userId,
      completed_date: checkDate,
      created_at: now
    };
    
    await db.insert('habit_logs', log);
    
    // Update habit streaks
    const logs = await db.query(`
      SELECT completed_date FROM habit_logs 
      WHERE habit_id = ? 
      ORDER BY completed_date DESC
    `, [habitId]);
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    // Calculate streaks (simplified - assumes daily frequency)
    const today = Math.floor(now / (24 * 60 * 60 * 1000));
    let checkDay = today;
    
    for (const logEntry of logs) {
      const logDay = Math.floor(logEntry.completed_date / (24 * 60 * 60 * 1000));
      if (logDay === checkDay) {
        tempStreak++;
        if (checkDay === today || checkDay === today - 1) {
          currentStreak = tempStreak;
        }
        checkDay--;
      } else if (logDay < checkDay - 1) {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
        checkDay = logDay - 1;
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);
    
    await db.update('habits', { habit_id: habitId }, {
      current_streak: currentStreak,
      longest_streak: longestStreak,
      updated_at: now
    });
    
    const updatedHabit = await db.getOne('habits', { habit_id: habitId });
    
    return c.json({ 
      success: true, 
      log, 
      habit: updatedHabit,
      streaks: { current: currentStreak, longest: longestStreak }
    });
  } catch (error) {
    console.error('Habit check-in error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// PUT /api/habits/:id - Update habit
core.put('/habits/:id', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  
  try {
    const habitId = c.req.param('id');
    const updates = await c.req.json();
    
    const db = new DatabaseService(c.env);
    
    // Verify habit belongs to user
    const habit = await db.getOne('habits', { 
      habit_id: habitId, 
      user_id: auth.userId 
    });
    
    if (!habit) {
      return c.json({ error: 'Habit not found' }, 404);
    }
    
    const allowedUpdates = ['name', 'description', 'frequency', 'target_days', 'is_active'];
    const filteredUpdates = {};
    
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }
    
    filteredUpdates.updated_at = Date.now();
    
    await db.update('habits', { habit_id: habitId }, filteredUpdates);
    
    const updatedHabit = await db.getOne('habits', { habit_id: habitId });
    
    return c.json({ habit: updatedHabit });
  } catch (error) {
    console.error('Update habit error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// DELETE /api/habits/:id - Delete habit
core.delete('/habits/:id', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  
  try {
    const habitId = c.req.param('id');
    const db = new DatabaseService(c.env);
    
    // Verify habit belongs to user
    const habit = await db.getOne('habits', { 
      habit_id: habitId, 
      user_id: auth.userId 
    });
    
    if (!habit) {
      return c.json({ error: 'Habit not found' }, 404);
    }
    
    // Delete habit and its logs
    await db.delete('habit_logs', { habit_id: habitId });
    await db.delete('habits', { habit_id: habitId });
    
    return c.json({ success: true, message: 'Habit deleted successfully' });
  } catch (error) {
    console.error('Delete habit error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/habits/:id/logs - Get habit completion logs
core.get('/habits/:id/logs', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  
  try {
    const habitId = c.req.param('id');
    const db = new DatabaseService(c.env);
    
    // Verify habit belongs to user
    const habit = await db.getOne('habits', { 
      habit_id: habitId, 
      user_id: auth.userId 
    });
    
    if (!habit) {
      return c.json({ error: 'Habit not found' }, 404);
    }
    
    const logs = await db.query(`
      SELECT * FROM habit_logs 
      WHERE habit_id = ? 
      ORDER BY completed_date DESC
    `, [habitId]);
    
    return c.json({ logs: logs || [] });
  } catch (error) {
    console.error('Get habit logs error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Test endpoint to add preferences column
core.post('/test/add-preferences-column', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const db = new DatabaseService(c.env);
    await db.execute('ALTER TABLE users ADD COLUMN preferences TEXT DEFAULT "{}"');
    return c.json({ success: true, message: 'Preferences column added successfully' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message });
  }
});

// ========== USER PREFERENCES ==========

// Validation schema for user preferences
const userPreferencesSchema = z.object({
  theme: z.object({
    mode: z.enum(['light', 'dark', 'system']).optional(),
    colorTheme: z.string().optional(),
  }).optional(),
  appearance: z.object({
    fontSize: z.string().optional(),
    compactMode: z.boolean().optional(),
    animations: z.boolean().optional(),
  }).optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    desktop: z.boolean().optional(),
  }).optional(),
  privacy: z.object({
    profileVisibility: z.enum(['public', 'private', 'friends']).optional(),
    dataSharing: z.boolean().optional(),
  }).optional(),
  general: z.object({
    timezone: z.string().optional(),
    language: z.string().optional(),
    dateFormat: z.string().optional(),
    timeFormat: z.enum(['12h', '24h']).optional(),
  }).optional(),
});

// GET /user/preferences - Get user preferences
core.get('/user/preferences', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    console.log('Getting preferences for user:', auth.userId);
    const db = new DatabaseService(c.env);
    const result = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [auth.userId]
    );
    
    console.log('Database query result:', result);
    
    const user = result.results?.[0];
    if (!user) {
      console.log('User not found');
      return c.json({ error: 'User not found' }, 404);
    }

    console.log('User found:', user);
    console.log('User preferences field:', user.preferences);

    // Parse existing preferences or return defaults
    const preferences = user.preferences ? JSON.parse(user.preferences) : {};
    
    // Default preferences
    const defaultPreferences = {
      theme: {
        mode: 'system',
        colorTheme: 'orange',
      },
      appearance: {
        fontSize: 'medium',
        compactMode: false,
        animations: true,
      },
      notifications: {
        email: true,
        push: true,
        desktop: true,
      },
      privacy: {
        profileVisibility: 'private',
        dataSharing: false,
      },
      general: {
        timezone: 'UTC',
        language: 'en',
        dateFormat: 'MM/dd/yyyy',
        timeFormat: '12h',
      },
    };

    // Merge with defaults
    const mergedPreferences = {
      theme: { ...defaultPreferences.theme, ...preferences.theme },
      appearance: { ...defaultPreferences.appearance, ...preferences.appearance },
      notifications: { ...defaultPreferences.notifications, ...preferences.notifications },
      privacy: { ...defaultPreferences.privacy, ...preferences.privacy },
      general: { ...defaultPreferences.general, ...preferences.general },
    };

    console.log('Returning preferences:', mergedPreferences);

    return c.json({ 
      success: true,
      preferences: mergedPreferences 
    });
  } catch (error) {
    console.error('Get user preferences error:', error);
    return c.json({ error: 'Failed to get preferences' }, 500);
  }
});

// PUT /user/preferences - Update user preferences
core.put('/user/preferences', zValidator('json', userPreferencesSchema), async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const newPreferences = c.req.valid('json');
    const db = new DatabaseService(c.env);
    
    // Get current user and preferences
    const result = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [auth.userId]
    );
    
    const user = result.results?.[0];
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Parse existing preferences
    const currentPreferences = user.preferences ? JSON.parse(user.preferences) : {};
    
    // Merge new preferences with existing ones
    const updatedPreferences = {
      ...currentPreferences,
      ...newPreferences,
    };

    // Update user preferences
    await db.execute(
      'UPDATE users SET preferences = ?, updated_at = ? WHERE id = ?',
      [JSON.stringify(updatedPreferences), Date.now(), auth.userId]
    );

    console.log(`Preferences updated for user: ${auth.userId}`);

    return c.json({ 
      success: true,
      message: 'Preferences updated successfully',
      preferences: updatedPreferences 
    });
  } catch (error) {
    console.error('Update user preferences error:', error);
    return c.json({ error: 'Failed to update preferences' }, 500);
  }
});

export default core;