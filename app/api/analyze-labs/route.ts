import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { loadConfig } from '@/lib/config';
import { getGeminiModel, fallbackModel } from '@/lib/ai/gemini-provider';

// Configuration for the lab analysis API
export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 120, // Increase timeout for file processing
}

// The system prompt from the Python script
const SYSTEM_PROMPT = `# Mission

Help the user figure out their chronic health issue. The user owns their own health, but you (the chatbot) own this case. 

# General Process

1. Comprehensively identify and document all symptoms. Keep in mind the user might not have the correct language, so you'll need to ask questions, provide feedback and suggestions, and adopt a very curious, probative tone for this step. 

2. Educate the user. They are tackling a complex, distressing medical mystery. One of the key things that all people need help with in these cases is learning. Not just their body and disease, but the navigating the medical establishment, communication skills, and so on. 

3. Help the user construct frameworks and refine this project. This is the vanilla "default starting point" but every user who engages with this framework will need help customizing this project, such as by adding and removing files, refining the instructions, and even refining their approach. 

4. Coaching the user. This project should include, at minimum, several files, such as comprehensive timelines, lab work, symptoms, journal entries, and so on. You'll need to coach the user specifically based on how their case evolves. 

5. Local Minima - Chatbot, this message is for you. Keep in mind that this is for managing chronic conditions, not necessarily acute break/fix models of healthcare. That means you might get stuck in "local minima" or over-index on immediate, obvious problems. That means sometimes you'll need to step back and think differently. 

# CONCRETE GOALS AND MILESTONES

The overarching process of chronic illness generally follows several phases:

1. Mystery Phase - Nebulous symptoms, medical gaslighting, unhelpful lab results. This is all typical (and aggravating). This requires a curious, exploratory mindset for both you and the user.

2. Make an initial list of issues to address. Rank order them by importance, making the highest risk first. Make sure one of them doesn't get lost in the analysis of one issue. Prompt the user to move on to the next issue. 

Probative Breakthroughs - After lots of testing, experimentation, and examining multiple systems, a few dots will start to connect. These first probative clues will open up new avenues of investigation. In many cases, there will be MULTIPLE OVERLAPPING problems. Differentials, confounding variables, and complex interactions should be expected and looked for! 

3. Developing a Plan of Care - Once specific issues have been identified, properly diagnosed, and validated for testing, the user moves to the development of a plan of care. This might be a "terminal resolution" type cure, or it might be a chronic management situation. In some cases, there might be a keystone dysfunction or pathogen causing systemic problems that can be cured. In other cases, it could be primary or endogenous (permanent) requiring ongoing intervention and support.

4. Do not end the conversation until you have worked with the patient to develop a SMART goal and they have a plan for their next step.`;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userMessage = formData.get('message') as string || "Please analyze my lab results and help me understand them.";
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    console.log('Processing lab file:', file.name, 'Type:', file.type, 'Size:', file.size);
    
    // File size validation
    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
    if (file.size > MAX_FILE_SIZE) {
      console.error('File too large:', file.size, 'bytes (max:', MAX_FILE_SIZE, 'bytes)');
      return NextResponse.json(
        { error: `File too large. Maximum file size is 20MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.` },
        { status: 400 }
      );
    }
    
    // First, we need to process the file to extract text
    // We'll use the process-file route as a dispatcher
    const processFormData = new FormData();
    processFormData.append('file', file);
    
    console.log('Sending file to process-file route for text extraction');
    
    try {
      const processResponse = await fetch(new URL('/api/process-file', request.url), {
        method: 'POST',
        body: processFormData,
      });
      
      if (!processResponse.ok) {
        const errorData = await processResponse.json();
        throw new Error(errorData.error || `Processing error: ${processResponse.status}`);
      }
      
      const processedData = await processResponse.json();
      
      if (!processedData.text) {
        throw new Error('No text extracted from file');
      }
      
      const fileContents = processedData.text;
      console.log('Successfully extracted text from file, length:', fileContents.length);
      
      // Load configuration
      const config = loadConfig();
      
      // Check for API key
      const apiKey = config.apiKey || process.env.GEMINI_API_KEY || '';
      if (!apiKey) {
        console.error('Gemini API key not configured');
        return NextResponse.json(
          { error: 'API key not configured. Please add a valid Gemini API key in the admin console.' },
          { status: 500 }
        );
      }
      
      // Configure AI settings
      const modelName = getGeminiModel();
      console.log(`Using model: ${modelName} for lab analysis`);
      
      // Initialize the Gemini API client
      const genAI = new GoogleGenAI({
        apiKey: apiKey
      });
      
      try {
        // Generate response with Gemini
        const result = await genAI.models.generateContent({
          model: modelName,
          contents: [
            {
              role: "user",
              parts: [
                { text: SYSTEM_PROMPT },
                { text: "User message: " + userMessage },
                { text: "Lab report contents: " + fileContents }
              ]
            }
          ]
        });

        // Return the analysis result
        return NextResponse.json({ 
          success: true,
          result: result.text,
          model: modelName
        });
      } catch (error: any) {
        console.error('Error processing file with primary model:', error);
        
        // Try with fallback model
        try {
          console.log(`Falling back to ${fallbackModel}`);
          
          const fallbackResult = await genAI.models.generateContent({
            model: fallbackModel,
            contents: [
              {
                role: "user",
                parts: [
                  { text: SYSTEM_PROMPT },
                  { text: "User message: " + userMessage },
                  { text: "Lab report contents: " + fileContents }
                ]
              }
            ]
          });
          
          return NextResponse.json({ 
            success: true,
            result: fallbackResult.text,
            model: fallbackModel,
            fallback: true
          });
        } catch (fallbackError: any) {
          console.error('Fallback model also failed:', fallbackError);
          return NextResponse.json(
            { 
              error: 'Both primary and fallback AI models failed. Please try again later.',
              originalError: error.message,
              fallbackError: fallbackError.message
            },
            { status: 500 }
          );
        }
      }
    } catch (processingError: any) {
      console.error('Error during file processing:', processingError);
      return NextResponse.json(
        { error: `Failed to process file: ${processingError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { 
        error: error.message || 'An error occurred during file processing',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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