-- Fix productivity_rating range from 1-5 to 1-10
-- Update the CHECK constraint to allow ratings from 1 to 10

-- First, drop the existing CHECK constraint
-- Note: SQLite doesn't support DROP CONSTRAINT directly, so we need to recreate the table

-- Create a temporary table with the correct schema
CREATE TABLE focus_sessions_temp AS
SELECT
  id,
  user_id,
  session_type,
  session_name,
  planned_duration,
  actual_duration,
  task_id,
  planned_task_count,
  completed_task_count,
  break_duration,
  interruptions,
  distraction_count,
  environment_data,
  mood_before,
  energy_before,
  mood_after,
  energy_after,
  focus_quality,
  session_tags,
  is_successful,
  started_at,
  completed_at,
  created_at,
  updated_at
FROM focus_sessions;

-- Drop the original table
DROP TABLE focus_sessions;

-- Recreate the table with the correct productivity_rating constraint
CREATE TABLE focus_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_type TEXT CHECK(session_type IN ('pomodoro', 'deep_work', 'custom', 'sprint', 'flow', 'exercise', 'meditation')) NOT NULL,
  session_name TEXT,
  planned_duration INTEGER CHECK(planned_duration > 0) NOT NULL,
  actual_duration INTEGER CHECK(actual_duration > 0),
  task_id TEXT,
  planned_task_count INTEGER CHECK(planned_task_count > 0) DEFAULT 1,
  completed_task_count INTEGER CHECK(completed_task_count >= 0) DEFAULT 0,
  break_duration INTEGER CHECK(break_duration >= 0) DEFAULT 0,
  interruptions INTEGER CHECK(interruptions >= 0) DEFAULT 0,
  distraction_count INTEGER CHECK(distraction_count >= 0) DEFAULT 0,
  distraction_details TEXT,
  environment_data TEXT,
  mood_before INTEGER CHECK(mood_before BETWEEN 1 AND 10),
  mood_after INTEGER CHECK(mood_after BETWEEN 1 AND 10),
  energy_before INTEGER CHECK(energy_before BETWEEN 1 AND 10),
  energy_after INTEGER CHECK(energy_after BETWEEN 1 AND 10),
  focus_quality INTEGER CHECK(focus_quality BETWEEN 1 AND 10),
  session_tags TEXT,
  productivity_rating INTEGER CHECK(productivity_rating BETWEEN 1 AND 10),
  notes TEXT,
  is_successful INTEGER CHECK(is_successful IN (0, 1)) DEFAULT 1,
  cancellation_reason TEXT,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Copy data back from temporary table
INSERT INTO focus_sessions (
  id,
  user_id,
  session_type,
  session_name,
  planned_duration,
  actual_duration,
  task_id,
  planned_task_count,
  completed_task_count,
  break_duration,
  interruptions,
  distraction_count,
  distraction_details,
  environment_data,
  mood_before,
  mood_after,
  energy_before,
  energy_after,
  focus_quality,
  session_tags,
  productivity_rating,
  notes,
  is_successful,
  cancellation_reason,
  started_at,
  completed_at,
  created_at,
  updated_at
) SELECT
  id,
  user_id,
  session_type,
  session_name,
  planned_duration,
  actual_duration,
  task_id,
  planned_task_count,
  completed_task_count,
  break_duration,
  interruptions,
  distraction_count,
  NULL as distraction_details,
  environment_data,
  mood_before,
  mood_after,
  energy_before,
  energy_after,
  focus_quality,
  session_tags,
  5 as productivity_rating, -- Default rating of 5 for existing records
  NULL as notes,
  is_successful,
  NULL as cancellation_reason,
  started_at,
  completed_at,
  created_at,
  updated_at
FROM focus_sessions_temp;

-- Drop the temporary table
DROP TABLE focus_sessions_temp;

-- Recreate indexes
CREATE INDEX idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX idx_focus_sessions_started_at ON focus_sessions(started_at DESC);
CREATE INDEX idx_focus_sessions_completed_at ON focus_sessions(completed_at DESC);
CREATE INDEX idx_focus_sessions_successful ON focus_sessions(is_successful, productivity_rating DESC);
CREATE INDEX idx_focus_sessions_type ON focus_sessions(session_type);
