import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { getGeminiModel, fallbackModel } from '@/lib/ai/gemini-provider'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  maxDuration: 60, // Increase timeout for file processing
}

export async function POST(request: Request) {
  try {
    console.log('Python-style file processing endpoint called');
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    console.log('Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);
    
    // Check API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'API key not configured. Please set GEMINI_API_KEY environment variable.' },
        { status: 500 }
      );
    }
    
    console.log('API Key exists, length:', apiKey.length);
    
    // Initialize Gemini API with the specific model
    const genAI = new GoogleGenAI({
      apiKey: apiKey
    });
    
    const modelName = getGeminiModel();
    console.log('Using model:', modelName);
    
    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString('base64');
    
    console.log('File converted to base64, length:', base64Data.length);
    
    // Get file extension for better MIME type detection
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    
    // Use an extraction prompt based on file type and extension
    let extractionPrompt = "This is a lab report. Extract all text from this document that appears to be related to medical test results or health data. Format it clearly with test names, values, and reference ranges if present.";
    let mimeType = file.type;
    
    // Handle images
    if (file.type.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
      extractionPrompt = "This is a medical image or document. Extract all visible text and data, especially test results, values, and reference ranges if present. Organize it in a structured format.";
      // Ensure image MIME type is set correctly
      if (!file.type.includes('image')) {
        mimeType = `image/${fileExtension}`;
      }
    } 
    // Handle PDFs
    else if (file.type.includes('pdf') || fileExtension === 'pdf') {
      extractionPrompt = "This is a PDF medical document. Extract all text with special focus on lab results, biomarkers, test values, and their reference ranges. Format the data in a clean, readable way with clear labels for each test and value.";
      // Ensure PDF MIME type is set correctly
      if (!file.type.includes('pdf')) {
        mimeType = 'application/pdf';
      }
    }
    // Handle text files
    else if (file.type.includes('text') || fileExtension === 'txt') {
      extractionPrompt = "This is a text file containing medical information. Extract all health-related data, focusing on lab results, biomarkers, and their values and reference ranges. Format it in a structured way.";
      mimeType = 'text/plain';
    }
    
    console.log('Sending request to Gemini API with model:', modelName);
    
    try {
      // Use the new SDK format to generate content
      const result = await genAI.models.generateContent({
        model: modelName,
        contents: [
          {
            role: "user",
            parts: [
              { text: extractionPrompt },
              { inlineData: { mimeType: mimeType, data: base64Data } }
            ]
          }
        ]
      });
      
      console.log('Received response from Gemini API');
      const extractedText = result.text;
      
      return NextResponse.json({ 
        success: true,
        text: extractedText,
        filename: file.name,
        fileType: file.type,
      });
    } catch (genError: any) {
      console.error('Error generating content with primary model:', genError);
      
      // Try with fallback model
      try {
        console.log(`Attempting fallback to ${fallbackModel}`);
        
        const fallbackResult = await genAI.models.generateContent({
          model: fallbackModel,
          contents: [
            {
              role: "user",
              parts: [
                { text: extractionPrompt },
                { inlineData: { mimeType: mimeType, data: base64Data } }
              ]
            }
          ]
        });
        
        console.log('Received response from fallback model');
        const extractedText = fallbackResult.text;
        
        return NextResponse.json({ 
          success: true,
          text: extractedText,
          filename: file.name,
          fileType: file.type,
          fallback: true
        });
      } catch (fallbackError: any) {
        console.error('Error with fallback model:', fallbackError);
        return NextResponse.json(
          { 
            error: 'Failed to process file with both primary and fallback models',
            details: genError.message,
            fallbackError: fallbackError.message 
          },
          { status: 500 }
        );
      }
    }
  } catch (error: any) {
    console.error('Error processing file:', error);
    console.error('Error stack:', error.stack);
    
    // Format the error in a way that's easy to read
    let errorMessage = error.message || 'Unknown error';
    if (error.code) {
      errorMessage = `[${error.code}] ${errorMessage}`;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        details: error.details || undefined
      },
      { status: 500 }
    );
  }
}

// Helper function to convert blob to base64
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Just get the base64 data part without the prefix
      resolve(base64String.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
} 