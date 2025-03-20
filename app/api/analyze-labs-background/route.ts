import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getGeminiModel, fallbackModel } from '@/lib/ai/gemini-provider';

// Set a higher timeout for background processing
// Note: This still won't exceed Vercel's limits, but gives us more time
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  maxDuration: 60,
}

// Analysis cache to store results (in a real app, use a database or Redis)
const analysisCache = new Map<string, any>();

// Full system prompt for detailed analysis
const FULL_SYSTEM_PROMPT = `# Mission

Help the user understand their lab results and health data thoroughly. The user owns their own health, and you are providing expert analysis and education.

# Analysis Goals

1. Identify ALL abnormal values and explain their significance
2. Look for patterns or clusters of related findings
3. Explain what each test measures and why it's important
4. Suggest possible implications (without diagnosing)
5. Recommend next steps for the user to discuss with their healthcare provider

Be thorough but clear, educational but accessible. Always emphasize that this analysis is not a diagnosis and the user should consult with their healthcare provider.

DISCLAIMER: This is an AI-powered analysis tool and not a substitute for professional medical advice, diagnosis, or treatment.`;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userMessage = formData.get('message') as string || "Please analyze my lab results thoroughly.";
    const initialAnalysis = formData.get('initialAnalysis') as string || "";
    const analysisId = formData.get('id') as string || Date.now().toString();
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    console.log('Background processing started for analysis ID:', analysisId);
    
    // Extract the file contents using process-file API
    const processFormData = new FormData();
    processFormData.append('file', file);
    
    let fileContents: string;
    try {
      const processResponse = await fetch(new URL('/api/process-file', request.url).toString(), {
        method: 'POST',
        body: processFormData,
      });
      
      if (!processResponse.ok) {
        const errorData = await processResponse.json();
        throw new Error(errorData.error || `Processing error: ${processResponse.status}`);
      }
      
      const processedData = await processResponse.json();
      fileContents = processedData.text;
      
      if (!fileContents) {
        throw new Error('No text extracted from file');
      }
    } catch (error: any) {
      console.error('Error extracting file contents:', error);
      analysisCache.set(analysisId, {
        error: `Failed to process file: ${error.message}`,
        status: 'error'
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Run the full analysis
    try {
      // Load API key
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY not configured');
      }
      
      // Initialize Gemini client
      const genAI = new GoogleGenerativeAI(apiKey);
      const modelName = getGeminiModel();
      
      // Context-aware prompt that includes the initial analysis
      const contextPrompt = initialAnalysis 
        ? `Based on the initial analysis:\n\n${initialAnalysis}\n\nNow provide a more detailed analysis:`
        : "Provide a comprehensive analysis of these lab results:";
      
      try {
        // Generate detailed response
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const result = await model.generateContent({
          contents: [
            { role: "user", parts: [{ text: FULL_SYSTEM_PROMPT }] },
            { role: "user", parts: [{ text: contextPrompt }] },
            { role: "user", parts: [{ text: fileContents }] },
            { role: "user", parts: [{ text: userMessage }] },
          ],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096, // Longer, more detailed response
          },
        });
        
        const fullAnalysis = result.response.text();
        
        // Store the result in cache with the analysisId
        analysisCache.set(analysisId, {
          result: fullAnalysis,
          model: modelName,
          status: 'completed',
          timestamp: new Date().toISOString()
        });
        
        console.log(`Background analysis completed for ID: ${analysisId}, length: ${fullAnalysis.length}`);
        
        return NextResponse.json({ 
          success: true,
          analysisId
        });
        
      } catch (genError: any) {
        console.error('Error with primary model:', genError);
        
        // Try fallback model
        try {
          const fallbackModelObj = genAI.getGenerativeModel({ model: fallbackModel });
          
          const fallbackResult = await fallbackModelObj.generateContent({
            contents: [
              { role: "user", parts: [{ text: FULL_SYSTEM_PROMPT }] },
              { role: "user", parts: [{ text: contextPrompt }] },
              { role: "user", parts: [{ text: fileContents }] },
              { role: "user", parts: [{ text: userMessage }] },
            ],
            generationConfig: {
              temperature: 0.3,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 4096,
            },
          });
          
          const fallbackAnalysis = fallbackResult.response.text();
          
          // Store the fallback result
          analysisCache.set(analysisId, {
            result: fallbackAnalysis,
            model: fallbackModel,
            fallback: true,
            status: 'completed',
            timestamp: new Date().toISOString()
          });
          
          console.log(`Background analysis completed with fallback for ID: ${analysisId}`);
          
          return NextResponse.json({ 
            success: true,
            analysisId,
            fallback: true
          });
          
        } catch (fallbackError: any) {
          console.error('Fallback model also failed:', fallbackError);
          
          // Store the error in cache
          analysisCache.set(analysisId, {
            error: 'Both primary and fallback models failed',
            primaryError: genError.message,
            fallbackError: fallbackError.message,
            status: 'error',
            timestamp: new Date().toISOString()
          });
          
          return NextResponse.json(
            { 
              error: 'Both models failed',
              analysisId,
              status: 'error'
            },
            { status: 500 }
          );
        }
      }
    } catch (error: any) {
      console.error('Background processing error:', error);
      
      // Store the error in cache
      analysisCache.set(analysisId, {
        error: error.message || 'Unknown error',
        status: 'error',
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json(
        { error: error.message || 'An error occurred during background processing' },
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

// Endpoint to retrieve analysis results
export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'Missing analysis ID' }, { status: 400 });
  }
  
  // Check if analysis exists in cache
  if (!analysisCache.has(id)) {
    return NextResponse.json(
      { error: 'Analysis not found or expired', status: 'not_found' },
      { status: 404 }
    );
  }
  
  // Return the analysis result
  return NextResponse.json(analysisCache.get(id));
} 