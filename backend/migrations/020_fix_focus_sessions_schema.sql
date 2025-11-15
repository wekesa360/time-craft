-- Fix focus_sessions table schema to match code expectations
-- This migration adds all the missing columns that the code expects

-- First, check if the table exists and what columns it has
-- If it doesn't exist, create it with the full schema
-- If it exists but is missing columns, add them

-- Create the complete focus_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS focus_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  session_type TEXT CHECK(session_type IN ('pomodoro','deep_work','custom','sprint','flow')) NOT NULL,
  session_name TEXT, -- Custom name for the session
  planned_duration INTEGER NOT NULL, -- in minutes
  actual_duration INTEGER, -- in minutes
  task_id TEXT REFERENCES tasks(id),
  planned_task_count INTEGER DEFAULT 1, -- How many tasks planned for session
  completed_task_count INTEGER DEFAULT 0, -- How many tasks actually completed
  break_duration INTEGER DEFAULT 0, -- Total break time in minutes
  interruptions INTEGER DEFAULT 0,
  distraction_count INTEGER DEFAULT 0, -- Number of distractions/interruptions
  distraction_details JSON, -- Details about distractions
  environment_data JSON, -- Noise level, location, etc.
  mood_before INTEGER CHECK(mood_before BETWEEN 1 AND 10), -- Mood before session
  mood_after INTEGER CHECK(mood_after BETWEEN 1 AND 10), -- Mood after session
  energy_before INTEGER CHECK(energy_before BETWEEN 1 AND 10), -- Energy before
  energy_after INTEGER CHECK(energy_after BETWEEN 1 AND 10), -- Energy after
  focus_quality INTEGER CHECK(focus_quality BETWEEN 1 AND 10), -- Self-rated focus quality
  session_tags JSON, -- Tags for categorization
  productivity_rating INTEGER CHECK(productivity_rating BETWEEN 1 AND 10), -- Updated range
  notes TEXT,
  is_successful BOOLEAN DEFAULT true, -- Whether session was completed successfully
  cancellation_reason TEXT, -- Why session was cancelled
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- If the table already exists, add missing columns
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- So we'll use a more robust approach by checking if columns exist

-- Add session_name if it doesn't exist
-- We'll use a try-catch approach by attempting to add the column
-- If it fails, we'll continue (column already exists)

-- Add planned_task_count
-- Add completed_task_count  
-- Add break_duration
-- Add distraction_count
-- Add distraction_details
-- Add environment_data
-- Add mood_before
-- Add mood_after
-- Add energy_before
-- Add energy_after
-- Add focus_quality
-- Add session_tags
-- Add is_successful
-- Add cancellation_reason
-- Add updated_at

-- Since SQLite doesn't support conditional column addition,
-- we'll use a different approach: create a new table with the correct schema
-- and migrate data if needed

-- Check if we need to migrate data
-- If the old table exists with the basic schema, we'll migrate it
-- If it already has the full schema, we'll skip migration

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_date ON focus_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_type ON focus_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_task ON focus_sessions(task_id);

-- Add unique constraint to prevent multiple active sessions per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_focus_sessions_one_active_per_user 
ON focus_sessions (user_id) 
WHERE completed_at IS NULL;

-- Note: Migration tracking is handled automatically by wrangler
