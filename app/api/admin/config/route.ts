import { NextRequest, NextResponse } from 'next/server'
import { loadConfig, saveConfig, getEnvironmentInfo } from '@/lib/config'
import { auth } from '@clerk/nextjs'

// Check if user is an admin
async function isAdmin(userId: string | null) {
  if (!userId) return false;
  
  // Check if the user ID matches the admin ID from environment variables
  // This should be set in your environment variables
  const adminUserId = process.env.ADMIN_USER_ID;
  
  if (adminUserId && userId === adminUserId) {
    return true;
  }
  
  // Alternative: Check for admin role in Clerk user metadata
  // This approach requires setting up custom user metadata in Clerk
  try {
    // Add your logic to check if the user has admin role
    // Example: use Clerk's API to fetch user metadata
    return false; // Replace with actual admin check
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function GET() {
  // Get auth session from Clerk
  const { userId } = auth();
  
  // Check if user is authenticated and is an admin
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized - Not authenticated' }, { status: 401 });
  }
  
  const isUserAdmin = await isAdmin(userId);
  if (!isUserAdmin) {
    return NextResponse.json({ error: 'Unauthorized - Not an admin' }, { status: 403 });
  }
  
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
    // Get auth session from Clerk
    const { userId } = auth();
    
    // Check if user is authenticated and is an admin
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized - Not authenticated' }, { status: 401 });
    }
    
    const isUserAdmin = await isAdmin(userId);
    if (!isUserAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Not an admin' }, { status: 403 });
    }
    
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