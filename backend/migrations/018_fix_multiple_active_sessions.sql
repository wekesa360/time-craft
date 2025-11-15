-- Fix multiple active sessions issue
-- Add unique constraint to prevent multiple active sessions per user

-- Note: Removed the UPDATE statement that was trying to set is_successful column
-- as it doesn't exist in the schema

-- Add a partial unique index to prevent multiple active sessions per user
-- This will ensure only one session per user can be active (completed_at IS NULL) at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_focus_sessions_one_active_per_user 
ON focus_sessions (user_id) 
WHERE completed_at IS NULL;

-- Note: SQLite doesn't support CHECK constraints with subqueries, so we rely on the unique index above
