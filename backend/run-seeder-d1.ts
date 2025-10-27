#!/usr/bin/env tsx

import { DatabaseSeeder } from './seeders/seeder';

// This script demonstrates how to use the seeder with a real D1 database
// In a real application, you would get the env from the Cloudflare Workers runtime

async function runSeederWithD1() {
  console.log('🌱 Database Seeder - D1 Integration Guide\n');
  
  console.log('📋 To run the seeder with your actual D1 database:');
  console.log('');
  console.log('1. In your Cloudflare Worker or application:');
  console.log('   ```typescript');
  console.log('   import { DatabaseSeeder } from "./seeders/seeder";');
  console.log('   ');
  console.log('   export default {');
  console.log('     async fetch(request: Request, env: Env) {');
  console.log('       // Initialize seeder');
  console.log('       const seeder = new DatabaseSeeder(env);');
  console.log('       ');
  console.log('       // Run seeding (only in development!)');
  console.log('       if (env.ENVIRONMENT === "development") {');
  console.log('         await seeder.seedDevelopmentData({ verbose: true });');
  console.log('       }');
  console.log('       ');
  console.log('       // Your app logic here...');
  console.log('     }');
  console.log('   }');
  console.log('   ```');
  console.log('');
  console.log('2. Or create a dedicated seeding endpoint:');
  console.log('   ```typescript');
  console.log('   // In your API routes');
  console.log('   app.post("/api/admin/seed", async (c) => {');
  console.log('     const env = c.env;');
  console.log('     const seeder = new DatabaseSeeder(env);');
  console.log('     ');
  console.log('     const result = await seeder.seedDevelopmentData({');
  console.log('       clearExisting: true,');
  console.log('       verbose: true');
  console.log('     });');
  console.log('     ');
  console.log('     return c.json(result);');
  console.log('   });');
  console.log('   ```');
  console.log('');
  console.log('3. Or use wrangler dev with a test request:');
  console.log('   - Start your worker: `npm run dev`');
  console.log('   - Make a request to your seeding endpoint');
  console.log('   - Check the logs for seeding progress');
  console.log('');
  console.log('🔒 Security Notes:');
  console.log('   • Only run seeding in development environments');
  console.log('   • Never expose seeding endpoints in production');
  console.log('   • Use proper authentication for admin endpoints');
  console.log('');
  console.log('📊 What gets seeded:');
  console.log('   • 20 different table types');
  console.log('   • ~65 total records');
  console.log('   • Complete user journeys for testing');
  console.log('   • Social features and integrations');
  console.log('   • Achievement and gamification data');
  console.log('');
  console.log('✅ Your seeder is ready to use with D1!');
}

runSeederWithD1().catch(console.error);