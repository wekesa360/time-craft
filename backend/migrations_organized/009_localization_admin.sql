-- Phase 5: Localization and Admin Features
-- Advanced localization, admin dashboard, and system management

-- Enhanced localization_content table (add missing columns)
ALTER TABLE localization_content ADD COLUMN content_type TEXT CHECK(content_type IN ('text','html','markdown','json','template')) DEFAULT 'text';
ALTER TABLE localization_content ADD COLUMN is_plural BOOLEAN DEFAULT false;
ALTER TABLE localization_content ADD COLUMN plural_forms TEXT; -- JSON array of plural forms
ALTER TABLE localization_content ADD COLUMN variables TEXT; -- JSON array of variable placeholders
ALTER TABLE localization_content ADD COLUMN is_rtl BOOLEAN DEFAULT false; -- Right-to-left languages
ALTER TABLE localization_content ADD COLUMN last_used_at INTEGER;
ALTER TABLE localization_content ADD COLUMN usage_count INTEGER DEFAULT 0;

-- Enhanced admin_users table (add missing columns)
ALTER TABLE admin_users ADD COLUMN permissions_json TEXT; -- JSON detailed permissions
ALTER TABLE admin_users ADD COLUMN last_login_at INTEGER;
ALTER TABLE admin_users ADD COLUMN login_count INTEGER DEFAULT 0;
ALTER TABLE admin_users ADD COLUMN is_super_admin BOOLEAN DEFAULT false;
ALTER TABLE admin_users ADD COLUMN can_manage_users BOOLEAN DEFAULT false;
ALTER TABLE admin_users ADD COLUMN can_manage_content BOOLEAN DEFAULT false;
ALTER TABLE admin_users ADD COLUMN can_view_analytics BOOLEAN DEFAULT false;
ALTER TABLE admin_users ADD COLUMN can_manage_system BOOLEAN DEFAULT false;

-- Enhanced feature_flags table (add missing columns)
ALTER TABLE feature_flags ADD COLUMN flag_type TEXT CHECK(flag_type IN ('boolean','percentage','user_list','experiment')) DEFAULT 'boolean';
ALTER TABLE feature_flags ADD COLUMN rollout_strategy TEXT; -- JSON rollout strategy
ALTER TABLE feature_flags ADD COLUMN target_conditions TEXT; -- JSON conditions for targeting
ALTER TABLE feature_flags ADD COLUMN metrics TEXT; -- JSON metrics to track
ALTER TABLE feature_flags ADD COLUMN last_modified_by TEXT REFERENCES admin_users(id);
ALTER TABLE feature_flags ADD COLUMN last_modified_at INTEGER;

-- System configuration table
CREATE TABLE system_config (
  id TEXT PRIMARY KEY,
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  config_type TEXT CHECK(config_type IN ('string','number','boolean','json','array')) NOT NULL,
  category TEXT CHECK(category IN ('general','security','features','integrations','ui','performance')) NOT NULL,
  description TEXT,
  is_encrypted BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false, -- Can be exposed to frontend
  last_modified_by TEXT REFERENCES admin_users(id),
  last_modified_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Admin activity logs
CREATE TABLE admin_activity_logs (
  id TEXT PRIMARY KEY,
  admin_user_id TEXT NOT NULL REFERENCES admin_users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  old_values TEXT, -- JSON of old values
  new_values TEXT, -- JSON of new values
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  timestamp INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- System health monitoring
CREATE TABLE system_health_checks (
  id TEXT PRIMARY KEY,
  check_name TEXT NOT NULL,
  check_type TEXT CHECK(check_type IN ('database','api','external_service','performance','security')) NOT NULL,
  status TEXT CHECK(status IN ('healthy','degraded','unhealthy','unknown')) NOT NULL,
  response_time_ms INTEGER,
  error_message TEXT,
  metadata TEXT, -- JSON additional data
  checked_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- User activity analytics
CREATE TABLE user_activity_analytics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  activity_type TEXT CHECK(activity_type IN ('login','logout','feature_usage','api_call','page_view','action')) NOT NULL,
  feature_name TEXT,
  session_id TEXT,
  duration_seconds INTEGER,
  metadata TEXT, -- JSON additional data
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL
);

-- Content moderation
CREATE TABLE content_moderation (
  id TEXT PRIMARY KEY,
  content_type TEXT CHECK(content_type IN ('post','comment','profile','challenge','group')) NOT NULL,
  content_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  moderator_id TEXT REFERENCES admin_users(id),
  action TEXT CHECK(action IN ('approve','reject','flag','hide','delete','warn')) NOT NULL,
  reason TEXT,
  severity TEXT CHECK(severity IN ('low','medium','high','critical')) DEFAULT 'medium',
  is_resolved BOOLEAN DEFAULT false,
  resolved_at INTEGER,
  created_at INTEGER NOT NULL
);

-- System maintenance logs
CREATE TABLE system_maintenance_logs (
  id TEXT PRIMARY KEY,
  maintenance_type TEXT CHECK(maintenance_type IN ('scheduled','emergency','update','backup','migration')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time INTEGER NOT NULL,
  end_time INTEGER,
  status TEXT CHECK(status IN ('scheduled','in_progress','completed','failed','cancelled')) NOT NULL,
  affected_services TEXT, -- JSON array of affected services
  downtime_minutes INTEGER,
  performed_by TEXT REFERENCES admin_users(id),
  created_at INTEGER NOT NULL
);

-- API rate limiting
CREATE TABLE api_rate_limits (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start INTEGER NOT NULL,
  window_end INTEGER NOT NULL,
  is_blocked BOOLEAN DEFAULT false,
  blocked_until INTEGER,
  created_at INTEGER NOT NULL
);

-- System alerts and notifications
CREATE TABLE system_alerts (
  id TEXT PRIMARY KEY,
  alert_type TEXT CHECK(alert_type IN ('error','warning','info','success')) NOT NULL,
  severity TEXT CHECK(severity IN ('low','medium','high','critical')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT NOT NULL, -- Which system component
  is_active BOOLEAN DEFAULT true,
  acknowledged_by TEXT REFERENCES admin_users(id),
  acknowledged_at INTEGER,
  resolved_by TEXT REFERENCES admin_users(id),
  resolved_at INTEGER,
  metadata TEXT, -- JSON additional data
  created_at INTEGER NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_localization_content_key_lang ON localized_content(content_key, language);
CREATE INDEX idx_localization_content_type ON localized_content(content_type);
CREATE INDEX idx_localization_content_usage ON localized_content(usage_count DESC);

CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_permissions ON admin_users(permissions);
CREATE INDEX idx_admin_users_last_login ON admin_users(last_login_at DESC);

CREATE INDEX idx_feature_flags_name ON feature_flags(name);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled);
CREATE INDEX idx_feature_flags_type ON feature_flags(flag_type);

CREATE INDEX idx_system_config_key ON system_config(config_key);
CREATE INDEX idx_system_config_category ON system_config(category);
CREATE INDEX idx_system_config_public ON system_config(is_public);

CREATE INDEX idx_admin_activity_logs_admin_id ON admin_activity_logs(admin_user_id);
CREATE INDEX idx_admin_activity_logs_action ON admin_activity_logs(action);
CREATE INDEX idx_admin_activity_logs_timestamp ON admin_activity_logs(timestamp DESC);

CREATE INDEX idx_system_health_checks_type ON system_health_checks(check_type);
CREATE INDEX idx_system_health_checks_status ON system_health_checks(status);
CREATE INDEX idx_system_health_checks_checked_at ON system_health_checks(checked_at DESC);

CREATE INDEX idx_user_activity_analytics_user_id ON user_activity_analytics(user_id);
CREATE INDEX idx_user_activity_analytics_type ON user_activity_analytics(activity_type);
CREATE INDEX idx_user_activity_analytics_created_at ON user_activity_analytics(created_at DESC);

CREATE INDEX idx_content_moderation_content_type ON content_moderation(content_type);
CREATE INDEX idx_content_moderation_user_id ON content_moderation(user_id);
CREATE INDEX idx_content_moderation_resolved ON content_moderation(is_resolved);

CREATE INDEX idx_system_maintenance_logs_type ON system_maintenance_logs(maintenance_type);
CREATE INDEX idx_system_maintenance_logs_status ON system_maintenance_logs(status);
CREATE INDEX idx_system_maintenance_logs_start_time ON system_maintenance_logs(start_time DESC);

CREATE INDEX idx_api_rate_limits_user_id ON api_rate_limits(user_id);
CREATE INDEX idx_api_rate_limits_endpoint ON api_rate_limits(endpoint);
CREATE INDEX idx_api_rate_limits_window ON api_rate_limits(window_start, window_end);

CREATE INDEX idx_system_alerts_type ON system_alerts(alert_type);
CREATE INDEX idx_system_alerts_severity ON system_alerts(severity);
CREATE INDEX idx_system_alerts_active ON system_alerts(is_active);
CREATE INDEX idx_system_alerts_created_at ON system_alerts(created_at DESC);

-- Create triggers for automatic logging
CREATE TRIGGER log_admin_activity
AFTER UPDATE ON system_config
BEGIN
  INSERT INTO admin_activity_logs (
    id, admin_user_id, action, resource_type, resource_id,
    old_values, new_values, timestamp, created_at
  ) VALUES (
    'admin_log_' || strftime('%s', 'now') || '_' || NEW.id,
    NEW.last_modified_by,
    'update',
    'system_config',
    NEW.id,
    json_object('value', OLD.config_value),
    json_object('value', NEW.config_value),
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
  );
END;

-- Create view for admin dashboard
CREATE VIEW admin_dashboard_view AS
SELECT 
  'users' as metric_type,
  COUNT(*) as total_count,
  COUNT(CASE WHEN created_at > strftime('%s', 'now', '-30 days') * 1000 THEN 1 END) as last_30_days,
  COUNT(CASE WHEN is_student = 1 THEN 1 END) as students
FROM users
UNION ALL
SELECT 
  'tasks' as metric_type,
  COUNT(*) as total_count,
  COUNT(CASE WHEN created_at > strftime('%s', 'now', '-30 days') * 1000 THEN 1 END) as last_30_days,
  COUNT(CASE WHEN status = 'done' THEN 1 END) as completed
FROM tasks
UNION ALL
SELECT 
  'health_logs' as metric_type,
  COUNT(*) as total_count,
  COUNT(CASE WHEN recorded_at > strftime('%s', 'now', '-30 days') * 1000 THEN 1 END) as last_30_days,
  COUNT(CASE WHEN type = 'exercise' THEN 1 END) as exercise_logs
FROM health_logs;
