-- Migration 024: Calendar Integrations Table
-- Creates tables for calendar integration functionality

-- Calendar integrations (Google, Outlook, Apple, etc.)
CREATE TABLE IF NOT EXISTS calendar_integrations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK(provider_type IN ('google','outlook','apple','exchange')),
  provider_email TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at INTEGER,
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at INTEGER,
  sync_status TEXT DEFAULT 'connected' CHECK(sync_status IN ('connected','disconnected','error','syncing')),
  calendar_list JSON, -- List of calendars from the provider
  sync_settings JSON, -- User preferences for sync
  error_message TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, provider_type, provider_email)
);

-- Activity feed table if it doesn't exist
CREATE TABLE IF NOT EXISTS activity_feed (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  data JSON,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Add missing columns to calendar_events if they don't exist
-- Note: Using IF NOT EXISTS equivalents for ALTER TABLE

-- First, check if we need to add the missing columns to calendar_events
-- Add eventType column if it doesn't exist
ALTER TABLE calendar_events ADD COLUMN eventType TEXT DEFAULT 'appointment' CHECK(eventType IN ('meeting','appointment','task','reminder','break'));

-- Add description column if it doesn't exist
ALTER TABLE calendar_events ADD COLUMN description TEXT;

-- Add location column if it doesn't exist
ALTER TABLE calendar_events ADD COLUMN location TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_user_provider ON calendar_integrations(user_id, provider_type);
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_sync_status ON calendar_integrations(sync_status, last_sync_at);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_type ON activity_feed(user_id, type, created_at);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_type ON calendar_events(eventType, start, "end");