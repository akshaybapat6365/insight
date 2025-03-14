import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { loadConfig } from '@/lib/config';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const config = loadConfig();
    
    // Check if we have an API key
    const apiKey = config.apiKey || '';
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
    let genAI;
    let model;
    try {
      genAI = new GoogleGenAI({
        apiKey: apiKey
      });
    } catch (error: any) {
      console.error('Error initializing Gemini AI:', error);
      return NextResponse.json(
        { error: 'Failed to initialize Gemini AI: ' + (error.message || 'Unknown error') },
        { status: 500 }
      );
    }
    
    // Get model configuration from the config
    const primaryModelName = "gemini-2.0-pro-exp-02-05";
    const fallbackModelName = config.fallbackModel || "gemini-1.5-pro";
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
    let result;
    try {
      console.log(`Attempting to use model: ${primaryModelName}`);
      
      result = await genAI.models.generateContent({
        model: primaryModelName,
        contents: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }, { text: messages[messages.length - 1].content }]
          }
        ]
      });
      
      return NextResponse.json({
        response: result.text,
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
          
          result = await genAI.models.generateContent({
            model: fallbackModelName,
            contents: [
              {
                role: 'user',
                parts: [{ text: systemPrompt }, { text: messages[messages.length - 1].content }]
              }
            ]
          });
          
          return NextResponse.json({
            response: result.text,
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
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during the request' },
      { status: 500 }
    );
  }
}
