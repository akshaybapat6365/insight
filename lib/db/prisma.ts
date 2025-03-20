// Specify Node.js runtime to ensure compatibility
export const runtime = 'nodejs';

import { PrismaClient } from '@prisma/client';
// Remove direct fs import
// import { existsSync } from 'fs';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more: 
// https://pris.ly/d/help/next-js-best-practices

// Flag to track if we're using a fallback database approach
export let isUsingFallback = false;

// Ensure DATABASE_URL exists - fallback to SQLite in memory if not configured
if (!process.env.DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL is not set. Using SQLite as fallback.');
  
  // Create path to database file
  const dbPath = './prisma/dev.db';
  const dbUrl = `file:${dbPath}`;
  process.env.DATABASE_URL = dbUrl;
  isUsingFallback = true;
  
  // Dynamically import fs in a way that's compatible with Next.js
  try {
    // Check if running on server side
    if (typeof window === 'undefined') {
      const fs = require('fs');
      // Check if SQLite file exists
      if (!fs.existsSync(dbPath)) {
        console.warn('⚠️ SQLite database file not found.');
        console.warn('To set up the database, run:');
        console.warn('1. npx prisma generate');
        console.warn('2. npx prisma migrate dev --name init');
        
        // We'll try to continue, but some operations may fail
        console.warn('Attempting to continue without database migrations...');
      }
    } else {
      console.warn('⚠️ Running in browser environment. File system checks skipped.');
    }
  } catch (error) {
    console.warn('⚠️ Error checking database file:', error);
  }
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma; 