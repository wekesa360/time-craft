#!/usr/bin/env tsx

import { DatabaseService } from '../src/lib/db';
import type { Env } from '../src/lib/env';

interface SeederOptions {
  clearExisting?: boolean;
  verbose?: boolean;
}

class DatabaseSeeder {
  constructor(private env: Env) {}

  private get db() {
    return new DatabaseService(this.env);
  }

  async seedDevelopmentData(options: SeederOptions = {}) {
    const { clearExisting = true, verbose = false } = options;
    
    if (verbose) console.log('🌱 Starting database seeding...');

    try {
      // Clear existing data if requested
      if (clearExisting) {
        await this.clearExistingData();
        if (verbose) console.log('🧹 Cleared existing data');
      }

      // Seed users first (required for foreign keys)
      await this.seedUsers();
      if (verbose) console.log('👥 Seeded users');

      // Seed achievement definitions
      await this.seedAchievementDefinitions();
      if (verbose) console.log('🏆 Seeded achievement definitions');

      // Seed user achievements
      await this.seedUserAchievements();
      if (verbose) console.log('🎖️ Seeded user achievements');

      // Seed tasks
      await this.seedTasks();
      if (verbose) console.log('📋 Seeded tasks');

      // Seed health data
      await this.seedHealthData();
      if (verbose) console.log('💪 Seeded health data');

      // Seed calendar events
      await this.seedCalendarEvents();
      if (verbose) console.log('📅 Seeded calendar events');

      // Seed habits
      await this.seedHabits();
      if (verbose) console.log('🔄 Seeded habits');

      // Seed goals
      await this.seedGoals();
      if (verbose) console.log('🎯 Seeded goals');

      // Seed gratitude entries
      await this.seedGratitudeEntries();
      if (verbose) console.log('🙏 Seeded gratitude entries');

      // Seed focus sessions
      await this.seedFocusSessions();
      if (verbose) console.log('🎯 Seeded focus sessions');

      // Seed focus templates
      await this.seedFocusTemplates();
      if (verbose) console.log('📋 Seeded focus templates');

      // Seed reflection entries
      await this.seedReflectionEntries();
      if (verbose) console.log('📝 Seeded reflection entries');

      // Seed social connections
      await this.seedSocialConnections();
      if (verbose) console.log('👥 Seeded social connections');

      // Seed user badges
      await this.seedUserBadges();
      if (verbose) console.log('🏅 Seeded user badges');

      // Seed challenges and participants
      await this.seedChallenges();
      if (verbose) console.log('🏆 Seeded challenges');

      // Seed notification preferences
      await this.seedNotificationPreferences();
      if (verbose) console.log('🔔 Seeded notification preferences');

      // Seed external tokens
      await this.seedExternalTokens();
      if (verbose) console.log('🔗 Seeded external tokens');

      // Seed file assets
      await this.seedFileAssets();
      if (verbose) console.log('📁 Seeded file assets');

      // Seed calendar connections
      await this.seedCalendarConnections();
      if (verbose) console.log('📅 Seeded calendar connections');

      if (verbose) console.log('✅ Database seeding completed successfully!');
      
      return {
        success: true,
        message: 'Development database seeded successfully!'
      };
    } catch (error) {
      console.error('❌ Seeding failed:', error);
      throw error;
    }
  }

  private async clearExistingData() {
    // Clear tables in order to respect foreign key constraints
    const tables = [
      'calendar_connections',
      'file_assets',
      'external_tokens',
      'notification_preferences',
      'challenge_participants',
      'challenges',
      'user_badges',
      'social_connections',
      'reflection_entries',
      'focus_templates',
      'focus_sessions',
      'gratitude_entries',
      'goals',
      'habits',
      'user_achievements',
      'achievement_definitions',
      'health_logs',
      'calendar_events', 
      'tasks',
      'users'
    ];

    for (const table of tables) {
      try {
        await this.db.execute(`DELETE FROM ${table}`);
      } catch (error) {
        console.warn(`Warning: Could not clear table ${table}:`, error);
      }
    }
  }

  private async seedUsers() {
    const users = [
      {
        id: 'user_1',
        email: 'john.doe@example.com',
        password_hash: '$2b$10$example_hash_1',
        first_name: 'John',
        last_name: 'Doe',
        timezone: 'America/New_York',
        preferred_language: 'en',
        subscription_type: 'premium',
        is_student: 0,
        student_verification_status: 'none'
      },
      {
        id: 'user_2',
        email: 'jane.student@university.edu',
        password_hash: '$2b$10$example_hash_2',
        first_name: 'Jane',
        last_name: 'Smith',
        timezone: 'Europe/London',
        preferred_language: 'en',
        subscription_type: 'free',
        is_student: 1,
        student_verification_status: 'verified'
      },
      {
        id: 'user_3',
        email: 'mike.wilson@example.com',
        password_hash: '$2b$10$example_hash_3',
        first_name: 'Mike',
        last_name: 'Wilson',
        timezone: 'America/Los_Angeles',
        preferred_language: 'en',
        subscription_type: 'free',
        is_student: 0,
        student_verification_status: 'none'
      }
    ];

    const now = Date.now();
    for (const user of users) {
      await this.db.execute(
        `INSERT INTO users (
          id, email, password_hash, first_name, last_name, timezone, 
          preferred_language, subscription_type, is_student, 
          student_verification_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id, user.email, user.password_hash, user.first_name,
          user.last_name, user.timezone, user.preferred_language,
          user.subscription_type, user.is_student, user.student_verification_status,
          now, now
        ]
      );
    }
  }

  private async seedTasks() {
    const tasks = [
      // User 1 tasks
      {
        id: 'task_1', 
        user_id: 'user_1', 
        title: 'Complete project proposal',
        description: 'Write and submit the Q4 project proposal', 
        priority: 4,
        status: 'pending', 
        due_days: 3, 
        estimated_duration: 120, 
        ai_priority_score: 0.95
      },
      {
        id: 'task_2', 
        user_id: 'user_1', 
        title: 'Review team performance',
        description: 'Quarterly performance reviews for team members', 
        priority: 3,
        status: 'pending', 
        due_days: 7, 
        estimated_duration: 180, 
        ai_priority_score: 0.85
      },
      {
        id: 'task_3', 
        user_id: 'user_1', 
        title: 'Update LinkedIn profile',
        description: 'Add recent achievements and skills', 
        priority: 1,
        status: 'done', 
        due_days: -5, 
        estimated_duration: 30, 
        ai_priority_score: 0.25
      },
      
      // User 2 tasks
      {
        id: 'task_4', 
        user_id: 'user_2', 
        title: 'Study for midterm exam',
        description: 'Prepare for Computer Science midterm', 
        priority: 4,
        status: 'pending', 
        due_days: 2, 
        estimated_duration: 240, 
        ai_priority_score: 0.98
      },
      {
        id: 'task_5', 
        user_id: 'user_2', 
        title: 'Submit assignment',
        description: 'Database design assignment due', 
        priority: 4,
        status: 'done', 
        due_days: -1, 
        estimated_duration: 180, 
        ai_priority_score: 0.90
      },
      
      // User 3 tasks
      {
        id: 'task_6', 
        user_id: 'user_3', 
        title: 'Grocery shopping',
        description: 'Weekly grocery run', 
        priority: 2,
        status: 'pending', 
        due_days: 1, 
        estimated_duration: 45, 
        ai_priority_score: 0.60
      }
    ];

    const now = Date.now();
    for (const task of tasks) {
      const dueDate = task.due_days > 0 ? 
        now + (task.due_days * 24 * 60 * 60 * 1000) : 
        now + (task.due_days * 24 * 60 * 60 * 1000);
      
      const createdAt = task.due_days > 0 ? 
        now - (2 * 24 * 60 * 60 * 1000) : 
        now + (task.due_days * 24 * 60 * 60 * 1000) - (5 * 24 * 60 * 60 * 1000);

      await this.db.execute(
        `INSERT INTO tasks (
          id, user_id, title, description, priority, status, 
          due_date, estimated_duration, ai_priority_score, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          task.id, task.user_id, task.title, task.description, task.priority,
          task.status, dueDate, task.estimated_duration, task.ai_priority_score, createdAt
        ]
      );
    }
  }

  private async seedHealthData() {
    const healthLogs = [
      { 
        id: 'health_1', 
        user_id: 'user_1', 
        type: 'exercise', 
        payload: { 
          type: 'cardio', 
          duration: 45, 
          intensity: 'moderate', 
          activity: 'running' 
        }, 
        days_ago: 1 
      },
      { 
        id: 'health_2', 
        user_id: 'user_1', 
        type: 'nutrition', 
        payload: { 
          meal: 'breakfast', 
          calories: 350, 
          protein: 15, 
          carbs: 45, 
          fat: 12 
        }, 
        days_ago: 1 
      },
      { 
        id: 'health_3', 
        user_id: 'user_1', 
        type: 'mood', 
        payload: { 
          score: 8, 
          energy: 7, 
          stress: 3, 
          notes: 'Feeling productive today' 
        }, 
        days_ago: 1 
      },
      { 
        id: 'health_4', 
        user_id: 'user_2', 
        type: 'exercise', 
        payload: { 
          type: 'cardio', 
          duration: 30, 
          intensity: 'high', 
          activity: 'running' 
        }, 
        days_ago: 1 
      },
      { 
        id: 'health_5', 
        user_id: 'user_3', 
        type: 'hydration', 
        payload: { 
          glasses: 8, 
          total_ml: 2000 
        }, 
        days_ago: 2 
      }
    ];

    const now = Date.now();
    for (const log of healthLogs) {
      const recordedAt = now - (log.days_ago * 24 * 60 * 60 * 1000);
      await this.db.execute(
        `INSERT INTO health_logs (id, user_id, type, payload, recorded_at) VALUES (?, ?, ?, ?, ?)`,
        [log.id, log.user_id, log.type, JSON.stringify(log.payload), recordedAt]
      );
    }
  }

  private async seedCalendarEvents() {
    const events = [
      {
        id: 'event_1', 
        user_id: 'user_1', 
        title: 'Project Meeting',
        start_hours: 33, 
        duration_hours: 1, 
        source: 'manual', 
        ai_generated: 0
      },
      {
        id: 'event_2', 
        user_id: 'user_1', 
        title: 'Lunch with Client',
        start_hours: 60, 
        duration_hours: 1, 
        source: 'manual', 
        ai_generated: 0
      },
      {
        id: 'event_3', 
        user_id: 'user_2', 
        title: 'CS Lecture',
        start_hours: 34, 
        duration_hours: 1, 
        source: 'manual', 
        ai_generated: 0
      },
      {
        id: 'event_4', 
        user_id: 'user_2', 
        title: 'Study Group',
        start_hours: 43, 
        duration_hours: 2, 
        source: 'manual', 
        ai_generated: 0
      }
    ];

    const now = Date.now();
    for (const event of events) {
      const startTime = now + (event.start_hours * 60 * 60 * 1000);
      const endTime = startTime + (event.duration_hours * 60 * 60 * 1000);

      await this.db.execute(
        `INSERT INTO calendar_events (
          id, user_id, title, start, "end", source, ai_generated, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [event.id, event.user_id, event.title, startTime, endTime, event.source, event.ai_generated, now]
      );
    }
  }

  private async seedAchievementDefinitions() {
    const achievements = [
      {
        achievement_key: 'first_task',
        category: 'productivity',
        title_en: 'Task Master',
        title_de: 'Aufgaben-Meister',
        description_en: 'Complete your first task',
        description_de: 'Schließe deine erste Aufgabe ab',
        criteria: JSON.stringify({ type: 'task_completion', count: 1 }),
        points_awarded: 50
      },
      {
        achievement_key: 'task_streak_7',
        category: 'productivity',
        title_en: 'Week Warrior',
        title_de: 'Wochen-Krieger',
        description_en: 'Complete tasks for 7 consecutive days',
        description_de: 'Schließe 7 Tage in Folge Aufgaben ab',
        criteria: JSON.stringify({ type: 'task_streak', days: 7 }),
        points_awarded: 200
      },
      {
        achievement_key: 'health_tracker',
        category: 'health',
        title_en: 'Health Tracker',
        title_de: 'Gesundheits-Tracker',
        description_en: 'Log health data for 5 consecutive days',
        description_de: 'Protokolliere 5 Tage in Folge Gesundheitsdaten',
        criteria: JSON.stringify({ type: 'health_streak', days: 5 }),
        points_awarded: 100
      },
      {
        achievement_key: 'focus_master',
        category: 'productivity',
        title_en: 'Focus Master',
        title_de: 'Fokus-Meister',
        description_en: 'Complete 10 focus sessions',
        description_de: 'Schließe 10 Fokus-Sitzungen ab',
        criteria: JSON.stringify({ type: 'focus_sessions', count: 10 }),
        points_awarded: 150
      }
    ];

    for (const achievement of achievements) {
      await this.db.execute(
        `INSERT INTO achievement_definitions (
          achievement_key, category, title_en, title_de, description_en, 
          description_de, criteria, points_awarded, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          achievement.achievement_key, achievement.category, achievement.title_en,
          achievement.title_de, achievement.description_en, achievement.description_de,
          achievement.criteria, achievement.points_awarded
        ]
      );
    }
  }

  private async seedUserAchievements() {
    const userAchievements = [
      { id: 'ach_1', user_id: 'user_1', achievement_key: 'first_task', days_ago: 10 },
      { id: 'ach_2', user_id: 'user_1', achievement_key: 'health_tracker', days_ago: 5 },
      { id: 'ach_3', user_id: 'user_2', achievement_key: 'first_task', days_ago: 8 },
      { id: 'ach_4', user_id: 'user_3', achievement_key: 'first_task', days_ago: 3 }
    ];

    const now = Date.now();
    for (const achievement of userAchievements) {
      const unlockedAt = now - (achievement.days_ago * 24 * 60 * 60 * 1000);
      await this.db.execute(
        `INSERT INTO user_achievements (
          id, user_id, achievement_key, unlocked_at, created_at
        ) VALUES (?, ?, ?, ?, ?)`,
        [achievement.id, achievement.user_id, achievement.achievement_key, unlockedAt, now]
      );
    }
  }

  private async seedHabits() {
    const habits = [
      { id: 'habit_1', user_id: 'user_1', name: 'Morning Meditation', frequency: 'daily', target_duration: 15 },
      { id: 'habit_2', user_id: 'user_1', name: 'Exercise', frequency: 'daily', target_duration: 30 },
      { id: 'habit_3', user_id: 'user_2', name: 'Study Session', frequency: 'daily', target_duration: 120 },
      { id: 'habit_4', user_id: 'user_3', name: 'Reading', frequency: 'daily', target_duration: 20 }
    ];

    const now = Date.now();
    for (const habit of habits) {
      await this.db.execute(
        `INSERT INTO habits (
          id, user_id, name, frequency, target_duration, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, 1, ?)`,
        [habit.id, habit.user_id, habit.name, habit.frequency, habit.target_duration, now]
      );
    }
  }

  private async seedGoals() {
    const goals = [
      {
        id: 'goal_1', 
        user_id: 'user_1', 
        title: 'Get Promoted',
        description: 'Achieve promotion by demonstrating leadership skills',
        target_months: 6, 
        progress_percent: 65.0,
        milestones: [
          { title: 'Complete leadership training', completed: true },
          { title: 'Lead 2 major projects', completed: false }
        ]
      },
      {
        id: 'goal_2', 
        user_id: 'user_2', 
        title: 'Graduate with Honors',
        description: 'Maintain GPA above 3.8',
        target_months: 18, 
        progress_percent: 33.0,
        milestones: [
          { title: 'Maintain 3.8+ GPA', completed: false },
          { title: 'Complete thesis research', completed: false }
        ]
      }
    ];

    const now = Date.now();
    for (const goal of goals) {
      const targetDate = now + (goal.target_months * 30 * 24 * 60 * 60 * 1000);

      await this.db.execute(
        `INSERT INTO goals (
          id, user_id, title, description, target_date, milestones, progress_percent, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [goal.id, goal.user_id, goal.title, goal.description, targetDate, JSON.stringify(goal.milestones), goal.progress_percent, now]
      );
    }
  }

  private async seedGratitudeEntries() {
    const gratitudeEntries = [
      { id: 'grat_1', user_id: 'user_1', text: 'Grateful for my supportive team at work', category: 'work', days_ago: 1 },
      { id: 'grat_2', user_id: 'user_1', text: 'Thankful for a healthy family', category: 'family', days_ago: 2 },
      { id: 'grat_3', user_id: 'user_2', text: 'Grateful for my professors who inspire me', category: 'education', days_ago: 1 },
      { id: 'grat_4', user_id: 'user_3', text: 'Grateful for my morning coffee ritual', category: 'personal', days_ago: 1 }
    ];

    const now = Date.now();
    for (const entry of gratitudeEntries) {
      const loggedAt = now - (entry.days_ago * 24 * 60 * 60 * 1000);
      await this.db.execute(
        `INSERT INTO gratitude_entries (id, user_id, entry_text, category, logged_at) VALUES (?, ?, ?, ?, ?)`,
        [entry.id, entry.user_id, entry.text, entry.category, loggedAt]
      );
    }
  }

  private async seedFocusSessions() {
    const focusSessions = [
      {
        id: 'focus_1', 
        user_id: 'user_1', 
        session_type: 'pomodoro', 
        planned_duration: 25,
        actual_duration: 25, 
        productivity_rating: 5,
        notes: 'Great focus session, completed proposal outline', 
        hours_ago: 25
      },
      {
        id: 'focus_2', 
        user_id: 'user_1', 
        session_type: 'deep_work', 
        planned_duration: 90,
        actual_duration: 85, 
        productivity_rating: 4,
        notes: 'Good session but had some interruptions', 
        hours_ago: 49
      },
      {
        id: 'focus_3', 
        user_id: 'user_2', 
        session_type: 'pomodoro', 
        planned_duration: 25,
        actual_duration: 30, 
        productivity_rating: 4,
        notes: 'Extended session for complex topic', 
        hours_ago: 8
      }
    ];

    const now = Date.now();
    for (const session of focusSessions) {
      const startedAt = now - (session.hours_ago * 60 * 60 * 1000);
      const completedAt = startedAt + (session.actual_duration * 60 * 1000);

      await this.db.execute(
        `INSERT INTO focus_sessions (
          id, user_id, session_type, planned_duration, actual_duration,
          started_at, completed_at, is_successful, productivity_rating, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`,
        [
          session.id, session.user_id, session.session_type, session.planned_duration,
          session.actual_duration, startedAt, completedAt, session.productivity_rating, 
          session.notes, startedAt, startedAt
        ]
      );
    }
  }

  private async seedFocusTemplates() {
    const templates = [
      {
        id: 'template_1',
        template_key: 'pomodoro_25',
        name: 'Pomodoro 25min',
        description: 'Classic Pomodoro technique with 25-minute focus sessions',
        session_type: 'pomodoro',
        duration_minutes: 25,
        break_duration_minutes: 5,
        is_default: 1,
        is_active: 1,
        language: 'en'
      },
      {
        id: 'template_2',
        template_key: 'deep_work_90',
        name: 'Deep Work 90min',
        description: 'Extended deep work session for complex tasks',
        session_type: 'deep_work',
        duration_minutes: 90,
        break_duration_minutes: 15,
        is_default: 0,
        is_active: 1,
        language: 'en'
      },
      {
        id: 'template_3',
        template_key: 'meditation_10',
        name: 'Meditation 10min',
        description: 'Short meditation session for mindfulness',
        session_type: 'meditation',
        duration_minutes: 10,
        break_duration_minutes: 0,
        is_default: 0,
        is_active: 1,
        language: 'en'
      }
    ];

    const now = Date.now();
    for (const template of templates) {
      await this.db.execute(
        `INSERT INTO focus_templates (
          id, template_key, name, description, session_type, duration_minutes,
          break_duration_minutes, is_default, is_active, language, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          template.id, template.template_key, template.name, template.description,
          template.session_type, template.duration_minutes, template.break_duration_minutes,
          template.is_default, template.is_active, template.language, now, now
        ]
      );
    }
  }

  private async seedReflectionEntries() {
    const reflections = [
      {
        id: 'refl_1',
        user_id: 'user_1',
        content: 'Today was productive. Completed the project proposal and had a great team meeting. Feeling confident about the upcoming presentation.',
        transcription: null,
        ai_analysis: JSON.stringify({
          sentiment: 'positive',
          themes: ['productivity', 'confidence', 'teamwork'],
          insights: ['Strong work performance', 'Good team collaboration']
        }),
        days_ago: 1
      },
      {
        id: 'refl_2',
        user_id: 'user_2',
        content: 'Studying for midterms is stressful but I feel prepared. The study group really helped clarify some concepts.',
        transcription: null,
        ai_analysis: JSON.stringify({
          sentiment: 'mixed',
          themes: ['stress', 'preparation', 'collaboration'],
          insights: ['Academic pressure present', 'Effective study strategies']
        }),
        days_ago: 2
      },
      {
        id: 'refl_3',
        user_id: 'user_3',
        content: 'Had a quiet day at home. Managed to get some reading done and went for a nice walk.',
        transcription: null,
        ai_analysis: JSON.stringify({
          sentiment: 'neutral',
          themes: ['relaxation', 'self-care', 'reading'],
          insights: ['Good work-life balance', 'Self-care activities']
        }),
        days_ago: 1
      }
    ];

    const now = Date.now();
    for (const reflection of reflections) {
      const loggedAt = now - (reflection.days_ago * 24 * 60 * 60 * 1000);
      await this.db.execute(
        `INSERT INTO reflection_entries (
          id, user_id, content, voice_file_key, transcription, ai_analysis, logged_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          reflection.id, reflection.user_id, reflection.content, null,
          reflection.transcription, reflection.ai_analysis, loggedAt
        ]
      );
    }
  }

  private async seedSocialConnections() {
    const connections = [
      {
        id: 'conn_1',
        requester_id: 'user_1',
        addressee_id: 'user_2',
        status: 'accepted',
        connection_type: 'colleague',
        days_ago: 10
      },
      {
        id: 'conn_2',
        requester_id: 'user_1',
        addressee_id: 'user_3',
        status: 'accepted',
        connection_type: 'friend',
        days_ago: 15
      },
      {
        id: 'conn_3',
        requester_id: 'user_2',
        addressee_id: 'user_3',
        status: 'pending',
        connection_type: 'friend',
        days_ago: 3
      }
    ];

    const now = Date.now();
    for (const connection of connections) {
      const createdAt = now - (connection.days_ago * 24 * 60 * 60 * 1000);
      await this.db.execute(
        `INSERT INTO social_connections (
          id, requester_id, addressee_id, status, connection_type, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          connection.id, connection.requester_id, connection.addressee_id,
          connection.status, connection.connection_type, createdAt, createdAt
        ]
      );
    }
  }

  private async seedUserBadges() {
    const badges = [
      {
        id: 'badge_1',
        user_id: 'user_1',
        badge_id: 'first_task_badge',
        badge_key: 'first_task',
        tier: 'gold',
        metadata: JSON.stringify({ earned_date: '2024-10-15', category: 'productivity' }),
        days_ago: 10
      },
      {
        id: 'badge_2',
        user_id: 'user_1',
        badge_id: 'health_tracker_badge',
        badge_key: 'health_tracker',
        tier: 'silver',
        metadata: JSON.stringify({ earned_date: '2024-10-20', category: 'health' }),
        days_ago: 5
      },
      {
        id: 'badge_3',
        user_id: 'user_2',
        badge_id: 'first_task_badge',
        badge_key: 'first_task',
        tier: 'bronze',
        metadata: JSON.stringify({ earned_date: '2024-10-18', category: 'productivity' }),
        days_ago: 8
      }
    ];

    const now = Date.now();
    for (const badge of badges) {
      const unlockedAt = now - (badge.days_ago * 24 * 60 * 60 * 1000);
      await this.db.execute(
        `INSERT INTO user_badges (
          id, user_id, badge_id, badge_key, unlocked_at, tier, metadata, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          badge.id, badge.user_id, badge.badge_id, badge.badge_key,
          unlockedAt, badge.tier, badge.metadata, unlockedAt
        ]
      );
    }
  }

  private async seedChallenges() {
    const challenges = [
      {
        id: 'challenge_1',
        created_by: 'user_1',
        title: '30-Day Meditation Challenge',
        description: 'Meditate for at least 10 minutes every day for 30 days',
        challenge_type: 'mindfulness',
        start_days_ago: 15,
        duration_days: 30,
        max_participants: 10,
        is_public: 1,
        reward_type: 'badge',
        reward_description: 'Mindfulness Master Badge'
      },
      {
        id: 'challenge_2',
        created_by: 'user_2',
        title: '7-Day Study Sprint',
        description: 'Study for at least 2 hours every day for a week',
        challenge_type: 'habit',
        start_days_ago: 5,
        duration_days: 7,
        max_participants: 5,
        is_public: 0,
        reward_type: 'points',
        reward_description: '500 Achievement Points'
      }
    ];

    const now = Date.now();
    for (const challenge of challenges) {
      const startDate = now - (challenge.start_days_ago * 24 * 60 * 60 * 1000);
      const endDate = startDate + (challenge.duration_days * 24 * 60 * 60 * 1000);
      const createdAt = startDate - (24 * 60 * 60 * 1000); // Created 1 day before start

      await this.db.execute(
        `INSERT INTO challenges (
          id, created_by, title, description, challenge_type, start_date, end_date,
          max_participants, is_public, reward_type, reward_description, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          challenge.id, challenge.created_by, challenge.title, challenge.description,
          challenge.challenge_type, startDate, endDate, challenge.max_participants,
          challenge.is_public, challenge.reward_type, challenge.reward_description,
          createdAt, createdAt
        ]
      );
    }

    // Seed challenge participants
    const participants = [
      {
        id: 'part_1',
        challenge_id: 'challenge_1',
        user_id: 'user_1',
        progress_data: JSON.stringify({ days_completed: 12, streak: 5 }),
        days_ago: 14
      },
      {
        id: 'part_2',
        challenge_id: 'challenge_1',
        user_id: 'user_2',
        progress_data: JSON.stringify({ days_completed: 8, streak: 3 }),
        days_ago: 12
      },
      {
        id: 'part_3',
        challenge_id: 'challenge_2',
        user_id: 'user_2',
        progress_data: JSON.stringify({ days_completed: 5, total_hours: 12 }),
        days_ago: 4
      },
      {
        id: 'part_4',
        challenge_id: 'challenge_2',
        user_id: 'user_3',
        progress_data: JSON.stringify({ days_completed: 3, total_hours: 7 }),
        days_ago: 4
      }
    ];

    for (const participant of participants) {
      const joinedAt = now - (participant.days_ago * 24 * 60 * 60 * 1000);
      await this.db.execute(
        `INSERT INTO challenge_participants (
          id, challenge_id, user_id, joined_at, progress_data, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
        [
          participant.id, participant.challenge_id, participant.user_id,
          joinedAt, participant.progress_data, joinedAt, joinedAt
        ]
      );
    }
  }

  private async seedNotificationPreferences() {
    const preferences = [
      {
        user_id: 'user_1',
        preferences: JSON.stringify({
          email_notifications: true,
          push_notifications: true,
          task_reminders: true,
          habit_reminders: true,
          achievement_notifications: true,
          social_notifications: true,
          marketing_emails: false
        })
      },
      {
        user_id: 'user_2',
        preferences: JSON.stringify({
          email_notifications: true,
          push_notifications: false,
          task_reminders: true,
          habit_reminders: true,
          achievement_notifications: true,
          social_notifications: false,
          marketing_emails: false
        })
      },
      {
        user_id: 'user_3',
        preferences: JSON.stringify({
          email_notifications: false,
          push_notifications: true,
          task_reminders: false,
          habit_reminders: true,
          achievement_notifications: true,
          social_notifications: true,
          marketing_emails: true
        })
      }
    ];

    const now = Date.now();
    for (const pref of preferences) {
      await this.db.execute(
        `INSERT INTO notification_preferences (user_id, preferences, created_at) VALUES (?, ?, ?)`,
        [pref.user_id, pref.preferences, now]
      );
    }
  }

  private async seedExternalTokens() {
    const tokens = [
      {
        user_id: 'user_1',
        provider: 'google',
        access_token_enc: 'encrypted_google_token_user1',
        refresh_token_enc: 'encrypted_google_refresh_user1',
        expires_at: Date.now() + (3600 * 1000) // 1 hour from now
      },
      {
        user_id: 'user_2',
        provider: 'outlook',
        access_token_enc: 'encrypted_outlook_token_user2',
        refresh_token_enc: 'encrypted_outlook_refresh_user2',
        expires_at: Date.now() + (7200 * 1000) // 2 hours from now
      }
    ];

    for (const token of tokens) {
      await this.db.execute(
        `INSERT INTO external_tokens (
          user_id, provider, access_token_enc, refresh_token_enc, expires_at
        ) VALUES (?, ?, ?, ?, ?)`,
        [
          token.user_id, token.provider, token.access_token_enc,
          token.refresh_token_enc, token.expires_at
        ]
      );
    }
  }

  private async seedFileAssets() {
    const assets = [
      {
        id: 'asset_1',
        user_id: 'user_1',
        file_type: 'profile_image',
        r2_key: 'profiles/user_1/avatar.jpg',
        r2_url: 'https://assets.example.com/profiles/user_1/avatar.jpg',
        related_entity_id: 'user_1'
      },
      {
        id: 'asset_2',
        user_id: 'user_2',
        file_type: 'voice_note',
        r2_key: 'reflections/user_2/reflection_001.mp3',
        r2_url: 'https://assets.example.com/reflections/user_2/reflection_001.mp3',
        related_entity_id: 'refl_2'
      },
      {
        id: 'asset_3',
        user_id: 'user_3',
        file_type: 'document',
        r2_key: 'documents/user_3/goal_plan.pdf',
        r2_url: 'https://assets.example.com/documents/user_3/goal_plan.pdf',
        related_entity_id: null
      }
    ];

    const now = Date.now();
    for (const asset of assets) {
      await this.db.execute(
        `INSERT INTO file_assets (
          id, user_id, file_type, r2_key, r2_url, related_entity_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          asset.id, asset.user_id, asset.file_type, asset.r2_key,
          asset.r2_url, asset.related_entity_id, now
        ]
      );
    }
  }

  private async seedCalendarConnections() {
    const connections = [
      {
        id: 'cal_conn_1',
        user_id: 'user_1',
        provider: 'google',
        provider_account_id: 'user1@gmail.com',
        provider_account_name: 'John Doe',
        access_token_enc: 'encrypted_google_calendar_token_1',
        refresh_token_enc: 'encrypted_google_calendar_refresh_1',
        sync_enabled: 1,
        last_sync_at: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
        sync_status: 'success'
      },
      {
        id: 'cal_conn_2',
        user_id: 'user_2',
        provider: 'outlook',
        provider_account_id: 'jane.student@university.edu',
        provider_account_name: 'Jane Smith',
        access_token_enc: 'encrypted_outlook_calendar_token_2',
        refresh_token_enc: 'encrypted_outlook_calendar_refresh_2',
        sync_enabled: 1,
        last_sync_at: Date.now() - (6 * 60 * 60 * 1000), // 6 hours ago
        sync_status: 'success'
      }
    ];

    const now = Date.now();
    for (const connection of connections) {
      await this.db.execute(
        `INSERT INTO calendar_connections (
          id, user_id, provider, provider_account_id, provider_account_name,
          access_token_enc, refresh_token_enc, sync_enabled, last_sync_at,
          sync_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          connection.id, connection.user_id, connection.provider,
          connection.provider_account_id, connection.provider_account_name,
          connection.access_token_enc, connection.refresh_token_enc,
          connection.sync_enabled, connection.last_sync_at,
          connection.sync_status, now, now
        ]
      );
    }
  }
}

// CLI runner function
async function runSeeder() {
  console.log('🌱 Starting database seeding...\n');

  // Mock environment for seeding
  const mockEnv: Env = {
    DB: {} as any, // This will be replaced by actual D1 database in real usage
    OPENAI_API_KEY: '',
    JWT_SECRET: 'test-secret',
    STRIPE_SECRET_KEY: '',
    STRIPE_WEBHOOK_SECRET: '',
    ENVIRONMENT: 'development'
  };

  try {
    console.log('📋 This seeder will create:');
    console.log('   • 3 Users (Premium, Student, Free)');
    console.log('   • 4 Achievement definitions');
    console.log('   • 4 User achievements');
    console.log('   • 6 Tasks with various priorities and statuses');
    console.log('   • 5 Health logs (exercise, nutrition, mood, hydration)');
    console.log('   • 4 Calendar events');
    console.log('   • 4 Habits (meditation, exercise, study, reading)');
    console.log('   • 2 Goals with milestones');
    console.log('   • 4 Gratitude entries');
    console.log('   • 3 Focus sessions');
    console.log('   • 3 Focus templates (Pomodoro, Deep Work, Meditation)');
    console.log('   • 3 Reflection entries with AI analysis');
    console.log('   • 3 Social connections (accepted and pending)');
    console.log('   • 3 User badges (gold, silver, bronze)');
    console.log('   • 2 Challenges with 4 participants');
    console.log('   • 3 Notification preference profiles');
    console.log('   • 2 External OAuth tokens (Google, Outlook)');
    console.log('   • 3 File assets (profile image, voice note, document)');
    console.log('   • 2 Calendar connections (Google, Outlook)');
    
    console.log('\n📝 To run the seeder:');
    console.log('   1. For local development:');
    console.log('      npm run seed:local');
    console.log('   2. For production database:');
    console.log('      npm run seed:remote');
    
    console.log('\n🔑 Test User Credentials:');
    console.log('   Email: john.doe@example.com (Premium user)');
    console.log('   Email: jane.student@university.edu (Student user)');
    console.log('   Email: mike.wilson@example.com (Free user)');
    console.log('   Password: Use your app\'s password reset or set manually');
    
    console.log('\n✅ Seeder ready to use!');
    console.log('🎉 Run one of the npm scripts above to populate your database!');
    
  } catch (error) {
    console.error('❌ Seeder preparation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
// Run if called directly (ES module compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeeder();
}

export { DatabaseSeeder, runSeeder };