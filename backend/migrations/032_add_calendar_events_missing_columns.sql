-- Migration 032: Add missing columns to calendar_events table
-- Adds status, is_all_day, updated_at, and external_id columns
-- Note: Migration 024 already added description, location, and eventType
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we'll only add columns that don't exist

-- Add status column (doesn't exist yet)
ALTER TABLE calendar_events ADD COLUMN status TEXT DEFAULT 'confirmed' CHECK(status IN ('confirmed','tentative','cancelled'));

-- Add is_all_day column (doesn't exist yet)
ALTER TABLE calendar_events ADD COLUMN is_all_day BOOLEAN DEFAULT 0;

-- Add updated_at column (doesn't exist yet)
ALTER TABLE calendar_events ADD COLUMN updated_at INTEGER;

-- Add external_id column (doesn't exist yet)
ALTER TABLE calendar_events ADD COLUMN external_id TEXT;

-- Update existing records to have updated_at = created_at if it's null
UPDATE calendar_events SET updated_at = created_at WHERE updated_at IS NULL;

-- Update existing records to have status = 'confirmed' if it's null
UPDATE calendar_events SET status = 'confirmed' WHERE status IS NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status, user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_is_all_day ON calendar_events(is_all_day, user_id);
