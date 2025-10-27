#!/usr/bin/env tsx

import { DatabaseSeeder } from './seeder';
import type { Env } from '../src/lib/env.d';

/**
 * Simple runner for the database seeder
 * This script provides information about the seeder and how to run it
 */

async function main() {
  console.log('🌱 Database Seeder Information\n');

  console.log('📋 This seeder will create:');
  console.log('   • 3 Users (Premium, Student, Free)');
  console.log('   • 4 Achievement definitions');
  console.log('   • 4 User achievements');
  console.log('   • 6 Tasks with various priorities and statuses');
  console.log('   • 5 Health logs (exercise, nutrition, mood, hydration)');
  console.log('   • 4 Calendar events');
  console.log('   • 4 Habits (meditation, exercise, study, reading)');
  console.log('   • 2 Goals with milestones');
  console.log('   • 4 Gratitude entries');
  console.log('   • 3 Focus sessions');
  console.log('   • 3 Focus templates (Pomodoro, Deep Work, Meditation)');
  console.log('   • 3 Reflection entries with AI analysis');
  console.log('   • 3 Social connections (accepted and pending)');
  console.log('   • 3 User badges (gold, silver, bronze)');
  console.log('   • 2 Challenges with 4 participants');
  console.log('   • 3 Notification preference profiles');
  console.log('   • 2 External OAuth tokens (Google, Outlook)');
  console.log('   • 3 File assets (profile image, voice note, document)');
  console.log('   • 2 Calendar connections (Google, Outlook)');
  
  console.log('\n📝 To run the seeder:');
  console.log('   1. For local development with D1:');
  console.log('      npm run seed:init-local');
  console.log('      # Then run your seeder through your application or tests');
  console.log('   2. For production database:');
  console.log('      npm run seed:init-remote');
  console.log('      # Then run your seeder through your application');
  
  console.log('\n🔑 Test User Credentials:');
  console.log('   Email: john.doe@example.com (Premium user)');
  console.log('   Email: jane.student@university.edu (Student user)');
  console.log('   Email: mike.wilson@example.com (Free user)');
  console.log('   Password: Use your app\'s password reset or set manually');
  
  console.log('\n💡 Usage in your application:');
  console.log('   ```typescript');
  console.log('   import { DatabaseSeeder } from "./seeders/seeder";');
  console.log('   ');
  console.log('   const seeder = new DatabaseSeeder(env);');
  console.log('   await seeder.seedDevelopmentData({ verbose: true });');
  console.log('   ```');
  
  console.log('\n✅ Seeder ready to use!');
}

// Run if called directly (ES module compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main };