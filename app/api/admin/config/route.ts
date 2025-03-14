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
    // If file doesn't exist, create it with default values
    const defaultConfig = { systemPrompt: DEFAULT_SYSTEM_PROMPT }
    writeConfig(defaultConfig)
    return defaultConfig
  } catch (error) {
    console.error('Error reading config:', error)
    return { systemPrompt: DEFAULT_SYSTEM_PROMPT }
  }
}

// Function to write the config
function writeConfig(config: Record<string, any>) {
  try {
    // Ensure directory exists
    const dir = path.dirname(CONFIG_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    // Write the file with formatting
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
    
    // If API key was provided, update the environment variable
    if (config.apiKey) {
      process.env.GEMINI_API_KEY = config.apiKey
      console.log('Updated GEMINI_API_KEY environment variable')
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error writing config:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
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
  try {
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
    
    const result = writeConfig(newConfig)
    
    if (result.success) {
      console.log('Successfully saved configuration')
      return NextResponse.json({ success: true })
    } else {
      console.error('Failed to save configuration:', result.error)
      return NextResponse.json({ 
        success: false, 
        error: `Failed to save configuration: ${result.error}` 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error processing config request:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Error processing request: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
} 