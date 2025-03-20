import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { auth } from '@clerk/nextjs'

// The config file path used in the actual config API
const CONFIG_PATH = path.join(process.cwd(), 'config.json')

// Check if user is an admin
async function isAdmin(userId: string | null) {
  if (!userId) return false;
  
  // Check if the user ID matches the admin ID from environment variables
  const adminUserId = process.env.ADMIN_USER_ID;
  
  if (adminUserId && userId === adminUserId) {
    return true;
  }
  
  // Alternative: Check for admin role in Clerk user metadata
  return false;
}

// Define types for our diagnostics object
type FileStats = {
  size: number
  isFile: boolean
  mode: string
  uid: number
  gid: number
  modifiedTime: Date
}

type Diagnostics = {
  system: {
    platform: string
    cwd: string
    homedir: string
    username: string
  }
  config_file: {
    path: string
    exists: boolean
    readable: boolean
    writable: boolean
    content_sample: string | null
    stats: FileStats | null
    error: string | null
  }
  directory: {
    path: string
    exists: boolean
    writable: boolean
    error: string | null
  }
  temp_file_test?: {
    success: boolean
    path?: string
    error?: string
  }
}

export async function GET() {
  // Authenticate using Clerk
  const { userId } = auth();
  
  // Check if user is authenticated and is an admin
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized - Not authenticated' }, { status: 401 });
  }
  
  const isUserAdmin = await isAdmin(userId);
  if (!isUserAdmin) {
    return NextResponse.json({ error: 'Unauthorized - Not an admin' }, { status: 403 });
  }

  const diagnostics: Diagnostics = {
    system: {
      platform: os.platform(),
      cwd: process.cwd(),
      homedir: os.homedir(),
      username: os.userInfo().username,
    },
    config_file: {
      path: CONFIG_PATH,
      exists: false,
      readable: false,
      writable: false,
      content_sample: null,
      stats: null,
      error: null
    },
    directory: {
      path: path.dirname(CONFIG_PATH),
      exists: false,
      writable: false,
      error: null
    }
  }
  
  // Check directory
  try {
    const dirPath = path.dirname(CONFIG_PATH)
    diagnostics.directory.exists = fs.existsSync(dirPath)
    
    if (diagnostics.directory.exists) {
      // Test write permission on directory
      try {
        const testPath = path.join(dirPath, `test-${Date.now()}.txt`)
        fs.writeFileSync(testPath, 'test')
        fs.unlinkSync(testPath) // Remove the test file
        diagnostics.directory.writable = true
      } catch (err) {
        diagnostics.directory.writable = false
        diagnostics.directory.error = err instanceof Error ? err.message : 'Unknown error'
      }
    }
  } catch (err) {
    diagnostics.directory.error = err instanceof Error ? err.message : 'Unknown error'
  }
  
  // Check config file
  try {
    diagnostics.config_file.exists = fs.existsSync(CONFIG_PATH)
    
    if (diagnostics.config_file.exists) {
      // Check file stats
      try {
        const stats = fs.statSync(CONFIG_PATH)
        diagnostics.config_file.stats = {
          size: stats.size,
          isFile: stats.isFile(),
          mode: stats.mode.toString(8), // Permission in octal
          uid: stats.uid,
          gid: stats.gid,
          modifiedTime: stats.mtime
        }
      } catch (err) {
        diagnostics.config_file.error = `Stats error: ${err instanceof Error ? err.message : 'Unknown error'}`
      }
      
      // Check read permission
      try {
        const content = fs.readFileSync(CONFIG_PATH, 'utf8')
        diagnostics.config_file.readable = true
        // Get a small sample of the content (first 50 chars)
        diagnostics.config_file.content_sample = content.substring(0, 50) + '...'
      } catch (err) {
        diagnostics.config_file.readable = false
        diagnostics.config_file.error = `Read error: ${err instanceof Error ? err.message : 'Unknown error'}`
      }
      
      // Check write permission
      try {
        // Read current content
        const content = fs.readFileSync(CONFIG_PATH, 'utf8')
        // Try to write same content back
        fs.writeFileSync(CONFIG_PATH, content)
        diagnostics.config_file.writable = true
      } catch (err) {
        diagnostics.config_file.writable = false
        diagnostics.config_file.error = `Write error: ${err instanceof Error ? err.message : 'Unknown error'}`
      }
    }
  } catch (err) {
    diagnostics.config_file.error = err instanceof Error ? err.message : 'Unknown error'
  }
  
  // Try to create a config file in /tmp for testing
  try {
    const tmpConfig = path.join(os.tmpdir(), 'health-insights-test-config.json')
    fs.writeFileSync(tmpConfig, JSON.stringify({ test: true }))
    diagnostics.temp_file_test = {
      success: true,
      path: tmpConfig
    }
  } catch (err) {
    diagnostics.temp_file_test = {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }
  
  return NextResponse.json(diagnostics)
} 