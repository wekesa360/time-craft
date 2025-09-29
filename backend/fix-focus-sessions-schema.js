const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, 'database.db');

console.log(`Fixing focus_sessions schema in: ${DB_PATH}`);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Start transaction
    db.serialize(() => {
      db.run("BEGIN TRANSACTION;", (err) => {
        if (err) {
          console.error("Error starting transaction:", err.message);
          return;
        }
        console.log("Transaction started.");

        // First, check if focus_sessions table exists and get its current schema
        db.all("PRAGMA table_info(focus_sessions);", (err, rows) => {
          if (err) {
            console.error("Error getting table info:", err.message);
            db.run("ROLLBACK;");
            return;
          }

          console.log("Current focus_sessions columns:");
          rows.forEach(row => {
            console.log(`- ${row.name} (${row.type})`);
          });

          // Check if we have the basic columns we need
          const hasProductivityRating = rows.some(row => row.name === 'productivity_rating');
          const hasMoodAfter = rows.some(row => row.name === 'mood_after');
          const hasEnergyAfter = rows.some(row => row.name === 'energy_after');
          const hasFocusQuality = rows.some(row => row.name === 'focus_quality');
          const hasCompletedTaskCount = rows.some(row => row.name === 'completed_task_count');
          const hasBreakDuration = rows.some(row => row.name === 'break_duration');
          const hasIsSuccessful = rows.some(row => row.name === 'is_successful');
          const hasUpdatedAt = rows.some(row => row.name === 'updated_at');

          if (hasProductivityRating && hasMoodAfter && hasEnergyAfter && hasFocusQuality && 
              hasCompletedTaskCount && hasBreakDuration && hasIsSuccessful && hasUpdatedAt) {
            console.log("✅ focus_sessions table already has all required columns!");
            db.run("COMMIT;");
            return;
          }

          console.log("❌ focus_sessions table is missing required columns. Fixing...");

          // Create a new table with the correct schema
          const createTableSql = `
            CREATE TABLE focus_sessions_new (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL REFERENCES users(id),
              session_type TEXT CHECK(session_type IN ('pomodoro','deep_work','custom','sprint','flow')) NOT NULL,
              session_name TEXT,
              planned_duration INTEGER NOT NULL,
              actual_duration INTEGER,
              task_id TEXT REFERENCES tasks(id),
              planned_task_count INTEGER DEFAULT 1,
              completed_task_count INTEGER DEFAULT 0,
              break_duration INTEGER DEFAULT 0,
              interruptions INTEGER DEFAULT 0,
              distraction_count INTEGER DEFAULT 0,
              distraction_details JSON,
              environment_data JSON,
              mood_before INTEGER CHECK(mood_before BETWEEN 1 AND 10),
              mood_after INTEGER CHECK(mood_after BETWEEN 1 AND 10),
              energy_before INTEGER CHECK(energy_before BETWEEN 1 AND 10),
              energy_after INTEGER CHECK(energy_after BETWEEN 1 AND 10),
              focus_quality INTEGER CHECK(focus_quality BETWEEN 1 AND 10),
              session_tags JSON,
              productivity_rating INTEGER CHECK(productivity_rating BETWEEN 1 AND 10),
              notes TEXT,
              is_successful BOOLEAN DEFAULT true,
              cancellation_reason TEXT,
              started_at INTEGER NOT NULL,
              completed_at INTEGER,
              created_at INTEGER NOT NULL,
              updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
            )
          `;

          db.run(createTableSql, (err) => {
            if (err) {
              console.error("Error creating new table:", err.message);
              db.run("ROLLBACK;");
              return;
            }
            console.log("✅ New focus_sessions table created.");

            // Copy data from old table to new table
            const copyDataSql = `
              INSERT INTO focus_sessions_new (
                id, user_id, session_type, planned_duration, actual_duration, 
                task_id, interruptions, productivity_rating, notes, started_at, 
                completed_at, created_at
              )
              SELECT 
                id, user_id, session_type, planned_duration, actual_duration,
                task_id, interruptions, productivity_rating, notes, started_at,
                completed_at, created_at
              FROM focus_sessions
            `;

            db.run(copyDataSql, (err) => {
              if (err) {
                console.error("Error copying data:", err.message);
                db.run("ROLLBACK;");
                return;
              }
              console.log("✅ Data copied to new table.");

              // Drop the old table
              db.run("DROP TABLE focus_sessions;", (err) => {
                if (err) {
                  console.error("Error dropping old table:", err.message);
                  db.run("ROLLBACK;");
                  return;
                }
                console.log("✅ Old table dropped.");

                // Rename the new table
                db.run("ALTER TABLE focus_sessions_new RENAME TO focus_sessions;", (err) => {
                  if (err) {
                    console.error("Error renaming new table:", err.message);
                    db.run("ROLLBACK;");
                    return;
                  }
                  console.log("✅ New table renamed to focus_sessions.");

                  // Recreate indexes
                  const indexes = [
                    "CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_date ON focus_sessions(user_id, started_at DESC);",
                    "CREATE INDEX IF NOT EXISTS idx_focus_sessions_type ON focus_sessions(session_type);",
                    "CREATE INDEX IF NOT EXISTS idx_focus_sessions_successful ON focus_sessions(is_successful, productivity_rating);",
                    "CREATE INDEX IF NOT EXISTS idx_focus_sessions_task ON focus_sessions(task_id);",
                    "CREATE UNIQUE INDEX IF NOT EXISTS idx_focus_sessions_one_active_per_user ON focus_sessions (user_id) WHERE completed_at IS NULL;"
                  ];

                  let indexCount = 0;
                  indexes.forEach((indexSql, i) => {
                    db.run(indexSql, (err) => {
                      if (err) {
                        console.error(`Error creating index ${i + 1}:`, err.message);
                      } else {
                        console.log(`✅ Index ${i + 1} created.`);
                      }
                      indexCount++;
                      if (indexCount === indexes.length) {
                        // All indexes created, commit transaction
                        db.run("COMMIT;", (err) => {
                          if (err) {
                            console.error("Error committing transaction:", err.message);
                            return;
                          }
                          console.log("🎉 Transaction committed. focus_sessions schema fixed successfully!");
                          db.close();
                        });
                      }
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  }
});
