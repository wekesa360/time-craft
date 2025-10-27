# Database Seeder

This directory contains a single, functional database seeder for the Time & Wellness application.

## Files

- `seeder.ts` - Main TypeScript seeder class with essential development data
- `run-seeder.ts` - Information and usage script
- `README.md` - This documentation file

## Usage

The seeder creates comprehensive development data including:

- **Users**: 3 test users with different subscription types (Premium, Student, Free)
- **Achievement System**: 4 achievement definitions and 4 user achievements
- **Tasks**: 6 tasks with various priorities, statuses, and due dates
- **Health Data**: 5 health logs covering exercise, nutrition, mood, and hydration
- **Calendar Events**: 4 sample calendar events
- **Habits**: 4 daily habits (meditation, exercise, study, reading)
- **Goals**: 2 long-term goals with milestone tracking
- **Gratitude**: 4 gratitude journal entries
- **Focus System**: 3 focus sessions and 3 focus templates
- **Reflections**: 3 reflection entries with AI analysis
- **Social Features**: 3 user connections and 2 challenges with 4 participants
- **Badges**: 3 user badges with different tiers
- **Preferences**: 3 notification preference profiles
- **Integrations**: 2 external OAuth tokens (Google, Outlook)

### Running the Seeder

The seeder is designed to work with Cloudflare D1 databases:

```bash
# View seeder information and usage instructions
npm run seed:info

# Initialize local database schema
npm run seed:init-local

# Initialize production database schema (use with caution!)
npm run seed:init-remote
```

### Test Users

After seeding, you can use these test accounts:

1. **John Doe** (`john.doe@example.com`)
   - Premium user
   - Multiple tasks and health data

2. **Jane Smith** (`jane.student@university.edu`)
   - Student user (verified)
   - Academic-focused tasks

3. **Mike Wilson** (`mike.wilson@example.com`)
   - Free user
   - Basic personal tasks

*Note: Passwords need to be set manually or through your app's password reset functionality*

### Integration with Application

The seeder can be used programmatically in your application:

```typescript
import { DatabaseSeeder } from './seeders/seeder';

const seeder = new DatabaseSeeder(env);
await seeder.seedDevelopmentData({ 
  clearExisting: true, 
  verbose: true 
});
```

### Options

- `clearExisting` (default: true) - Clear existing data before seeding
- `verbose` (default: false) - Show detailed progress information

## Database Schema Compatibility

The seeder works with the current database schema defined in `init-db.sql`. It handles:

- Foreign key relationships (users → tasks, health_logs, calendar_events)
- JSON payload fields for health data
- Timestamp fields using Unix milliseconds
- Enum constraints for task status, priority, etc.

## Development Notes

- Seeder clears tables in correct order to respect foreign key constraints
- All timestamps use Unix milliseconds for consistency
- JSON payloads are properly serialized for D1 storage
- Error handling includes warnings for missing tables
- Minimal, focused data set for faster development cycles