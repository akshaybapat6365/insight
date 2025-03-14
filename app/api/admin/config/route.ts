import { NextRequest, NextResponse } from 'next/server'
import { loadConfig, saveConfig, getEnvironmentInfo } from '@/lib/config'

export async function GET() {
  // Get the current configuration
  const config = loadConfig();
  const envInfo = getEnvironmentInfo();
  
  return NextResponse.json({
    systemPrompt: config.systemPrompt,
    fallbackModel: config.fallbackModel,
    useFallback: config.useFallback,
    maxOutputTokens: config.maxOutputTokens,
    hasApiKey: !!config.apiKey,
    environmentInfo: envInfo
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Create an update object with only the fields that were provided
    const updates: any = {};
    
    if (body.systemPrompt !== undefined) {
      updates.systemPrompt = body.systemPrompt;
    }
    
    if (body.apiKey) {
      updates.apiKey = body.apiKey;
    }
    
    if (body.fallbackModel) {
      updates.fallbackModel = body.fallbackModel;
    }
    
    if (body.useFallback !== undefined) {
      updates.useFallback = body.useFallback;
    }
    
    if (body.maxOutputTokens) {
      updates.maxOutputTokens = parseInt(body.maxOutputTokens, 10);
    }
    
    // Save the configuration
    const result = await saveConfig(updates);
    
    // Return the result
    return NextResponse.json({ 
      success: result.success,
      message: result.message,
      environmentInfo: getEnvironmentInfo()
    });
  } catch (error) {
    console.error('Error processing config request:', error);
    return NextResponse.json({ 
      success: false, 
      error: `Error processing request: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
} 