-- Migration to make user_id nullable in email_otps table for login OTPs

-- Step 1: Create a new table with the correct schema
CREATE TABLE email_otps_new (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT,  -- Made nullable for login OTPs
    email TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    attempts INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    created_at INTEGER NOT NULL,
    type TEXT DEFAULT 'verification'
);

-- Step 2: Copy data from the old table
INSERT INTO email_otps_new SELECT * FROM email_otps;

-- Step 3: Drop the old table
DROP TABLE email_otps;

-- Step 4: Rename the new table
ALTER TABLE email_otps_new RENAME TO email_otps;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email);
CREATE INDEX IF NOT EXISTS idx_email_otps_expires_at ON email_otps(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_otps_type ON email_otps(type);
