-- Fix productivity_rating range from 1-5 to 1-10
-- Update the CHECK constraint to allow ratings from 1 to 10

-- First, check if we need to update the productivity_rating column
-- We'll use a more robust approach that works with the current schema

-- Check if the productivity_rating column exists and has the correct constraint
-- If not, add or modify it

-- First, create a new table with the correct schema
CREATE TABLE focus_sessions_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_type TEXT CHECK(session_type IN ('pomodoro', 'deep_work', 'custom', 'sprint', 'flow', 'exercise', 'meditation')) NOT NULL,
  planned_duration INTEGER CHECK(planned_duration > 0) NOT NULL,
  actual_duration INTEGER CHECK(actual_duration > 0),
  task_id TEXT,
  interruptions INTEGER DEFAULT 0,
  productivity_rating INTEGER CHECK(productivity_rating IS NULL OR (productivity_rating >= 1 AND productivity_rating <= 10)),
  notes TEXT,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  created_at INTEGER NOT NULL
);

-- Copy data from the old table to the new one, handling potential missing columns
INSERT INTO focus_sessions_new (
  id, user_id, session_type, planned_duration, actual_duration,
  task_id, interruptions, productivity_rating, notes,
  started_at, completed_at, created_at
)
SELECT 
  id, user_id, session_type, planned_duration, actual_duration,
  task_id, interruptions, 
  CASE 
    WHEN productivity_rating > 5 THEN productivity_rating  -- If already using >5, keep as is
    WHEN productivity_rating = 5 THEN 10                   -- Map 5 to 10
    WHEN productivity_rating = 4 THEN 8                    -- Map 4 to 8
    WHEN productivity_rating = 3 THEN 6                    -- Map 3 to 6
    WHEN productivity_rating = 2 THEN 4                    -- Map 2 to 4
    WHEN productivity_rating = 1 THEN 2                    -- Map 1 to 2
    ELSE NULL
  END as productivity_rating,
  notes,
  started_at, completed_at, created_at
FROM focus_sessions;

-- Drop the old table and rename the new one
DROP TABLE focus_sessions;
ALTER TABLE focus_sessions_new RENAME TO focus_sessions;
