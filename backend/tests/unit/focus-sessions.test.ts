import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FocusSessionService } from '../../src/lib/focus-sessions';

// Mock dependencies
const mockDb = {
  query: vi.fn(),
  execute: vi.fn(),
  paginate: vi.fn(),
  transaction: vi.fn(),
  bulkInsert: vi.fn(),
  softDelete: vi.fn(),
  getUserData: vi.fn()
};

const mockNotificationService = {
  sendToUser: vi.fn(),
  scheduleNotification: vi.fn()
};

describe('Focus Sessions Service', () => {
  let focusService: FocusSessionService;

  beforeEach(() => {
    vi.clearAllMocks();
    focusService = new FocusSessionService(mockDb as any, mockNotificationService as any);
  });

  describe('Template Management', () => {
    it('should get focus templates', async () => {
      const mockTemplates = [
        {
          id: 'tpl_1',
          template_key: 'pomodoro_classic',
          name_en: 'Classic Pomodoro',
          name_de: 'Klassisches Pomodoro',
          session_type: 'pomodoro',
          default_duration: 25,
          break_duration: 5,
          long_break_duration: 15,
          cycles_before_long_break: 4,
          suggested_tasks: '["coding", "writing"]',
          productivity_tips_en: '["Focus on one task"]',
          productivity_tips_de: '["Auf eine Aufgabe fokussieren"]',
          environment_suggestions: '{"noise_level": "quiet"}',
          is_active: true,
          created_at: Date.now()
        }
      ];

      mockDb.query.mockResolvedValue({ results: mockTemplates });

      const result = await focusService.getTemplates('en');

      expect(result).toHaveLength(1);
      expect(result[0].template_key).toBe('pomodoro_classic');
      expect(result[0].suggested_tasks).toEqual(['coding', 'writing']);
      expect(result[0].productivity_tips_en).toEqual(['Focus on one task']);
    });

    it('should get specific template by key', async () => {
      const mockTemplate = {
        id: 'tpl_1',
        template_key: 'pomodoro_classic',
        name_en: 'Classic Pomodoro',
        session_type: 'pomodoro',
        default_duration: 25,
        suggested_tasks: '["coding"]',
        productivity_tips_en: '["Focus"]',
        productivity_tips_de: '["Fokus"]',
        environment_suggestions: '{}',
        is_active: true
      };

      mockDb.query.mockResolvedValue({ results: [mockTemplate] });

      const result = await focusService.getTemplate('pomodoro_classic');

      expect(result).toBeTruthy();
      expect(result?.template_key).toBe('pomodoro_classic');
      expect(result?.suggested_tasks).toEqual(['coding']);
    });

    it('should return null for non-existent template', async () => {
      mockDb.query.mockResolvedValue({ results: [] });

      const result = await focusService.getTemplate('non_existent');

      expect(result).toBeNull();
    });
  });

  describe('Session Management', () => {
    it('should start a focus session', async () => {
      const userId = 'user_123';
      const sessionData = {
        session_type: 'pomodoro' as const,
        session_name: 'Morning Focus',
        planned_duration: 25,
        task_id: 'task_456',
        planned_task_count: 2,
        mood_before: 7,
        energy_before: 8,
        session_tags: ['work', 'coding']
      };

      mockDb.execute.mockResolvedValue({ success: true });

      const result = await focusService.startSession(userId, sessionData);

      expect(result.user_id).toBe(userId);
      expect(result.session_type).toBe('pomodoro');
      expect(result.session_name).toBe('Morning Focus');
      expect(result.planned_duration).toBe(25);
      expect(result.planned_task_count).toBe(2);
      expect(result.mood_before).toBe(7);
      expect(result.energy_before).toBe(8);
      expect(result.session_tags).toEqual(['work', 'coding']);
      expect(result.is_successful).toBe(true);
      expect(result.started_at).toBeDefined();
      expect(result.created_at).toBeDefined();
    });

    it('should complete a focus session', async () => {
      const userId = 'user_123';
      const sessionId = 'session_456';
      const completionData = {
        actual_duration: 25,
        completed_task_count: 2,
        break_duration: 5,
        mood_after: 8,
        energy_after: 7,
        focus_quality: 9,
        productivity_rating: 4,
        notes: 'Great session!',
        is_successful: true
      };

      const mockSession = {
        id: sessionId,
        user_id: userId,
        session_type: 'pomodoro',
        planned_duration: 25,
        actual_duration: 25,
        completed_task_count: 2,
        mood_after: 8,
        productivity_rating: 4,
        is_successful: true,
        environment_data: '{}',
        session_tags: '["work"]',
        distraction_details: '{}'
      };

      mockDb.execute.mockResolvedValue({ success: true });
      mockDb.query.mockResolvedValue({ results: [mockSession] });

      const result = await focusService.completeSession(userId, sessionId, completionData);

      expect(result.id).toBe(sessionId);
      expect(result.actual_duration).toBe(25);
      expect(result.completed_task_count).toBe(2);
      expect(result.mood_after).toBe(8);
      expect(result.productivity_rating).toBe(4);
      expect(result.is_successful).toBe(true);
    });

    it('should cancel a focus session', async () => {
      const userId = 'user_123';
      const sessionId = 'session_456';
      const reason = 'Unexpected interruption';

      mockDb.execute.mockResolvedValue({ success: true });

      await expect(focusService.cancelSession(userId, sessionId, reason)).resolves.not.toThrow();

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE focus_sessions SET'),
        [reason, expect.any(Number), expect.any(Number), sessionId, userId]
      );
    });

    it('should get user sessions with filters', async () => {
      const userId = 'user_123';
      const mockSessions = [
        {
          id: 'session_1',
          user_id: userId,
          session_type: 'pomodoro',
          planned_duration: 25,
          actual_duration: 25,
          is_successful: true,
          environment_data: '{}',
          session_tags: '["work"]',
          distraction_details: '{}'
        }
      ];

      const mockCount = { count: 1 };

      mockDb.query
        .mockResolvedValueOnce({ results: mockSessions })
        .mockResolvedValueOnce({ results: [mockCount] });

      const result = await focusService.getUserSessions(userId, {
        limit: 10,
        offset: 0,
        session_type: 'pomodoro'
      });

      expect(result.sessions).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.sessions[0].session_type).toBe('pomodoro');
      expect(result.sessions[0].is_successful).toBe(true);
    });
  });

  describe('Distraction Tracking', () => {
    it('should record a distraction', async () => {
      const userId = 'user_123';
      const sessionId = 'session_456';
      const distractionData = {
        distraction_type: 'notification' as const,
        distraction_source: 'Slack',
        duration_seconds: 30,
        impact_level: 3,
        user_response: 'ignored' as const,
        notes: 'Work notification'
      };

      mockDb.execute.mockResolvedValue({ success: true });

      const result = await focusService.recordDistraction(userId, sessionId, distractionData);

      expect(result.session_id).toBe(sessionId);
      expect(result.user_id).toBe(userId);
      expect(result.distraction_type).toBe('notification');
      expect(result.distraction_source).toBe('Slack');
      expect(result.duration_seconds).toBe(30);
      expect(result.impact_level).toBe(3);
      expect(result.user_response).toBe('ignored');
      expect(result.notes).toBe('Work notification');
      expect(result.occurred_at).toBeDefined();
    });
  });

  describe('Break Reminders', () => {
    it('should get user break reminders', async () => {
      const userId = 'user_123';
      const mockReminders = [
        {
          id: 'reminder_1',
          user_id: userId,
          reminder_type: 'pomodoro_break',
          trigger_condition: '{"trigger": "session_end"}',
          reminder_text_en: 'Time for a break!',
          reminder_text_de: 'Zeit für eine Pause!',
          is_enabled: 1,
          frequency_minutes: null,
          trigger_count: 5,
          user_response_rate: 0.8
        }
      ];

      mockDb.query.mockResolvedValue({ results: mockReminders });

      const result = await focusService.getUserBreakReminders(userId);

      expect(result).toHaveLength(1);
      expect(result[0].reminder_type).toBe('pomodoro_break');
      expect(result[0].is_enabled).toBe(true);
      expect(result[0].trigger_condition).toEqual({ trigger: 'session_end' });
    });

    it('should update break reminder settings', async () => {
      const userId = 'user_123';
      const reminderId = 'reminder_1';
      const updates = {
        is_enabled: false,
        frequency_minutes: 30,
        reminder_text_en: 'Updated reminder text'
      };

      mockDb.execute.mockResolvedValue({ success: true });

      await expect(focusService.updateBreakReminder(userId, reminderId, updates)).resolves.not.toThrow();

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE break_reminders SET'),
        [0, 30, 'Updated reminder text', undefined, expect.any(Number), reminderId, userId]
      );
    });
  });

  describe('Analytics and Dashboard', () => {
    it('should get focus dashboard data', async () => {
      const userId = 'user_123';
      const mockDashboard = {
        user_id: userId,
        total_sessions: 15,
        successful_sessions: 12,
        total_focus_minutes: 375,
        avg_productivity_rating: 4.2,
        avg_session_duration: 25,
        total_interruptions: 8,
        avg_interruptions_per_session: 0.5,
        last_session_at: Date.now() - 3600000,
        today_sessions: 3,
        today_minutes: 75
      };

      const mockStreaks = [
        {
          id: 'streak_1',
          user_id: userId,
          streak_type: 'daily_sessions',
          current_streak: 7,
          longest_streak: 12,
          streak_data: '{"best_day": "Monday"}',
          is_active: 1
        }
      ];

      const mockTrends = [
        {
          date: '2025-01-15',
          metric_type: 'productivity_score',
          avg_value: 85.5
        }
      ];

      mockDb.query
        .mockResolvedValueOnce({ results: [mockDashboard] })
        .mockResolvedValueOnce({ results: mockStreaks })
        .mockResolvedValueOnce({ results: mockTrends });

      const result = await focusService.getFocusDashboard(userId);

      expect(result.total_sessions).toBe(15);
      expect(result.successful_sessions).toBe(12);
      expect(result.total_focus_minutes).toBe(375);
      expect(result.avg_productivity_rating).toBe(4.2);
      expect(result.today_sessions).toBe(3);
      expect(result.current_streaks).toHaveLength(1);
      expect(result.current_streaks[0].current_streak).toBe(7);
      expect(result.current_streaks[0].is_active).toBe(true);
      expect(result.productivity_trends).toHaveLength(1);
    });

    it('should get productivity patterns', async () => {
      const userId = 'user_123';
      const mockPatterns = [
        {
          id: 'pattern_1',
          user_id: userId,
          pattern_type: 'optimal_duration',
          pattern_data: '{"optimal_minutes": 25, "confidence": 0.85}',
          confidence_score: 0.85,
          sample_size: 20,
          effectiveness_score: 92.5,
          is_active: 1
        }
      ];

      mockDb.query.mockResolvedValue({ results: mockPatterns });

      const result = await focusService.getProductivityPatterns(userId);

      expect(result).toHaveLength(1);
      expect(result[0].pattern_type).toBe('optimal_duration');
      expect(result[0].confidence_score).toBe(0.85);
      expect(result[0].pattern_data).toEqual({ optimal_minutes: 25, confidence: 0.85 });
      expect(result[0].is_active).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockDb.query.mockRejectedValue(new Error('Database connection failed'));

      await expect(focusService.getTemplates()).rejects.toThrow('Failed to retrieve focus templates');
    });

    it('should handle missing session gracefully', async () => {
      mockDb.query.mockResolvedValue({ results: [] });

      const result = await focusService.getSession('user_123', 'non_existent_session');

      expect(result).toBeNull();
    });
  });
});