-- Health Goals and Insights System
-- Comprehensive health tracking with AI-powered insights and goal management

-- Enhanced health goals table (add missing columns)
ALTER TABLE health_goals ADD COLUMN target_frequency TEXT; -- daily, weekly, monthly
ALTER TABLE health_goals ADD COLUMN current_streak INTEGER DEFAULT 0;
ALTER TABLE health_goals ADD COLUMN best_streak INTEGER DEFAULT 0;
ALTER TABLE health_goals ADD COLUMN progress_history TEXT; -- JSON array of progress points
ALTER TABLE health_goals ADD COLUMN reminder_frequency TEXT; -- how often to remind user
ALTER TABLE health_goals ADD COLUMN is_public BOOLEAN DEFAULT false;
ALTER TABLE health_goals ADD COLUMN shared_with TEXT; -- JSON array of user IDs who can see this goal

-- Enhanced health insights table (add missing columns)
ALTER TABLE health_insights ADD COLUMN category TEXT CHECK(category IN ('nutrition','exercise','sleep','mental_health','hydration','general')) NOT NULL;
ALTER TABLE health_insights ADD COLUMN priority TEXT CHECK(priority IN ('low','medium','high','urgent')) DEFAULT 'medium';
ALTER TABLE health_insights ADD COLUMN action_required BOOLEAN DEFAULT false;
ALTER TABLE health_insights ADD COLUMN action_deadline INTEGER;
ALTER TABLE health_insights ADD COLUMN related_goal_id TEXT REFERENCES health_goals(id);
ALTER TABLE health_insights ADD COLUMN source_data TEXT; -- JSON of data that generated this insight

-- Health data aggregation table
CREATE TABLE health_data_aggregates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  data_type TEXT CHECK(data_type IN ('exercise','nutrition','sleep','mood','hydration','weight','steps')) NOT NULL,
  aggregation_period TEXT CHECK(aggregation_period IN ('daily','weekly','monthly')) NOT NULL,
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,
  total_value REAL,
  average_value REAL,
  min_value REAL,
  max_value REAL,
  count INTEGER DEFAULT 0,
  trend_direction TEXT CHECK(trend_direction IN ('up','down','stable','variable')),
  trend_strength REAL, -- 0-1 how strong the trend is
  created_at INTEGER NOT NULL,
  UNIQUE(user_id, data_type, aggregation_period, period_start)
);

-- Health recommendations table
CREATE TABLE health_recommendations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  recommendation_type TEXT CHECK(recommendation_type IN ('goal_adjustment','habit_formation','lifestyle_change','medical_advice','nutrition_tip','exercise_suggestion')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT CHECK(priority IN ('low','medium','high','urgent')) DEFAULT 'medium',
  category TEXT CHECK(category IN ('nutrition','exercise','sleep','mental_health','hydration','general')) NOT NULL,
  related_goal_id TEXT REFERENCES health_goals(id),
  related_insight_id TEXT REFERENCES health_insights(id),
  action_steps TEXT, -- JSON array of specific steps
  expected_outcome TEXT,
  timeframe_days INTEGER,
  is_accepted BOOLEAN DEFAULT false,
  accepted_at INTEGER,
  is_completed BOOLEAN DEFAULT false,
  completed_at INTEGER,
  created_at INTEGER NOT NULL,
  expires_at INTEGER
);

-- Health milestones and achievements
CREATE TABLE health_milestones (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  goal_id TEXT REFERENCES health_goals(id),
  milestone_type TEXT CHECK(milestone_type IN ('streak','target_reached','improvement','consistency','personal_best')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  achieved_at INTEGER NOT NULL,
  value_achieved REAL,
  previous_value REAL,
  improvement_percentage REAL,
  is_celebrated BOOLEAN DEFAULT false,
  celebration_data TEXT, -- JSON for celebration details
  created_at INTEGER NOT NULL
);

-- Health data validation and quality
CREATE TABLE health_data_quality (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  data_type TEXT CHECK(data_type IN ('exercise','nutrition','sleep','mood','hydration','weight','steps')) NOT NULL,
  quality_score REAL NOT NULL, -- 0-1 quality score
  completeness_score REAL NOT NULL, -- 0-1 how complete the data is
  consistency_score REAL NOT NULL, -- 0-1 how consistent the data is
  accuracy_score REAL, -- 0-1 estimated accuracy
  issues TEXT, -- JSON array of data quality issues
  recommendations TEXT, -- JSON array of improvement recommendations
  measurement_date INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Health data sources and devices
CREATE TABLE health_data_sources (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  source_name TEXT NOT NULL,
  source_type TEXT CHECK(source_type IN ('manual','device','app','api','import')) NOT NULL,
  device_model TEXT,
  app_name TEXT,
  api_provider TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sync_at INTEGER,
  sync_frequency TEXT CHECK(sync_frequency IN ('realtime','hourly','daily','weekly')) DEFAULT 'daily',
  data_types TEXT, -- JSON array of data types this source provides
  reliability_score REAL DEFAULT 0.8, -- 0-1 how reliable this source is
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_health_goals_user_id ON health_goals(user_id);
CREATE INDEX idx_health_goals_type ON health_goals(goal_type);
CREATE INDEX idx_health_goals_active ON health_goals(is_active);
CREATE INDEX idx_health_goals_target_date ON health_goals(target_date);

CREATE INDEX idx_health_insights_user_id ON health_insights(user_id);
CREATE INDEX idx_health_insights_type ON health_insights(insight_type);
CREATE INDEX idx_health_insights_category ON health_insights(category);
CREATE INDEX idx_health_insights_created_at ON health_insights(created_at DESC);
CREATE INDEX idx_health_insights_actionable ON health_insights(is_actionable);

CREATE INDEX idx_health_data_aggregates_user_id ON health_data_aggregates(user_id);
CREATE INDEX idx_health_data_aggregates_type ON health_data_aggregates(data_type);
CREATE INDEX idx_health_data_aggregates_period ON health_data_aggregates(aggregation_period);
CREATE INDEX idx_health_data_aggregates_date ON health_data_aggregates(period_start DESC);

CREATE INDEX idx_health_recommendations_user_id ON health_recommendations(user_id);
CREATE INDEX idx_health_recommendations_type ON health_recommendations(recommendation_type);
CREATE INDEX idx_health_recommendations_priority ON health_recommendations(priority);
CREATE INDEX idx_health_recommendations_accepted ON health_recommendations(is_accepted);
CREATE INDEX idx_health_recommendations_completed ON health_recommendations(is_completed);

CREATE INDEX idx_health_milestones_user_id ON health_milestones(user_id);
CREATE INDEX idx_health_milestones_goal_id ON health_milestones(goal_id);
CREATE INDEX idx_health_milestones_type ON health_milestones(milestone_type);
CREATE INDEX idx_health_milestones_achieved_at ON health_milestones(achieved_at DESC);

CREATE INDEX idx_health_data_quality_user_id ON health_data_quality(user_id);
CREATE INDEX idx_health_data_quality_type ON health_data_quality(data_type);
CREATE INDEX idx_health_data_quality_date ON health_data_quality(measurement_date DESC);

CREATE INDEX idx_health_data_sources_user_id ON health_data_sources(user_id);
CREATE INDEX idx_health_data_sources_type ON health_data_sources(source_type);
CREATE INDEX idx_health_data_sources_active ON health_data_sources(is_active);

-- Create triggers for automatic health data processing
CREATE TRIGGER update_health_goal_streak
AFTER INSERT ON health_logs
WHEN NEW.type = 'exercise' OR NEW.type = 'nutrition' OR NEW.type = 'hydration'
BEGIN
  -- Update streak for related health goals
  UPDATE health_goals 
  SET current_streak = current_streak + 1,
      best_streak = MAX(best_streak, current_streak + 1)
  WHERE user_id = NEW.user_id 
    AND goal_type = NEW.type 
    AND is_active = 1
    AND date(datetime(NEW.recorded_at/1000, 'unixepoch')) = date('now');
END;

-- Create view for health dashboard
CREATE VIEW health_dashboard_view AS
SELECT 
  hg.user_id,
  hg.goal_type,
  COUNT(*) as total_goals,
  COUNT(CASE WHEN hg.is_active = 1 THEN 1 END) as active_goals,
  AVG(hg.progress_percent) as avg_progress,
  MAX(hg.current_streak) as max_streak,
  COUNT(hm.id) as milestones_achieved,
  AVG(hdq.quality_score) as avg_data_quality
FROM health_goals hg
LEFT JOIN health_milestones hm ON hg.id = hm.goal_id
LEFT JOIN health_data_quality hdq ON hg.user_id = hdq.user_id AND hg.goal_type = hdq.data_type
GROUP BY hg.user_id, hg.goal_type;
