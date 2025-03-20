import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { loadConfig } from '@/lib/config';
import { getGeminiModel, fallbackModel } from '@/lib/ai/gemini-provider';

// Configure request size limits and timeout
export const config = {
  api: {
    // Match client-side limit (20MB)
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
  // For serverless environments, extend timeout for large file processing
  maxDuration: 60, // seconds
};

// Allowed file types
const VALID_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const VALID_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

// System prompt for analyzing health reports
const SYSTEM_PROMPT = `
You are a health analysis assistant that analyzes lab reports and medical documents.
Your task is to interpret the results and provide a clear, easy-to-understand explanation.

For each analysis:
1. Summarize the key findings in the lab report.
2. Explain what each value means in simple terms.
3. Highlight any abnormal results and what they might indicate.
4. Provide general context on the health implications.
5. Format your response using markdown for clarity.

IMPORTANT NOTES:
- Structure your analysis with clear sections using markdown headings.
- Always emphasize that this is not medical advice and the patient should consult healthcare professionals.
- Be factual and avoid speculative diagnoses.
- Use bullet points for clarity where appropriate.
- If you cannot interpret certain values, acknowledge this limitation.
`;

/**
 * Extract text from a PDF file
 */
async function extractTextFromPdf(file: File): Promise<string> {
  // This is a simplified implementation
  // In a production environment, you would want to use a proper PDF parsing library
  try {
    const text = await file.text();
    return text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Could not extract text from PDF file');
  }
}

/**
 * Get text content from an image using AI
 */
async function extractTextFromImage(file: File, apiKey: string): Promise<string> {
  try {
    // For images, we'll use Gemini's vision capabilities
    // This requires converting the file to a base64 data URL
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));
    const base64Data = buffer.toString('base64');
    const mimeType = file.type;
    const dataUrl = `data:${mimeType};base64,${base64Data}`;
    
    // Generate content with the image
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: "Extract all text from this lab report image, preserving numbers and measurements" },
            {
              inlineData: {
                mimeType,
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 8192
      }
    });
    
    return result.response.text();
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw new Error('Could not extract text from image file');
  }
}

/**
 * Main API route handler for analyzing lab reports
 */
export async function POST(req: NextRequest) {
  try {
    // Verify that API key is configured
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Missing required environment variable: GEMINI_API_KEY');
      return NextResponse.json(
        { error: 'Server configuration error: API key not set' },
        { status: 500 }
      );
    }
    
    // Process the uploaded file
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const message = formData.get('message') as string || 'Please analyze this lab report and explain what it means for my health.';
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Validate file type
    if (!VALID_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Supported types: PDF, JPG, JPEG, PNG` },
        { status: 400 }
      );
    }
    
    // Get file extension
    const fileName = file.name || '';
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !VALID_EXTENSIONS.includes(fileExtension)) {
      return NextResponse.json(
        { error: `Invalid file extension: .${fileExtension || 'none'}. Supported extensions: .pdf, .jpg, .jpeg, .png` },
        { status: 400 }
      );
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File exceeds size limit of 20MB` },
        { status: 400 }
      );
    }
    
    // Extract text from the file based on type
    let extractedText = '';
    
    try {
      if (file.type === 'application/pdf') {
        extractedText = await extractTextFromPdf(file);
      } else {
        // For images (jpg, png)
        extractedText = await extractTextFromImage(file, apiKey);
      }
      
      // Check if we got enough text to analyze
      if (!extractedText || extractedText.length < 50) {
        return NextResponse.json(
          { error: 'Could not extract sufficient text from the uploaded file. Please ensure the file contains readable text.' },
          { status: 422 }
        );
      }
    } catch (error: any) {
      console.error('Error extracting text:', error);
      return NextResponse.json(
        { error: `Error processing file: ${error.message}` },
        { status: 500 }
      );
    }
    
    // Get AI configuration
    const config = loadConfig();
    const userMessage = message.trim();
    
    // Initialize the Gemini AI model
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      // Analyze the extracted text
      const result = await model.generateContent({
        contents: [
          { 
            role: "user", 
            parts: [{ 
              text: `${SYSTEM_PROMPT}
              
Lab Report Text:
${extractedText}

User Message: ${userMessage}`
            }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          topK: 32,
          topP: 0.95,
          maxOutputTokens: config.maxOutputTokens || 4096
        }
      });
      
      const analysis = result.response.text();
      
      // Return the analysis
      return NextResponse.json({
        success: true,
        analysis,
        textLength: extractedText.length
      });
    } catch (error: any) {
      console.error('Error generating analysis with primary model:', error);
      
      // Try fallback model if enabled
      if (config.useFallback) {
        try {
          console.log('Attempting with fallback model...');
          const fallbackResponse = await fallbackModel({
            prompt: `Analyze this lab report and explain what it means for health:\n${extractedText}\n\nUser asked: ${userMessage}`,
            maxTokens: 2048
          });
          
          return NextResponse.json({
            success: true,
            analysis: fallbackResponse,
            fallback: true
          });
        } catch (fallbackError: any) {
          console.error('Fallback model also failed:', fallbackError);
          return NextResponse.json(
            { error: 'Failed to analyze the lab report with both primary and fallback models.' },
            { status: 500 }
          );
        }
      }
      
      return NextResponse.json(
        { error: `AI processing error: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Unexpected error in lab analysis:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
} 