import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { loadConfig } from '@/lib/config';

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
    
    // Load configuration
    const appConfig = loadConfig();
    
    // Check for API key
    const apiKey = appConfig.apiKey || '';
    if (!apiKey) {
      console.error('Gemini API key not configured');
      return NextResponse.json(
        { error: 'API key not configured. Please add a valid Gemini API key in the admin console.' },
        { status: 500 }
      );
    }
    
    // Use the experimental model specified in the Python code
    const modelName = "gemini-2.0-flash-thinking-exp-01-21";
    console.log(`Using model: ${modelName} for lab analysis`);
    
    // Initialize Google AI
    let genAI;
    try {
      genAI = new GoogleGenerativeAI(apiKey);
    } catch (error: any) {
      console.error('Error initializing Gemini AI:', error);
      return NextResponse.json(
        { error: 'Failed to initialize Gemini AI: ' + (error.message || 'Unknown error') },
        { status: 500 }
      );
    }
    
    // Get the model
    let model;
    try {
      model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 64,
          maxOutputTokens: 65536,
        },
        systemInstruction: SYSTEM_PROMPT,
      });
    } catch (modelError: any) {
      console.error('Error getting Gemini model:', modelError);
      return NextResponse.json(
        { error: 'Could not access the Gemini model for lab analysis.' },
        { status: 500 }
      );
    }
    
    // Convert file to base64
    try {
      const bytes = await file.arrayBuffer();
      const blob = new Blob([bytes], { type: file.type });
      const base64Data = await blobToBase64(blob);
      
      // Create specialized prompt for lab reports
      const labPrompt = "I'm uploading my lab report and would like you to analyze it. " + userMessage;
      
      console.log('Sending lab report to Gemini API...');
      
      // Use structured format similar to Python implementation
      let result;
      try {
        result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                { text: labPrompt },
                { inlineData: { data: base64Data, mimeType: file.type } }
              ]
            }
          ]
        });
        
        console.log('Received response from Gemini API');
        const responseText = result.response.text();
        
        return NextResponse.json({ 
          success: true,
          analysis: responseText,
          filename: file.name,
          fileType: file.type,
        });
      } catch (generationError: any) {
        console.error('Error generating content:', generationError);
        
        // Detailed error for debugging
        const errorDetails = {
          message: generationError.message || 'Unknown error during content generation',
          code: generationError.code,
          status: generationError.status,
          details: generationError.details || {}
        };
        
        return NextResponse.json(
          { 
            error: 'Failed to analyze lab report: ' + errorDetails.message,
            errorDetails
          },
          { status: 500 }
        );
      }
    } catch (fileProcessingError: any) {
      console.error('Error processing file data:', fileProcessingError);
      return NextResponse.json(
        { error: 'Error processing lab report: ' + (fileProcessingError.message || 'Unknown error') },
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