#!/bin/bash
# wellness-backend file scaffold
# Run from wellness-backend/ (pwd)

# directories
mkdir -p \
  src/{workers,lib,middleware,schemas,utils,jobs} \
  tests/{unit,integration} \
  scripts docs postman migrations

# files
touch \
  wrangler.toml \
  package.json \
  tsconfig.json \
  .gitignore \
  .env.example \
  README.md \
  migrations/001_init.sql \
  migrations/seed.sql \
  src/workers/{api-gateway.ts,auth.ts,core.ts,health.ts,ai.ts,realtime.ts,admin.ts} \
  src/lib/{env.d.ts,db.ts,kv.ts,encryption.ts,jwt.ts,paywall.ts,ai.ts,voice.ts,notifications.ts,logger.ts} \
  src/middleware/{rateLimit.ts,cors.ts,validate.ts} \
  src/schemas/{auth.ts,task.ts,health.ts,ai.ts,calendar.ts} \
  src/utils/{id.ts,date.ts,errors.ts} \
  src/jobs/{index.ts,analyzeTaskPriority.ts,generateInsights.ts,syncExternalCalendars.ts,sendNotification.ts} \
  tests/{unit/.gitkeep,integration/.gitkeep} \
  scripts/{dev.ts,seed-stripe.js,deploy.sh} \
  docs/{api.md,runbooks.md} \
  postman/wellness.postman_collection.json