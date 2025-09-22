// Badges and Achievement System Integration Tests
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import apiGateway from '../../src/workers/api-gateway';
import { 
  createMockEnv, 
  testUsers,
  generateTestToken,
  makeRequest, 
  expectSuccessResponse, 
  expectErrorResponse,
  cleanupTestData
} from '../utils/test-helpers';

describe('Badges and Achievement API', () => {
  let env: any;
  let app: any;
  let userToken: string;

  beforeEach(async () => {
    env = createMockEnv();
    app = apiGateway;
    userToken = await generateTestToken(testUsers.regularUser.id);
    
    // Set up mock data
    env.DB._setMockData('SELECT * FROM users WHERE id = ?', [testUsers.regularUser]);
    env.DB._setMockData('SELECT * FROM user_badges WHERE user_id = ?', []);
    env.DB._setMockData('SELECT * FROM tasks WHERE user_id = ? AND status = ?', []);
  });

  afterEach(() => {
    cleanupTestData(env);
  });

  describe('Available Badges', () => {
    describe('GET /available', () => {
      it('should get all available badges with status', async () => {
        const response = await makeRequest(app, 'GET', '/api/badges/available', {
          token: userToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          badges: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              name: expect.any(String),
              description: expect.any(String),
              category: expect.any(String),
              tier: expect.stringMatching(/bronze|silver|gold|platinum/),
              icon: expect.any(String),
              points: expect.any(Number),
              isUnlocked: expect.any(Boolean)
            })
          ]),
          totalAvailable: expect.any(Number),
          totalUnlocked: expect.any(Number)
        });

        // Should include specific badge types
        const badgeIds = body.badges.map((b: any) => b.id);
        expect(badgeIds).toContain('first_task');
        expect(badgeIds).toContain('task_veteran');
        expect(badgeIds).toContain('health_tracker');
        expect(badgeIds).toContain('wellness_warrior');
        expect(badgeIds).toContain('consistency_king');
      });

      it('should show unlocked badges correctly', async () => {
        // Mock some unlocked badges
        const unlockedBadges = [
          {
            id: 'user_badge_1',
            user_id: testUsers.regularUser.id,
            badge_id: 'first_task',
            unlocked_at: Date.now() - 86400000,
            tier: 'bronze'
          }
        ];
        env.DB._setMockData('SELECT * FROM user_badges WHERE user_id = ?', unlockedBadges);

        const response = await makeRequest(app, 'GET', '/api/badges/available', {
          token: userToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        const firstTaskBadge = body.badges.find((b: any) => b.id === 'first_task');
        expect(firstTaskBadge).toMatchObject({
          isUnlocked: true,
          unlockedAt: expect.any(Number)
        });

        expect(body.totalUnlocked).toBe(1);
      });
    });
  });

  describe('User Badges', () => {
    describe('GET /user', () => {
      it('should get user\'s unlocked badges', async () => {
        const mockUserBadges = [
          {
            id: 'user_badge_1',
            user_id: testUsers.regularUser.id,
            badge_id: 'first_task',
            unlocked_at: Date.now() - 86400000,
            tier: 'bronze'
          },
          {
            id: 'user_badge_2',
            user_id: testUsers.regularUser.id,
            badge_id: 'health_tracker',
            unlocked_at: Date.now() - 43200000,
            tier: 'bronze'
          }
        ];

        env.DB._setMockData('SELECT * FROM user_badges WHERE user_id = ?', mockUserBadges);
        env.DB._setMockData('SELECT badge_points FROM users WHERE id = ?', [{ badge_points: 25 }]);

        const response = await makeRequest(app, 'GET', '/api/badges/user', {
          token: userToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          badges: expect.arrayContaining([
            expect.objectContaining({
              id: 'user_badge_1',
              badgeId: 'first_task',
              name: 'Getting Started',
              description: expect.any(String),
              category: 'milestone',
              icon: '🎯',
              points: 10,
              unlockedAt: expect.any(Number)
            })
          ]),
          totalBadges: 2,
          totalPoints: 25,
          recentlyUnlocked: expect.any(Array)
        });
      });

      it('should show recently unlocked badges', async () => {
        const recentBadge = {
          id: 'user_badge_recent',
          user_id: testUsers.regularUser.id,
          badge_id: 'consistency_king',
          unlocked_at: Date.now() - 3600000, // 1 hour ago (recent)
          tier: 'silver'
        };

        env.DB._setMockData('SELECT * FROM user_badges WHERE user_id = ?', [recentBadge]);
        env.DB._setMockData('SELECT badge_points FROM users WHERE id = ?', [{ badge_points: 50 }]);

        const response = await makeRequest(app, 'GET', '/api/badges/user', {
          token: userToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body.recentlyUnlocked).toHaveLength(1);
        expect(body.recentlyUnlocked[0]).toMatchObject({
          badgeId: 'consistency_king',
          name: 'Consistency King'
        });
      });

      it('should handle user with no badges', async () => {
        env.DB._setMockData('SELECT badge_points FROM users WHERE id = ?', [{ badge_points: 0 }]);

        const response = await makeRequest(app, 'GET', '/api/badges/user', {
          token: userToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          badges: [],
          totalBadges: 0,
          totalPoints: 0,
          recentlyUnlocked: []
        });
      });
    });
  });

  describe('Badge Checking', () => {
    describe('POST /check', () => {
      it('should check and unlock eligible badges', async () => {
        // Mock task completion for first_task badge
        env.DB._setMockData('SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = \'completed\'', [
          { count: 1 }
        ]);
        
        // Mock user creation date for early_adopter badge
        const userWithDate = {
          ...testUsers.regularUser,
          created_at: Date.now() - (8 * 24 * 60 * 60 * 1000) // 8 days ago
        };
        env.DB._setMockData('SELECT created_at FROM users WHERE id = ?', [userWithDate]);

        // Mock badge unlock operations
        env.DB._setMockData('INSERT INTO user_badges', [
          { id: 'new_badge_1' },
          { id: 'new_badge_2' }
        ]);

        const response = await makeRequest(app, 'POST', '/api/badges/check', {
          token: userToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          message: expect.stringMatching(/\d+ new badge\(s\) unlocked/),
          newBadges: expect.arrayContaining([
            expect.objectContaining({
              badgeId: expect.any(String),
              name: expect.any(String),
              description: expect.any(String),
              icon: expect.any(String),
              points: expect.any(Number)
            })
          ]),
          totalNewPoints: expect.any(Number)
        });

        expect(body.newBadges.length).toBeGreaterThan(0);
        expect(body.totalNewPoints).toBeGreaterThan(0);
      });

      it('should return no new badges when none are eligible', async () => {
        // Mock no completed tasks
        env.DB._setMockData('SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = \'completed\'', [
          { count: 0 }
        ]);

        // Mock recent user (not eligible for early_adopter)
        const newUser = {
          ...testUsers.regularUser,
          created_at: Date.now() - (2 * 24 * 60 * 60 * 1000) // 2 days ago
        };
        env.DB._setMockData('SELECT created_at FROM users WHERE id = ?', [newUser]);

        const response = await makeRequest(app, 'POST', '/api/badges/check', {
          token: userToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          message: '0 new badge(s) unlocked',
          newBadges: [],
          totalNewPoints: 0
        });
      });

      it('should handle database errors gracefully', async () => {
        // Mock database error
        env.DB._setMockData('SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = \'completed\'', []);

        const response = await makeRequest(app, 'POST', '/api/badges/check', {
          token: userToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body.newBadges).toEqual([]);
      });
    });
  });

  describe('Leaderboard', () => {
    describe('GET /leaderboard', () => {
      it('should get badge leaderboard', async () => {
        const mockLeaderboard = [
          {
            display_name: 'Top User',
            email: 'top@example.com',
            points: 500,
            badge_count: 8
          },
          {
            display_name: 'Second User',
            email: 'second@example.com',
            points: 350,
            badge_count: 6
          },
          {
            display_name: testUsers.regularUser.display_name,
            email: testUsers.regularUser.email,
            points: 150,
            badge_count: 3
          }
        ];

        env.DB._setMockData('SELECT u.display_name, u.email, COALESCE(u.badge_points, 0) as points', mockLeaderboard);
        env.DB._setMockData('SELECT COUNT(*) + 1 as rank FROM users', [{ rank: 25 }]);

        const response = await makeRequest(app, 'GET', '/api/badges/leaderboard', {
          token: userToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          leaderboard: expect.arrayContaining([
            expect.objectContaining({
              rank: 1,
              displayName: 'Top User',
              email: 'top***', // Privacy protected
              points: 500,
              badgeCount: 8
            }),
            expect.objectContaining({
              rank: 2,
              displayName: 'Second User',
              points: 350,
              badgeCount: 6
            })
          ]),
          userRank: 25
        });

        expect(body.leaderboard.length).toBeGreaterThan(0);
        
        // Verify email privacy protection
        body.leaderboard.forEach((user: any) => {
          expect(user.email).toMatch(/^\w{3}\*\*\*$/);
        });
      });

      it('should handle empty leaderboard', async () => {
        env.DB._setMockData('SELECT u.display_name, u.email, COALESCE(u.badge_points, 0) as points', []);
        env.DB._setMockData('SELECT COUNT(*) + 1 as rank FROM users', [{ rank: 1 }]);

        const response = await makeRequest(app, 'GET', '/api/badges/leaderboard', {
          token: userToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body.leaderboard).toEqual([]);
        expect(body.userRank).toBe(1);
      });
    });
  });

  describe('Badge Types and Categories', () => {
    it('should include all expected badge categories', async () => {
      const response = await makeRequest(app, 'GET', '/api/badges/available', {
          token: userToken
      ,
          env: env
        });

      expectSuccessResponse(response);
      const body = await response.json();
      
      const categories = new Set(body.badges.map((b: any) => b.category));
      expect(categories).toContain('tasks');
      expect(categories).toContain('health');
      expect(categories).toContain('streak');
      expect(categories).toContain('milestone');
    });

    it('should include all badge tiers', async () => {
      const response = await makeRequest(app, 'GET', '/api/badges/available', {
          token: userToken
      ,
          env: env
        });

      expectSuccessResponse(response);
      const body = await response.json();
      
      const tiers = new Set(body.badges.map((b: any) => b.tier));
      expect(tiers).toContain('bronze');
      expect(tiers).toContain('silver');
      expect(tiers).toContain('gold');
      expect(tiers).toContain('platinum');
    });

    it('should have appropriate point values for different tiers', async () => {
      const response = await makeRequest(app, 'GET', '/api/badges/available', {
          token: userToken
      ,
          env: env
        });

      expectSuccessResponse(response);
      const body = await response.json();
      
      const bronzeBadges = body.badges.filter((b: any) => b.tier === 'bronze');
      const goldBadges = body.badges.filter((b: any) => b.tier === 'gold');
      const platinumBadges = body.badges.filter((b: any) => b.tier === 'platinum');

      // Bronze badges should have lower points than gold
      const avgBronzePoints = bronzeBadges.reduce((sum: number, b: any) => sum + b.points, 0) / bronzeBadges.length;
      const avgGoldPoints = goldBadges.reduce((sum: number, b: any) => sum + b.points, 0) / goldBadges.length;
      
      expect(avgBronzePoints).toBeLessThan(avgGoldPoints);
      
      // Platinum should have highest points
      if (platinumBadges.length > 0) {
        const avgPlatinumPoints = platinumBadges.reduce((sum: number, b: any) => sum + b.points, 0) / platinumBadges.length;
        expect(avgPlatinumPoints).toBeGreaterThan(avgGoldPoints);
      }
    });
  });

  describe('Security and Validation', () => {
    it('should require authentication for all endpoints', async () => {
      const endpoints = [
        { method: 'GET', path: '/available' },
        { method: 'GET', path: '/user' },
        { method: 'POST', path: '/check' },
        { method: 'GET', path: '/leaderboard' }
      ];

      for (const endpoint of endpoints) {
        const response = await makeRequest(app, endpoint.method, endpoint.path);
        expectErrorResponse(response, 401);
      }
    });

    it('should not expose sensitive user data in leaderboard', async () => {
      const mockLeaderboard = [
        {
          display_name: 'Test User',
          email: 'sensitive@example.com',
          points: 100,
          badge_count: 2
        }
      ];

      env.DB._setMockData('SELECT u.display_name, u.email, COALESCE(u.badge_points, 0) as points', mockLeaderboard);
      env.DB._setMockData('SELECT COUNT(*) + 1 as rank FROM users', [{ rank: 1 }]);

      const response = await makeRequest(app, 'GET', '/api/badges/leaderboard', {
          token: userToken
      ,
          env: env
        });

      expectSuccessResponse(response);
      const body = await response.json();
      
      expect(body.leaderboard[0].email).toBe('sen***');
      expect(body.leaderboard[0].email).not.toContain('sensitive@example.com');
    });
  });

  describe('Performance', () => {
    it('should respond quickly to badge checks', async () => {
      // Mock some simple data
      env.DB._setMockData('SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = \'completed\'', [
        { count: 1 }
      ]);

      const start = Date.now();
      const response = await makeRequest(app, 'POST', '/api/badges/check', {
          token: userToken
      ,
          env: env
        });
      const duration = Date.now() - start;

      expectSuccessResponse(response);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle large leaderboards efficiently', async () => {
      // Mock large leaderboard
      const largeMockData = Array.from({ length: 50 }, (_, i) => ({
        display_name: `User ${i}`,
        email: `user${i}@example.com`,
        points: 1000 - (i * 10),
        badge_count: 10 - Math.floor(i / 10)
      }));

      env.DB._setMockData('SELECT u.display_name, u.email, COALESCE(u.badge_points, 0) as points', largeMockData);
      env.DB._setMockData('SELECT COUNT(*) + 1 as rank FROM users', [{ rank: 51 }]);

      const start = Date.now();
      const response = await makeRequest(app, 'GET', '/api/badges/leaderboard', {
          token: userToken
      ,
          env: env
        });
      const duration = Date.now() - start;

      expectSuccessResponse(response);
      expect(duration).toBeLessThan(500); // Should be fast even with large data
      expect(body.leaderboard.length).toBe(50);
    });
  });
});