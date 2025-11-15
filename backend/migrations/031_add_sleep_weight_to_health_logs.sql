-- Add 'sleep' and 'weight' to health_logs type constraint
-- SQLite doesn't support modifying CHECK constraints directly, so we need to recreate the table

-- Step 1: Create new table with updated constraint
CREATE TABLE health_logs_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT CHECK(type IN ('exercise','nutrition','mood','hydration','sleep','weight')) NOT NULL,
  payload TEXT NOT NULL, -- JSON stored as TEXT
  recorded_at INTEGER NOT NULL,
  source TEXT CHECK(source IN ('auto','manual','device')) DEFAULT 'manual',
  device_type TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Step 2: Copy existing data
INSERT INTO health_logs_new (id, user_id, type, payload, recorded_at, source, device_type, created_at)
SELECT id, user_id, type, payload, recorded_at, 
       COALESCE(source, 'manual') as source,
       device_type,
       COALESCE(created_at, strftime('%s', 'now') * 1000) as created_at
FROM health_logs;

-- Step 3: Drop old table
DROP TABLE health_logs;

-- Step 4: Rename new table
ALTER TABLE health_logs_new RENAME TO health_logs;

