import { genAI, geminiModel } from '@/lib/ai/gemini-provider';
import { streamText } from 'ai';
import { HarmCategory, HarmBlockThreshold, GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Path to store configuration
const CONFIG_PATH = path.join(process.cwd(), 'config.json');

// Default Health-specific system prompt
export const DEFAULT_SYSTEM_PROMPT = "You are a health analysis assistant that helps users understand their bloodwork and medical reports. You explain lab results in simple terms and provide general health insights. You always remind users that you are not providing medical advice and they should consult with healthcare professionals.";

/**
 * Gets the current system prompt from config file or returns the default
 * This function is used by the chat API to ensure it always uses the latest
 * configuration from the admin panel
 */
function getSystemPrompt() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
      const config = JSON.parse(configData);
      if (config.systemPrompt) {
        console.log('Using custom system prompt from config');
        return config.systemPrompt;
      }
    }
  } catch (error) {
    console.error('Error reading config for system prompt:', error);
    console.warn('Falling back to default system prompt due to error');
  }
  
  console.log('Using default system prompt');
  return DEFAULT_SYSTEM_PROMPT;
}

/**
 * Gets the API key from config file or falls back to environment variable
 * This allows the admin panel to override the API key at runtime
 */
function getApiKey() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
      const config = JSON.parse(configData);
      if (config.apiKey) {
        return config.apiKey;
      }
    }
  } catch (error) {
    console.error('Error reading API key from config:', error);
  }
  
  return process.env.GEMINI_API_KEY || '';
}

export async function POST(req: Request) {
  // Extract the `messages` from the body of the request
  const { messages, id } = await req.json();

  console.log('Chat ID:', id); // can be used for persisting the chat

  // Get the current API key from config or environment
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.error('No Gemini API key available');
    return new Response(JSON.stringify({ error: 'Gemini API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Initialize the API with the possibly updated API key
  const genAIInstance = new GoogleGenerativeAI(apiKey);

  // Convert messages to Gemini format
  const history = messages
    .slice(0, -1)
    .map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

  const lastMessage = messages[messages.length - 1].content;

  // Call the language model
  try {
    const model = genAIInstance.getGenerativeModel({ model: geminiModel });
    
    // Get the current system prompt from config or default
    const currentSystemPrompt = getSystemPrompt();
    
    // Create chat session with system prompt
    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 1000,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
      systemInstruction: currentSystemPrompt,
    });

    // Stream the response
    const streamingResult = await chat.sendMessageStream(lastMessage);
    
    const stream = new ReadableStream({
      async start(controller) {
        // Handle each chunk from Gemini
        for await (const chunk of streamingResult.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`));
          }
        }
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    let errorMessage = 'Error calling Gemini API';
    
    // Provide more specific error messages for common issues
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'Invalid or missing Gemini API key';
      } else if (error.message.includes('quota')) {
        errorMessage = 'Gemini API quota exceeded';
      }
    }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 