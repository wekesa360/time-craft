// Social Features API Worker
// Handles social connections, achievement sharing, and challenges

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { SocialFeaturesServiceImpl } from '../lib/social-features';
import { DatabaseService } from '../lib/db';
import { authenticateUser } from '../middleware/auth';
import { z } from 'zod';

import type { Env } from '../lib/env';

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://timeandwellness.app'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Authentication middleware for all routes
app.use('*', authenticateUser);

// Validation schemas
const connectionRequestSchema = z.object({
  addresseeId: z.string().uuid().optional(),
  email: z.string().email().optional(),
  message: z.string().max(500).optional(),
  type: z.enum(['friend', 'family', 'colleague', 'accountability_partner']).optional()
}).refine((v) => !!v.addresseeId || !!v.email, {
  message: 'Either addresseeId or email is required',
  path: ['addresseeId']
});

const shareAchievementSchema = z.object({
  badgeId: z.string().uuid(),
  platform: z.enum(['twitter', 'facebook', 'linkedin', 'instagram', 'other'])
});

const createChallengeSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  challenge_type: z.enum(['habit', 'goal', 'fitness', 'mindfulness']),
  start_date: z.number().int().positive(),
  end_date: z.number().int().positive(),
  max_participants: z.number().int().min(2).max(100).default(10),
  is_public: z.boolean().default(false),
  reward_type: z.string().optional(),
  reward_description: z.string().optional()
});

const updateProgressSchema = z.object({
  progressData: z.any()
});

// Connection Management Routes

// Send connection request
app.post('/connections/request', async (c) => {
  try {
    const jwtPayload = c.get('jwtPayload') as any;
    const userId = jwtPayload?.userId;
    const body = await c.req.json();
    const parsed = connectionRequestSchema.parse(body);

    let targetUserId = parsed.addresseeId as string | undefined;
    if (!targetUserId && parsed.email) {
      // Resolve email to user ID
      const result = await c.env.DB.prepare('SELECT id FROM users WHERE email = ? LIMIT 1').bind(parsed.email).all();
      const row: any = (result.results || [])[0];
      if (!row?.id) {
        return c.json({ success: false, error: 'User not found for provided email' }, 404);
      }
      targetUserId = row.id as string;
    }

    const socialService = new SocialFeaturesServiceImpl(new DatabaseService(c.env));
    const connection = await socialService.sendConnectionRequest(userId, targetUserId!, parsed.type);

    return c.json({
      success: true,
      data: connection
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send connection request'
    }, 400);
  }
});

// Accept connection request
app.post('/connections/:connectionId/accept', async (c) => {
  try {
    const jwtPayload = c.get('jwtPayload') as any;
    const userId = jwtPayload?.userId;
    const connectionId = c.req.param('connectionId');

    const socialService = new SocialFeaturesServiceImpl(new DatabaseService(c.env));
    const success = await socialService.acceptConnectionRequest(connectionId, userId);

    if (!success) {
      return c.json({
        success: false,
        error: 'Connection request not found or already processed'
      }, 404);
    }

    return c.json({
      success: true,
      message: 'Connection request accepted'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to accept connection request'
    }, 400);
  }
});

// Reject connection request
app.post('/connections/:connectionId/reject', async (c) => {
  try {
    const jwtPayload = c.get('jwtPayload') as any;
    const userId = jwtPayload?.userId;
    const connectionId = c.req.param('connectionId');

    const socialService = new SocialFeaturesServiceImpl(new DatabaseService(c.env));
    const success = await socialService.rejectConnectionRequest(connectionId, userId);

    if (!success) {
      return c.json({
        success: false,
        error: 'Connection request not found'
      }, 404);
    }

    return c.json({
      success: true,
      message: 'Connection request rejected'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject connection request'
    }, 400);
  }
});

// Block user
app.post('/connections/block', async (c) => {
  try {
    const jwtPayload = c.get('jwtPayload') as any;
    const userId = jwtPayload?.userId;
    const body = await c.req.json();
    const { addresseeId } = connectionRequestSchema.parse(body);

    const socialService = new SocialFeaturesServiceImpl(new DatabaseService(c.env));
    await socialService.blockUser(userId, addresseeId);

    return c.json({
      success: true,
      message: 'User blocked successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to block user'
    }, 400);
  }
});

// Get user connections
app.get('/connections', async (c) => {
  try {
    const jwtPayload = c.get('jwtPayload') as any;
    const userId = jwtPayload?.userId;
    const status = c.req.query('status') as 'pending' | 'accepted' | 'blocked' | undefined;

    const socialService = new SocialFeaturesServiceImpl(new DatabaseService(c.env));
    const connections = await socialService.getUserConnections(userId, status);

    return c.json({
      success: true,
      data: connections
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get connections'
    }, 500);
  }
});

// Achievement Sharing Routes

// Share achievement
app.post('/achievements/share', async (c) => {
  try {
    const jwtPayload = c.get('jwtPayload') as any;
    const userId = jwtPayload?.userId;
    const body = await c.req.json();
    const { badgeId, platform } = shareAchievementSchema.parse(body);

    const socialService = new SocialFeaturesServiceImpl(new DatabaseService(c.env));
    const share = await socialService.shareAchievement(badgeId, platform, userId);

    return c.json({
      success: true,
      data: share
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to share achievement'
    }, 400);
  }
});

// Get achievement share stats
app.get('/achievements/:badgeId/stats', async (c) => {
  try {
    const badgeId = c.req.param('badgeId');

    const socialService = new SocialFeaturesServiceImpl(new DatabaseService(c.env));
    const stats = await socialService.getAchievementShareStats(badgeId);

    return c.json({
      success: true,
      data: stats
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get share stats'
    }, 500);
  }
});

// Social Challenges Routes

// Create challenge
app.post('/challenges', async (c) => {
  try {
    const jwtPayload = c.get('jwtPayload') as any;
    const userId = jwtPayload?.userId;
    const body = await c.req.json();
    const challengeData = createChallengeSchema.parse(body);

    const socialService = new SocialFeaturesServiceImpl(new DatabaseService(c.env));
    const challenge = await socialService.createChallenge(userId, challengeData);

    return c.json({
      success: true,
      data: challenge
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create challenge'
    }, 400);
  }
});

// Join challenge
app.post('/challenges/:challengeId/join', async (c) => {
  try {
    const jwtPayload = c.get('jwtPayload') as any;
    const userId = jwtPayload?.userId;
    const challengeId = c.req.param('challengeId');

    const socialService = new SocialFeaturesServiceImpl(new DatabaseService(c.env));
    const participant = await socialService.joinChallenge(challengeId, userId);

    return c.json({
      success: true,
      data: participant
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to join challenge'
    }, 400);
  }
});

// Leave challenge
app.post('/challenges/:challengeId/leave', async (c) => {
  try {
    const jwtPayload = c.get('jwtPayload') as any;
    const userId = jwtPayload?.userId;
    const challengeId = c.req.param('challengeId');

    const socialService = new SocialFeaturesServiceImpl(new DatabaseService(c.env));
    const success = await socialService.leaveChallenge(challengeId, userId);

    if (!success) {
      return c.json({
        success: false,
        error: 'Challenge participation not found'
      }, 404);
    }

    return c.json({
      success: true,
      message: 'Left challenge successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to leave challenge'
    }, 400);
  }
});

// Update challenge progress
app.put('/challenges/:challengeId/progress', async (c) => {
  try {
    const jwtPayload = c.get('jwtPayload') as any;
    const userId = jwtPayload?.userId;
    const challengeId = c.req.param('challengeId');
    const body = await c.req.json();
    const { progressData } = updateProgressSchema.parse(body);

    const socialService = new SocialFeaturesServiceImpl(new DatabaseService(c.env));
    const success = await socialService.updateChallengeProgress(challengeId, userId, progressData);

    if (!success) {
      return c.json({
        success: false,
        error: 'Challenge participation not found or inactive'
      }, 404);
    }

    return c.json({
      success: true,
      message: 'Progress updated successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update progress'
    }, 400);
  }
});

// Get challenge leaderboard
app.get('/challenges/:challengeId/leaderboard', async (c) => {
  try {
    const challengeId = c.req.param('challengeId');

    const socialService = new SocialFeaturesServiceImpl(new DatabaseService(c.env));
    const leaderboard = await socialService.getChallengeLeaderboard(challengeId);

    return c.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get leaderboard'
    }, 500);
  }
});

// Get public challenges
app.get('/challenges/public', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '20');

    const socialService = new SocialFeaturesServiceImpl(new DatabaseService(c.env));
    const challenges = await socialService.getPublicChallenges(limit);

    return c.json({
      success: true,
      data: challenges
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get public challenges'
    }, 500);
  }
});

// Get user challenges
app.get('/challenges/my', async (c) => {
  try {
    const jwtPayload = c.get('jwtPayload') as any;
    const userId = jwtPayload?.userId;

    const socialService = new SocialFeaturesServiceImpl(new DatabaseService(c.env));
    const challenges = await socialService.getUserChallenges(userId);

    return c.json({
      success: true,
      data: challenges
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user challenges'
    }, 500);
  }
});

// Social Feed Routes

// Get social feed
app.get('/feed', async (c) => {
  try {
    const jwtPayload = c.get('jwtPayload') as any;
    const userId = jwtPayload?.userId;
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');
    const socialService = new SocialFeaturesServiceImpl(new DatabaseService(c.env));

    // Get user connections for feed filtering
    const connections = await socialService.getUserConnections(userId, 'accepted');
    const connectionIds = connections.map(conn => 
      conn.requester_id === userId ? conn.addressee_id : conn.requester_id
    );

    // Get feed items from various sources
    const feedItems = [];

    // 1. Achievement shares from connections
    if (connectionIds.length > 0) {
      const achievementShares = await c.env.DB.prepare(`
        SELECT 
          'achievement_share' as type,
          s.id,
          s.user_id,
          s.badge_id,
          s.platform,
          s.shared_at as created_at,
          u.first_name,
          u.last_name,
          u.avatar_url,
          b.title_en as badge_title,
          b.description_en as badge_description
        FROM achievement_shares s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN user_badges ub ON s.badge_id = ub.id
        LEFT JOIN achievement_definitions b ON ub.badge_key = b.achievement_key
        WHERE s.user_id IN (${connectionIds.map(() => '?').join(',')})
        ORDER BY s.shared_at DESC
        LIMIT ? OFFSET ?
      `).bind(...connectionIds, Math.ceil(limit / 3), offset).all();

      feedItems.push(...(achievementShares.results || []));
    }

    // 2. Challenge completions and milestones
    if (connectionIds.length > 0) {
      const challengeUpdates = await c.env.DB.prepare(`
        SELECT 
          'challenge_update' as type,
          cp.challenge_id as id,
          cp.user_id,
          cp.updated_at as created_at,
          cp.progress_data,
          u.first_name,
          u.last_name,
          u.avatar_url,
          c.title as challenge_title,
          c.challenge_type
        FROM challenge_participants cp
        JOIN users u ON cp.user_id = u.id
        JOIN challenges c ON cp.challenge_id = c.id
        WHERE cp.user_id IN (${connectionIds.map(() => '?').join(',')})
          AND cp.updated_at > ?
        ORDER BY cp.updated_at DESC
        LIMIT ? OFFSET ?
      `).bind(...connectionIds, Date.now() - (7 * 24 * 60 * 60 * 1000), Math.ceil(limit / 3), offset).all();

      feedItems.push(...(challengeUpdates.results || []));
    }

    // 3. Public challenges and announcements
    const publicContent = await c.env.DB.prepare(`
      SELECT 
        'public_challenge' as type,
        id,
        created_by as user_id,
        title,
        description,
        challenge_type,
        created_at,
        max_participants,
        (SELECT COUNT(*) FROM challenge_participants WHERE challenge_id = challenges.id) as participant_count
      FROM challenges
      WHERE is_public = true
        AND start_date > ?
        AND created_at > ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(Date.now(), Date.now() - (3 * 24 * 60 * 60 * 1000), Math.ceil(limit / 3), offset).all();

    feedItems.push(...(publicContent.results || []));

    // Sort all feed items by creation date
    feedItems.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));

    // Limit to requested amount
    const limitedFeed = feedItems.slice(0, limit);

    return c.json({
      success: true,
      data: limitedFeed,
      hasMore: feedItems.length >= limit,
      total: feedItems.length
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get social feed'
    }, 500);
  }
});

export default app;