// AI Meeting Scheduler Tests
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MeetingScheduler } from '../../src/lib/meeting-scheduler';
import { createMockEnv, createTestUser } from '../utils/test-helpers';

describe('AI Meeting Scheduler', () => {
  let env: any;
  let scheduler: MeetingScheduler;
  let testUserId: string;

  beforeEach(async () => {
    env = createMockEnv();
    scheduler = new MeetingScheduler(env);
    testUserId = await createTestUser(env);

    // Set up mock data for meeting scheduler operations
    env.DB._setMockData('INSERT INTO meeting_requests', [{ id: 'meeting_123' }]);
    env.DB._setMockData('INSERT INTO meeting_time_slots', [{ id: 'slot_123' }]);
    env.DB._setMockData('SELECT * FROM users WHERE email = ?', []);
    env.DB._setMockData('SELECT * FROM calendar_events WHERE user_id = ?', []);
    env.DB._setMockData('SELECT * FROM availability_patterns WHERE user_id = ?', []);
    
    // Mock OpenAI API response for AI analysis
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{
          message: {
            content: JSON.stringify({
              scheduling_difficulty: 'moderate',
              optimal_time_range: '10:00-14:00',
              participant_analysis: {
                'alice@example.com': { availability_rate: 0.8, constraints_met: true },
                'bob@example.com': { availability_rate: 0.7, constraints_met: true }
              },
              recommendations: ['Consider scheduling during mid-morning for better engagement']
            })
          }
        }]
      })
    });
  });

  describe('Meeting Request Creation', () => {
    it('should create a meeting request with AI analysis', async () => {
      const meetingRequest = {
        id: '',
        organizer_id: testUserId,
        title: 'Team Standup',
        participants: ['alice@example.com', 'bob@example.com'],
        duration_minutes: 30,
        meeting_type: 'standup' as const,
        priority: 'medium' as const,
        location_type: 'video_call' as const,
        agenda: 'Daily standup meeting'
      };

      const result = await scheduler.scheduleMeeting(meetingRequest);

      expect(result.meeting_request_id).toBeDefined();
      expect(result.suggested_slots).toHaveLength.greaterThan(0);
      expect(result.analysis).toBeDefined();
      expect(result.analysis.scheduling_difficulty).toMatch(/easy|moderate|difficult|very_difficult/);
    });

    it('should generate multiple time slot suggestions', async () => {
      const meetingRequest = {
        id: '',
        organizer_id: testUserId,
        title: 'Project Review',
        participants: ['team@example.com'],
        duration_minutes: 60,
        meeting_type: 'team' as const,
        priority: 'high' as const,
        location_type: 'video_call' as const
      };

      const result = await scheduler.scheduleMeeting(meetingRequest);

      expect(result.suggested_slots).toHaveLength.greaterThan(1);
      expect(result.suggested_slots).toHaveLength.lessThanOrEqual(5); // Max 5 suggestions
      
      // Slots should be sorted by AI score (highest first)
      for (let i = 1; i < result.suggested_slots.length; i++) {
        expect(result.suggested_slots[i-1].ai_score).toBeGreaterThanOrEqual(
          result.suggested_slots[i].ai_score
        );
      }
    });

    it('should provide higher scores for optimal meeting times', async () => {
      const meetingRequest = {
        id: '',
        organizer_id: testUserId,
        title: 'Morning Standup',
        participants: ['dev@example.com'],
        duration_minutes: 15,
        meeting_type: 'standup' as const,
        priority: 'medium' as const,
        location_type: 'video_call' as const,
        preferences: {
          preferredTimes: [{ start: '09:00', end: '10:00' }],
          timezone: 'UTC'
        }
      };

      const result = await scheduler.scheduleMeeting(meetingRequest);

      // Should have at least one high-scoring slot for morning standup
      const bestSlot = result.suggested_slots[0];
      expect(bestSlot.ai_score).toBeGreaterThan(70); // Good score for optimal standup time
      expect(bestSlot.reasoning).toBeDefined();
      expect(bestSlot.optimal_factors).toContain.something;
    });
  });

  describe('Participant Availability Analysis', () => {
    it('should analyze participant conflicts', async () => {
      const meetingRequest = {
        id: '',
        organizer_id: testUserId,
        title: 'Team Meeting',
        participants: ['busy@example.com', 'free@example.com'],
        duration_minutes: 60,
        meeting_type: 'team' as const,
        priority: 'medium' as const,
        location_type: 'video_call' as const
      };

      const result = await scheduler.scheduleMeeting(meetingRequest);

      expect(result.participant_feedback).toBeDefined();
      expect(result.participant_feedback['busy@example.com']).toBeDefined();
      expect(result.participant_feedback['free@example.com']).toBeDefined();
      
      // Each participant should have availability rate
      Object.values(result.participant_feedback).forEach((feedback: any) => {
        expect(feedback.availability_rate).toBeGreaterThanOrEqual(0);
        expect(feedback.availability_rate).toBeLessThanOrEqual(1);
      });
    });

    it('should provide recommendations for difficult scheduling', async () => {
      const meetingRequest = {
        id: '',
        organizer_id: testUserId,
        title: 'Large Team Meeting',
        participants: Array.from({ length: 10 }, (_, i) => `person${i}@example.com`),
        duration_minutes: 120,
        meeting_type: 'team' as const,
        priority: 'low' as const,
        location_type: 'in_person' as const
      };

      const result = await scheduler.scheduleMeeting(meetingRequest);

      if (result.analysis.scheduling_difficulty === 'difficult' || 
          result.analysis.scheduling_difficulty === 'very_difficult') {
        expect(result.analysis.recommendations).toHaveLength.greaterThan(0);
        expect(result.analysis.recommendations.some(r => 
          r.includes('participants') || r.includes('smaller groups')
        )).toBe(true);
      }
    });
  });

  describe('Meeting Type Optimization', () => {
    it('should optimize standup meetings for morning slots', async () => {
      const meetingRequest = {
        id: '',
        organizer_id: testUserId,
        title: 'Daily Standup',
        participants: ['dev1@example.com', 'dev2@example.com'],
        duration_minutes: 15,
        meeting_type: 'standup' as const,
        priority: 'medium' as const,
        location_type: 'video_call' as const
      };

      const result = await scheduler.scheduleMeeting(meetingRequest);

      // Best slot should be in the morning (9 AM gets bonus points)
      const bestSlot = result.suggested_slots[0];
      const hour = new Date(bestSlot.start_time).getHours();
      
      // Should prefer morning hours for standups
      expect(hour).toBeLessThanOrEqual(11); // Before noon
      expect(bestSlot.optimal_factors.some(factor => 
        factor.includes('standup') || factor.includes('Morning')
      )).toBe(true);
    });

    it('should handle interview scheduling appropriately', async () => {
      const meetingRequest = {
        id: '',
        organizer_id: testUserId,
        title: 'Technical Interview',
        participants: ['candidate@example.com'],
        duration_minutes: 90,
        meeting_type: 'interview' as const,
        priority: 'high' as const,
        location_type: 'video_call' as const
      };

      const result = await scheduler.scheduleMeeting(meetingRequest);

      const bestSlot = result.suggested_slots[0];
      const hour = new Date(bestSlot.start_time).getHours();
      
      // Interviews should be during professional hours (10 AM - 4 PM)
      expect(hour).toBeGreaterThanOrEqual(10);
      expect(hour).toBeLessThanOrEqual(16);
    });
  });

  describe('Priority Handling', () => {
    it('should boost urgent meetings even with conflicts', async () => {
      const urgentMeeting = {
        id: '',
        organizer_id: testUserId,
        title: 'Urgent Issue Discussion',
        participants: ['oncall@example.com'],
        duration_minutes: 30,
        meeting_type: 'team' as const,
        priority: 'urgent' as const,
        location_type: 'video_call' as const
      };

      const result = await scheduler.scheduleMeeting(urgentMeeting);

      // Urgent meetings should get priority boost
      const bestSlot = result.suggested_slots[0];
      expect(bestSlot.ai_score).toBeGreaterThan(50); // Should get reasonable score even with conflicts
      
      if (bestSlot.optimal_factors.length > 0) {
        expect(bestSlot.optimal_factors.some(factor => 
          factor.includes('urgent') || factor.includes('priority')
        )).toBe(true);
      }
    });
  });

  describe('Time Zone Handling', () => {
    it('should respect timezone preferences', async () => {
      const meetingRequest = {
        id: '',
        organizer_id: testUserId,
        title: 'Global Team Sync',
        participants: ['us@example.com', 'eu@example.com'],
        duration_minutes: 60,
        meeting_type: 'team' as const,
        priority: 'medium' as const,
        location_type: 'video_call' as const,
        preferences: {
          timezone: 'America/New_York',
          preferredTimes: [{ start: '14:00', end: '16:00' }] // 2-4 PM EST
        }
      };

      const result = await scheduler.scheduleMeeting(meetingRequest);

      expect(result.suggested_slots).toHaveLength.greaterThan(0);
      
      // Should provide formatted times in the requested timezone
      result.suggested_slots.forEach(slot => {
        expect(slot.formatted).toBeDefined();
        expect(slot.formatted.start).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        expect(slot.formatted.date).toBeDefined();
        expect(slot.formatted.time).toBeDefined();
      });
    });
  });

  describe('Analysis and Insights', () => {
    it('should provide meaningful analysis', async () => {
      const meetingRequest = {
        id: '',
        organizer_id: testUserId,
        title: 'Analysis Test Meeting',
        participants: ['analyst@example.com'],
        duration_minutes: 45,
        meeting_type: 'presentation' as const,
        priority: 'medium' as const,
        location_type: 'video_call' as const
      };

      const result = await scheduler.scheduleMeeting(meetingRequest);

      expect(result.analysis.total_slots_analyzed).toBeGreaterThan(0);
      expect(result.analysis.best_score).toBeGreaterThanOrEqual(0);
      expect(result.analysis.best_score).toBeLessThanOrEqual(100);
      expect(result.analysis.average_score).toBeGreaterThanOrEqual(0);
      expect(result.analysis.scheduling_difficulty).toMatch(/easy|moderate|difficult|very_difficult/);
      expect(Array.isArray(result.analysis.recommendations)).toBe(true);
    });

    it('should provide confidence scores for suggestions', async () => {
      const meetingRequest = {
        id: '',
        organizer_id: testUserId,
        title: 'Confidence Test',
        participants: ['confident@example.com'],
        duration_minutes: 30,
        meeting_type: 'one_on_one' as const,
        priority: 'medium' as const,
        location_type: 'video_call' as const
      };

      const result = await scheduler.scheduleMeeting(meetingRequest);

      result.suggested_slots.forEach(slot => {
        expect(slot.confidence_level).toBeGreaterThanOrEqual(0);
        expect(slot.confidence_level).toBeLessThanOrEqual(1);
        expect(slot.confidence).toBeGreaterThanOrEqual(0);
        expect(slot.confidence).toBeLessThanOrEqual(100);
        expect(slot.reasoning).toBeDefined();
        expect(typeof slot.reasoning).toBe('string');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid meeting requests gracefully', async () => {
      const invalidRequest = {
        id: '',
        organizer_id: 'invalid-user',
        title: '',
        participants: [],
        duration_minutes: 0,
        meeting_type: 'team' as const,
        priority: 'medium' as const,
        location_type: 'video_call' as const
      };

      await expect(scheduler.scheduleMeeting(invalidRequest)).rejects.toThrow();
    });

    it('should handle scheduling failures gracefully', async () => {
      // Mock a database error
      const originalQuery = env.DB.prepare;
      env.DB.prepare = () => {
        throw new Error('Database connection failed');
      };

      const meetingRequest = {
        id: '',
        organizer_id: testUserId,
        title: 'Error Test Meeting',
        participants: ['test@example.com'],
        duration_minutes: 30,
        meeting_type: 'team' as const,
        priority: 'medium' as const,
        location_type: 'video_call' as const
      };

      await expect(scheduler.scheduleMeeting(meetingRequest)).rejects.toThrow('Failed to schedule meeting');

      // Restore original function
      env.DB.prepare = originalQuery;
    });
  });
});