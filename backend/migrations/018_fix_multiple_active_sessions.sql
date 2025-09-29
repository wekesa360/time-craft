-- Fix multiple active sessions issue
-- Add unique constraint to prevent multiple active sessions per user

-- First, cancel any existing multiple active sessions
UPDATE focus_sessions
SET
  is_successful = 0,
  completed_at = updated_at,
  updated_at = updated_at
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY started_at DESC) as rn
    FROM focus_sessions
    WHERE completed_at IS NULL
  ) ranked
  WHERE rn > 1
);

-- Add a partial unique index to prevent multiple active sessions per user
-- This will ensure only one session per user can be active (completed_at IS NULL) at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_focus_sessions_one_active_per_user 
ON focus_sessions (user_id) 
WHERE completed_at IS NULL;

-- Add a check constraint to ensure data integrity
-- Note: SQLite doesn't support CHECK constraints with subqueries, so we rely on the unique index above
