-- Migration: Add badge-related columns to users table
-- This migration adds badge_points, total_badges, and badge_tier columns to support the leaderboard functionality

-- Add badge-related columns to users table
ALTER TABLE users ADD COLUMN badge_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN total_badges INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN badge_tier TEXT DEFAULT 'bronze';

-- Create index on badge_points for efficient leaderboard queries
CREATE INDEX IF NOT EXISTS idx_users_badge_points ON users(badge_points DESC);

-- Create index on total_badges for efficient badge count queries
CREATE INDEX IF NOT EXISTS idx_users_total_badges ON users(total_badges DESC);

-- Update existing users to have default badge values
UPDATE users SET 
  badge_points = 0,
  total_badges = 0,
  badge_tier = 'bronze'
WHERE badge_points IS NULL OR total_badges IS NULL OR badge_tier IS NULL;
