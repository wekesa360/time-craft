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
    'tasks.ai_priority',
    'en',
    'AI Priority Score',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_6',
    'calendar.title',
    'en',
    'Calendar',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_7',
    'calendar.ai_scheduler',
    'en',
    'AI Meeting Scheduler',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_8',
    'health.title',
    'en',
    'Health Tracking',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_9',
    'health.exercise',
    'en',
    'Exercise',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_10',
    'health.nutrition',
    'en',
    'Nutrition',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_11',
    'health.sleep',
    'en',
    'Sleep',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_12',
    'health.mood',
    'en',
    'Mood',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_13',
    'focus.title',
    'en',
    'Focus Sessions',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_14',
    'focus.pomodoro',
    'en',
    'Pomodoro Timer',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_15',
    'habits.title',
    'en',
    'Habits',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_16',
    'gratitude.title',
    'en',
    'Gratitude Journal',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_17',
    'reflection.title',
    'en',
    'Daily Reflection',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_18',
    'goals.title',
    'en',
    'Goals & Milestones',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_19',
    'finance.title',
    'en',
    'Financial Tracking',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_20',
    'time_tracking.title',
    'en',
    'Time Tracking',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_21',
    'social.title',
    'en',
    'Social Features',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_22',
    'achievements.title',
    'en',
    'Achievements',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_23',
    'settings.title',
    'en',
    'Settings',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_24',
    'settings.language',
    'en',
    'Language',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_25',
    'settings.timezone',
    'en',
    'Timezone',
    strftime('%s', 'now') * 1000
  );
-- Insert localized content (German)
INSERT INTO localized_content (id, content_key, language, content, created_at)
VALUES (
    'loc_26',
    'app.name',
    'de',
    'Zeit & Wohlbefinden',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_27',
    'app.tagline',
    'de',
    'Ihr persönlicher Produktivitäts- und Wellness-Begleiter',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_28',
    'tasks.title',
    'de',
    'Aufgaben',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_29',
    'tasks.create_new',
    'de',
    'Neue Aufgabe erstellen',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_30',
    'tasks.ai_priority',
    'de',
    'KI-Prioritätsbewertung',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_31',
    'calendar.title',
    'de',
    'Kalender',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_32',
    'calendar.ai_scheduler',
    'de',
    'KI-Meeting-Planer',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_33',
    'health.title',
    'de',
    'Gesundheitsüberwachung',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_34',
    'health.exercise',
    'de',
    'Bewegung',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_35',
    'health.nutrition',
    'de',
    'Ernährung',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_36',
    'health.sleep',
    'de',
    'Schlaf',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_37',
    'health.mood',
    'de',
    'Stimmung',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_38',
    'focus.title',
    'de',
    'Fokus-Sitzungen',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_39',
    'focus.pomodoro',
    'de',
    'Pomodoro-Timer',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_40',
    'habits.title',
    'de',
    'Gewohnheiten',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_41',
    'gratitude.title',
    'de',
    'Dankbarkeitstagebuch',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_42',
    'reflection.title',
    'de',
    'Tägliche Reflexion',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_43',
    'goals.title',
    'de',
    'Ziele & Meilensteine',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_44',
    'finance.title',
    'de',
    'Finanzverfolgung',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_45',
    'time_tracking.title',
    'de',
    'Zeiterfassung',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_46',
    'social.title',
    'de',
    'Soziale Funktionen',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_47',
    'achievements.title',
    'de',
    'Erfolge',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_48',
    'settings.title',
    'de',
    'Einstellungen',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_49',
    'settings.language',
    'de',
    'Sprache',
    strftime('%s', 'now') * 1000
  ),
  (
    'loc_50',
    'settings.timezone',
    'de',
    'Zeitzone',
    strftime('%s', 'now') * 1000
  );
-- Achievement definitions with localized content
INSERT INTO achievement_definitions (
    id,
    achievement_key,
    category,
    title_en,
    title_de,
    description_en,
    description_de,
    criteria,
    points_awarded,
    badge_svg_template,
    rarity,
    is_active
  )
VALUES (
    'ach_1',
    'first_task',
    'productivity',
    'First Steps',
    'Erste Schritte',
    'Complete your first task',
    'Schließen Sie Ihre erste Aufgabe ab',
    '{"type": "task_completion", "count": 1}',
    10,
    '<svg>...</svg>',
    'common',
    true
  ),
  (
    'ach_2',
    'task_master_10',
    'productivity',
    'Task Master',
    'Aufgaben-Meister',
    'Complete 10 tasks',
    'Schließen Sie 10 Aufgaben ab',
    '{"type": "task_completion", "count": 10}',
    50,
    '<svg>...</svg>',
    'common',
    true
  ),
  (
    'ach_3',
    'task_master_100',
    'productivity',
    'Task Legend',
    'Aufgaben-Legende',
    'Complete 100 tasks',
    'Schließen Sie 100 Aufgaben ab',
    '{"type": "task_completion", "count": 100}',
    200,
    '<svg>...</svg>',
    'rare',
    true
  ),
  (
    'ach_4',
    'early_bird',
    'productivity',
    'Early Bird',
    'Frühaufsteher',
    'Complete a task before 8 AM',
    'Schließen Sie eine Aufgabe vor 8 Uhr ab',
    '{"type": "task_completion_time", "before": "08:00"}',
    25,
    '<svg>...</svg>',
    'common',
    true
  ),
  (
    'ach_5',
    'focus_master',
    'focus',
    'Focus Master',
    'Fokus-Meister',
    'Complete 10 focus sessions',
    'Schließen Sie 10 Fokus-Sitzungen ab',
    '{"type": "focus_sessions", "count": 10}',
    75,
    '<svg>...</svg>',
    'common',
    true
  ),
  (
    'ach_6',
    'pomodoro_streak',
    'focus',
    'Pomodoro Pro',
    'Pomodoro-Profi',
    'Complete 25 Pomodoro sessions',
    'Schließen Sie 25 Pomodoro-Sitzungen ab',
    '{"type": "pomodoro_sessions", "count": 25}',
    100,
    '<svg>...</svg>',
    'rare',
    true
  ),
  (
    'ach_7',
    'health_tracker',
    'health',
    'Health Tracker',
    'Gesundheits-Tracker',
    'Log health data for 7 consecutive days',
    'Protokollieren Sie 7 aufeinanderfolgende Tage Gesundheitsdaten',
    '{"type": "consecutive_health_logs", "days": 7}',
    50,
    '<svg>...</svg>',
    'common',
    true
  ),
  (
    'ach_8',
    'fitness_enthusiast',
    'health',
    'Fitness Enthusiast',
    'Fitness-Enthusiast',
    'Complete 30 workout sessions',
    'Schließen Sie 30 Trainingseinheiten ab',
    '{"type": "exercise_sessions", "count": 30}',
    150,
    '<svg>...</svg>',
    'rare',
    true
  ),
  (
    'ach_9',
    'gratitude_practitioner',
    'mindfulness',
    'Gratitude Practitioner',
    'Dankbarkeits-Praktiker',
    'Write 30 gratitude entries',
    'Schreiben Sie 30 Dankbarkeitseinträge',
    '{"type": "gratitude_entries", "count": 30}',
    75,
    '<svg>...</svg>',
    'common',
    true
  ),
  (
    'ach_10',
    'reflection_master',
    'mindfulness',
    'Reflection Master',
    'Reflexions-Meister',
    'Complete 50 daily reflections',
    'Schließen Sie 50 tägliche Reflexionen ab',
    '{"type": "reflection_entries", "count": 50}',
    125,
    '<svg>...</svg>',
    'rare',
    true
  ),
  (
    'ach_11',
    'habit_builder',
    'habits',
    'Habit Builder',
    'Gewohnheits-Baumeister',
    'Maintain a habit streak for 21 days',
    'Behalten Sie eine Gewohnheit für 21 Tage bei',
    '{"type": "habit_streak", "days": 21}',
    100,
    '<svg>...</svg>',
    'rare',
    true
  ),
  (
    'ach_12',
    'social_connector',
    'social',
    'Social Connector',
    'Sozialer Verbinder',
    'Connect with 5 friends',
    'Verbinden Sie sich mit 5 Freunden',
    '{"type": "friend_connections", "count": 5}',
    50,
    '<svg>...</svg>',
    'common',
    true
  ),
  (
    'ach_13',
    'challenge_champion',
    'social',
    'Challenge Champion',
    'Challenge-Champion',
    'Win a social challenge',
    'Gewinnen Sie eine soziale Herausforderung',
    '{"type": "challenge_win", "count": 1}',
    200,
    '<svg>...</svg>',
    'epic',
    true
  ),
  (
    'ach_14',
    'financial_tracker',
    'finance',
    'Financial Tracker',
    'Finanz-Tracker',
    'Track expenses for 30 days',
    'Verfolgen Sie Ausgaben für 30 Tage',
    '{"type": "financial_entries", "days": 30}',
    75,
    '<svg>...</svg>',
    'common',
    true
  ),
  (
    'ach_15',
    'time_master',
    'productivity',
    'Time Master',
    'Zeit-Meister',
    'Track 100 hours of time',
    'Verfolgen Sie 100 Stunden Zeit',
    '{"type": "time_tracked_hours", "hours": 100}',
    150,
    '<svg>...</svg>',
    'rare',
    true
  );
-- Sample user data (for development/testing)
INSERT INTO users (
    id,
    email,
    password_hash,
    first_name,
    last_name,
    timezone,
    preferred_language,
    subscription_type,
    is_student,
    created_at,
    updated_at
  )
VALUES (
    'user_1',
    'john.doe@example.com',
    '$2a$10$example_hash_1',
    'John',
    'Doe',
    'America/New_York',
    'en',
    'free',
    false,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
  ),
  (
    'user_2',
    'anna.mueller@example.com',
    '$2a$10$example_hash_2',
    'Anna',
    'Müller',
    'Europe/Berlin',
    'de',
    'standard',
    false,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
  ),
  (
    'user_3',
    'student@university.edu',
    '$2a$10$example_hash_3',
    'Alex',
    'Student',
    'America/Los_Angeles',
    'en',
    'student',
    true,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
  );
-- Sample tasks
INSERT INTO tasks (
    id,
    user_id,
    title,
    description,
    priority,
    status,
    due_date,
    estimated_duration,
    ai_priority_score,
    context_type,
    created_at,
    updated_at
  )
VALUES (
    'task_1',
    'user_1',
    'Review project proposal',
    'Review the Q1 project proposal document',
    3,
    'pending',
    (strftime('%s', 'now') + 86400) * 1000,
    60,
    0.85,
    'work',
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
  ),
  (
    'task_2',
    'user_1',
    'Buy groceries',
    'Weekly grocery shopping',
    2,
    'pending',
    (strftime('%s', 'now') + 3600) * 1000,
    45,
    0.6,
    'personal',
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
  ),
  (
    'task_3',
    'user_2',
    'Trainingsplan erstellen',
    'Neuen Trainingsplan für die Woche erstellen',
    2,
    'pending',
    (strftime('%s', 'now') + 7200) * 1000,
    30,
    0.7,
    'health',
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
  );
-- Sample habits
INSERT INTO habits (
    id,
    user_id,
    name,
    frequency,
    target_duration,
    is_active,
    created_at
  )
VALUES (
    'habit_1',
    'user_1',
    'Morning meditation',
    'daily',
    10,
    true,
    strftime('%s', 'now') * 1000
  ),
  (
    'habit_2',
    'user_1',
    'Evening walk',
    'daily',
    20,
    true,
    strftime('%s', 'now') * 1000
  ),
  (
    'habit_3',
    'user_2',
    'Lesen vor dem Schlafen',
    'daily',
    15,
    true,
    strftime('%s', 'now') * 1000
  );
-- Sample habit completions
INSERT INTO habit_completions (
    id,
    habit_id,
    user_id,
    completed_at,
    duration_minutes,
    streak_count,
    created_at
  )
VALUES (
    'comp_1',
    'habit_1',
    'user_1',
    (strftime('%s', 'now') - 86400) * 1000,
    10,
    5,
    strftime('%s', 'now') * 1000
  ),
  (
    'comp_2',
    'habit_1',
    'user_1',
    strftime('%s', 'now') * 1000,
    12,
    6,
    strftime('%s', 'now') * 1000
  );
-- Sample goals
INSERT INTO goals (
    id,
    user_id,
    title,
    description,
    target_date,
    milestones,
    progress_percent,
    created_at
  )
VALUES (
    'goal_1',
    'user_1',
    'Learn Spanish',
    'Become conversational in Spanish',
    (strftime('%s', 'now') + 15552000) * 1000,
    '[{"title": "Complete Duolingo course", "completed": false}, {"title": "Have first conversation", "completed": false}]',
    25.5,
    strftime('%s', 'now') * 1000
  ),
  (
    'goal_2',
    'user_2',
    'Marathon laufen',
    'Einen Marathon unter 4 Stunden laufen',
    (strftime('%s', 'now') + 10368000) * 1000,
    '[{"title": "10K unter 50 Minuten", "completed": true}, {"title": "Halbmarathon unter 1:50", "completed": false}]',
    60.0,
    strftime('%s', 'now') * 1000
  );
-- Sample gratitude entries
INSERT INTO gratitude_entries (id, user_id, entry_text, category, logged_at)
VALUES (
    'grat_1',
    'user_1',
    'Grateful for a productive day at work',
    'work',
    strftime('%s', 'now') * 1000
  ),
  (
    'grat_2',
    'user_2',
    'Dankbar für das schöne Wetter heute',
    'nature',
    (strftime('%s', 'now') - 3600) * 1000
  );
-- Sample reflection entries
INSERT INTO reflection_entries (id, user_id, content, ai_analysis, logged_at)
VALUES (
    'refl_1',
    'user_1',
    'Today was challenging but I managed to complete most of my tasks. I need to work on better time estimation.',
    '{"mood": "neutral", "themes": ["productivity", "time_management"], "suggestions": ["break_down_tasks", "use_timers"]}',
    strftime('%s', 'now') * 1000
  );
-- Sample mood entries
INSERT INTO mood_entries (
    id,
    user_id,
    mood_score,
    energy_level,
    stress_level,
    tags,
    notes,
    recorded_at,
    created_at
  )
VALUES (
    'mood_1',
    'user_1',
    7,
    6,
    4,
    '["productive", "focused"]',
    'Good day overall, felt focused during work',
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
  ),
  (
    'mood_2',
    'user_2',
    8,
    8,
    2,
    '["happy", "relaxed"]',
    'Schöner entspannter Tag im Park',
    (strftime('%s', 'now') - 3600) * 1000,
    strftime('%s', 'now') * 1000
  );
-- Sample exercise entries
INSERT INTO exercise_entries (
    id,
    user_id,
    exercise_type,
    activity_name,
    duration_minutes,
    intensity_level,
    calories_burned,
    distance_km,
    notes,
    recorded_at,
    created_at
  )
VALUES (
    'ex_1',
    'user_1',
    'cardio',
    'Running',
    30,
    7,
    300,
    5.2,
    'Good pace, felt strong',
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
  ),
  (
    'ex_2',
    'user_2',
    'strength',
    'Krafttraining',
    45,
    6,
    250,
    null,
    'Gutes Training heute',
    (strftime('%s', 'now') - 7200) * 1000,
    strftime('%s', 'now') * 1000
  );
-- Sample user achievements (unlocked)
INSERT INTO user_achievements (
    id,
    user_id,
    achievement_key,
    is_unlocked,
    unlocked_at,
    share_count,
    created_at
  )
VALUES (
    'ua_1',
    'user_1',
    'first_task',
    true,
    (strftime('%s', 'now') - 86400) * 1000,
    2,
    strftime('%s', 'now') * 1000
  ),
  (
    'ua_2',
    'user_1',
    'early_bird',
    true,
    strftime('%s', 'now') * 1000,
    0,
    strftime('%s', 'now') * 1000
  ),
  (
    'ua_3',
    'user_2',
    'first_task',
    true,
    (strftime('%s', 'now') - 172800) * 1000,
    1,
    strftime('%s', 'now') * 1000
  );
-- Sample budget goals
INSERT INTO budget_goals (
    id,
    user_id,
    category,
    monthly_limit,
    currency,
    alert_threshold,
    is_active,
    created_at,
    updated_at
  )
VALUES (
    'budget_1',
    'user_1',
    'food',
    600.00,
    'USD',
    0.8,
    true,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
  ),
  (
    'budget_2',
    'user_1',
    'entertainment',
    200.00,
    'USD',
    0.75,
    true,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
  ),
  (
    'budget_3',
    'user_2',
    'transport',
    150.00,
    'EUR',
    0.9,
    true,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
  );
-- Sample financial entries
INSERT INTO financial_entries (
    id,
    user_id,
    transaction_type,
    category,
    amount,
    currency,
    description,
    tags,
    payment_method,
    transaction_date,
    created_at
  )
VALUES (
    'fin_1',
    'user_1',
    'expense',
    'food',
    45.50,
    'USD',
    'Grocery shopping at Whole Foods',
    '["groceries", "weekly"]',
    'credit_card',
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
  ),
  (
    'fin_2',
    'user_1',
    'expense',
    'transport',
    12.75,
    'USD',
    'Uber ride to office',
    '["commute"]',
    'mobile_payment',
    (strftime('%s', 'now') - 3600) * 1000,
    strftime('%s', 'now') * 1000
  ),
  (
    'fin_3',
    'user_2',
    'income',
    'salary',
    3200.00,
    'EUR',
    'Monatsgehalt',
    '["salary"]',
    'bank_transfer',
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
  );
-- Sample time tracking sessions
INSERT INTO time_tracking_sessions (
    id,
    user_id,
    project_name,
    category,
    description,
    started_at,
    ended_at,
    duration_minutes,
    is_billable,
    tags,
    created_at
  )
VALUES (
    'time_1',
    'user_1',
    'Client Website',
    'work',
    'Frontend development',
    (strftime('%s', 'now') - 7200) * 1000,
    (strftime('%s', 'now') - 3600) * 1000,
    120,
    true,
    '["development", "frontend"]',
    strftime('%s', 'now') * 1000
  ),
  (
    'time_2',
    'user_1',
    'Personal Learning',
    'learning',
    'React tutorial',
    (strftime('%s', 'now') - 1800) * 1000,
    strftime('%s', 'now') * 1000,
    30,
    false,
    '["react", "tutorial"]',
    strftime('%s', 'now') * 1000
  );