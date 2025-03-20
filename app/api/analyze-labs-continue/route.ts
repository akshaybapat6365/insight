import { NextResponse } from 'next/server';

// Set a low timeout since this is just a quick check
export const config = {
  maxDuration: 10
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Missing analysis ID' }, { status: 400 });
    }
    
    // Call the background processing endpoint to get the status
    try {
      const analysisUrl = new URL('/api/analyze-labs-background', request.url).toString();
      const response = await fetch(`${analysisUrl}?id=${id}`);
      
      if (response.status === 404) {
        return NextResponse.json({ 
          status: 'pending',
          message: 'Analysis is still in progress'
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        return NextResponse.json(
          { 
            error: errorData.error || 'Error fetching analysis',
            status: 'error'
          },
          { status: response.status }
        );
      }
      
      // Return the analysis data
      const analysisData = await response.json();
      return NextResponse.json(analysisData);
      
    } catch (error: any) {
      console.error('Error fetching analysis:', error);
      return NextResponse.json(
        { 
          error: error.message || 'Error retrieving analysis',
          status: 'error'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Request processing error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred processing the request' },
      { status: 500 }
    );
  }
} 