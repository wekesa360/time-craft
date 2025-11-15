-- Migration 035: Add connection invitation tokens table
-- Stores tokens for email-based connection invitations

CREATE TABLE IF NOT EXISTS connection_invitation_tokens (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL REFERENCES user_connections(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invitation_tokens_token ON connection_invitation_tokens(token);
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_connection_id ON connection_invitation_tokens(connection_id);
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_expires_at ON connection_invitation_tokens(expires_at);

