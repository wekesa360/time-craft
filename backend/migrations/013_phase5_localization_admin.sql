-- Phase 5: German Localization & Admin Dashboard Migration
-- Adds comprehensive German localization and admin management features

-- Enhanced localization system
CREATE TABLE IF NOT EXISTS localization_keys (
    id TEXT PRIMARY KEY,
    key_name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Localized pricing for different regions
CREATE TABLE IF NOT EXISTS localized_pricing (
    id TEXT PRIMARY KEY,
    subscription_type TEXT NOT NULL,
    currency TEXT NOT NULL,
    price_monthly REAL NOT NULL,
    price_yearly REAL NOT NULL,
    country_code TEXT NOT NULL,
    tax_rate REAL DEFAULT 0.0,
    is_active BOOLEAN DEFAULT true,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Admin users and permissions
CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator', 'support')),
    permissions TEXT NOT NULL, -- JSON array of permissions
    is_active BOOLEAN DEFAULT true,
    created_by TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES admin_users(id)
);

-- System analytics and metrics
CREATE TABLE IF NOT EXISTS system_metrics (
    id TEXT PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_value REAL NOT NULL,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('counter', 'gauge', 'histogram')),
    tags TEXT, -- JSON object for additional metadata
    recorded_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);

-- Content management for dynamic content
CREATE TABLE IF NOT EXISTS managed_content (
    id TEXT PRIMARY KEY,
    content_type TEXT NOT NULL CHECK (content_type IN ('announcement', 'tip', 'feature_highlight', 'maintenance')),
    title_en TEXT NOT NULL,
    title_de TEXT NOT NULL,
    content_en TEXT NOT NULL,
    content_de TEXT NOT NULL,
    target_audience TEXT, -- JSON array: ['free', 'standard', 'premium', 'student']
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    start_date INTEGER,
    end_date INTEGER,
    created_by TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (created_by) REFERENCES admin_users(id)
);

-- User feedback and support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('bug', 'feature_request', 'billing', 'technical_support', 'general')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'waiting_user', 'resolved', 'closed')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'en',
    assigned_to TEXT,
    resolution TEXT,
    resolved_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES admin_users(id)
);

-- Audit log for admin actions
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id TEXT PRIMARY KEY,
    admin_user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    old_values TEXT, -- JSON
    new_values TEXT, -- JSON
    ip_address TEXT,
    user_agent TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (admin_user_id) REFERENCES admin_users(id)
);

-- Feature flags for A/B testing and gradual rollouts
CREATE TABLE IF NOT EXISTS feature_flags (
    id TEXT PRIMARY KEY,
    flag_name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_enabled BOOLEAN DEFAULT false,
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    target_groups TEXT, -- JSON array of user groups
    created_by TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (created_by) REFERENCES admin_users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_localization_keys_category ON localization_keys(category);
CREATE INDEX IF NOT EXISTS idx_localized_pricing_currency ON localized_pricing(currency, country_code);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role, is_active);
CREATE INDEX IF NOT EXISTS idx_system_metrics_name_time ON system_metrics(metric_name, recorded_at);
CREATE INDEX IF NOT EXISTS idx_managed_content_type_active ON managed_content(content_type, is_active);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status, priority);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_time ON admin_audit_log(admin_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(is_enabled);

-- Insert localization keys for better organization
INSERT INTO localization_keys (id, key_name, category, description, created_at, updated_at)
VALUES 
    ('lk_1', 'app.name', 'branding', 'Application name', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
    ('lk_2', 'app.tagline', 'branding', 'Application tagline', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
    ('lk_3', 'navigation.dashboard', 'navigation', 'Dashboard menu item', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
    ('lk_4', 'navigation.tasks', 'navigation', 'Tasks menu item', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
    ('lk_5', 'navigation.calendar', 'navigation', 'Calendar menu item', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
    ('lk_6', 'navigation.health', 'navigation', 'Health menu item', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
    ('lk_7', 'navigation.focus', 'navigation', 'Focus sessions menu item', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
    ('lk_8', 'navigation.habits', 'navigation', 'Habits menu item', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
    ('lk_9', 'navigation.social', 'navigation', 'Social features menu item', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
    ('lk_10', 'navigation.settings', 'navigation', 'Settings menu item', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- Insert German pricing (EUR)
INSERT INTO localized_pricing (id, subscription_type, currency, price_monthly, price_yearly, country_code, tax_rate, created_at, updated_at)
VALUES 
    ('price_de_1', 'free', 'EUR', 0.00, 0.00, 'DE', 0.19, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
    ('price_de_2', 'standard', 'EUR', 9.99, 99.99, 'DE', 0.19, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
    ('price_de_3', 'premium', 'EUR', 19.99, 199.99, 'DE', 0.19, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
    ('price_de_4', 'student', 'EUR', 4.99, 49.99, 'DE', 0.19, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- Insert Austrian pricing (EUR)
INSERT INTO localized_pricing (id, subscription_type, currency, price_monthly, price_yearly, country_code, tax_rate, created_at, updated_at)
VALUES 
    ('price_at_1', 'free', 'EUR', 0.00, 0.00, 'AT', 0.20, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
    ('price_at_2', 'standard', 'EUR', 9.99, 99.99, 'AT', 0.20, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
    ('price_at_3', 'premium', 'EUR', 19.99, 199.99, 'AT', 0.20, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
    ('price_at_4', 'student', 'EUR', 4.99, 49.99, 'AT', 0.20, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- Insert Swiss pricing (CHF)
INSERT INTO localized_pricing (id, subscription_type, currency, price_monthly, price_yearly, country_code, tax_rate, created_at, updated_at)
VALUES 
    ('price_ch_1', 'free', 'CHF', 0.00, 0.00, 'CH', 0.077, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
    ('price_ch_2', 'standard', 'CHF', 10.99, 109.99, 'CH', 0.077, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
    ('price_ch_3', 'premium', 'CHF', 21.99, 219.99, 'CH', 0.077, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
    ('price_ch_4', 'student', 'CHF', 5.49, 54.99, 'CH', 0.077, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- Create default super admin (will be updated with real credentials)
INSERT INTO admin_users (id, user_id, role, permissions, created_at, updated_at)
VALUES (
    'admin_1',
    'user_1', -- This should be updated to a real admin user
    'super_admin',
    '["user_management", "content_management", "system_monitoring", "billing_management", "support_management", "analytics_access", "feature_flags"]',
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
);

-- Insert sample managed content
INSERT INTO managed_content (id, content_type, title_en, title_de, content_en, content_de, target_audience, priority, created_by, created_at, updated_at)
VALUES 
    ('content_1', 'tip', 'Daily Productivity Tip', 'Täglicher Produktivitätstipp', 
     'Try the 2-minute rule: if a task takes less than 2 minutes, do it immediately!', 
     'Probieren Sie die 2-Minuten-Regel: Wenn eine Aufgabe weniger als 2 Minuten dauert, erledigen Sie sie sofort!',
     '["free", "standard", "premium", "student"]', 5, 'admin_1', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
    ('content_2', 'feature_highlight', 'New AI Meeting Scheduler', 'Neuer KI-Meeting-Planer',
     'Our AI can now automatically find the best meeting times for all participants!',
     'Unsere KI kann jetzt automatisch die besten Meeting-Zeiten für alle Teilnehmer finden!',
     '["standard", "premium"]', 8, 'admin_1', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- Insert feature flags
INSERT INTO feature_flags (id, flag_name, description, is_enabled, rollout_percentage, target_groups, created_by, created_at, updated_at)
VALUES 
    ('ff_1', 'ai_insights_v2', 'Enhanced AI insights with better recommendations', false, 0, '["premium"]', 'admin_1', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
    ('ff_2', 'german_voice_processing', 'German language support for voice processing', true, 100, '["standard", "premium"]', 'admin_1', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
    ('ff_3', 'social_challenges_v2', 'Enhanced social challenges with team features', false, 25, '["premium"]', 'admin_1', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);