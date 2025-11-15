-- Migration 033: Update calendar_events source CHECK constraint to include 'local'
-- The current constraint only allows ('manual','auto','google','outlook','icloud')
-- but the code uses 'local' for locally created events

-- SQLite doesn't support ALTER TABLE to modify CHECK constraints directly
-- We need to recreate the table with the updated constraint

-- Step 1: Create new table with updated constraint
CREATE TABLE calendar_events_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  "start" INTEGER NOT NULL,
  "end" INTEGER NOT NULL,
  location TEXT,
  eventType TEXT DEFAULT 'appointment' CHECK(eventType IN ('meeting','appointment','task','reminder','personal','work')),
  is_all_day BOOLEAN DEFAULT 0,
  status TEXT DEFAULT 'confirmed' CHECK(status IN ('confirmed','tentative','cancelled')),
  source TEXT CHECK(source IN ('local','manual','auto','google','outlook','icloud','apple')) DEFAULT 'local',
  external_id TEXT,
  ai_generated BOOLEAN DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

-- Step 2: Copy data from old table
INSERT INTO calendar_events_new 
SELECT 
  id, user_id, title, description, "start", "end", location, 
  eventType, is_all_day, status, 
  CASE 
    WHEN source NOT IN ('local','manual','auto','google','outlook','icloud','apple') THEN 'manual'
    ELSE source
  END as source,
  external_id, ai_generated, created_at, updated_at
FROM calendar_events;

-- Step 3: Drop old table
DROP TABLE calendar_events;

-- Step 4: Rename new table
ALTER TABLE calendar_events_new RENAME TO calendar_events;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON calendar_events("start");
CREATE INDEX IF NOT EXISTS idx_calendar_events_source ON calendar_events(source);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status, user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_is_all_day ON calendar_events(is_all_day, user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_type ON calendar_events(eventType, "start", "end");

