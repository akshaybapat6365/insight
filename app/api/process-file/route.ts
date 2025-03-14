import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { loadConfig } from '@/lib/config'

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 60, // Increase timeout for file processing
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    console.log('Processing file:', file.name, 'Type:', file.type, 'Size:', file.size)
    
    // File size validation
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_FILE_SIZE) {
      console.error('File too large:', file.size, 'bytes (max:', MAX_FILE_SIZE, 'bytes)')
      return NextResponse.json(
        { error: `File too large. Maximum file size is 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.` },
        { status: 400 }
      )
    }
    
    // Load configuration
    const appConfig = loadConfig()
    
    // Check for API key
    const apiKey = appConfig.apiKey || ''
    if (!apiKey) {
      console.error('Gemini API key not configured')
      return NextResponse.json(
        { error: 'API key not configured. Please add a valid Gemini API key in the admin console.' },
        { status: 500 }
      )
    }
    
    // Get model configuration from the config
    const primaryModelName = "gemini-2.0-pro-exp-02-05"
    const fallbackModelName = appConfig.fallbackModel || "gemini-1.5-pro"
    const shouldUseFallback = appConfig.useFallback !== undefined ? appConfig.useFallback : true
    const maxOutputTokens = appConfig.maxOutputTokens || 4096
    
    console.log(`Attempting to use model: ${primaryModelName}`)
    console.log(`Fallback enabled: ${shouldUseFallback}, fallback model: ${fallbackModelName}`)
    console.log(`Max output tokens: ${maxOutputTokens}`)
    
    // Create extraction prompt based on file type
    let extractionPrompt = "This is a lab report. Extract all text from this document that appears to be related to medical test results or health data. Format it clearly with test names, values, and reference ranges if present."
    
    if (file.type.includes('image')) {
      extractionPrompt = "This is a medical image or document. Extract all visible text and data, especially test results, values, and reference ranges if present."
    } else if (file.type.includes('pdf')) {
      extractionPrompt = "This is a PDF medical document. Extract all text with special focus on lab results, biomarkers, test values, and their reference ranges. Format the data in a clean, readable way with clear labels for each test and value."
    }
    
    // Initialize the Gemini API client
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
    
    // Try to use the primary model first
    let result;
    try {
      console.log(`Attempting to use model: ${primaryModelName}`)
      
      // Convert file to base64
      const bytes = await file.arrayBuffer();
      const base64Data = Buffer.from(bytes).toString('base64');
      const mimeType = file.type;
      
      result = await genAI.models.generateContent({
        model: primaryModelName,
        contents: [
          {
            role: 'user',
            parts: [
              { text: extractionPrompt },
              { inlineData: { mimeType: mimeType, data: base64Data } }
            ]
          }
        ]
      });
      
      return NextResponse.json({
        analysis: result.text,
        model: primaryModelName
      });
    } catch (generationError: any) {
      console.error('Error generating content:', generationError)
      
      // Detailed error for debugging
      const errorDetails = {
        message: generationError.message || 'Unknown error during content generation',
        code: generationError.code,
        status: generationError.status,
        details: generationError.details || {}
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to process file with AI model: ' + errorDetails.message,
          errorDetails
        },
        { status: 500 }
      )
    }

    // If enabled, try to use the fallback model
    if (shouldUseFallback) {
      try {
        console.log(`Attempting fallback to ${fallbackModelName}`)
        
        // Convert file to base64
        const bytes = await file.arrayBuffer();
        const base64Data = Buffer.from(bytes).toString('base64');
        const mimeType = file.type;
        
        result = await genAI.models.generateContent({
          model: fallbackModelName,
          contents: [
            {
              role: 'user',
              parts: [
                { text: extractionPrompt },
                { inlineData: { mimeType: mimeType, data: base64Data } }
              ]
            }
          ]
        });
        
        return NextResponse.json({
          analysis: result.text,
          model: fallbackModelName,
          fallback: true
        });
      } catch (fallbackError: any) {
        console.error('Error creating fallback Gemini model:', fallbackError)
        return NextResponse.json(
          { error: 'Could not access any Gemini models. Please check your API key and permissions.' },
          { status: 500 }
        )
      }
    }
  } catch (error: any) {
    console.error('Error processing file:', error)
    return NextResponse.json(
      { 
        error: error.message || 'An error occurred during file processing',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// Helper function to convert blob to base64
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      // Just get the base64 data part without the prefix
      resolve(base64String.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
} 