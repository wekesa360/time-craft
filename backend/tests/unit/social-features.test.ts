// Social Features Tests
// Comprehensive test suite for social connections, achievement sharing, and challenges

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SocialFeaturesServiceImpl } from '../../src/lib/social-features';

// Mock D1Database
const mockDb = {
  prepare: vi.fn(),
  exec: vi.fn(),
  batch: vi.fn(),
  dump: vi.fn()
};

const mockStatement = {
  bind: vi.fn().mockReturnThis(),
  first: vi.fn(),
  all: vi.fn(),
  run: vi.fn(),
  raw: vi.fn()
};

describe('SocialFeaturesService', () => {
  let socialService: SocialFeaturesServiceImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.prepare.mockReturnValue(mockStatement);
    socialService = new SocialFeaturesServiceImpl(mockDb as any);
  });

  describe('Connection Management', () => {
    it('should send connection request successfully', async () => {
      const requesterId = 'user1';
      const addresseeId = 'user2';
      const type = 'friend';

      // Mock no existing connection
      mockStatement.first.mockResolvedValueOnce(null);
      mockStatement.run.mockResolvedValueOnce({ changes: 1 });

      const result = await socialService.sendConnectionRequest(requesterId, addresseeId, type);

      expect(result).toMatchObject({
        requester_id: requesterId,
        addressee_id: addresseeId,
        status: 'pending',
        connection_type: type
      });
      expect(mockDb.prepare).toHaveBeenCalledTimes(2);
    });

    it('should throw error if connection already exists', async () => {
      const requesterId = 'user1';
      const addresseeId = 'user2';

      // Mock existing connection
      mockStatement.first.mockResolvedValueOnce({ id: 'existing' });

      await expect(
        socialService.sendConnectionRequest(requesterId, addresseeId)
      ).rejects.toThrow('Connection already exists between these users');
    });

    it('should accept connection request successfully', async () => {
      const connectionId = 'conn1';
      const userId = 'user2';

      mockStatement.run.mockResolvedValueOnce({ changes: 1 });

      const result = await socialService.acceptConnectionRequest(connectionId, userId);

      expect(result).toBe(true);
      expect(mockStatement.bind).toHaveBeenCalledWith(expect.any(Number), connectionId, userId);
    });

    it('should reject connection request successfully', async () => {
      const connectionId = 'conn1';
      const userId = 'user2';

      mockStatement.run.mockResolvedValueOnce({ changes: 1 });

      const result = await socialService.rejectConnectionRequest(connectionId, userId);

      expect(result).toBe(true);
    });

    it('should block user successfully', async () => {
      const blockerId = 'user1';
      const blockedId = 'user2';

      mockStatement.run.mockResolvedValue({ changes: 1 });

      const result = await socialService.blockUser(blockerId, blockedId);

      expect(result).toBe(true);
      expect(mockDb.prepare).toHaveBeenCalledTimes(2); // DELETE + INSERT
    });

    it('should get user connections with filters', async () => {
      const userId = 'user1';
      const status = 'accepted';
      const mockConnections = [
        { id: 'conn1', requester_id: userId, status: 'accepted' }
      ];

      mockStatement.all.mockResolvedValueOnce({ results: mockConnections });

      const result = await socialService.getUserConnections(userId, status);

      expect(result).toEqual(mockConnections);
      expect(mockStatement.bind).toHaveBeenCalledWith(userId, userId, status);
    });
  });

  describe('Achievement Sharing', () => {
    it('should share achievement successfully', async () => {
      const badgeId = 'badge1';
      const platform = 'twitter';
      const userId = 'user1';

      // Mock badge exists and is unlocked
      mockStatement.first.mockResolvedValueOnce({ id: badgeId, user_id: userId, is_unlocked: true });
      mockStatement.run.mockResolvedValue({ changes: 1 });

      const result = await socialService.shareAchievement(badgeId, platform, userId);

      expect(result).toMatchObject({
        badge_id: badgeId,
        platform,
        click_count: 0
      });
      expect(result.share_url).toContain('twitter.com');
    });

    it('should throw error if badge not found or not unlocked', async () => {
      const badgeId = 'badge1';
      const platform = 'twitter';
      const userId = 'user1';

      mockStatement.first.mockResolvedValueOnce(null);

      await expect(
        socialService.shareAchievement(badgeId, platform, userId)
      ).rejects.toThrow('Badge not found or not unlocked');
    });

    it('should get achievement share stats', async () => {
      const badgeId = 'badge1';
      const mockStats = [
        { platform: 'twitter', count: 5, clicks: 10 },
        { platform: 'facebook', count: 3, clicks: 7 }
      ];

      mockStatement.all.mockResolvedValueOnce({ results: mockStats });

      const result = await socialService.getAchievementShareStats(badgeId);

      expect(result).toEqual({
        totalShares: 8,
        platformBreakdown: {
          twitter: 5,
          facebook: 3
        }
      });
    });

    it('should generate correct shareable links for different platforms', async () => {
      const badgeId = 'badge1';

      const twitterLink = await socialService.generateShareableLink(badgeId, 'twitter');
      const facebookLink = await socialService.generateShareableLink(badgeId, 'facebook');
      const linkedinLink = await socialService.generateShareableLink(badgeId, 'linkedin');

      expect(twitterLink).toContain('twitter.com/intent/tweet');
      expect(facebookLink).toContain('facebook.com/sharer');
      expect(linkedinLink).toContain('linkedin.com/sharing');
    });
  });

  describe('Social Challenges', () => {
    it('should create challenge successfully', async () => {
      const creatorId = 'user1';
      const challengeData = {
        title: 'Test Challenge',
        description: 'A test challenge',
        challenge_type: 'habit' as const,
        start_date: Date.now(),
        end_date: Date.now() + 86400000,
        max_participants: 10,
        is_public: true,
        reward_type: 'badge',
        reward_description: 'Test badge'
      };

      mockStatement.run.mockResolvedValue({ changes: 1 });
      // Mock auto-join
      mockStatement.first.mockResolvedValueOnce({ 
        ...challengeData, 
        id: 'challenge1',
        participant_count: 0 
      });

      const result = await socialService.createChallenge(creatorId, challengeData);

      expect(result).toMatchObject({
        creator_id: creatorId,
        ...challengeData
      });
    });

    it('should join challenge successfully', async () => {
      const challengeId = 'challenge1';
      const userId = 'user1';

      // Mock challenge exists with space
      mockStatement.first.mockResolvedValueOnce({
        id: challengeId,
        max_participants: 10,
        participant_count: 5
      });
      // Mock user not already joined
      mockStatement.first.mockResolvedValueOnce(null);
      mockStatement.run.mockResolvedValueOnce({ changes: 1 });

      const result = await socialService.joinChallenge(challengeId, userId);

      expect(result).toMatchObject({
        challenge_id: challengeId,
        user_id: userId,
        completion_status: 'active'
      });
    });

    it('should throw error if challenge is full', async () => {
      const challengeId = 'challenge1';
      const userId = 'user1';

      // Mock challenge is full
      mockStatement.first.mockResolvedValueOnce({
        id: challengeId,
        max_participants: 10,
        participant_count: 10
      });

      await expect(
        socialService.joinChallenge(challengeId, userId)
      ).rejects.toThrow('Challenge is full');
    });

    it('should throw error if user already joined', async () => {
      const challengeId = 'challenge1';
      const userId = 'user1';

      // Mock challenge exists with space
      mockStatement.first.mockResolvedValueOnce({
        id: challengeId,
        max_participants: 10,
        participant_count: 5
      });
      // Mock user already joined
      mockStatement.first.mockResolvedValueOnce({ id: 'existing' });

      await expect(
        socialService.joinChallenge(challengeId, userId)
      ).rejects.toThrow('User already joined this challenge');
    });

    it('should leave challenge successfully', async () => {
      const challengeId = 'challenge1';
      const userId = 'user1';

      mockStatement.run.mockResolvedValueOnce({ changes: 1 });

      const result = await socialService.leaveChallenge(challengeId, userId);

      expect(result).toBe(true);
    });

    it('should update challenge progress successfully', async () => {
      const challengeId = 'challenge1';
      const userId = 'user1';
      const progressData = { completed_days: 5, current_streak: 3 };

      mockStatement.run.mockResolvedValueOnce({ changes: 1 });

      const result = await socialService.updateChallengeProgress(challengeId, userId, progressData);

      expect(result).toBe(true);
      expect(mockStatement.bind).toHaveBeenCalledWith(
        JSON.stringify(progressData),
        challengeId,
        userId
      );
    });

    it('should get challenge leaderboard', async () => {
      const challengeId = 'challenge1';
      const mockLeaderboard = [
        { id: 'p1', user_id: 'user1', final_score: 100, first_name: 'John' },
        { id: 'p2', user_id: 'user2', final_score: 90, first_name: 'Jane' }
      ];

      mockStatement.all.mockResolvedValueOnce({ results: mockLeaderboard });

      const result = await socialService.getChallengeLeaderboard(challengeId);

      expect(result).toEqual(mockLeaderboard);
    });

    it('should get public challenges', async () => {
      const limit = 20;
      const mockChallenges = [
        { id: 'c1', title: 'Public Challenge 1', is_public: true },
        { id: 'c2', title: 'Public Challenge 2', is_public: true }
      ];

      mockStatement.all.mockResolvedValueOnce({ results: mockChallenges });

      const result = await socialService.getPublicChallenges(limit);

      expect(result).toEqual(mockChallenges);
      expect(mockStatement.bind).toHaveBeenCalledWith(expect.any(Number), limit);
    });

    it('should get user challenges', async () => {
      const userId = 'user1';
      const mockChallenges = [
        { id: 'c1', title: 'User Challenge 1', completion_status: 'active' },
        { id: 'c2', title: 'User Challenge 2', completion_status: 'completed' }
      ];

      mockStatement.all.mockResolvedValueOnce({ results: mockChallenges });

      const result = await socialService.getUserChallenges(userId);

      expect(result).toEqual(mockChallenges);
      expect(mockStatement.bind).toHaveBeenCalledWith(userId);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const error = new Error('Database connection failed');
      mockStatement.first.mockRejectedValueOnce(error);

      await expect(
        socialService.sendConnectionRequest('user1', 'user2')
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle invalid UUIDs', async () => {
      // This would be handled by the API layer validation, but testing service robustness
      mockStatement.first.mockResolvedValueOnce(null);
      mockStatement.run.mockResolvedValueOnce({ changes: 1 });

      const result = await socialService.sendConnectionRequest('invalid-uuid', 'user2');
      
      expect(result.requester_id).toBe('invalid-uuid');
    });
  });
});