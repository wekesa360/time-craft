/**
 * MSW Request Handlers
 * Mock API handlers for testing
 */

import { http, HttpResponse } from 'msw';
import { mockUser, mockTask, mockFocusSession } from '../test-utils';

const API_BASE = 'http://localhost:3001';

export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE}/auth/login`, () => {
    return HttpResponse.json({
      user: mockUser,
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token'
    });
  }),

  http.post(`${API_BASE}/auth/logout`, () => {
    return HttpResponse.json({ success: true });
  }),

  http.get(`${API_BASE}/auth/me`, () => {
    return HttpResponse.json(mockUser);
  }),

  // Tasks endpoints
  http.get(`${API_BASE}/tasks`, () => {
    return HttpResponse.json({
      tasks: [mockTask],
      total: 1,
      page: 1,
      limit: 10
    });
  }),

  http.post(`${API_BASE}/tasks`, async ({ request }) => {
    const body = await request.json() as any;
    const newTask = {
      ...mockTask,
      id: `task-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(newTask);
  }),

  http.put(`${API_BASE}/tasks/:id`, async ({ params, request }) => {
    const body = await request.json() as any;
    const updatedTask = {
      ...mockTask,
      id: params.id as string,
      ...body,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(updatedTask);
  }),

  http.delete(`${API_BASE}/tasks/:id`, ({ params }) => {
    return HttpResponse.json({ success: true, id: params.id });
  }),

  // Focus sessions endpoints
  http.get(`${API_BASE}/focus-sessions`, () => {
    return HttpResponse.json({
      sessions: [mockFocusSession],
      total: 1,
      page: 1,
      limit: 10
    });
  }),

  http.post(`${API_BASE}/focus-sessions`, async ({ request }) => {
    const body = await request.json() as any;
    const newSession = {
      ...mockFocusSession,
      id: `session-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(newSession);
  }),

  // Health endpoints
  http.get(`${API_BASE}/health/dashboard`, () => {
    return HttpResponse.json({
      totalSteps: 8547,
      caloriesBurned: 2150,
      waterIntake: 1800,
      sleepHours: 7.5,
      mood: 'good',
      exerciseMinutes: 45,
      healthScore: 85,
      weeklyTrend: [80, 82, 85, 83, 87, 85, 85],
    });
  }),

  // Admin endpoints
  http.get(`${API_BASE}/admin/users`, () => {
    return HttpResponse.json({
      users: [mockUser],
      total: 1,
      page: 1,
      limit: 10
    });
  }),

  http.get(`${API_BASE}/admin/metrics`, () => {
    return HttpResponse.json({
      systemHealth: {
        cpu: 45.2,
        memory: 67.8,
        disk: 23.1,
        network: 156.7,
        responseTime: 127,
        errorRate: 0.2
      },
      uptime: '99.9%',
      totalUsers: 1234,
      activeUsers: 892
    });
  }),

  // Feature flags
  http.get(`${API_BASE}/admin/feature-flags`, () => {
    return HttpResponse.json({
      flags: [
        {
          id: 'new-dashboard',
          name: 'New Dashboard',
          description: 'Enable the new dashboard design',
          enabled: true,
          rolloutPercentage: 100,
          conditions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ]
    });
  }),

  // Notifications
  http.get(`${API_BASE}/notifications`, () => {
    return HttpResponse.json({
      notifications: [
        {
          id: 'notif-1',
          title: 'Test Notification',
          message: 'This is a test notification',
          type: 'info',
          read: false,
          createdAt: new Date().toISOString(),
        }
      ],
      unreadCount: 1
    });
  }),

  // System Health (SSE mock)
  http.get(`${API_BASE}/system/health`, () => {
    return HttpResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        api: 'healthy',
        cache: 'healthy',
        queue: 'healthy'
      }
    });
  }),

  // Error handler for unmatched requests
  http.all(`${API_BASE}/*`, ({ request }) => {
    console.warn(`Unhandled ${request.method} request to ${request.url}`);
    return new HttpResponse(null, { status: 404 });
  }),
];

// Error handlers for testing error states
export const errorHandlers = [
  http.get(`${API_BASE}/tasks`, () => {
    return new HttpResponse('Internal Server Error', { status: 500 });
  }),

  http.post(`${API_BASE}/auth/login`, () => {
    return HttpResponse.json(
      { error: 'Invalid credentials' }, 
      { status: 401 }
    );
  }),

  http.get(`${API_BASE}/auth/me`, () => {
    return new HttpResponse('Unauthorized', { status: 401 });
  }),
];

// Network delay handlers for testing loading states
export const delayedHandlers = handlers.map(handler => {
  return http.all(handler.info.path as string, async ({ request }) => {
    // Add artificial delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return handler.resolver({ request } as any);
  });
});

// Handlers for different response scenarios
export const emptyHandlers = [
  http.get(`${API_BASE}/tasks`, () => {
    return HttpResponse.json({
      tasks: [],
      total: 0,
      page: 1,
      limit: 10
    });
  }),

  http.get(`${API_BASE}/focus-sessions`, () => {
    return HttpResponse.json({
      sessions: [],
      total: 0,
      page: 1,
      limit: 10
    });
  }),

  http.get(`${API_BASE}/notifications`, () => {
    return HttpResponse.json({
      notifications: [],
      unreadCount: 0
    });
  }),
];