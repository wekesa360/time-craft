-- Create calendar_connections table for external calendar integrations
CREATE TABLE IF NOT EXISTS calendar_connections (
  id TEXT PRIMARY KEY DEFAULT ('conn_' || lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL, -- 'google', 'outlook', 'apple', 'exchange'
  provider_account_id TEXT NOT NULL, -- The external account identifier
  provider_account_email TEXT NOT NULL,
  display_name TEXT,
  access_token TEXT, -- Encrypted access token
  refresh_token TEXT, -- Encrypted refresh token
  token_expires_at INTEGER, -- Unix timestamp when access token expires
  scopes TEXT, -- JSON array of granted scopes
  calendar_list TEXT, -- JSON array of available calendars
  sync_enabled BOOLEAN DEFAULT 1,
  sync_calendars TEXT, -- JSON array of calendar IDs to sync
  last_sync_at INTEGER, -- Unix timestamp of last successful sync
  sync_status TEXT DEFAULT 'pending', -- 'pending', 'active', 'error', 'paused'
  sync_error TEXT, -- Last sync error message if any
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, provider, provider_account_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_calendar_connections_user_id ON calendar_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_connections_provider ON calendar_connections(provider);
CREATE INDEX IF NOT EXISTS idx_calendar_connections_sync_status ON calendar_connections(sync_status);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_calendar_connections_timestamp
  AFTER UPDATE ON calendar_connections
  FOR EACH ROW
  BEGIN
    UPDATE calendar_connections SET updated_at = unixepoch() WHERE id = NEW.id;
  END;