import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Log the API key (first few chars only for security)
    const apiKey = process.env.GEMINI_API_KEY || '';
    console.log('GEMINI_API_KEY present:', !!apiKey);
    if (apiKey) {
      console.log('GEMINI_API_KEY starts with:', apiKey.substring(0, 4) + '...');
      console.log('GEMINI_API_KEY length:', apiKey.length);
    }
    
    // Get the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    // Return debug info
    if (!file) {
      return NextResponse.json({ 
        error: 'No file provided', 
        env: {
          gemini_key_exists: !!apiKey,
          node_env: process.env.NODE_ENV,
        }
      }, { status: 400 });
    }
    
    // Log file details
    console.log('File received:', file.name);
    console.log('File type:', file.type);
    console.log('File size:', file.size, 'bytes');
    
    // Create a more detailed response
    return NextResponse.json({
      success: true,
      debug: {
        file: {
          name: file.name,
          type: file.type,
          size: file.size,
        },
        environment: {
          gemini_key_exists: !!apiKey,
          gemini_key_starts_with: apiKey ? apiKey.substring(0, 4) + '...' : null,
          gemini_key_length: apiKey?.length || 0,
          node_env: process.env.NODE_ENV,
        }
      }
    });
  } catch (error: any) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      error: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
} 