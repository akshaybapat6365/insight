/**
 * Database Setup Script
 * 
 * This script automatically sets up the database for the Health Insights AI application.
 * It checks for the database file, creates it if needed, and runs the necessary migrations.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Path to the SQLite database file
const DB_PATH = path.join(__dirname, '..', 'prisma', 'dev.db');
const MIGRATIONS_PATH = path.join(__dirname, '..', 'prisma', 'migrations');

console.log('🔍 Checking database configuration...');

// Check if DATABASE_URL is set
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.log('ℹ️ DATABASE_URL not set. Using default SQLite database.');
} else {
  console.log('✓ DATABASE_URL is set.');
  if (databaseUrl.includes('sqlite')) {
    console.log('ℹ️ Using SQLite database.');
  } else {
    console.log('ℹ️ Using external database (not SQLite).');
  }
}

// For SQLite, check if the database file exists
if (!databaseUrl || databaseUrl.includes('sqlite')) {
  if (fs.existsSync(DB_PATH)) {
    console.log('✓ SQLite database file exists.');
  } else {
    console.log('ℹ️ SQLite database file does not exist. It will be created during migration.');
  }
}

// Check if migrations directory exists
if (fs.existsSync(MIGRATIONS_PATH)) {
  console.log('✓ Migration directory exists.');
  // Check if there are any migrations
  const migrations = fs.readdirSync(MIGRATIONS_PATH);
  if (migrations.length > 0) {
    console.log(`✓ ${migrations.length} migrations found.`);
  } else {
    console.log('ℹ️ No migrations found. Will create initial migration.');
  }
} else {
  console.log('ℹ️ Migration directory does not exist. Will create it.');
}

// Run the setup steps
try {
  console.log('\n📦 Running database setup...');
  
  // Step 1: Generate Prisma client
  console.log('\n🔧 Step 1: Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✓ Prisma client generated successfully.');
  
  // Step 2: Run migrations
  try {
    console.log('\n🔧 Step 2: Running database migrations...');
    
    // Check if we need to create the first migration
    if (!fs.existsSync(MIGRATIONS_PATH) || fs.readdirSync(MIGRATIONS_PATH).length === 0) {
      console.log('ℹ️ Creating initial migration...');
      execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });
    } else {
      console.log('ℹ️ Running existing migrations...');
      execSync('npx prisma migrate dev', { stdio: 'inherit' });
    }
    
    console.log('✓ Database migrations completed successfully.');
  } catch (migrationError) {
    console.error('\n❌ Error running migrations:', migrationError);
    console.log('\nAttempting to deploy migrations instead...');
    
    try {
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      console.log('✓ Database migrations deployed successfully.');
    } catch (deployError) {
      console.error('\n❌ Error deploying migrations:', deployError);
      throw new Error('Failed to set up database migrations.');
    }
  }

  console.log('\n🎉 Database setup completed successfully!');
  console.log('\nYou can now start your application with:');
  console.log('npm run dev');
} catch (error) {
  console.error('\n❌ Database setup failed:', error);
  process.exit(1);
}
