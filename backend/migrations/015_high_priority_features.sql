-- Migration 015: High Priority Features
-- Adds tables for real-time features, mobile platform, and security enhancements

-- Real-time SSE connections
CREATE TABLE IF NOT EXISTS sse_connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  last_ping INTEGER NOT NULL,
  subscriptions TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Calendar conflicts for real-time sync
CREATE TABLE IF NOT EXISTS calendar_conflicts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  local_event_id TEXT NOT NULL,
  remote_event_id TEXT NOT NULL,
  conflict_type TEXT NOT NULL,
  resolution TEXT DEFAULT 'pending',
  local_event_data TEXT,
  remote_event_data TEXT,
  created_at INTEGER NOT NULL,
  resolved_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Recurring event instances
CREATE TABLE IF NOT EXISTS calendar_event_instances (
  id TEXT PRIMARY KEY,
  master_event_id TEXT NOT NULL,
  start_time INTEGER NOT NULL,
  end_time INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (master_event_id) REFERENCES calendar_events(id)
);

-- Mobile devices
CREATE TABLE IF NOT EXISTS mobile_devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  device_token TEXT NOT NULL,
  platform TEXT NOT NULL,
  app_version TEXT,
  os_version TEXT,
  last_seen INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  capabilities TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Push notifications
CREATE TABLE IF NOT EXISTS push_notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data TEXT,
  type TEXT NOT NULL,
  scheduled_for INTEGER,
  sent_at INTEGER,
  status TEXT DEFAULT 'pending',
  platform TEXT NOT NULL,
  device_token TEXT,
  one_signal_id TEXT,
  error_message TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Audit logs for security
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  details TEXT,
  ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  severity TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Security events
CREATE TABLE IF NOT EXISTS security_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  user_id TEXT,
  ip_address TEXT NOT NULL,
  details TEXT,
  severity TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  resolved BOOLEAN DEFAULT false,
  resolved_at INTEGER,
  resolved_by TEXT
);

-- Compliance reports
CREATE TABLE IF NOT EXISTS compliance_reports (
  report_id TEXT PRIMARY KEY,
  report_type TEXT NOT NULL,
  generated_at INTEGER NOT NULL,
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,
  data TEXT,
  compliance TEXT
);

-- Migration backups
CREATE TABLE IF NOT EXISTS migration_backups (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  table_count INTEGER NOT NULL,
  total_records INTEGER NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sse_connections_user_id ON sse_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_conflicts_user_id ON calendar_conflicts(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_conflicts_resolution ON calendar_conflicts(resolution);
CREATE INDEX IF NOT EXISTS idx_calendar_event_instances_master ON calendar_event_instances(master_event_id);
CREATE INDEX IF NOT EXISTS idx_mobile_devices_user_id ON mobile_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_mobile_devices_platform ON mobile_devices(platform);
CREATE INDEX IF NOT EXISTS idx_push_notifications_user_id ON push_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_push_notifications_status ON push_notifications(status);
CREATE INDEX IF NOT EXISTS idx_push_notifications_type ON push_notifications(type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_resolved ON security_events(resolved);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_type ON compliance_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_generated ON compliance_reports(generated_at);

-- Add mobile settings to users table
ALTER TABLE users ADD COLUMN mobile_settings TEXT DEFAULT '{}';
ALTER TABLE users ADD COLUMN security_settings TEXT DEFAULT '{}';
ALTER TABLE users ADD COLUMN last_offline_sync INTEGER DEFAULT 0;
