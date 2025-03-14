import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getEnvironmentInfo } from '@/lib/config';
import os from 'os';

export async function GET() {
  // Get basic environment info from our utility
  const envInfo = getEnvironmentInfo();
  
  // Get server information
  const serverInfo = {
    platform: os.platform(),
    release: os.release(),
    totalMem: Math.round(os.totalmem() / (1024 * 1024)) + ' MB',
    freeMem: Math.round(os.freemem() / (1024 * 1024)) + ' MB',
    uptime: Math.round(os.uptime() / 60) + ' minutes',
    cpus: os.cpus().length,
    loadAvg: os.loadavg(),
  };
  
  // Check for common files
  const fileChecks = {
    hasConfigJson: fs.existsSync(path.join(process.cwd(), 'config.json')),
    hasPackageJson: fs.existsSync(path.join(process.cwd(), 'package.json')),
    hasEnvLocal: fs.existsSync(path.join(process.cwd(), '.env.local')),
    hasVercelJson: fs.existsSync(path.join(process.cwd(), 'vercel.json')),
  };
  
  // Verify API routes exist
  const routeChecks = {
    hasChatRoute: fs.existsSync(path.join(process.cwd(), 'app/api/chat/route.ts')),
    hasProcessFileRoute: fs.existsSync(path.join(process.cwd(), 'app/api/process-file/route.ts')),
    hasAdminConfigRoute: fs.existsSync(path.join(process.cwd(), 'app/api/admin/config/route.ts')),
  };
  
  // Get credential info (safely)
  const credentials = {
    adminPasswordSet: !!process.env.ADMIN_PASSWORD,
    publicAdminKeySet: !!process.env.NEXT_PUBLIC_ADMIN_KEY,
    // Add a sample value with asterisks to check length without exposing actual value
    adminPasswordLength: process.env.ADMIN_PASSWORD?.length || 0,
    publicAdminKeyLength: process.env.NEXT_PUBLIC_ADMIN_KEY?.length || 0,
    geminiApiKeySet: !!process.env.GEMINI_API_KEY,
    geminiApiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
  };
  
  // Get Vercel-specific info
  const vercelInfo = {
    isVercel: !!process.env.VERCEL,
    vercelEnv: process.env.VERCEL_ENV || 'not set',
    region: process.env.VERCEL_REGION || 'unknown',
  };
  
  // Check for PDF processing capabilities
  let pdfSupport = {
    hasImageMagick: false,
  };
  
  try {
    // Check if the imagemagick package is available (used for PDF processing in some setups)
    require('imagemagick');
    pdfSupport.hasImageMagick = true;
  } catch (err) {
    // Optional dependency, not critical if missing
  }
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV || 'development',
    envInfo,
    serverInfo,
    fileChecks,
    routeChecks,
    credentials,
    vercelInfo,
    pdfSupport,
  });
} 