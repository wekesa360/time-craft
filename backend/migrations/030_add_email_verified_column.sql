-- Migration 030: Add email_verified column to users table
-- Enforces email verification before users can access the application

-- Add email_verified column
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;

-- Update existing users to be verified (for backward compatibility)
-- In production, you may want to require re-verification
UPDATE users SET email_verified = true WHERE email_verified IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

