// Social Features Service
// Handles achievement sharing, social connections, and challenges

import { D1Database } from '@cloudflare/workers-types';
import { 
  UserConnection, 
  SocialChallenge, 
  ChallengeParticipant, 
  BadgeShare,
  UserAchievement,
  ConnectionStatus,
  ConnectionType,
  ChallengeType,
  ParticipationStatus
} from '../types/database';

export interface SocialFeaturesService {
  // Connection management
  sendConnectionRequest(requesterId: string, addresseeId: string, type: ConnectionType): Promise<UserConnection>;
  acceptConnectionRequest(connectionId: string, userId: string): Promise<boolean>;
  rejectConnectionRequest(connectionId: string, userId: string): Promise<boolean>;
  blockUser(blockerId: string, blockedId: string): Promise<boolean>;
  getUserConnections(userId: string, status?: ConnectionStatus): Promise<UserConnection[]>;
  
  // Achievement sharing
  shareAchievement(badgeId: string, platform: string, userId: string): Promise<BadgeShare>;
  getAchievementShareStats(badgeId: string): Promise<{ totalShares: number; platformBreakdown: Record<string, number> }>;
  generateShareableLink(badgeId: string, platform: string): Promise<string>;
  
  // Social challenges
  createChallenge(creatorId: string, challengeData: Omit<SocialChallenge, 'id' | 'creator_id' | 'created_at'>): Promise<SocialChallenge>;
  joinChallenge(challengeId: string, userId: string): Promise<ChallengeParticipant>;
  leaveChallenge(challengeId: string, userId: string): Promise<boolean>;
  updateChallengeProgress(challengeId: string, userId: string, progressData: any): Promise<boolean>;
  getChallengeLeaderboard(challengeId: string): Promise<ChallengeParticipant[]>;
  getPublicChallenges(limit?: number): Promise<SocialChallenge[]>;
  getUserChallenges(userId: string): Promise<SocialChallenge[]>;
}

export class SocialFeaturesServiceImpl implements SocialFeaturesService {
  constructor(private db: D1Database) {}

  async sendConnectionRequest(requesterId: string, addresseeId: string, type: ConnectionType = 'friend'): Promise<UserConnection> {
    const id = crypto.randomUUID();
    const now = Date.now();

    // Check if connection already exists
    const existing = await this.db.prepare(`
      SELECT * FROM user_connections 
      WHERE (requester_id = ? AND addressee_id = ?) 
         OR (requester_id = ? AND addressee_id = ?)
    `).bind(requesterId, addresseeId, addresseeId, requesterId).first();

    if (existing) {
      throw new Error('Connection already exists between these users');
    }

    const connection: UserConnection = {
      id,
      requester_id: requesterId,
      addressee_id: addresseeId,
      status: 'pending',
      connection_type: type,
      created_at: now,
      updated_at: now
    };

    await this.db.prepare(`
      INSERT INTO user_connections (id, requester_id, addressee_id, status, connection_type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, requesterId, addresseeId, 'pending', type, now, now).run();

    return connection;
  }

  async acceptConnectionRequest(connectionId: string, userId: string): Promise<boolean> {
    const now = Date.now();
    
    const result = await this.db.prepare(`
      UPDATE user_connections 
      SET status = 'accepted', updated_at = ?
      WHERE id = ? AND addressee_id = ? AND status = 'pending'
    `).bind(now, connectionId, userId).run();

    return result.changes > 0;
  }

  async rejectConnectionRequest(connectionId: string, userId: string): Promise<boolean> {
    const result = await this.db.prepare(`
      DELETE FROM user_connections 
      WHERE id = ? AND addressee_id = ? AND status = 'pending'
    `).bind(connectionId, userId).run();

    return result.changes > 0;
  }

  async blockUser(blockerId: string, blockedId: string): Promise<boolean> {
    const id = crypto.randomUUID();
    const now = Date.now();

    // Remove any existing connections
    await this.db.prepare(`
      DELETE FROM user_connections 
      WHERE (requester_id = ? AND addressee_id = ?) 
         OR (requester_id = ? AND addressee_id = ?)
    `).bind(blockerId, blockedId, blockedId, blockerId).run();

    // Create block relationship
    await this.db.prepare(`
      INSERT INTO user_connections (id, requester_id, addressee_id, status, connection_type, created_at, updated_at)
      VALUES (?, ?, ?, 'blocked', 'friend', ?, ?)
    `).bind(id, blockerId, blockedId, now, now).run();

    return true;
  }

  async getUserConnections(userId: string, status?: ConnectionStatus): Promise<UserConnection[]> {
    let query = `
      SELECT uc.*, 
             u1.first_name as requester_first_name, u1.last_name as requester_last_name,
             u2.first_name as addressee_first_name, u2.last_name as addressee_last_name
      FROM user_connections uc
      JOIN users u1 ON uc.requester_id = u1.id
      JOIN users u2 ON uc.addressee_id = u2.id
      WHERE (uc.requester_id = ? OR uc.addressee_id = ?)
    `;
    
    const params = [userId, userId];
    
    if (status) {
      query += ` AND uc.status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY uc.updated_at DESC`;

    const result = await this.db.prepare(query).bind(...params).all();
    return result.results as UserConnection[];
  }

  async shareAchievement(badgeId: string, platform: string, userId: string): Promise<BadgeShare> {
    // Verify user owns this badge
    const badge = await this.db.prepare(`
      SELECT * FROM user_achievements 
      WHERE id = ? AND user_id = ? AND is_unlocked = true
    `).bind(badgeId, userId).first();

    if (!badge) {
      throw new Error('Badge not found or not unlocked');
    }

    const id = crypto.randomUUID();
    const now = Date.now();
    const shareUrl = await this.generateShareableLink(badgeId, platform);

    const share: BadgeShare = {
      id,
      badge_id: badgeId,
      platform,
      shared_at: now,
      click_count: 0,
      share_url: shareUrl
    };

    await this.db.prepare(`
      INSERT INTO badge_shares (id, badge_id, platform, shared_at, click_count, share_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, badgeId, platform, now, 0, shareUrl).run();

    // Update share count on the badge
    await this.db.prepare(`
      UPDATE user_achievements 
      SET share_count = share_count + 1 
      WHERE id = ?
    `).bind(badgeId).run();

    return share;
  }

  async getAchievementShareStats(badgeId: string): Promise<{ totalShares: number; platformBreakdown: Record<string, number> }> {
    const result = await this.db.prepare(`
      SELECT platform, COUNT(*) as count, SUM(click_count) as clicks
      FROM badge_shares 
      WHERE badge_id = ?
      GROUP BY platform
    `).bind(badgeId).all();

    const platformBreakdown: Record<string, number> = {};
    let totalShares = 0;

    for (const row of result.results) {
      const data = row as { platform: string; count: number; clicks: number };
      platformBreakdown[data.platform] = data.count;
      totalShares += data.count;
    }

    return { totalShares, platformBreakdown };
  }

  async generateShareableLink(badgeId: string, platform: string): Promise<string> {
    // Generate a shareable link based on platform
    const baseUrl = 'https://timeandwellness.app/shared-badge';
    const shareId = crypto.randomUUID();
    
    switch (platform) {
      case 'twitter':
        return `https://twitter.com/intent/tweet?url=${encodeURIComponent(`${baseUrl}/${shareId}`)}&text=${encodeURIComponent('Check out my achievement! 🏆')}`;
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${baseUrl}/${shareId}`)}`;
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${baseUrl}/${shareId}`)}`;
      case 'instagram':
        return `${baseUrl}/${shareId}?platform=instagram`;
      default:
        return `${baseUrl}/${shareId}`;
    }
  }

  async createChallenge(creatorId: string, challengeData: Omit<SocialChallenge, 'id' | 'creator_id' | 'created_at'>): Promise<SocialChallenge> {
    const id = crypto.randomUUID();
    const now = Date.now();

    const challenge: SocialChallenge = {
      id,
      creator_id: creatorId,
      ...challengeData,
      created_at: now
    };

    await this.db.prepare(`
      INSERT INTO social_challenges (
        id, creator_id, title, description, challenge_type, start_date, end_date,
        max_participants, is_public, reward_type, reward_description, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, creatorId, challengeData.title, challengeData.description, challengeData.challenge_type,
      challengeData.start_date, challengeData.end_date, challengeData.max_participants,
      challengeData.is_public, challengeData.reward_type, challengeData.reward_description, now
    ).run();

    // Auto-join creator to the challenge
    await this.joinChallenge(id, creatorId);

    return challenge;
  }

  async joinChallenge(challengeId: string, userId: string): Promise<ChallengeParticipant> {
    // Check if challenge exists and has space
    const challenge = await this.db.prepare(`
      SELECT *, (SELECT COUNT(*) FROM challenge_participants WHERE challenge_id = ?) as participant_count
      FROM social_challenges 
      WHERE id = ?
    `).bind(challengeId, challengeId).first() as any;

    if (!challenge) {
      throw new Error('Challenge not found');
    }

    if (challenge.participant_count >= challenge.max_participants) {
      throw new Error('Challenge is full');
    }

    // Check if user already joined
    const existing = await this.db.prepare(`
      SELECT * FROM challenge_participants 
      WHERE challenge_id = ? AND user_id = ?
    `).bind(challengeId, userId).first();

    if (existing) {
      throw new Error('User already joined this challenge');
    }

    const id = crypto.randomUUID();
    const now = Date.now();

    const participant: ChallengeParticipant = {
      id,
      challenge_id: challengeId,
      user_id: userId,
      joined_at: now,
      progress_data: null,
      completion_status: 'active',
      final_score: null
    };

    await this.db.prepare(`
      INSERT INTO challenge_participants (id, challenge_id, user_id, joined_at, progress_data, completion_status, final_score)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, challengeId, userId, now, null, 'active', null).run();

    return participant;
  }

  async leaveChallenge(challengeId: string, userId: string): Promise<boolean> {
    const result = await this.db.prepare(`
      UPDATE challenge_participants 
      SET completion_status = 'dropped'
      WHERE challenge_id = ? AND user_id = ? AND completion_status = 'active'
    `).bind(challengeId, userId).run();

    return result.changes > 0;
  }

  async updateChallengeProgress(challengeId: string, userId: string, progressData: any): Promise<boolean> {
    const result = await this.db.prepare(`
      UPDATE challenge_participants 
      SET progress_data = ?
      WHERE challenge_id = ? AND user_id = ? AND completion_status = 'active'
    `).bind(JSON.stringify(progressData), challengeId, userId).run();

    return result.changes > 0;
  }

  async getChallengeLeaderboard(challengeId: string): Promise<ChallengeParticipant[]> {
    const result = await this.db.prepare(`
      SELECT cp.*, u.first_name, u.last_name
      FROM challenge_participants cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.challenge_id = ?
      ORDER BY cp.final_score DESC NULLS LAST, cp.joined_at ASC
    `).bind(challengeId).all();

    return result.results as ChallengeParticipant[];
  }

  async getPublicChallenges(limit: number = 20): Promise<SocialChallenge[]> {
    const result = await this.db.prepare(`
      SELECT sc.*, u.first_name as creator_first_name, u.last_name as creator_last_name,
             (SELECT COUNT(*) FROM challenge_participants WHERE challenge_id = sc.id) as participant_count
      FROM social_challenges sc
      JOIN users u ON sc.creator_id = u.id
      WHERE sc.is_public = true AND sc.end_date > ?
      ORDER BY sc.created_at DESC
      LIMIT ?
    `).bind(Date.now(), limit).all();

    return result.results as SocialChallenge[];
  }

  async getUserChallenges(userId: string): Promise<SocialChallenge[]> {
    const result = await this.db.prepare(`
      SELECT DISTINCT sc.*, u.first_name as creator_first_name, u.last_name as creator_last_name,
             cp.completion_status, cp.progress_data, cp.final_score
      FROM social_challenges sc
      JOIN users u ON sc.creator_id = u.id
      JOIN challenge_participants cp ON sc.id = cp.challenge_id
      WHERE cp.user_id = ?
      ORDER BY sc.created_at DESC
    `).bind(userId).all();

    return result.results as SocialChallenge[];
  }
}