-- Seed data for Time & Wellness Application
-- Includes localized content, achievement definitions, and sample data

-- Insert localized content (English)
INSERT INTO localized_content (id, content_key, language, content, created_at)
VALUES (
    'loc_1',
    'app.name',
    'en',
    'Time & Wellness',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_2',
    'app.tagline',
    'en',
    'Your personal productivity and wellness companion',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_3',
    'tasks.title',
    'en',
    'Tasks',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_4',
    'tasks.create_new',
    'en',
    'Create New Task',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_5',
    'tasks.priority.high',
    'en',
    'High Priority',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_6',
    'tasks.priority.medium',
    'en',
    'Medium Priority',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_7',
    'tasks.priority.low',
    'en',
    'Low Priority',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_8',
    'tasks.status.pending',
    'en',
    'Pending',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_9',
    'tasks.status.done',
    'en',
    'Completed',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_10',
    'tasks.status.archived',
    'en',
    'Archived',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_11',
    'health.title',
    'en',
    'Health & Wellness',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_12',
    'health.exercise',
    'en',
    'Exercise',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_13',
    'health.nutrition',
    'en',
    'Nutrition',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_14',
    'health.mood',
    'en',
    'Mood',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_15',
    'health.hydration',
    'en',
    'Hydration',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_16',
    'calendar.title',
    'en',
    'Calendar',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_17',
    'calendar.create_event',
    'en',
    'Create Event',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_18',
    'habits.title',
    'en',
    'Habits',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_19',
    'habits.create_new',
    'en',
    'Create New Habit',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_20',
    'goals.title',
    'en',
    'Goals',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_21',
    'goals.create_new',
    'en',
    'Create New Goal',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_22',
    'focus.title',
    'en',
    'Focus Sessions',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_23',
    'focus.start_session',
    'en',
    'Start Focus Session',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_24',
    'voice.title',
    'en',
    'Voice Notes',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_25',
    'voice.record_note',
    'en',
    'Record Voice Note',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_26',
    'notifications.title',
    'en',
    'Notifications',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_27',
    'settings.title',
    'en',
    'Settings',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_28',
    'profile.title',
    'en',
    'Profile',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_29',
    'achievements.title',
    'en',
    'Achievements',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_30',
    'challenges.title',
    'en',
    'Challenges',
    strftime('%s', 'now') * 1000
  );

-- Insert localized content (German)
INSERT INTO localized_content (id, content_key, language, content, created_at)
VALUES (
    'loc_de_1',
    'app.name',
    'de',
    'Zeit & Wohlbefinden',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_de_2',
    'app.tagline',
    'de',
    'Ihr persönlicher Produktivitäts- und Wellness-Begleiter',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_de_3',
    'tasks.title',
    'de',
    'Aufgaben',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_de_4',
    'tasks.create_new',
    'de',
    'Neue Aufgabe erstellen',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_de_5',
    'tasks.priority.high',
    'de',
    'Hohe Priorität',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_de_6',
    'tasks.priority.medium',
    'de',
    'Mittlere Priorität',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_de_7',
    'tasks.priority.low',
    'de',
    'Niedrige Priorität',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_de_8',
    'tasks.status.pending',
    'de',
    'Ausstehend',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_de_9',
    'tasks.status.done',
    'de',
    'Abgeschlossen',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_de_10',
    'tasks.status.archived',
    'de',
    'Archiviert',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_de_11',
    'health.title',
    'de',
    'Gesundheit & Wohlbefinden',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_de_12',
    'health.exercise',
    'de',
    'Bewegung',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_de_13',
    'health.nutrition',
    'de',
    'Ernährung',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_de_14',
    'health.mood',
    'de',
    'Stimmung',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_de_15',
    'health.hydration',
    'de',
    'Hydratation',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_de_16',
    'calendar.title',
    'de',
    'Kalender',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_de_17',
    'calendar.create_event',
    'de',
    'Termin erstellen',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_de_18',
    'habits.title',
    'de',
    'Gewohnheiten',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_de_19',
    'habits.create_new',
    'de',
    'Neue Gewohnheit erstellen',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_de_20',
    'goals.title',
    'de',
    'Ziele',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_de_21',
    'goals.create_new',
    'de',
    'Neues Ziel erstellen',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_de_22',
    'focus.title',
    'de',
    'Fokussitzungen',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_de_23',
    'focus.start_session',
    'de',
    'Fokussitzung starten',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_de_24',
    'voice.title',
    'de',
    'Sprachnotizen',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_de_25',
    'voice.record_note',
    'de',
    'Sprachnotiz aufnehmen',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_de_26',
    'notifications.title',
    'de',
    'Benachrichtigungen',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_de_27',
    'settings.title',
    'de',
    'Einstellungen',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_de_28',
    'profile.title',
    'de',
    'Profil',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_de_29',
    'achievements.title',
    'de',
    'Erfolge',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_de_30',
    'challenges.title',
    'de',
    'Herausforderungen',
    strftime('%s', 'now') * 1000
  );

-- Insert achievement definitions
INSERT INTO achievement_definitions (
  achievement_key, category, title_en, title_de, description_en, description_de, 
  criteria, points_awarded, is_active, created_at
) VALUES 
('first_task', 'tasks', 'First Steps', 'Erste Schritte', 
 'Complete your first task', 'Erledige deine erste Aufgabe',
 '{"type": "count", "metric": "tasks_completed", "threshold": 1}', 10, 1, strftime('%s', 'now') * 1000),

('task_master', 'tasks', 'Task Master', 'Aufgaben-Meister', 
 'Complete 100 tasks', 'Erledige 100 Aufgaben',
 '{"type": "count", "metric": "tasks_completed", "threshold": 100}', 100, 1, strftime('%s', 'now') * 1000),

('streak_7', 'streak', 'Week Warrior', 'Wochen-Krieger', 
 'Maintain a 7-day task completion streak', 'Halte eine 7-tägige Aufgaben-Erledigungs-Serie',
 '{"type": "streak", "metric": "daily_tasks_completed", "threshold": 7}', 50, 1, strftime('%s', 'now') * 1000),

('health_tracker', 'health', 'Health Tracker', 'Gesundheits-Tracker', 
 'Log health data for 30 days', 'Protokolliere 30 Tage lang Gesundheitsdaten',
 '{"type": "streak", "metric": "daily_health_logs", "threshold": 30}', 75, 1, strftime('%s', 'now') * 1000),

('focus_champion', 'focus', 'Focus Champion', 'Fokus-Champion', 
 'Complete 50 focus sessions', 'Schließe 50 Fokussitzungen ab',
 '{"type": "count", "metric": "focus_sessions_completed", "threshold": 50}', 80, 1, strftime('%s', 'now') * 1000),

('habit_builder', 'habits', 'Habit Builder', 'Gewohnheits-Bauer', 
 'Create and maintain 5 active habits', 'Erstelle und halte 5 aktive Gewohnheiten',
 '{"type": "count", "metric": "active_habits", "threshold": 5}', 60, 1, strftime('%s', 'now') * 1000),

('goal_achiever', 'goals', 'Goal Achiever', 'Ziel-Erreicher', 
 'Complete 10 goals', 'Erreiche 10 Ziele',
 '{"type": "count", "metric": "goals_completed", "threshold": 10}', 90, 1, strftime('%s', 'now') * 1000),

('voice_enthusiast', 'voice', 'Voice Enthusiast', 'Sprach-Enthusiast', 
 'Record 25 voice notes', 'Nimm 25 Sprachnotizen auf',
 '{"type": "count", "metric": "voice_notes_recorded", "threshold": 25}', 40, 1, strftime('%s', 'now') * 1000),

('social_butterfly', 'social', 'Social Butterfly', 'Gesellige Seele', 
 'Connect with 10 other users', 'Verbinde dich mit 10 anderen Nutzern',
 '{"type": "count", "metric": "social_connections", "threshold": 10}', 70, 1, strftime('%s', 'now') * 1000),

('challenge_accepted', 'challenges', 'Challenge Accepted', 'Herausforderung angenommen', 
 'Participate in 5 challenges', 'Nimm an 5 Herausforderungen teil',
 '{"type": "count", "metric": "challenges_participated", "threshold": 5}', 55, 1, strftime('%s', 'now') * 1000);

-- Insert sample focus templates
INSERT INTO focus_templates (
  id, user_id, name, duration, environment, is_public, created_at
) VALUES 
('pomodoro_25', 'system', 'Pomodoro (25 min)', 25, '{"noise_level": "quiet", "phone": "silent"}', 1, strftime('%s', 'now') * 1000),
('deep_work_90', 'system', 'Deep Work (90 min)', 90, '{"noise_level": "silent", "distractions": "none"}', 1, strftime('%s', 'now') * 1000),
('quick_sprint_15', 'system', 'Quick Sprint (15 min)', 15, '{"energy": "high", "task_size": "small"}', 1, strftime('%s', 'now') * 1000),
('flow_state_120', 'system', 'Flow State (2 hours)', 120, '{"distractions": "none", "materials": "ready"}', 1, strftime('%s', 'now') * 1000);

-- Insert sample challenges
INSERT INTO challenges (
  id, title, description, type, criteria, reward_points, start_date, end_date, is_active, created_at
) VALUES 
('daily_tasks_30', '30-Day Task Challenge', 'Complete at least one task every day for 30 days', 'daily_tasks', 
 '{"type": "streak", "metric": "daily_tasks_completed", "threshold": 30}', 200, 
 strftime('%s', 'now') * 1000, strftime('%s', 'now', '+30 days') * 1000, 1, strftime('%s', 'now') * 1000),

('health_logging_14', '14-Day Health Logging', 'Log your health data every day for 14 days', 'health_logging', 
 '{"type": "streak", "metric": "daily_health_logs", "threshold": 14}', 150, 
 strftime('%s', 'now') * 1000, strftime('%s', 'now', '+14 days') * 1000, 1, strftime('%s', 'now') * 1000),

('focus_sessions_10', '10 Focus Sessions', 'Complete 10 focus sessions in one week', 'focus_sessions', 
 '{"type": "count", "metric": "weekly_focus_sessions", "threshold": 10, "timeframe": 7}', 100, 
 strftime('%s', 'now') * 1000, strftime('%s', 'now', '+7 days') * 1000, 1, strftime('%s', 'now') * 1000);

-- Insert system configuration
INSERT INTO system_config (
  id, config_key, config_value, config_type, category, description, is_public, created_at, last_modified_at
) VALUES 
('app_version', '1.0.0', 'string', 'general', 'Current application version', 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
('maintenance_mode', 'false', 'boolean', 'general', 'Enable maintenance mode', 0, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
('max_file_size_mb', '10', 'number', 'general', 'Maximum file upload size in MB', 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
('session_timeout_minutes', '60', 'number', 'security', 'User session timeout in minutes', 0, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
('api_rate_limit_per_hour', '1000', 'number', 'security', 'API rate limit per user per hour', 0, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
('enable_analytics', 'true', 'boolean', 'features', 'Enable analytics tracking', 0, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
('enable_voice_features', 'true', 'boolean', 'features', 'Enable voice processing features', 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
('enable_social_features', 'true', 'boolean', 'features', 'Enable social features', 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- Insert feature flags
INSERT INTO feature_flags (
  id, name, description, enabled, rollout_percentage, target_users, created_at, updated_at
) VALUES 
('eisenhower_matrix', 'Eisenhower Matrix', 'Enable Eisenhower Matrix task prioritization', 1, 100, '[]', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
('ai_insights', 'AI Insights', 'Enable AI-powered health and productivity insights', 1, 50, '[]', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
('voice_commands', 'Voice Commands', 'Enable voice command processing', 1, 25, '[]', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
('social_challenges', 'Social Challenges', 'Enable community challenges and competitions', 1, 75, '[]', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
('advanced_analytics', 'Advanced Analytics', 'Enable detailed analytics and reporting', 0, 10, '[]', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);
