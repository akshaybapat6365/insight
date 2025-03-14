import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { DEFAULT_SYSTEM_PROMPT } from '@/lib/constants'

const CONFIG_PATH = path.join(process.cwd(), 'config.json')

// Function to read the current config
function readConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf8')
      return JSON.parse(data)
    }
    return { 
      systemPrompt: DEFAULT_SYSTEM_PROMPT
    }
  } catch (error) {
    console.error('Error reading config:', error)
    return { systemPrompt: DEFAULT_SYSTEM_PROMPT }
  }
}

// Function to write the config
function writeConfig(config: Record<string, any>) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
    
    // If API key was provided, update the environment variable
    // This won't persist across server restarts
    if (config.apiKey) {
      process.env.GEMINI_API_KEY = config.apiKey
    }
    
    return true
  } catch (error) {
    console.error('Error writing config:', error)
    return false
  }
}

export async function GET() {
  const config = readConfig()
  // Don't return the API key to the frontend
  const safeConfig = { ...config }
  delete safeConfig.apiKey
  
  return NextResponse.json(safeConfig)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const currentConfig = readConfig()
  
  const newConfig = {
    ...currentConfig,
    systemPrompt: body.systemPrompt || currentConfig.systemPrompt
  }
  
  // Only update API key if one was provided
  if (body.apiKey) {
    newConfig.apiKey = body.apiKey
    // This would typically update an environment variable or secret store
    // For simplicity, we're just storing it in the config file
    // In production, use a proper secret management system
  }
  
  const success = writeConfig(newConfig)
  
  if (success) {
    return NextResponse.json({ success: true })
  } else {
    return NextResponse.json({ success: false, error: "Failed to save configuration" }, { status: 500 })
  }
} 