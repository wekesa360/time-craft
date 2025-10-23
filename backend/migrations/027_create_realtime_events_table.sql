-- Migration: Create realtime_events table for polling-based real-time updates
-- This table stores events that can be polled by clients instead of using SSE

CREATE TABLE IF NOT EXISTS realtime_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data TEXT NOT NULL, -- JSON string
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL -- Auto-cleanup after expiration
);

-- Create index for efficient polling queries
CREATE INDEX IF NOT EXISTS idx_realtime_events_user_time ON realtime_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_realtime_events_expires ON realtime_events(expires_at);

-- Create index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_realtime_events_cleanup ON realtime_events(created_at);
