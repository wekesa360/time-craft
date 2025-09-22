-- Phase 4: Social Features
-- Community features, challenges, and social wellness tracking

-- Enhanced social connections table (add missing columns)
ALTER TABLE social_connections ADD COLUMN connection_strength REAL DEFAULT 0.5; -- 0-1 how strong the connection is
ALTER TABLE social_connections ADD COLUMN last_interaction INTEGER;
ALTER TABLE social_connections ADD COLUMN interaction_count INTEGER DEFAULT 0;
ALTER TABLE social_connections ADD COLUMN shared_goals_count INTEGER DEFAULT 0;
ALTER TABLE social_connections ADD COLUMN mutual_challenges_count INTEGER DEFAULT 0;

-- Enhanced challenges table (add missing columns)
ALTER TABLE challenges ADD COLUMN creator_id TEXT REFERENCES users(id);
ALTER TABLE challenges ADD COLUMN max_participants INTEGER;
ALTER TABLE challenges ADD COLUMN current_participants INTEGER DEFAULT 0;
ALTER TABLE challenges ADD COLUMN difficulty_level TEXT CHECK(difficulty_level IN ('beginner','intermediate','advanced','expert')) DEFAULT 'beginner';
ALTER TABLE challenges ADD COLUMN category TEXT CHECK(category IN ('fitness','nutrition','productivity','mindfulness','social','learning')) NOT NULL;
ALTER TABLE challenges ADD COLUMN tags TEXT; -- JSON array of tags
ALTER TABLE challenges ADD COLUMN is_featured BOOLEAN DEFAULT false;
ALTER TABLE challenges ADD COLUMN featured_until INTEGER;

-- Enhanced user_challenges table (add missing columns)
ALTER TABLE user_challenges ADD COLUMN joined_at INTEGER;
ALTER TABLE user_challenges ADD COLUMN last_activity_at INTEGER;
ALTER TABLE user_challenges ADD COLUMN streak_days INTEGER DEFAULT 0;
ALTER TABLE user_challenges ADD COLUMN total_points_earned INTEGER DEFAULT 0;
ALTER TABLE user_challenges ADD COLUMN rank_in_challenge INTEGER;
ALTER TABLE user_challenges ADD COLUMN is_public BOOLEAN DEFAULT true;

-- Social posts and updates
CREATE TABLE social_posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  post_type TEXT CHECK(post_type IN ('achievement','milestone','goal_update','challenge_progress','general','motivation')) NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT, -- JSON array of media URLs
  privacy_level TEXT CHECK(privacy_level IN ('public','friends','private')) DEFAULT 'public',
  is_anonymous BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Social interactions (likes, comments, shares)
CREATE TABLE social_interactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  post_id TEXT NOT NULL REFERENCES social_posts(id),
  interaction_type TEXT CHECK(interaction_type IN ('like','comment','share','bookmark')) NOT NULL,
  content TEXT, -- For comments
  created_at INTEGER NOT NULL,
  UNIQUE(user_id, post_id, interaction_type)
);

-- Social groups and communities
CREATE TABLE social_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  creator_id TEXT NOT NULL REFERENCES users(id),
  group_type TEXT CHECK(group_type IN ('public','private','invite_only')) DEFAULT 'public',
  category TEXT CHECK(category IN ('fitness','nutrition','productivity','mindfulness','learning','general')) NOT NULL,
  member_count INTEGER DEFAULT 1,
  max_members INTEGER,
  is_active BOOLEAN DEFAULT true,
  rules TEXT, -- JSON array of group rules
  tags TEXT, -- JSON array of tags
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Group memberships
CREATE TABLE group_memberships (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES social_groups(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT CHECK(role IN ('admin','moderator','member')) DEFAULT 'member',
  joined_at INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_activity_at INTEGER,
  UNIQUE(group_id, user_id)
);

-- Social wellness tracking
CREATE TABLE social_wellness_metrics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  metric_type TEXT CHECK(metric_type IN ('social_engagement','community_participation','support_given','support_received','connection_quality')) NOT NULL,
  metric_value REAL NOT NULL,
  measurement_period TEXT CHECK(measurement_period IN ('daily','weekly','monthly')) NOT NULL,
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,
  additional_data TEXT, -- JSON additional metrics
  created_at INTEGER NOT NULL
);

-- Social challenges and competitions
CREATE TABLE social_competitions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  organizer_id TEXT NOT NULL REFERENCES users(id),
  competition_type TEXT CHECK(competition_type IN ('individual','team','group')) NOT NULL,
  category TEXT CHECK(category IN ('fitness','productivity','wellness','learning','creative')) NOT NULL,
  start_date INTEGER NOT NULL,
  end_date INTEGER NOT NULL,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  entry_fee_points INTEGER DEFAULT 0,
  prize_pool_points INTEGER DEFAULT 0,
  rules TEXT, -- JSON array of competition rules
  scoring_criteria TEXT, -- JSON scoring system
  is_active BOOLEAN DEFAULT true,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Competition participants
CREATE TABLE competition_participants (
  id TEXT PRIMARY KEY,
  competition_id TEXT NOT NULL REFERENCES social_competitions(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  team_id TEXT, -- For team competitions
  joined_at INTEGER NOT NULL,
  current_score REAL DEFAULT 0,
  rank INTEGER,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(competition_id, user_id)
);

-- Social notifications and feeds
CREATE TABLE social_notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  notification_type TEXT CHECK(notification_type IN ('connection_request','challenge_invite','achievement_celebration','group_invite','competition_update','post_interaction')) NOT NULL,
  from_user_id TEXT REFERENCES users(id),
  related_entity_id TEXT, -- ID of related post, challenge, etc.
  related_entity_type TEXT, -- Type of related entity
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at INTEGER,
  created_at INTEGER NOT NULL
);

-- Social feed algorithm preferences
CREATE TABLE social_feed_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  content_types TEXT, -- JSON array of preferred content types
  user_preferences TEXT, -- JSON user-specific preferences
  algorithm_version TEXT DEFAULT '1.0',
  last_updated INTEGER NOT NULL,
  UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX idx_social_posts_user_id ON social_posts(user_id);
CREATE INDEX idx_social_posts_type ON social_posts(post_type);
CREATE INDEX idx_social_posts_privacy ON social_posts(privacy_level);
CREATE INDEX idx_social_posts_created_at ON social_posts(created_at DESC);

CREATE INDEX idx_social_interactions_user_id ON social_interactions(user_id);
CREATE INDEX idx_social_interactions_post_id ON social_interactions(post_id);
CREATE INDEX idx_social_interactions_type ON social_interactions(interaction_type);

CREATE INDEX idx_social_groups_creator_id ON social_groups(creator_id);
CREATE INDEX idx_social_groups_category ON social_groups(category);
CREATE INDEX idx_social_groups_type ON social_groups(group_type);
CREATE INDEX idx_social_groups_active ON social_groups(is_active);

CREATE INDEX idx_group_memberships_group_id ON group_memberships(group_id);
CREATE INDEX idx_group_memberships_user_id ON group_memberships(user_id);
CREATE INDEX idx_group_memberships_role ON group_memberships(role);

CREATE INDEX idx_social_wellness_metrics_user_id ON social_wellness_metrics(user_id);
CREATE INDEX idx_social_wellness_metrics_type ON social_wellness_metrics(metric_type);
CREATE INDEX idx_social_wellness_metrics_period ON social_wellness_metrics(measurement_period);

CREATE INDEX idx_social_competitions_organizer_id ON social_competitions(organizer_id);
CREATE INDEX idx_social_competitions_category ON social_competitions(category);
CREATE INDEX idx_social_competitions_dates ON social_competitions(start_date, end_date);
CREATE INDEX idx_social_competitions_active ON social_competitions(is_active);

CREATE INDEX idx_competition_participants_competition_id ON competition_participants(competition_id);
CREATE INDEX idx_competition_participants_user_id ON competition_participants(user_id);
CREATE INDEX idx_competition_participants_rank ON competition_participants(rank);

CREATE INDEX idx_social_notifications_user_id ON social_notifications(user_id);
CREATE INDEX idx_social_notifications_type ON social_notifications(notification_type);
CREATE INDEX idx_social_notifications_read ON social_notifications(is_read);
CREATE INDEX idx_social_notifications_created_at ON social_notifications(created_at DESC);

-- Create triggers for automatic social metrics
CREATE TRIGGER update_social_engagement_metrics
AFTER INSERT ON social_interactions
BEGIN
  -- Update social engagement metrics
  INSERT OR REPLACE INTO social_wellness_metrics (
    id, user_id, metric_type, metric_value, measurement_period, 
    period_start, period_end, created_at
  )
  SELECT 
    'social_engagement_' || NEW.user_id || '_' || date('now'),
    NEW.user_id,
    'social_engagement',
    COUNT(*) * 1.0,
    'daily',
    strftime('%s', date('now')) * 1000,
    strftime('%s', date('now', '+1 day')) * 1000 - 1,
    strftime('%s', 'now') * 1000
  FROM social_interactions 
  WHERE user_id = NEW.user_id 
    AND date(datetime(created_at/1000, 'unixepoch')) = date('now');
END;

-- Create view for social dashboard
CREATE VIEW social_dashboard_view AS
SELECT 
  sc.user_id,
  COUNT(DISTINCT sc.connected_user_id) as total_connections,
  COUNT(CASE WHEN sc.status = 'accepted' THEN 1 END) as active_connections,
  COUNT(DISTINCT sp.id) as total_posts,
  COUNT(DISTINCT si.id) as total_interactions,
  COUNT(DISTINCT gm.group_id) as groups_joined,
  COUNT(DISTINCT uc.challenge_id) as challenges_participating,
  AVG(swm.metric_value) as avg_wellness_score
FROM social_connections sc
LEFT JOIN social_posts sp ON sc.user_id = sp.user_id
LEFT JOIN social_interactions si ON sc.user_id = si.user_id
LEFT JOIN group_memberships gm ON sc.user_id = gm.user_id AND gm.is_active = 1
LEFT JOIN user_challenges uc ON sc.user_id = uc.user_id AND uc.status = 'active'
LEFT JOIN social_wellness_metrics swm ON sc.user_id = swm.user_id
GROUP BY sc.user_id;
