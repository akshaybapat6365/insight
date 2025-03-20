// Specify Node.js runtime to ensure compatibility with Prisma
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { saveChat } from '@/lib/services/unified-chat-service';
import { loadConfig } from '@/lib/config';

// Set maximum duration for API route (60 seconds)
export const maxDuration = 60;

// Rate limiting implementation
const RATE_LIMIT_MAX = 30; // Maximum requests per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window

// Simple in-memory rate limiting store (use Redis in production)
const rateLimitStore: Record<string, { count: number, resetAt: number }> = {};

// Rate limiting function
function checkRateLimit(identifier: string): { limited: boolean, resetIn?: number } {
  const now = Date.now();
  const userRateLimit = rateLimitStore[identifier];
  
  // If no existing rate limit or window expired, create new entry
  if (!userRateLimit || userRateLimit.resetAt < now) {
    rateLimitStore[identifier] = { count: 1, resetAt: now + RATE_LIMIT_WINDOW };
    return { limited: false };
  }
  
  // If under limit, increment
  if (userRateLimit.count < RATE_LIMIT_MAX) {
    userRateLimit.count++;
    return { limited: false };
  }
  
  // Rate limited
  return { 
    limited: true, 
    resetIn: Math.ceil((userRateLimit.resetAt - now) / 1000) 
  };
}

// Load system prompt from configuration
const getSystemPrompt = (): string => {
  // First try to get from configuration
  const config = loadConfig();
  if (config.systemPrompt) {
    return config.systemPrompt;
  }
  
  // Fallback to default system prompt
  return `
You are Health Insights AI, a specialized health education assistant focused on helping users understand health concepts, medical information, and wellness strategies. Your primary goals are:

1. Provide evidence-based health information and explanations
2. Help users understand medical concepts, terminology, and research
3. Offer educational content about healthy lifestyle choices, prevention strategies, and wellness approaches
4. Analyze general health data trends and explain their significance
5. Suggest relevant health resources, studies, and reliable references

IMPORTANT GUIDELINES:
- You are educational only. Do not diagnose, prescribe treatments, or provide personalized medical advice.
- Always clarify that users should consult qualified healthcare providers for personal medical decisions.
- Present balanced information on health topics, including mainstream and evidence-based alternative approaches when relevant.
- Be transparent about scientific consensus vs. emerging research.
- Respect user privacy and emphasize that you do not store personal health information.
- When discussing sensitive health topics, maintain a professional, non-judgmental approach.
- Prioritize reputable sources from established medical institutions, peer-reviewed research, and recognized health authorities.
- Clearly explain complex health concepts in accessible language.
- Acknowledge the limitations of your knowledge, especially regarding very recent medical developments.
`;
};

export async function POST(req: Request) {
  try {
    // Apply rate limiting by IP and user ID
    let identifier = "anonymous";
    
    // Get IP address for rate limiting
    const ip = req.headers.get("x-forwarded-for") || 
              req.headers.get("x-real-ip") || 
              "unknown-ip";
    
    const body = await req.json();
    const { messages, chatId, userId } = body;
    
    // Use user ID if available, otherwise use IP
    if (userId) {
      identifier = userId;
    } else {
      identifier = `ip-${ip}`;
    }
    
    // Apply rate limiting
    const rateLimitResult = checkRateLimit(identifier);
    if (rateLimitResult.limited) {
      return NextResponse.json(
        { 
          error: `Rate limit exceeded. Please try again in ${rateLimitResult.resetIn} seconds.` 
        }, 
        { 
          status: 429,
          headers: {
            'Retry-After': `${rateLimitResult.resetIn}`,
            'X-RateLimit-Limit': `${RATE_LIMIT_MAX}`,
            'X-RateLimit-Reset-In': `${rateLimitResult.resetIn}`
          } 
        }
      );
    }

    // Validate messages format
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    // Ensure API key is configured - try from config and fallback to env var
    const config = loadConfig();
    const apiKey = config.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not configured");
      return NextResponse.json(
        { error: "API key not configured. Please set the GEMINI_API_KEY environment variable or configure it in the admin console." },
        { status: 500 }
      );
    }

    // Get system prompt from configuration
    const systemPrompt = getSystemPrompt();

    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(apiKey);

    try {
      // Get model from configuration or use default
      const configuredModel = config.fallbackModel || "gemini-1.5-flash";
      
      // Try the primary model first (or configured model)
      try {
        const model = genAI.getGenerativeModel({ model: configuredModel });

        const result = await model.generateContent({
          contents: [
            { role: "user", parts: [{ text: systemPrompt }] },
            ...messages.map((message: any) => ({
              role: message.role === "user" ? "user" : "model",
              parts: [{ text: message.content }],
            })),
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: config.maxOutputTokens || 2048,
          },
        });

        const response = result.response;
        const text = response.text();

        // Save chat in database if user is authenticated
        if (userId) {
          try {
            await saveChat({
              userId,
              chatId,
              messages: [
                ...messages,
                { role: "assistant", content: text }
              ]
            });
          } catch (error) {
            console.error("Error saving chat:", error);
            // Continue to return response even if saving fails
          }
        }

        return NextResponse.json({ role: "assistant", content: text });
      } catch (primaryModelError) {
        console.log("Primary model error:", primaryModelError);
        
        // Check if fallback is enabled in configuration
        if (config.useFallback === false) {
          throw primaryModelError; // Do not fallback if disabled
        }
        
        // Fallback to gemini-pro model
        const fallbackModelName = "gemini-pro"; // Most reliable fallback
        const fallbackModel = genAI.getGenerativeModel({ model: fallbackModelName });
        
        console.log(`Falling back to ${fallbackModelName}`);
        
        const result = await fallbackModel.generateContent({
          contents: [
            { role: "user", parts: [{ text: systemPrompt }] },
            ...messages.map((message: any) => ({
              role: message.role === "user" ? "user" : "model",
              parts: [{ text: message.content }],
            })),
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: config.maxOutputTokens || 2048,
          },
        });

        const response = result.response;
        const text = response.text();

        // Save chat in database if user is authenticated
        if (userId) {
          try {
            await saveChat({
              userId,
              chatId,
              messages: [
                ...messages,
                { role: "assistant", content: text }
              ]
            });
          } catch (error) {
            console.error("Error saving chat:", error);
            // Continue to return response even if saving fails
          }
        }

        return NextResponse.json({ 
          role: "assistant", 
          content: text,
          model: fallbackModelName,
          fallback: true
        });
      }
    } catch (error: any) {
      console.error("Error generating response:", error);
      
      // Provide a user-friendly error message
      let errorMessage = "Failed to generate a response. Please try again later.";
      
      // Include more details for development
      if (process.env.NODE_ENV === "development") {
        errorMessage += ` Error: ${error.message || "Unknown error"}`;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error processing request:", error);
    
    // Provide a generic error message
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
