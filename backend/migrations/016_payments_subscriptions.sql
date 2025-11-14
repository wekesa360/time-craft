-- Payments and Subscriptions Schema Migration
-- Create comprehensive payment and subscription tables

-- User subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT CHECK(status IN ('active','canceled','past_due','unpaid','incomplete','trialing')) DEFAULT 'active',
  current_period_start INTEGER NOT NULL,
  current_period_end INTEGER NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'USD',
  interval_type TEXT CHECK(interval_type IN ('month','year')) DEFAULT 'month',
  features TEXT, -- JSON array of features
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  stripe_payment_method_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- card, bank_account, etc.
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Payment history/invoices table
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  subscription_id TEXT,
  stripe_invoice_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'USD',
  status TEXT CHECK(status IN ('pending','succeeded','failed','canceled')) DEFAULT 'pending',
  description TEXT,
  invoice_url TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id)
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  resource_type TEXT NOT NULL, -- tasks, ai_requests, storage, etc.
  amount INTEGER NOT NULL,
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Webhook events table for audit trail
CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed BOOLEAN DEFAULT 0,
  error_message TEXT,
  created_at INTEGER NOT NULL,
  processed_at INTEGER
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_id ON user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_period ON usage_tracking(user_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_id ON webhook_events(stripe_event_id);

-- Insert default subscription plans
INSERT OR IGNORE INTO subscription_plans (
  id, name, description, price, currency, interval_type, features, 
  stripe_product_id, stripe_price_id, is_active, created_at, updated_at
) VALUES 
  (
    'basic_monthly',
    'Basic Monthly',
    'Essential features for personal productivity',
    999, -- $9.99
    'USD',
    'month',
    '["Unlimited tasks", "Basic health tracking", "Priority support", "Export data"]',
    'prod_basic',
    'price_basic_monthly',
    1,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
  ),
  (
    'premium',
    'Premium Monthly', 
    'Advanced features for power users',
    1999, -- $19.99
    'USD',
    'month',
    '["All Basic features", "AI-powered insights", "Advanced analytics", "Calendar integrations", "Voice transcription", "Custom badges", "Priority AI processing"]',
    'prod_premium',
    'price_premium_monthly',
    1,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
  ),
  (
    'premium_yearly',
    'Premium Yearly',
    'Premium features with 2 months free',
    19990, -- $199.90 (10 months price)
    'USD',
    'year',
    '["All Premium features", "2 months free", "Annual planning sessions", "Premium support"]',
    'prod_premium',
    'price_premium_yearly',
    1,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
  );