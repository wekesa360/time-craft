-- Health Goals and Advanced Health Features Migration
-- Adds health goal tracking, nutrition analysis, and health insights

-- Create health goals table
CREATE TABLE health_goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  goal_type TEXT CHECK(goal_type IN ('weight_loss','weight_gain','muscle_gain','endurance','strength','nutrition','hydration','sleep','mood','custom')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_value REAL,
  target_unit TEXT, -- kg, lbs, minutes, hours, glasses, etc.
  current_value REAL DEFAULT 0,
  start_date INTEGER NOT NULL,
  target_date INTEGER NOT NULL,
  status TEXT CHECK(status IN ('active','completed','paused','cancelled')) DEFAULT 'active',
  priority INTEGER CHECK(priority BETWEEN 1 AND 5) DEFAULT 3,
  reminder_frequency TEXT, -- daily, weekly, etc.
  tracking_method TEXT CHECK(tracking_method IN ('manual','automatic','device')) DEFAULT 'manual',
  milestones JSON, -- array of milestone objects
  progress_notes JSON, -- array of progress note objects
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Create health goal progress tracking
CREATE TABLE health_goal_progress (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL REFERENCES health_goals(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  progress_value REAL NOT NULL,
  progress_percentage REAL NOT NULL,
  notes TEXT,
  recorded_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Create nutrition analysis cache table
CREATE TABLE nutrition_analysis (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  analysis_date INTEGER NOT NULL, -- date for which analysis was done
  total_calories REAL,
  macros JSON, -- protein, carbs, fat, fiber breakdown
  micronutrients JSON, -- vitamins, minerals
  meal_distribution JSON, -- calories per meal type
  nutritional_score REAL, -- overall nutrition score 1-10
  recommendations JSON, -- array of recommendation objects
  deficiencies JSON, -- array of nutrient deficiencies
  created_at INTEGER NOT NULL,
  UNIQUE(user_id, analysis_date)
);

-- Create health insights table
CREATE TABLE health_insights (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  insight_type TEXT CHECK(insight_type IN ('trend','correlation','recommendation','achievement','warning')) NOT NULL,
  category TEXT CHECK(category IN ('exercise','nutrition','mood','sleep','hydration','overall')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence_score REAL CHECK(confidence_score BETWEEN 0 AND 1),
  data_points JSON, -- supporting data for the insight
  action_items JSON, -- suggested actions
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  priority INTEGER CHECK(priority BETWEEN 1 AND 5) DEFAULT 3,
  expires_at INTEGER, -- when insight becomes irrelevant
  created_at INTEGER NOT NULL
);

-- Create health dashboard configuration
CREATE TABLE health_dashboard_config (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  widget_layout JSON NOT NULL, -- array of widget configurations
  preferred_metrics JSON, -- user's preferred health metrics to display
  chart_preferences JSON, -- chart types, time ranges, etc.
  notification_settings JSON, -- insight notification preferences
  updated_at INTEGER NOT NULL
);

-- Add indexes for performance
CREATE INDEX idx_health_goals_user_status ON health_goals(user_id, status);
CREATE INDEX idx_health_goals_type_status ON health_goals(goal_type, status);
CREATE INDEX idx_health_goals_target_date ON health_goals(target_date);

CREATE INDEX idx_health_goal_progress_goal ON health_goal_progress(goal_id, recorded_at);
CREATE INDEX idx_health_goal_progress_user ON health_goal_progress(user_id, recorded_at);

CREATE INDEX idx_nutrition_analysis_user_date ON nutrition_analysis(user_id, analysis_date);

CREATE INDEX idx_health_insights_user_type ON health_insights(user_id, insight_type);
CREATE INDEX idx_health_insights_category ON health_insights(category, created_at);
CREATE INDEX idx_health_insights_priority ON health_insights(priority, created_at);
CREATE INDEX idx_health_insights_unread ON health_insights(user_id, is_read, created_at);