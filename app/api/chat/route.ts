import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { loadConfig } from '@/lib/config';
import { getGeminiModel, fallbackModel } from '@/lib/ai/gemini-provider';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const config = loadConfig();
    
    // Check if we have an API key
    const apiKey = config.apiKey || process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      console.error('Gemini API key not configured');
      return NextResponse.json(
        { error: 'API key not configured. Please add a valid Gemini API key in the admin console.' },
        { status: 500 }
      );
    }
    
    // Log the API key length for debugging (never log the full key!)
    console.log(`Using Gemini API key (${apiKey.length} chars, starts with: ${apiKey.substring(0, 4)}...)`);
    
    // Initialize the Gemini client
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // Get model configuration from the config
      const primaryModelName = getGeminiModel();
      const fallbackModelName = config.fallbackModel || fallbackModel;
      const shouldUseFallback = config.useFallback !== undefined ? config.useFallback : true;
      const maxOutputTokens = config.maxOutputTokens || 1000;
      
      console.log(`Attempting to use model: ${primaryModelName}`);
      console.log(`Fallback enabled: ${shouldUseFallback}, fallback model: ${fallbackModelName}`);
      console.log(`Max output tokens: ${maxOutputTokens}`);
      
      // Get system prompt from config
      const systemPrompt = config.systemPrompt || 
        "You are a helpful AI assistant specializing in health insights.";
      
      console.log(`Using system prompt (${systemPrompt.length} chars)`);

      // Try to use the primary model first
      try {
        console.log(`Attempting to use model: ${primaryModelName}`);
        
        const model = genAI.getGenerativeModel({ model: primaryModelName });
        const result = await model.generateContent([
          systemPrompt,
          messages[messages.length - 1].content
        ]);
        
        return NextResponse.json({
          response: result.response.text(),
          model: primaryModelName
        });
      } catch (modelError: any) {
        console.warn(`Failed to use ${primaryModelName}:`, modelError.message);
        
        if (!shouldUseFallback) {
          return NextResponse.json(
            { error: `Could not access the primary Gemini model (${primaryModelName}) and fallback is disabled.` },
            { status: 500 }
          );
        }
        
        // If enabled, try to use the fallback model
        if (shouldUseFallback) {
          try {
            console.log(`Attempting fallback to ${fallbackModelName}`);
            
            const fallbackModel = genAI.getGenerativeModel({ model: fallbackModelName });
            const result = await fallbackModel.generateContent([
              systemPrompt,
              messages[messages.length - 1].content
            ]);
            
            return NextResponse.json({
              response: result.response.text(),
              model: fallbackModelName,
              fallback: true
            });
          } catch (fallbackError: any) {
            console.error('Error creating fallback Gemini model:', fallbackError);
            return NextResponse.json(
              { error: 'Could not access any Gemini models. Please check your API key and permissions.' },
              { status: 500 }
            );
          }
        }
      }
    } catch (initError: any) {
      console.error('Error initializing Gemini AI:', initError);
      return NextResponse.json(
        { error: 'Failed to initialize Gemini AI: ' + (initError.message || 'Unknown error') },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during the request' },
      { status: 500 }
    );
  }
}
