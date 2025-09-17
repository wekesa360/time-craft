-- Phase 4: Social Features and Student Verification Migration
-- Ensures all social and student verification features are properly set up

-- Create email OTPs table for student verification
CREATE TABLE IF NOT EXISTS email_otps (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  created_at INTEGER NOT NULL
);

-- Create achievement sharing analytics table
CREATE TABLE IF NOT EXISTS achievement_share_analytics (
  id TEXT PRIMARY KEY,
  badge_id TEXT NOT NULL REFERENCES user_achievements(id),
  platform TEXT NOT NULL,
  shared_at INTEGER NOT NULL,
  click_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0, -- users who signed up from this share
  share_url TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at INTEGER NOT NULL
);

-- Create social activity feed table
CREATE TABLE IF NOT EXISTS social_activity_feed (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  activity_type TEXT CHECK(activity_type IN ('achievement_unlocked', 'challenge_joined', 'challenge_completed', 'connection_made', 'goal_achieved')) NOT NULL,
  activity_data JSON NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_at INTEGER NOT NULL
);

-- Create challenge templates table for pre-built challenges
CREATE TABLE IF NOT EXISTS challenge_templates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT CHECK(challenge_type IN ('habit', 'goal', 'fitness', 'mindfulness')) NOT NULL,
  duration_days INTEGER NOT NULL,
  difficulty_level INTEGER CHECK(difficulty_level BETWEEN 1 AND 5) DEFAULT 3,
  template_data JSON NOT NULL, -- challenge configuration
  is_active BOOLEAN DEFAULT true,
  created_by TEXT, -- admin user who created template
  created_at INTEGER NOT NULL
);

-- Create user notification preferences for social features
CREATE TABLE IF NOT EXISTS social_notification_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  connection_requests BOOLEAN DEFAULT true,
  challenge_invites BOOLEAN DEFAULT true,
  achievement_shares BOOLEAN DEFAULT true,
  challenge_updates BOOLEAN DEFAULT true,
  leaderboard_changes BOOLEAN DEFAULT false,
  friend_achievements BOOLEAN DEFAULT true,
  updated_at INTEGER NOT NULL
);

-- Create challenge invitations table
CREATE TABLE IF NOT EXISTS challenge_invitations (
  id TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL REFERENCES social_challenges(id),
  inviter_id TEXT NOT NULL REFERENCES users(id),
  invitee_id TEXT NOT NULL REFERENCES users(id),
  status TEXT CHECK(status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  message TEXT,
  created_at INTEGER NOT NULL,
  responded_at INTEGER,
  UNIQUE(challenge_id, invitee_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_otps_user_expires ON email_otps(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_email_otps_expires ON email_otps(expires_at);

CREATE INDEX IF NOT EXISTS idx_achievement_share_analytics_badge ON achievement_share_analytics(badge_id, shared_at);
CREATE INDEX IF NOT EXISTS idx_achievement_share_analytics_platform ON achievement_share_analytics(platform, shared_at);

CREATE INDEX IF NOT EXISTS idx_social_activity_feed_user ON social_activity_feed(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_social_activity_feed_public ON social_activity_feed(is_public, created_at);
CREATE INDEX IF NOT EXISTS idx_social_activity_feed_type ON social_activity_feed(activity_type, created_at);

CREATE INDEX IF NOT EXISTS idx_challenge_templates_type ON challenge_templates(challenge_type, is_active);
CREATE INDEX IF NOT EXISTS idx_challenge_templates_difficulty ON challenge_templates(difficulty_level, is_active);

CREATE INDEX IF NOT EXISTS idx_challenge_invitations_challenge ON challenge_invitations(challenge_id, status);
CREATE INDEX IF NOT EXISTS idx_challenge_invitations_invitee ON challenge_invitations(invitee_id, status);

-- Insert some default challenge templates
INSERT OR IGNORE INTO challenge_templates (id, title, description, challenge_type, duration_days, difficulty_level, template_data, is_active, created_at) VALUES
('template_1', '30-Day Meditation Challenge', 'Meditate for at least 10 minutes every day for 30 days', 'mindfulness', 30, 2, '{"daily_target": 10, "unit": "minutes", "activity": "meditation"}', true, strftime('%s', 'now') * 1000),
('template_2', '7-Day Hydration Challenge', 'Drink 8 glasses of water every day for a week', 'habit', 7, 1, '{"daily_target": 8, "unit": "glasses", "activity": "hydration"}', true, strftime('%s', 'now') * 1000),
('template_3', '21-Day Exercise Challenge', 'Exercise for at least 30 minutes every day for 21 days', 'fitness', 21, 3, '{"daily_target": 30, "unit": "minutes", "activity": "exercise"}', true, strftime('%s', 'now') * 1000),
('template_4', '14-Day Gratitude Challenge', 'Write down 3 things you are grateful for every day', 'mindfulness', 14, 1, '{"daily_target": 3, "unit": "items", "activity": "gratitude"}', true, strftime('%s', 'now') * 1000),
('template_5', '30-Day Reading Challenge', 'Read for at least 20 minutes every day for 30 days', 'habit', 30, 2, '{"daily_target": 20, "unit": "minutes", "activity": "reading"}', true, strftime('%s', 'now') * 1000);

-- Insert default social notification preferences for existing users
INSERT OR IGNORE INTO social_notification_preferences (user_id, connection_requests, challenge_invites, achievement_shares, challenge_updates, leaderboard_changes, friend_achievements, updated_at)
SELECT id, true, true, true, true, false, true, strftime('%s', 'now') * 1000
FROM users;

-- Update existing badge shares to use new analytics table
INSERT OR IGNORE INTO achievement_share_analytics (id, badge_id, platform, shared_at, click_count, conversion_count, share_url, user_agent, referrer, created_at)
SELECT 
  bs.id,
  bs.badge_id,
  bs.platform,
  bs.shared_at,
  bs.click_count,
  0 as conversion_count,
  bs.share_url,
  null as user_agent,
  null as referrer,
  bs.shared_at as created_at
FROM badge_shares bs;

-- Create trigger to automatically create social notification preferences for new users
CREATE TRIGGER IF NOT EXISTS create_social_preferences_for_new_user
AFTER INSERT ON users
BEGIN
  INSERT INTO social_notification_preferences (user_id, connection_requests, challenge_invites, achievement_shares, challenge_updates, leaderboard_changes, friend_achievements, updated_at)
  VALUES (NEW.id, true, true, true, true, false, true, strftime('%s', 'now') * 1000);
END;

-- Create trigger to log social activities
CREATE TRIGGER IF NOT EXISTS log_achievement_unlock
AFTER UPDATE ON user_achievements
WHEN NEW.is_unlocked = true AND OLD.is_unlocked = false
BEGIN
  INSERT INTO social_activity_feed (id, user_id, activity_type, activity_data, is_public, created_at)
  VALUES (
    lower(hex(randomblob(16))),
    NEW.user_id,
    'achievement_unlocked',
    json_object('achievement_key', NEW.achievement_key, 'badge_id', NEW.id),
    true,
    strftime('%s', 'now') * 1000
  );
END;

CREATE TRIGGER IF NOT EXISTS log_challenge_join
AFTER INSERT ON challenge_participants
BEGIN
  INSERT INTO social_activity_feed (id, user_id, activity_type, activity_data, is_public, created_at)
  VALUES (
    lower(hex(randomblob(16))),
    NEW.user_id,
    'challenge_joined',
    json_object('challenge_id', NEW.challenge_id),
    true,
    strftime('%s', 'now') * 1000
  );
END;

CREATE TRIGGER IF NOT EXISTS log_challenge_completion
AFTER UPDATE ON challenge_participants
WHEN NEW.completion_status = 'completed' AND OLD.completion_status != 'completed'
BEGIN
  INSERT INTO social_activity_feed (id, user_id, activity_type, activity_data, is_public, created_at)
  VALUES (
    lower(hex(randomblob(16))),
    NEW.user_id,
    'challenge_completed',
    json_object('challenge_id', NEW.challenge_id, 'final_score', NEW.final_score),
    true,
    strftime('%s', 'now') * 1000
  );
END;

CREATE TRIGGER IF NOT EXISTS log_connection_made
AFTER UPDATE ON user_connections
WHEN NEW.status = 'accepted' AND OLD.status = 'pending'
BEGIN
  INSERT INTO social_activity_feed (id, user_id, activity_type, activity_data, is_public, created_at)
  VALUES (
    lower(hex(randomblob(16))),
    NEW.requester_id,
    'connection_made',
    json_object('connection_id', NEW.id, 'connection_type', NEW.connection_type, 'friend_id', NEW.addressee_id),
    false, -- connections are private by default
    strftime('%s', 'now') * 1000
  );
END;