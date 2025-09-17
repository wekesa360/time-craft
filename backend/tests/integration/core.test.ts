// Core API Integration Tests  
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import apiGateway from '../../src/workers/api-gateway';
import { 
  createMockEnv, 
  testUsers, 
  testTasks,
  generateTestToken,
  makeRequest, 
  expectSuccessResponse, 
  expectErrorResponse,
  expectValidationError,
  cleanupTestData
} from '../utils/test-helpers';

describe('Core API', () => {
  let env: any;
  let app: any;
  let userToken: string;

  beforeEach(async () => {
    env = createMockEnv();
    app = apiGateway;
    userToken = await generateTestToken(testUsers.regularUser.id);
    
    // Set up mock data
    env.DB._setMockData('SELECT * FROM users WHERE id = ?', [testUsers.regularUser]);
    env.DB._setMockData('SELECT * FROM tasks WHERE user_id = ?', testTasks);
  });

  afterEach(() => {
    cleanupTestData(env);
  });

  describe('User Profile Management', () => {
    describe('GET /users/profile', () => {
      it('should get user profile successfully', async () => {
        const response = await makeRequest(app, 'GET', '/api/users/profile', {
          token: userToken
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          user: {
            id: testUsers.regularUser.id,
            email: testUsers.regularUser.email,
            displayName: testUsers.regularUser.display_name,
            preferredLanguage: testUsers.regularUser.preferred_language,
            timezone: testUsers.regularUser.timezone
          }
        });
      });

      it('should reject unauthenticated request', async () => {
        const response = await makeRequest(app, 'GET', '/api/users/profile');

        expectErrorResponse(response, 401);
      });
    });

    describe('PUT /users/profile', () => {
      it('should update user profile successfully', async () => {
        const updateData = {
          firstName: 'Updated',
          lastName: 'Name',
          timezone: 'America/New_York',
          preferredLanguage: 'de'
        };

        const response = await makeRequest(app, 'PUT', '/api/users/profile', {
          token: userToken,
          body: updateData
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body.message).toContain('updated successfully');
        expect(body.user).toMatchObject({
          firstName: updateData.firstName,
          lastName: updateData.lastName,
          timezone: updateData.timezone,
          preferredLanguage: updateData.preferredLanguage
        });
      });

      it('should reject invalid timezone', async () => {
        const response = await makeRequest(app, 'PUT', '/api/users/profile', {
          token: userToken,
          body: { timezone: 'Invalid/Timezone' }
        });

        await expectValidationError(response, 'timezone');
      });
    });
  });

  describe('Task Management', () => {
    describe('GET /tasks', () => {
      it('should get user tasks successfully', async () => {
        const response = await makeRequest(app, 'GET', '/api/tasks', {
          token: userToken
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          tasks: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              title: expect.any(String),
              priority: expect.any(Number),
              status: expect.any(String)
            })
          ]),
          pagination: expect.objectContaining({
            total: expect.any(Number),
            page: expect.any(Number)
          })
        });
      });

      it('should filter tasks by status', async () => {
        const response = await makeRequest(app, 'GET', '/api/tasks?status=pending', {
          token: userToken
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        body.tasks.forEach((task: any) => {
          expect(task.status).toBe('pending');
        });
      });

      it('should filter tasks by priority', async () => {
        const response = await makeRequest(app, 'GET', '/api/tasks?priority=4', {
          token: userToken
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        body.tasks.forEach((task: any) => {
          expect(task.priority).toBe(4);
        });
      });
    });

    describe('POST /tasks', () => {
      it('should create task successfully', async () => {
        const newTask = {
          title: 'New test task',
          description: 'Task description',
          priority: 3,
          dueDate: Date.now() + 86400000, // 1 day from now
          estimatedDuration: 60
        };

        env.DB._setMockData('INSERT INTO tasks', [{ id: 'new_task_id' }]);

        const response = await makeRequest(app, 'POST', '/api/tasks', {
          token: userToken,
          body: newTask
        });

        expectSuccessResponse(response, 201);
        const body = await response.json();
        
        expect(body).toMatchObject({
          message: expect.stringContaining('created'),
          task: {
            title: newTask.title,
            description: newTask.description,
            priority: newTask.priority,
            status: 'pending'
          }
        });
      });

      it('should reject task with invalid priority', async () => {
        const response = await makeRequest(app, 'POST', '/api/tasks', {
          token: userToken,
          body: {
            title: 'Test task',
            priority: 5 // Invalid (max is 4)
          }
        });

        await expectValidationError(response, 'priority');
      });

      it('should reject task without title', async () => {
        const response = await makeRequest(app, 'POST', '/api/tasks', {
          token: userToken,
          body: {
            description: 'Task without title',
            priority: 2
          }
        });

        await expectValidationError(response, 'title');
      });
    });

    describe('PUT /tasks/:id', () => {
      it('should update task successfully', async () => {
        const taskId = testTasks[0].id;
        const updateData = {
          title: 'Updated task title',
          priority: 3,
          status: 'in_progress'
        };

        env.DB._setMockData('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [testTasks[0]]);
        env.DB._setMockData('UPDATE tasks', [{ id: taskId }]);

        const response = await makeRequest(app, 'PUT', `/tasks/${taskId}`, {
          token: userToken,
          body: updateData
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body.message).toContain('updated');
        expect(body.task).toMatchObject({
          id: taskId,
          title: updateData.title,
          priority: updateData.priority,
          status: updateData.status
        });
      });

      it('should reject updating non-existent task', async () => {
        env.DB._setMockData('SELECT * FROM tasks WHERE id = ? AND user_id = ?', []);

        const response = await makeRequest(app, 'PUT', '/api/tasks/nonexistent', {
          token: userToken,
          body: { title: 'Updated title' }
        });

        expectErrorResponse(response, 404, 'not found');
      });
    });

    describe('DELETE /tasks/:id', () => {
      it('should delete task successfully', async () => {
        const taskId = testTasks[0].id;
        env.DB._setMockData('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [testTasks[0]]);

        const response = await makeRequest(app, 'DELETE', `/tasks/${taskId}`, {
          token: userToken
        });

        expectSuccessResponse(response);
        const body = await response.json();
        expect(body.message).toContain('deleted');
      });

      it('should reject deleting non-existent task', async () => {
        env.DB._setMockData('SELECT * FROM tasks WHERE id = ? AND user_id = ?', []);

        const response = await makeRequest(app, 'DELETE', '/api/tasks/nonexistent', {
          token: userToken
        });

        expectErrorResponse(response, 404, 'not found');
      });
    });
  });

  describe('Focus Timer', () => {
    describe('POST /focus/start', () => {
      it('should start focus session successfully', async () => {
        const sessionData = {
          duration: 25, // 25 minutes
          taskId: testTasks[0].id,
          type: 'pomodoro'
        };

        env.DB._setMockData('INSERT INTO focus_sessions', [{ id: 'new_session_id' }]);

        const response = await makeRequest(app, 'POST', '/api/focus/start', {
          token: userToken,
          body: sessionData
        });

        expectSuccessResponse(response, 201);
        const body = await response.json();
        
        expect(body).toMatchObject({
          message: expect.stringContaining('started'),
          session: {
            duration: sessionData.duration,
            type: sessionData.type,
            taskId: sessionData.taskId
          }
        });
      });

      it('should reject invalid duration', async () => {
        const response = await makeRequest(app, 'POST', '/api/focus/start', {
          token: userToken,
          body: { duration: 200 } // Too long
        });

        await expectValidationError(response, 'duration');
      });
    });

    describe('POST /focus/:id/complete', () => {
      it('should complete focus session successfully', async () => {
        const sessionId = 'test_session_id';
        const sessionData = {
          id: sessionId,
          user_id: testUsers.regularUser.id,
          duration: 25,
          started_at: Date.now() - 1500000, // 25 minutes ago
          status: 'active'
        };

        env.DB._setMockData('SELECT * FROM focus_sessions WHERE id = ? AND user_id = ?', [sessionData]);

        const response = await makeRequest(app, 'POST', `/focus/${sessionId}/complete`, {
          token: userToken,
          body: { actualDuration: 25, wasProductive: true }
        });

        expectSuccessResponse(response);
        const body = await response.json();
        expect(body.message).toContain('completed');
      });
    });
  });

  describe('Analytics', () => {
    describe('GET /analytics/overview', () => {
      it('should get user analytics successfully', async () => {
        // Mock analytics data
        env.DB._setMockData('SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = ?', [
          { count: 5 }
        ]);
        env.DB._setMockData('SELECT SUM(duration) as total FROM focus_sessions WHERE user_id = ?', [
          { total: 150 }
        ]);

        const response = await makeRequest(app, 'GET', '/api/analytics/overview', {
          token: userToken
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          overview: {
            tasks: expect.objectContaining({
              completed: expect.any(Number),
              pending: expect.any(Number)
            }),
            focus: expect.objectContaining({
              totalMinutes: expect.any(Number),
              averageSession: expect.any(Number)
            })
          }
        });
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on task creation', async () => {
      // Attempt to create many tasks quickly
      const promises = [];
      for (let i = 0; i < 15; i++) {
        promises.push(
          makeRequest(app, 'POST', '/api/tasks', {
            token: userToken,
            body: { title: `Task ${i}`, priority: 2 }
          })
        );
      }

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should respond quickly to task list requests', async () => {
      const start = Date.now();
      const response = await makeRequest(app, 'GET', '/api/tasks', {
        token: userToken
      });
      const duration = Date.now() - start;

      expectSuccessResponse(response);
      expect(duration).toBeLessThan(200); // Should respond within 200ms
    });
  });
});