import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_SYSTEM_PROMPT } from '@/lib/constants'

// Get the current system prompt from environment variable or use the default
function getSystemPrompt() {
  return process.env.SYSTEM_PROMPT || DEFAULT_SYSTEM_PROMPT
}

export async function GET() {
  // Return the current system prompt
  return NextResponse.json({
    systemPrompt: getSystemPrompt()
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // In serverless environments like Vercel, we can't write to the file system
    // Instead, we log the values that would be set, and you can update them
    // in the Vercel project settings
    
    console.log('Would update SYSTEM_PROMPT to:', body.systemPrompt)
    if (body.apiKey) {
      console.log('Would update GEMINI_API_KEY to: [API key provided]')
      
      // We can still set the environment variable for the current instance
      // This won't persist across function invocations but can be useful for testing
      process.env.GEMINI_API_KEY = body.apiKey
    }
    
    // Return instruction to update environment variables manually
    return NextResponse.json({ 
      success: true,
      message: "In serverless environments, configuration changes need to be made in Vercel dashboard. Your changes have been logged but not permanently saved."
    })
  } catch (error) {
    console.error('Error processing config request:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Error processing request: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
} 