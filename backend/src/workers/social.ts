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

// Authentication middleware for most routes (except public invitation acceptance)
// Note: Public routes are defined before this middleware

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

// Public Routes (no authentication required)

// Accept connection request via invitation token (public endpoint)
// NOTE: This must be defined before the parameterized route to avoid routing conflicts
app.post('/connections/accept-invitation', async (c) => {
  try {
    const body = await c.req.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return c.json({ success: false, error: 'Invitation token is required' }, 400);
    }

    const socialService = new SocialFeaturesServiceImpl(new DatabaseService(c.env));
    const result = await socialService.acceptConnectionByToken(token);

    if (!result.success) {
      return c.json({
        success: false,
        error: result.error || 'Failed to accept invitation'
      }, 400);
    }

    return c.json({
      success: true,
      message: 'Connection request accepted successfully',
      connectionId: result.connectionId
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to accept invitation'
    }, 500);
  }
});

// Authentication middleware for all other routes
// Apply to all routes except the public accept-invitation route
app.use('*', async (c, next) => {
  // Skip auth for the public accept-invitation route
  if (c.req.path === '/connections/accept-invitation' && c.req.method === 'POST') {
    return next();
  }
  return authenticateUser(c, next);
});

// Connection Management Routes

// Send connection request
app.post('/connections/request', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const body = await c.req.json();
    const parsed = connectionRequestSchema.parse(body);

    let targetUserId = parsed.addresseeId as string | undefined;
    let targetEmail = parsed.email;
    
    if (!targetUserId && parsed.email) {
      // Resolve email to user ID
      const result = await c.env.DB.prepare('SELECT id, email FROM users WHERE email = ? LIMIT 1').bind(parsed.email).all();
      const row: any = (result.results || [])[0];
      if (!row?.id) {
        return c.json({ success: false, error: 'User not found for provided email' }, 404);
      }
      targetUserId = row.id as string;
      targetEmail = row.email || parsed.email;
    } else if (targetUserId && !targetEmail) {
      // Get email for the target user
      const result = await c.env.DB.prepare('SELECT email FROM users WHERE id = ? LIMIT 1').bind(targetUserId).all();
      const row: any = (result.results || [])[0];
      targetEmail = row?.email;
    }

    // Get requester info
    const requesterResult = await c.env.DB.prepare('SELECT first_name, last_name, email FROM users WHERE id = ? LIMIT 1').bind(userId).all();
    const requesterRow: any = (requesterResult.results || [])[0];
    const requesterName = requesterRow ? `${requesterRow.first_name || ''} ${requesterRow.last_name || ''}`.trim() || requesterRow.email : 'Someone';

    // Check for existing connection before attempting to create
    const existingCheck = await c.env.DB.prepare(`
      SELECT uc.*, 
             u1.email as requester_email,
             u2.email as addressee_email
      FROM user_connections uc
      JOIN users u1 ON uc.requester_id = u1.id
      JOIN users u2 ON uc.addressee_id = u2.id
      WHERE (uc.requester_id = ? AND uc.addressee_id = ?) 
         OR (uc.requester_id = ? AND uc.addressee_id = ?)
    `).bind(userId, targetUserId, targetUserId, userId).first();
    
    if (existingCheck) {
      const existing = existingCheck as any;
      console.log('[Existing Connection Found]', {
        id: existing.id,
        requester_email: existing.requester_email,
        addressee_email: existing.addressee_email,
        status: existing.status,
        requester_id: existing.requester_id,
        addressee_id: existing.addressee_id,
        current_user_id: userId,
        target_user_id: targetUserId
      });
    }

    const socialService = new SocialFeaturesServiceImpl(new DatabaseService(c.env));
    const connection = await socialService.sendConnectionRequest(userId, targetUserId!, parsed.type);

    // Get invitation token and send email
    if (targetEmail) {
      try {
        const token = await socialService.getInvitationToken(connection.id);
        if (token) {
          // Build invitation link
          const baseUrl = c.env.FRONTEND_URL || 'https://timeandwellness.app';
          const invitationLink = `${baseUrl}/accept-invitation?token=${token}`;

          // Send invitation email
          const { createEmailService } = await import('../lib/email');
          const emailService = createEmailService(c.env);
          
          const messageHtml = parsed.message 
            ? `<p style="background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">${parsed.message}</p>`
            : '';
          const messageText = parsed.message || '';

          await emailService.sendConnectionInvitation(
            targetEmail,
            requesterName,
            invitationLink,
            messageText,
            'en'
          );
        }
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Don't fail the request if email fails
      }
    }

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

// Accept connection request (must come after literal routes to avoid conflicts)
app.post('/connections/:connectionId/accept', async (c) => {
  try {
    console.log('[Accept Connection Route] Hit!', { 
      path: c.req.path, 
      method: c.req.method,
      url: c.req.url,
      rawPath: c.req.raw.path
    });
    
    // Try both userId (from authenticateUser) and jwtPayload (from API gateway)
    const userId = (c.get('userId') as string) || ((c.get('jwtPayload') as any)?.userId);
    const connectionId = c.req.param('connectionId');
    
    console.log('[Accept Connection]', { connectionId, userId, path: c.req.path });

    if (!userId) {
      return c.json({
        success: false,
        error: 'Authentication required'
      }, 401);
    }

    if (!connectionId) {
      return c.json({
        success: false,
        error: 'Connection ID is required'
      }, 400);
    }

    const socialService = new SocialFeaturesServiceImpl(new DatabaseService(c.env));
    const success = await socialService.acceptConnectionRequest(connectionId, userId);

    console.log('[Accept Connection Result]', { success, connectionId, userId });

    if (!success) {
      // Check if connection exists to provide better error message
      const connectionCheck = await c.env.DB.prepare(`
        SELECT * FROM user_connections 
        WHERE id = ? AND (requester_id = ? OR addressee_id = ?)
      `).bind(connectionId, userId, userId).first();
      
      if (!connectionCheck) {
        return c.json({
          success: false,
          error: 'Connection request not found'
        }, 404);
      }
      
      const connection = connectionCheck as any;
      
      // Check if user is the requester (sender) instead of addressee (recipient)
      if (connection.requester_id === userId && connection.addressee_id !== userId) {
        return c.json({
          success: false,
          error: 'You cannot accept your own connection request. You can only accept requests sent to you.'
        }, 400);
      }
      
      // Check if already processed
      if (connection.status !== 'pending') {
        return c.json({
          success: false,
          error: `Connection request has already been ${connection.status}`
        }, 400);
      }
      
      return c.json({
        success: false,
        error: 'Unable to accept connection request'
      }, 400);
    }

    return c.json({
      success: true,
      message: 'Connection request accepted'
    });
  } catch (error) {
    console.error('[Accept Connection Error]', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to accept connection request'
    }, 400);
  }
});

// Reject connection request
app.post('/connections/:connectionId/reject', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const connectionId = c.req.param('connectionId');

    if (!userId) {
      return c.json({
        success: false,
        error: 'Authentication required'
      }, 401);
    }

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

// Decline connection request (alias for reject)
app.post('/connections/:connectionId/decline', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const connectionId = c.req.param('connectionId');

    if (!userId) {
      return c.json({
        success: false,
        error: 'Authentication required'
      }, 401);
    }

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
      message: 'Connection request declined'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to decline connection request'
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

    if (!userId) {
      return c.json({
        success: false,
        error: 'Authentication required'
      }, 401);
    }

    // Get user connections for feed filtering
    const connections = await socialService.getUserConnections(userId, 'accepted');
    const connectionIds = connections.map(conn => 
      conn.requester_id === userId ? conn.addressee_id : conn.requester_id
    );

    // Get feed items from various sources
    const feedItems = [];

    // 1. Achievement shares from connections (if table exists)
    if (connectionIds.length > 0) {
      try {
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
            u.avatar_url
          FROM achievement_shares s
          JOIN users u ON s.user_id = u.id
          WHERE s.user_id IN (${connectionIds.map(() => '?').join(',')})
          ORDER BY s.shared_at DESC
          LIMIT ? OFFSET ?
        `).bind(...connectionIds, Math.ceil(limit / 3), offset).all();

        feedItems.push(...(achievementShares.results || []));
      } catch (error) {
        console.log('[Social Feed] Achievement shares query failed (table may not exist):', error instanceof Error ? error.message : String(error));
        // Continue without achievement shares
      }
    }

    // 2. Challenge completions and milestones (if table exists)
    if (connectionIds.length > 0) {
      try {
        // Try with challenge_participants table first
        const challengeUpdates = await c.env.DB.prepare(`
          SELECT 
            'challenge_update' as type,
            cp.challenge_id as id,
            cp.user_id,
            COALESCE(cp.updated_at, cp.created_at) as created_at,
            cp.progress_data,
            u.first_name,
            u.last_name,
            u.avatar_url,
            c.title as challenge_title,
            COALESCE(c.challenge_type, c.type) as challenge_type
          FROM challenge_participants cp
          JOIN users u ON cp.user_id = u.id
          JOIN challenges c ON cp.challenge_id = c.id
          WHERE cp.user_id IN (${connectionIds.map(() => '?').join(',')})
            AND COALESCE(cp.updated_at, cp.created_at) > ?
          ORDER BY COALESCE(cp.updated_at, cp.created_at) DESC
          LIMIT ? OFFSET ?
        `).bind(...connectionIds, Date.now() - (7 * 24 * 60 * 60 * 1000), Math.ceil(limit / 3), offset).all();

        feedItems.push(...(challengeUpdates.results || []));
      } catch (error) {
        console.log('[Social Feed] Challenge updates query failed (table may not exist):', error instanceof Error ? error.message : String(error));
        // Continue without challenge updates
      }
    }

    // 3. Public challenges and announcements (if table exists)
    try {
      // Try with is_public column first, fallback to checking if created_by exists
      const publicContent = await c.env.DB.prepare(`
        SELECT 
          'public_challenge' as type,
          id,
          COALESCE(created_by, 'system') as user_id,
          title,
          description,
          COALESCE(challenge_type, type) as challenge_type,
          created_at,
          COALESCE(max_participants, 10) as max_participants,
          (SELECT COUNT(*) FROM challenge_participants WHERE challenge_id = challenges.id) as participant_count
        FROM challenges
        WHERE (is_public = 1 OR is_public IS NULL)
          AND (start_date > ? OR start_date IS NULL)
          AND created_at > ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).bind(Date.now(), Date.now() - (3 * 24 * 60 * 60 * 1000), Math.ceil(limit / 3), offset).all();

      feedItems.push(...(publicContent.results || []));
    } catch (error) {
      console.log('[Social Feed] Public challenges query failed (table may not exist):', error instanceof Error ? error.message : String(error));
      // Continue without public challenges
    }

    // Sort all feed items by creation date
    feedItems.sort((a: any, b: any) => (b.created_at || 0) - (a.created_at || 0));

    // Limit to requested amount
    const limitedFeed = feedItems.slice(0, limit);

    return c.json({
      success: true,
      data: limitedFeed,
      hasMore: feedItems.length >= limit,
      total: feedItems.length
    });
  } catch (error) {
    console.error('[Social Feed] Error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get social feed'
    }, 500);
  }
});

// Debug: Log all unmatched routes
app.all('*', async (c) => {
  console.log('[Social Router] Unmatched route:', {
    path: c.req.path,
    method: c.req.method,
    url: c.req.url
  });
  return c.json({ error: 'Route not found in social router' }, 404);
});

export default app;