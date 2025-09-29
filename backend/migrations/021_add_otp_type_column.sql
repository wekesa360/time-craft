-- Migration to add type column to email_otps table for different OTP types

-- Add type column to distinguish between different OTP types
ALTER TABLE email_otps ADD COLUMN type TEXT DEFAULT 'verification';

-- Update existing records to have verification type
UPDATE email_otps SET type = 'verification' WHERE type IS NULL;

-- Add a comment for the migration
INSERT INTO migrations (id, name, applied_at) VALUES ('021_add_otp_type_column', 'Add type column to email_otps table', UNIXEPOCH());
