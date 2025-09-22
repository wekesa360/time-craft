import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApiClient } from '../../lib/api';
import type { TaskForm } from '../../types';

describe('Frontend-Backend Integration Tests', () => {
  let apiClient: ApiClient;

  beforeAll(() => {
    // Initialize API client with test configuration
    apiClient = new ApiClient();
  });

  afterAll(() => {
    // Cleanup if needed
  });

  describe('Authentication Flow', () => {
    it('should handle registration', async () => {
      const testUser = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        timezone: 'UTC',
        preferredLanguage: 'en' as const
      };

      try {
        const response = await apiClient.register(testUser);
        expect(response).toHaveProperty('user');
        expect(response).toHaveProperty('tokens');
        expect(response.user.email).toBe(testUser.email);
      } catch (error: unknown) {
        // User might already exist, which is expected in test environment
        if ((error as any).response?.status === 409) {
          console.log('User already exists, continuing with login test');
        } else {
          throw error;
        }
      }
    });

    it('should handle login', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPassword123!'
      };

      try {
        const response = await apiClient.login(loginData);
        expect(response).toHaveProperty('user');
        expect(response).toHaveProperty('tokens');
        expect(response.user.email).toBe(loginData.email);
      } catch (error) {
        console.error('Login failed:', error);
        throw error;
      }
    });

    it('should validate token', async () => {
      try {
        const response = await apiClient.validateToken();
        expect(response).toHaveProperty('valid');
        expect(typeof response.valid).toBe('boolean');
      } catch (error) {
        console.error('Token validation failed:', error);
        throw error;
      }
    });
  });

  describe('Task Management', () => {
    let testTaskId: string;

    it('should create a task', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'This is a test task',
        priority: 2,
        urgency: 3,
        importance: 4,
        eisenhower_quadrant: 'do' as const,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        estimatedDuration: 30,
        contextType: 'work' as const
      };

      try {
        const task = await apiClient.createTask(taskData);
        expect(task).toHaveProperty('id');
        expect(task.title).toBe(taskData.title);
        expect(task.eisenhower_quadrant).toBe(taskData.eisenhower_quadrant);
        testTaskId = task.id;
      } catch (error) {
        console.error('Task creation failed:', error);
        throw error;
      }
    });

    it('should get tasks', async () => {
      try {
        const tasks = await apiClient.getTasks();
        expect(Array.isArray(tasks)).toBe(true);
        expect(tasks.length).toBeGreaterThan(0);
      } catch (error) {
        console.error('Get tasks failed:', error);
        throw error;
      }
    });

    it('should get a specific task', async () => {
      if (!testTaskId) {
        throw new Error('No test task ID available');
      }

      try {
        const task = await apiClient.getTask(testTaskId);
        expect(task).toHaveProperty('id');
        expect(task.id).toBe(testTaskId);
      } catch (error) {
        console.error('Get task failed:', error);
        throw error;
      }
    });

    it('should update a task', async () => {
      if (!testTaskId) {
        throw new Error('No test task ID available');
      }

      const updateData = {
        title: 'Updated Test Task',
        priority: 3
      };

      try {
        const updatedTask = await apiClient.updateTask(testTaskId, updateData);
        expect(updatedTask.title).toBe(updateData.title);
        expect(updatedTask.priority).toBe(updateData.priority);
      } catch (error) {
        console.error('Task update failed:', error);
        throw error;
      }
    });

    it('should get Eisenhower matrix', async () => {
      try {
        const matrix = await apiClient.getEisenhowerMatrix();
        expect(matrix).toHaveProperty('quadrants');
        expect(matrix.quadrants).toHaveProperty('do');
        expect(matrix.quadrants).toHaveProperty('decide');
        expect(matrix.quadrants).toHaveProperty('delegate');
        expect(matrix.quadrants).toHaveProperty('delete');
      } catch (error) {
        console.error('Get Eisenhower matrix failed:', error);
        throw error;
      }
    });

    it('should complete a task', async () => {
      if (!testTaskId) {
        throw new Error('No test task ID available');
      }

      try {
        await apiClient.completeTask(testTaskId);
        // Verify task is completed
        const task = await apiClient.getTask(testTaskId);
        expect(task.status).toBe('done');
      } catch (error) {
        console.error('Task completion failed:', error);
        throw error;
      }
    });

    it('should delete a task', async () => {
      if (!testTaskId) {
        throw new Error('No test task ID available');
      }

      try {
        await apiClient.deleteTask(testTaskId);
        // Verify task is deleted
        try {
          await apiClient.getTask(testTaskId);
          throw new Error('Task should have been deleted');
        } catch (error: unknown) {
          expect((error as any).response?.status).toBe(404);
        }
      } catch (error) {
        console.error('Task deletion failed:', error);
        throw error;
      }
    });
  });

  describe('Health Logging', () => {
    it('should log exercise', async () => {
      const exerciseData = {
        activity: 'Running',
        durationMinutes: 30,
        intensity: 7,
        caloriesBurned: 300,
        distance: 5,
        notes: 'Morning run'
      };

      try {
        const log = await apiClient.logExercise(exerciseData);
        expect(log).toHaveProperty('id');
        expect(log.type).toBe('exercise');
        expect(log.payload).toMatchObject(exerciseData);
      } catch (error) {
        console.error('Exercise logging failed:', error);
        throw error;
      }
    });

    it('should log mood', async () => {
      const moodData = {
        score: 8,
        energy: 7,
        stress: 3,
        sleep: 8,
        notes: 'Feeling great today!',
        tags: ['productive', 'happy']
      };

      try {
        const log = await apiClient.logMood(moodData);
        expect(log).toHaveProperty('id');
        expect(log.type).toBe('mood');
        expect(log.payload).toMatchObject(moodData);
      } catch (error) {
        console.error('Mood logging failed:', error);
        throw error;
      }
    });

    it('should get health summary', async () => {
      try {
        const summary = await apiClient.getHealthSummary(7);
        expect(summary).toHaveProperty('exerciseCount');
        expect(summary).toHaveProperty('nutritionCount');
        expect(summary).toHaveProperty('moodCount');
        expect(summary).toHaveProperty('hydrationCount');
        expect(typeof summary.exerciseCount).toBe('number');
      } catch (error) {
        console.error('Get health summary failed:', error);
        throw error;
      }
    });
  });

  describe('Focus Sessions', () => {
    it('should get focus templates', async () => {
      try {
        const templates = await apiClient.getFocusTemplates();
        expect(Array.isArray(templates)).toBe(true);
        expect(templates.length).toBeGreaterThan(0);
        expect(templates[0]).toHaveProperty('id');
        expect(templates[0]).toHaveProperty('name');
        expect(templates[0]).toHaveProperty('duration');
      } catch (error) {
        console.error('Get focus templates failed:', error);
        throw error;
      }
    });

    it('should start a focus session', async () => {
      const sessionData = {
        templateKey: 'pomodoro_25',
        taskId: undefined,
        environment: { noise_level: 'quiet' }
      };

      try {
        const session = await apiClient.startFocusSession(sessionData);
        expect(session).toHaveProperty('id');
        expect(session).toHaveProperty('status');
        expect(session.status).toBe('active');
      } catch (error) {
        console.error('Start focus session failed:', error);
        throw error;
      }
    });
  });

  describe('Badge System', () => {
    it('should get user badges', async () => {
      try {
        const response = await apiClient.getBadges();
        expect(response).toHaveProperty('badges');
        expect(response).toHaveProperty('totalBadges');
        expect(response).toHaveProperty('unlockedBadges');
        expect(Array.isArray(response.badges)).toBe(true);
        expect(typeof response.totalBadges).toBe('number');
        expect(typeof response.unlockedBadges).toBe('number');
      } catch (error) {
        console.error('Get badges failed:', error);
        throw error;
      }
    });
  });

  describe('Calendar Integration', () => {
    it('should get calendar events', async () => {
      try {
        const events = await apiClient.getEvents();
        expect(Array.isArray(events)).toBe(true);
      } catch (error) {
        console.error('Get calendar events failed:', error);
        throw error;
      }
    });

    it('should create a calendar event', async () => {
      const eventData = {
        title: 'Test Event',
        start: Date.now(),
        end: Date.now() + 60 * 60 * 1000, // 1 hour later
        source: 'manual' as const
      };

      try {
        const event = await apiClient.createEvent(eventData);
        expect(event).toHaveProperty('id');
        expect(event.title).toBe(eventData.title);
        expect(event.source).toBe(eventData.source);
      } catch (error) {
        console.error('Create calendar event failed:', error);
        throw error;
      }
    });
  });

  describe('Real-time Features', () => {
    it('should connect to SSE', (done) => {
      const unsubscribe = apiClient.subscribeToUpdates((data) => {
        console.log('SSE message received:', data);
        unsubscribe();
        done();
      });

      // Set a timeout to avoid hanging the test
      setTimeout(() => {
        unsubscribe();
        done();
      }, 5000);
    });

    it('should check SSE connection status', () => {
      const isConnected = apiClient.isSSEConnected();
      expect(typeof isConnected).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors gracefully', async () => {
      try {
        await apiClient.getTask('non-existent-id');
        throw new Error('Should have thrown 404 error');
      } catch (error: unknown) {
        expect((error as any).response?.status).toBe(404);
      }
    });

    it('should handle validation errors', async () => {
      const invalidTaskData = {
        title: '', // Empty title should fail validation
        priority: 5 // Invalid priority
      };

      try {
        await apiClient.createTask(invalidTaskData as unknown as TaskForm);
        throw new Error('Should have thrown validation error');
      } catch (error: unknown) {
        expect([400, 422]).toContain((error as any).response?.status);
      }
    });
  });
});
