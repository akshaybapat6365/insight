import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 60, // Increase timeout for file processing
}

export async function POST(request: Request) {
  try {
    console.log('Python-style PDF processing endpoint called');
    
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
    
    // Initialize Gemini API with the specific model from Python code
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-thinking-exp-01-21'  // Exactly match the model in Python code
    });
    
    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const blob = new Blob([bytes], { type: file.type });
    const base64Data = await blobToBase64(blob);
    
    console.log('File converted to base64, length:', base64Data.length);
    
    // Use the identical prompt as in the Python code
    const extractionPrompt = "This is a lab report. Extract all text from this document that appears to be related to medical test results or health data. Format it clearly with test names, values, and reference ranges if present.";
    
    console.log('Sending request to Gemini API with model:', 'gemini-2.0-flash-thinking-exp-01-21');
    
    // Use the exact format from the Python implementation
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: extractionPrompt },
            { inlineData: { data: base64Data, mimeType: file.type } }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
      }
    });
    
    console.log('Received response from Gemini API');
    const extractedText = result.response.text();
    
    return NextResponse.json({ 
      success: true,
      text: extractedText,
      filename: file.name,
      fileType: file.type,
    });
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