// Admin Panel and Management Integration Tests
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import apiGateway from '../../src/workers/api-gateway';
import { 
  createMockEnv, 
  testUsers,
  generateTestToken,
  makeRequest, 
  expectSuccessResponse, 
  expectErrorResponse,
  expectValidationError,
  cleanupTestData
} from '../utils/test-helpers';

const testAdminUser = {
  ...testUsers.regularUser,
  id: 'admin_user_123',
  email: 'admin@timecraft.com',
  role: 'admin',
  permissions: ['user_management', 'system_admin', 'analytics_read']
};

const testSystemStats = {
  users: {
    total: 1250,
    active_30d: 890,
    new_today: 12,
    premium: 340
  },
  tasks: {
    total: 45600,
    completed_today: 1280,
    average_per_user: 36
  },
  health_logs: {
    total: 23400,
    today: 890
  },
  system: {
    uptime: 99.8,
    avg_response_time: 145,
    error_rate: 0.002
  }
};

describe('Admin Panel and Management API', () => {
  let env: any;
  let app: any;
  let adminToken: string;
  let userToken: string;

  beforeEach(async () => {
    env = createMockEnv();
    app = apiGateway;
    adminToken = await generateTestToken(testAdminUser.id);
    userToken = await generateTestToken(testUsers.regularUser.id);
    
    // Set up mock data
    env.DB._setMockData('SELECT * FROM users WHERE id = ?', [testAdminUser]);
    env.DB._setMockData('SELECT role, permissions FROM users WHERE id = ?', [{ 
      role: testAdminUser.role, 
      permissions: JSON.stringify(testAdminUser.permissions) 
    }]);
  });

  afterEach(() => {
    cleanupTestData(env);
  });

  describe('Admin Authentication and Authorization', () => {
    describe('Authentication', () => {
      it('should require admin authentication for all endpoints', async () => {
        const endpoints = [
          { method: 'GET', path: '/dashboard' },
          { method: 'GET', path: '/users' },
          { method: 'GET', path: '/system/health' },
          { method: 'GET', path: '/analytics/overview' }
        ];

        for (const endpoint of endpoints) {
          const response = await makeRequest(app, endpoint.method, endpoint.path, {
            env: env
          });
          expectErrorResponse(response, 401);
        }
      });

      it('should reject non-admin users', async () => {
        const response = await makeRequest(app, 'GET', '/admin/dashboard', {
          token: userToken, // Regular user token
          env: env
        ,
          env: env
        });

        expectErrorResponse(response, 403, 'Admin access required');
      });

      it('should allow admin access', async () => {
        env.DB._setMockData('SELECT COUNT(*) as total FROM users', [{ total: testSystemStats.users.total }]);
        env.DB._setMockData('SELECT COUNT(*) as active FROM users WHERE last_login > ?', [{ active: testSystemStats.users.active_30d }]);

        const response = await makeRequest(app, 'GET', '/admin/dashboard', {
          token: adminToken,
          env: env
        ,
          env: env
        });

        expectSuccessResponse(response);
      });
    });

    describe('Permission-based access', () => {
      it('should check specific permissions for sensitive operations', async () => {
        // Mock user without user_management permission
        const limitedAdminUser = {
          ...testAdminUser,
          permissions: ['analytics_read'] // No user_management
        };
        
        env.DB._setMockData('SELECT role, permissions FROM users WHERE id = ?', [{ 
          role: 'admin', 
          permissions: JSON.stringify(limitedAdminUser.permissions) 
        }]);

        const response = await makeRequest(app, 'DELETE', '/admin/users/test_user_id', {
          token: adminToken
        ,
          env: env
        });

        expectErrorResponse(response, 403, 'Insufficient permissions');
      });
    });
  });

  describe('Dashboard and Overview', () => {
    describe('GET /dashboard', () => {
      it('should get comprehensive dashboard data', async () => {
        // Mock all dashboard queries
        env.DB._setMockData('SELECT COUNT(*) as total FROM users', [{ total: testSystemStats.users.total }]);
        env.DB._setMockData('SELECT COUNT(*) as active FROM users WHERE last_login > ?', [{ active: testSystemStats.users.active_30d }]);
        env.DB._setMockData('SELECT COUNT(*) as new_today FROM users WHERE created_at > ?', [{ new_today: testSystemStats.users.new_today }]);
        env.DB._setMockData('SELECT COUNT(*) as premium FROM subscriptions WHERE status = ?', [{ premium: testSystemStats.users.premium }]);
        env.DB._setMockData('SELECT COUNT(*) as total FROM tasks', [{ total: testSystemStats.tasks.total }]);
        env.DB._setMockData('SELECT COUNT(*) as completed_today FROM tasks WHERE status = ? AND completed_at > ?', [{ completed_today: testSystemStats.tasks.completed_today }]);

        const response = await makeRequest(app, 'GET', '/admin/dashboard', {
          token: adminToken,
          env: env
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          overview: {
            users: expect.objectContaining({
              total: testSystemStats.users.total,
              active30d: testSystemStats.users.active_30d,
              newToday: testSystemStats.users.new_today,
              premium: testSystemStats.users.premium
            }),
            tasks: expect.objectContaining({
              total: testSystemStats.tasks.total,
              completedToday: testSystemStats.tasks.completed_today
            }),
            system: expect.objectContaining({
              uptime: expect.any(Number),
              responseTime: expect.any(Number)
            })
          },
          recentActivity: expect.any(Array),
          alerts: expect.any(Array)
        });
      });

      it('should include system alerts for issues', async () => {
        // Mock high error rate scenario
        env.DB._setMockData('SELECT COUNT(*) as error_count FROM system_logs WHERE level = ? AND created_at > ?', [{ error_count: 100 }]);
        env.DB._setMockData('SELECT AVG(response_time) as avg_time FROM request_logs WHERE created_at > ?', [{ avg_time: 2500 }]);

        const response = await makeRequest(app, 'GET', '/admin/dashboard', {
          token: adminToken,
          env: env
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body.alerts).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              type: 'warning',
              message: expect.stringContaining('response time'),
              severity: expect.any(String)
            })
          ])
        );
      });
    });
  });

  describe('User Management', () => {
    describe('GET /users', () => {
      it('should get paginated user list', async () => {
        const mockUsers = [
          {
            id: 'user_1',
            email: 'user1@example.com',
            display_name: 'User One',
            created_at: Date.now() - 86400000,
            last_login: Date.now() - 3600000,
            status: 'active'
          },
          {
            id: 'user_2', 
            email: 'user2@example.com',
            display_name: 'User Two',
            created_at: Date.now() - 172800000,
            last_login: Date.now() - 7200000,
            status: 'active'
          }
        ];

        env.DB._setMockData('SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?', mockUsers);
        env.DB._setMockData('SELECT COUNT(*) as total FROM users', [{ total: 150 }]);

        const response = await makeRequest(app, 'GET', '/admin/users?page=1&limit=50', {
          token: adminToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          users: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              email: expect.any(String),
              displayName: expect.any(String),
              createdAt: expect.any(Number),
              lastLogin: expect.any(Number),
              status: expect.any(String)
            })
          ]),
          pagination: {
            total: 150,
            page: 1,
            limit: 50,
            totalPages: 3
          }
        });

        // Should not expose sensitive data
        body.users.forEach((user: any) => {
          expect(user.password).toBeUndefined();
          expect(user.stripe_customer_id).toBeUndefined();
        });
      });

      it('should filter users by status', async () => {
        const response = await makeRequest(app, 'GET', '/admin/users?status=suspended', {
          token: adminToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        body.users.forEach((user: any) => {
          expect(user.status).toBe('suspended');
        });
      });

      it('should search users by email', async () => {
        const response = await makeRequest(app, 'GET', '/admin/users?search=john@example.com', {
          token: adminToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        body.users.forEach((user: any) => {
          expect(user.email.toLowerCase()).toContain('john');
        });
      });
    });

    describe('GET /users/:id', () => {
      it('should get detailed user information', async () => {
        const userId = 'detailed_user_123';
        const mockDetailedUser = {
          id: userId,
          email: 'detailed@example.com',
          display_name: 'Detailed User',
          created_at: Date.now() - 2592000000, // 30 days ago
          last_login: Date.now() - 3600000,
          status: 'active',
          subscription_status: 'premium',
          task_count: 45,
          health_logs_count: 123
        };

        env.DB._setMockData('SELECT * FROM users WHERE id = ?', [mockDetailedUser]);
        env.DB._setMockData('SELECT COUNT(*) as count FROM tasks WHERE user_id = ?', [{ count: mockDetailedUser.task_count }]);
        env.DB._setMockData('SELECT COUNT(*) as count FROM health_logs WHERE user_id = ?', [{ count: mockDetailedUser.health_logs_count }]);

        const response = await makeRequest(app, 'GET', '/users/${userId}', {
          token: adminToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          user: expect.objectContaining({
            id: userId,
            email: mockDetailedUser.email,
            displayName: mockDetailedUser.display_name,
            status: mockDetailedUser.status,
            subscriptionStatus: mockDetailedUser.subscription_status
          }),
          analytics: expect.objectContaining({
            taskCount: mockDetailedUser.task_count,
            healthLogsCount: mockDetailedUser.health_logs_count,
            accountAge: expect.any(Number)
          }),
          recentActivity: expect.any(Array)
        });
      });
    });

    describe('PUT /users/:id/status', () => {
      it('should update user status', async () => {
        const userId = 'user_to_suspend';
        const statusUpdate = {
          status: 'suspended',
          reason: 'Terms of service violation',
          notify: true
        };

        env.DB._setMockData('SELECT * FROM users WHERE id = ?', [{ id: userId, status: 'active' }]);
        env.DB._setMockData('UPDATE users SET status = ? WHERE id = ?', [{ success: true }]);

        const response = await makeRequest(app, 'PUT', '/users/${userId}/status', {
          token: adminToken,
          body: statusUpdate
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body.message).toContain('status updated');
        expect(body.user.status).toBe(statusUpdate.status);
      });
    });

    describe('DELETE /users/:id', () => {
      it('should delete user account and associated data', async () => {
        const userId = 'user_to_delete';
        
        env.DB._setMockData('SELECT * FROM users WHERE id = ?', [{ id: userId, email: 'delete@example.com' }]);
        env.DB._setMockData('DELETE FROM users WHERE id = ?', [{ success: true }]);
        env.DB._setMockData('DELETE FROM tasks WHERE user_id = ?', [{ success: true }]);
        env.DB._setMockData('DELETE FROM health_logs WHERE user_id = ?', [{ success: true }]);

        const response = await makeRequest(app, 'DELETE', '/users/${userId}', {
          token: adminToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body.message).toContain('deleted');
        expect(body.deletedData).toMatchObject({
          user: true,
          tasks: expect.any(Boolean),
          healthLogs: expect.any(Boolean),
          files: expect.any(Boolean)
        });
      });
    });
  });

  describe('System Management', () => {
    describe('GET /system/health', () => {
      it('should get comprehensive system health status', async () => {
        // Mock system health checks
        env.DB._setMockData('SELECT 1', [{ result: 1 }]); // Database health
        env.KV._setMockData('health_check', 'ok'); // KV health
        env.R2._setMockData('health_check', { success: true }); // R2 health

        const response = await makeRequest(app, 'GET', '/admin/system/health', {
          token: adminToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          overall: 'healthy',
          services: {
            database: expect.objectContaining({
              status: 'healthy',
              responseTime: expect.any(Number)
            }),
            kv: expect.objectContaining({
              status: 'healthy'
            }),
            r2: expect.objectContaining({
              status: 'healthy'
            }),
            queue: expect.any(Object)
          },
          metrics: {
            uptime: expect.any(Number),
            memory: expect.any(Object),
            cpu: expect.any(Object)
          }
        });
      });

      it('should detect and report service issues', async () => {
        // Mock database failure
        env.DB._setMockError('SELECT 1', new Error('Connection timeout'));

        const response = await makeRequest(app, 'GET', '/admin/system/health', {
          token: adminToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body.overall).toBe('degraded');
        expect(body.services.database.status).toBe('unhealthy');
        expect(body.services.database.error).toContain('Connection timeout');
      });
    });

    describe('GET /system/logs', () => {
      it('should get system logs with filtering', async () => {
        const mockLogs = [
          {
            id: 'log_1',
            level: 'error',
            message: 'Database connection failed',
            timestamp: Date.now() - 3600000,
            service: 'core',
            metadata: JSON.stringify({ errorCode: 'DB_CONN_FAIL' })
          },
          {
            id: 'log_2',
            level: 'info',
            message: 'User authentication successful',
            timestamp: Date.now() - 1800000,
            service: 'auth',
            metadata: JSON.stringify({ userId: 'user_123' })
          }
        ];

        env.DB._setMockData('SELECT * FROM system_logs WHERE level >= ? ORDER BY timestamp DESC LIMIT ?', mockLogs);

        const response = await makeRequest(app, 'GET', '/admin/system/logs?level=info&limit=100', {
          token: adminToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          logs: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              level: expect.any(String),
              message: expect.any(String),
              timestamp: expect.any(Number),
              service: expect.any(String)
            })
          ]),
          pagination: expect.any(Object)
        });
      });
    });

    describe('POST /system/maintenance', () => {
      it('should toggle maintenance mode', async () => {
        const maintenanceData = {
          enabled: true,
          message: 'Scheduled maintenance in progress',
          estimatedDuration: 30 // minutes
        };

        const response = await makeRequest(app, 'POST', '/admin/system/maintenance', {
          token: adminToken,
          body: maintenanceData
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body.message).toContain('Maintenance mode enabled');
        expect(body.maintenance).toMatchObject({
          enabled: true,
          message: maintenanceData.message,
          startedAt: expect.any(Number)
        });
      });
    });
  });

  describe('Analytics and Reporting', () => {
    describe('GET /analytics/overview', () => {
      it('should get comprehensive analytics overview', async () => {
        // Mock analytics queries
        env.DB._setMockData('SELECT DATE(created_at) as date, COUNT(*) as count FROM users WHERE created_at > ? GROUP BY DATE(created_at)', [
          { date: '2024-01-01', count: 12 },
          { date: '2024-01-02', count: 15 },
          { date: '2024-01-03', count: 8 }
        ]);
        
        env.DB._setMockData('SELECT COUNT(*) as total FROM tasks WHERE status = ?', [{ total: 1250 }]);

        const response = await makeRequest(app, 'GET', '/admin/analytics/overview?period=30d', {
          token: adminToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          users: {
            growth: expect.arrayContaining([
              expect.objectContaining({
                date: expect.any(String),
                count: expect.any(Number)
              })
            ]),
            demographics: expect.any(Object),
            retention: expect.any(Object)
          },
          engagement: {
            taskCompletion: expect.any(Object),
            healthLogging: expect.any(Object),
            voiceUsage: expect.any(Object)
          },
          revenue: expect.any(Object)
        });
      });
    });

    describe('GET /analytics/export', () => {
      it('should export analytics data as CSV', async () => {
        const exportRequest = {
          type: 'users',
          format: 'csv',
          dateRange: {
            start: Date.now() - 2592000000, // 30 days ago
            end: Date.now()
          }
        };

        const response = await makeRequest(app, 'GET', '/analytics/export?type=${exportRequest.type}&format=${exportRequest.format}', {
          token: adminToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        expect(response.headers.get('content-type')).toBe('text/csv');
        expect(response.headers.get('content-disposition')).toContain('attachment');
      });
    });
  });

  describe('Security and Audit', () => {
    describe('GET /security/audit-log', () => {
      it('should get audit log of admin actions', async () => {
        const mockAuditLog = [
          {
            id: 'audit_1',
            admin_user_id: testAdminUser.id,
            action: 'user_suspension',
            target_user_id: 'suspended_user_123',
            details: JSON.stringify({ reason: 'Terms violation' }),
            timestamp: Date.now() - 3600000,
            ip_address: '192.168.1.100'
          }
        ];

        env.DB._setMockData('SELECT * FROM admin_audit_log ORDER BY timestamp DESC LIMIT ?', mockAuditLog);

        const response = await makeRequest(app, 'GET', '/admin/security/audit-log', {
          token: adminToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          auditLog: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              adminUserId: expect.any(String),
              action: expect.any(String),
              timestamp: expect.any(Number),
              ipAddress: expect.any(String)
            })
          ])
        });
      });
    });

    describe('GET /security/threats', () => {
      it('should get security threat analysis', async () => {
        const response = await makeRequest(app, 'GET', '/admin/security/threats', {
          token: adminToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          threats: {
            suspiciousLogins: expect.any(Number),
            rateLimitViolations: expect.any(Number),
            maliciousRequests: expect.any(Number)
          },
          recentIncidents: expect.any(Array),
          recommendations: expect.any(Array)
        });
      });
    });
  });

  describe('Performance Monitoring', () => {
    it('should respond quickly to dashboard requests', async () => {
      // Mock basic queries for performance test
      env.DB._setMockData('SELECT COUNT(*) as total FROM users', [{ total: 1000 }]);
      env.DB._setMockData('SELECT COUNT(*) as active FROM users WHERE last_login > ?', [{ active: 800 }]);

      const start = Date.now();
      const response = await makeRequest(app, 'GET', '/admin/dashboard', {
          token: adminToken
      ,
          env: env
        });
      const duration = Date.now() - start;

      expectSuccessResponse(response);
      expect(duration).toBeLessThan(1000); // Should load dashboard within 1 second
    });

    it('should handle concurrent admin requests', async () => {
      // Mock data for concurrent requests
      env.DB._setMockData('SELECT COUNT(*) as total FROM users', [{ total: 1000 }]);
      env.DB._setMockData('SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?', []);

      const requests = [
        makeRequest(app, 'GET', '/admin/dashboard', {
          token: adminToken ,
          env: env
        }),
        makeRequest(app, 'GET', '/admin/users', {
          token: adminToken ,
          env: env
        }),
        makeRequest(app, 'GET', '/admin/system/health', {
          token: adminToken ,
          env: env
        })
      ];

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expectSuccessResponse(response);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection failures gracefully', async () => {
      env.DB._setMockError('SELECT COUNT(*) as total FROM users', new Error('Database unavailable'));

      const response = await makeRequest(app, 'GET', '/admin/dashboard', {
          token: adminToken
      ,
          env: env
        });

      // Should return degraded service rather than complete failure
      expect(response.status).toBeLessThan(500);
    });

    it('should validate admin permissions for sensitive operations', async () => {
      // Mock user with insufficient permissions
      env.DB._setMockData('SELECT role, permissions FROM users WHERE id = ?', [{ 
        role: 'support', 
        permissions: JSON.stringify(['analytics_read']) 
      }]);

      const response = await makeRequest(app, 'DELETE', '/admin/users/some_user', {
          token: adminToken
      ,
          env: env
        });

      expectErrorResponse(response, 403, 'Insufficient permissions');
    });
  });
});