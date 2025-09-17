-- Badge System Implementation
-- Creates missing tables for comprehensive badge and achievement system

-- User badges table (was referenced but not created)
CREATE TABLE user_badges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  badge_id TEXT NOT NULL, -- references achievement_definitions.achievement_key
  unlocked_at INTEGER NOT NULL,
  tier TEXT CHECK(tier IN ('bronze','silver','gold','platinum')) DEFAULT 'bronze',
  progress_percentage INTEGER DEFAULT 100, -- 0-100, for partially earned badges
  metadata JSON, -- additional badge-specific data
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  UNIQUE(user_id, badge_id)
);

-- Badge sharing system (was referenced but not created)
CREATE TABLE badge_shares (
  id TEXT PRIMARY KEY,
  badge_id TEXT NOT NULL REFERENCES user_badges(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  platform TEXT CHECK(platform IN ('instagram','whatsapp','twitter','facebook','linkedin','email')) NOT NULL,
  share_url TEXT NOT NULL,
  custom_message TEXT,
  shared_at INTEGER NOT NULL,
  click_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Badge progress tracking for complex achievements
CREATE TABLE badge_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  badge_id TEXT NOT NULL, -- achievement_definitions.achievement_key
  current_value INTEGER DEFAULT 0,
  target_value INTEGER NOT NULL,
  progress_data JSON, -- detailed progress tracking
  last_updated INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  UNIQUE(user_id, badge_id)
);

-- Add badge points to users table
ALTER TABLE users ADD COLUMN badge_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN total_badges INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN badge_tier TEXT DEFAULT 'bronze';

-- Update achievement_definitions to include SVG templates and enhanced metadata
ALTER TABLE achievement_definitions ADD COLUMN badge_svg_template TEXT;
ALTER TABLE achievement_definitions ADD COLUMN rarity TEXT CHECK(rarity IN ('common','rare','epic','legendary')) DEFAULT 'common';
ALTER TABLE achievement_definitions ADD COLUMN icon_emoji TEXT DEFAULT '🏅';
ALTER TABLE achievement_definitions ADD COLUMN color_primary TEXT DEFAULT '#3B82F6';
ALTER TABLE achievement_definitions ADD COLUMN color_secondary TEXT DEFAULT '#1E40AF';
ALTER TABLE achievement_definitions ADD COLUMN is_secret BOOLEAN DEFAULT false; -- hidden until unlocked
ALTER TABLE achievement_definitions ADD COLUMN prerequisite_badges JSON; -- required badges to unlock
ALTER TABLE achievement_definitions ADD COLUMN created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000);
ALTER TABLE achievement_definitions ADD COLUMN updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000);

-- Create indexes for performance
CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_unlocked_at ON user_badges(unlocked_at DESC);
CREATE INDEX idx_user_badges_tier ON user_badges(tier);

CREATE INDEX idx_badge_shares_user ON badge_shares(user_id);
CREATE INDEX idx_badge_shares_platform ON badge_shares(platform);
CREATE INDEX idx_badge_shares_shared_at ON badge_shares(shared_at DESC);

CREATE INDEX idx_badge_progress_user ON badge_progress(user_id);
CREATE INDEX idx_badge_progress_badge ON badge_progress(badge_id);
CREATE INDEX idx_badge_progress_updated ON badge_progress(last_updated DESC);

CREATE INDEX idx_users_badge_points ON users(badge_points DESC);
CREATE INDEX idx_users_total_badges ON users(total_badges DESC);

CREATE INDEX idx_achievement_definitions_category ON achievement_definitions(category);
CREATE INDEX idx_achievement_definitions_rarity ON achievement_definitions(rarity);
CREATE INDEX idx_achievement_definitions_active ON achievement_definitions(is_active);

-- Insert comprehensive badge definitions
INSERT INTO achievement_definitions (
  achievement_key, category, title_en, title_de, description_en, description_de,
  criteria, points_awarded, rarity, icon_emoji, color_primary, color_secondary, is_active
) VALUES 
-- Milestone Badges
('first_task', 'milestone', 'Getting Started', 'Erste Schritte', 
 'Complete your first task', 'Vervollständige deine erste Aufgabe',
 '{"type": "count", "threshold": 1, "metric": "tasks_completed"}', 
 10, 'common', '🎯', '#10B981', '#059669', true),

('first_week', 'milestone', 'First Week', 'Erste Woche',
 'Active for your first week', 'Aktiv in deiner ersten Woche',
 '{"type": "time_based", "threshold": 7, "metric": "days_since_registration"}',
 25, 'common', '📅', '#3B82F6', '#1E40AF', true),

('first_month', 'milestone', 'Monthly Warrior', 'Monats-Krieger',
 'Active for your first month', 'Aktiv in deinem ersten Monat',
 '{"type": "time_based", "threshold": 30, "metric": "days_since_registration"}',
 100, 'rare', '🗓️', '#8B5CF6', '#7C3AED', true),

-- Task Achievement Badges
('task_master_10', 'tasks', 'Task Rookie', 'Aufgaben-Neuling',
 'Complete 10 tasks', 'Vervollständige 10 Aufgaben',
 '{"type": "count", "threshold": 10, "metric": "tasks_completed"}',
 25, 'common', '✅', '#10B981', '#059669', true),

('task_master_50', 'tasks', 'Task Veteran', 'Aufgaben-Veteran',
 'Complete 50 tasks', 'Vervollständige 50 Aufgaben',
 '{"type": "count", "threshold": 50, "metric": "tasks_completed"}',
 75, 'rare', '🏆', '#F59E0B', '#D97706', true),

('task_master_100', 'tasks', 'Task Legend', 'Aufgaben-Legende',
 'Complete 100 tasks', 'Vervollständige 100 Aufgaben',
 '{"type": "count", "threshold": 100, "metric": "tasks_completed"}',
 150, 'epic', '👑', '#EF4444', '#DC2626', true),

('productive_day', 'tasks', 'Productive Day', 'Produktiver Tag',
 'Complete 10 tasks in a single day', 'Vervollständige 10 Aufgaben an einem Tag',
 '{"type": "count", "threshold": 10, "timeframe": 1, "metric": "tasks_completed"}',
 50, 'rare', '⚡', '#F59E0B', '#D97706', true),

-- Health & Wellness Badges
('health_starter', 'health', 'Health Conscious', 'Gesundheitsbewusst',
 'Log your first health activity', 'Protokolliere deine erste Gesundheitsaktivität',
 '{"type": "count", "threshold": 1, "metric": "health_logs"}',
 15, 'common', '🌱', '#10B981', '#059669', true),

('exercise_enthusiast', 'health', 'Exercise Enthusiast', 'Sport-Enthusiast',
 'Log 25 exercise activities', 'Protokolliere 25 Sportaktivitäten',
 '{"type": "count", "threshold": 25, "metric": "health_logs", "conditions": {"type": "exercise"}}',
 75, 'rare', '🏃', '#3B82F6', '#1E40AF', true),

('wellness_warrior', 'health', 'Wellness Warrior', 'Wellness-Krieger',
 'Log health activities for 30 consecutive days', 'Protokolliere 30 Tage lang Gesundheitsaktivitäten',
 '{"type": "streak", "threshold": 30, "metric": "health_logs"}',
 200, 'epic', '💪', '#8B5CF6', '#7C3AED', true),

('hydration_hero', 'health', 'Hydration Hero', 'Hydrations-Held',
 'Log water intake for 14 consecutive days', 'Protokolliere 14 Tage lang Wasseraufnahme',
 '{"type": "streak", "threshold": 14, "metric": "health_logs", "conditions": {"type": "hydration"}}',
 60, 'rare', '💧', '#06B6D4', '#0891B2', true),

-- Streak Badges
('consistency_champion', 'streak', 'Consistency Champion', 'Beständigkeits-Champion',
 'Complete tasks for 7 consecutive days', 'Vervollständige 7 Tage lang Aufgaben',
 '{"type": "streak", "threshold": 7, "metric": "daily_task_completion"}',
 75, 'rare', '🔥', '#EF4444', '#DC2626', true),

('habit_master', 'streak', 'Habit Master', 'Gewohnheits-Meister',
 'Maintain any habit for 21 consecutive days', 'Behalte eine Gewohnheit 21 Tage lang bei',
 '{"type": "streak", "threshold": 21, "metric": "daily_activity"}',
 150, 'epic', '🎭', '#8B5CF6', '#7C3AED', true),

-- Special Badges
('early_bird', 'special', 'Early Bird', 'Frühaufsteher',
 'Complete 10 tasks before 9 AM', 'Vervollständige 10 Aufgaben vor 9 Uhr',
 '{"type": "custom", "threshold": 10, "metric": "early_tasks", "conditions": {"before_hour": 9}}',
 40, 'rare', '🌅', '#F59E0B', '#D97706', true),

('night_owl', 'special', 'Night Owl', 'Nachteule',
 'Complete 10 tasks after 10 PM', 'Vervollständige 10 Aufgaben nach 22 Uhr',
 '{"type": "custom", "threshold": 10, "metric": "late_tasks", "conditions": {"after_hour": 22}}',
 40, 'rare', '🦉', '#8B5CF6', '#7C3AED', true),

('perfectionist', 'special', 'Perfectionist', 'Perfektionist',
 'Complete 50 tasks with high priority', 'Vervollständige 50 Aufgaben mit hoher Priorität',
 '{"type": "count", "threshold": 50, "metric": "tasks_completed", "conditions": {"priority": 4}}',
 100, 'epic', '💎', '#06B6D4', '#0891B2', true),

-- Social Badges (for future implementation)
('social_butterfly', 'social', 'Social Butterfly', 'Geselliger Schmetterling',
 'Connect with 5 friends', 'Verbinde dich mit 5 Freunden',
 '{"type": "count", "threshold": 5, "metric": "friend_connections"}',
 30, 'common', '🦋', '#EC4899', '#DB2777', false), -- disabled for now

-- Legendary Badges
('wellness_legend', 'legendary', 'Wellness Legend', 'Wellness-Legende',
 'Earn 1000 badge points', 'Sammle 1000 Badge-Punkte',
 '{"type": "count", "threshold": 1000, "metric": "badge_points"}',
 500, 'legendary', '🌟', '#F59E0B', '#D97706', true),

('time_master', 'legendary', 'Time Master', 'Zeit-Meister',
 'Complete 500 tasks and maintain 30-day streak', 'Vervollständige 500 Aufgaben und behalte 30-Tage-Serie bei',
 '{"type": "custom", "requirements": [{"metric": "tasks_completed", "threshold": 500}, {"metric": "daily_streak", "threshold": 30}]}',
 1000, 'legendary', '⏰', '#EF4444', '#DC2626', true);

-- Create trigger to update user badge stats
CREATE TRIGGER update_user_badge_stats 
AFTER INSERT ON user_badges
BEGIN
  UPDATE users 
  SET 
    total_badges = (SELECT COUNT(*) FROM user_badges WHERE user_id = NEW.user_id),
    badge_points = COALESCE(badge_points, 0) + (
      SELECT points_awarded 
      FROM achievement_definitions 
      WHERE achievement_key = NEW.badge_id
    ),
    badge_tier = CASE 
      WHEN (SELECT COUNT(*) FROM user_badges WHERE user_id = NEW.user_id AND tier = 'legendary') > 0 THEN 'legendary'
      WHEN (SELECT COUNT(*) FROM user_badges WHERE user_id = NEW.user_id AND tier = 'epic') >= 3 THEN 'epic'
      WHEN (SELECT COUNT(*) FROM user_badges WHERE user_id = NEW.user_id AND tier = 'rare') >= 5 THEN 'rare'
      ELSE 'bronze'
    END
  WHERE id = NEW.user_id;
END;