import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { loadConfig } from '@/lib/config';
import { getGeminiModel, fallbackModel, createFreshGeminiClient } from '@/lib/ai/gemini-provider';
import { auth } from '@/auth';
import { saveChat } from '@/lib/services/chat-service';

// System prompt for the health assistant
const SYSTEM_PROMPT = `You are a health education assistant that helps users understand their health data, lab results, and medical terminology.

Your primary goals are to:
1. Provide clear, educational explanations about health metrics and medical terms
2. Help users understand what their lab results might mean (only as educational content, not medical advice)
3. Answer general health questions with scientific accuracy
4. Always be respectful, compassionate, and mindful that health topics can be sensitive

Important guidelines:
- NEVER diagnose conditions or provide personalized medical advice
- Always clarify that you're providing educational information only, not medical advice
- Recommend consulting healthcare professionals for specific medical concerns or diagnosis
- Be precise when discussing medical concepts, but explain them in accessible language
- When uncertain, acknowledge the limits of your knowledge rather than guessing
- Maintain patient privacy and data security at all times
- Provide evidence-based information and cite sources when appropriate
- NEVER prescribe medications or suggest changing prescribed treatments
- Always include a health disclaimer when interpreting lab data

Remember: Your role is to educate, not to replace healthcare providers.`;

export async function POST(req: Request) {
  try {
    // Get the session to check if user is authenticated
    const session = await auth();
    const userId = session?.user?.id;

    // Parse the request body
    const body = await req.json();
    const { messages, chatId } = body;

    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    // Get a fresh Gemini client
    const genAI = createFreshGeminiClient();
    if (!genAI) {
      return NextResponse.json(
        { error: 'API key not configured. Please add a valid Gemini API key in the admin console.' },
        { status: 500 }
      );
    }

    // Configure AI settings
    const modelName = getGeminiModel();
    const fallbackModelName = fallbackModel;
    console.log(`Using model: ${modelName} for chat`);

    // Map messages for Gemini API format
    const historyMessages = messages.slice(0, -1);
    const lastUserMessage = messages[messages.length - 1];

    try {
      // Create the chat model
      const model = genAI.getGenerativeModel({ model: modelName });
      
      // Start a chat session
      const chat = model.startChat({
        history: historyMessages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        })),
        generationConfig: {
          temperature: 0.5,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 2048,
        },
      });

      // Generate a response
      const result = await chat.sendMessage(`${SYSTEM_PROMPT}\n\nUser: ${lastUserMessage.content}`);
      const responseText = result.response.text();

      // Create a response message object
      const responseMessage = {
        role: 'assistant',
        content: responseText,
        id: Date.now().toString()
      };

      // Save the chat in the database if user is authenticated
      if (userId && chatId) {
        const allMessages = [...messages, responseMessage];
        await saveChat(userId, chatId, allMessages);
      }

      return NextResponse.json({
        message: responseMessage
      });

    } catch (error: any) {
      console.error('Error with primary model:', error);
      
      try {
        console.log(`Falling back to ${fallbackModelName}`);
        
        // Try with fallback model
        const fallbackModelInstance = genAI.getGenerativeModel({ model: fallbackModelName });
        
        // Start a chat session with fallback model
        const fallbackChat = fallbackModelInstance.startChat({
          history: historyMessages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          })),
          generationConfig: {
            temperature: 0.5,
            topP: 0.9,
            topK: 40,
            maxOutputTokens: 2048,
          },
        });

        // Generate a response with fallback model
        const fallbackResult = await fallbackChat.sendMessage(`${SYSTEM_PROMPT}\n\nUser: ${lastUserMessage.content}`);
        const fallbackResponseText = fallbackResult.response.text();

        // Create a response message object
        const fallbackResponseMessage = {
          role: 'assistant',
          content: fallbackResponseText,
          id: Date.now().toString()
        };

        // Save the chat in the database if user is authenticated
        if (userId && chatId) {
          const allMessages = [...messages, fallbackResponseMessage];
          await saveChat(userId, chatId, allMessages);
        }

        return NextResponse.json({
          message: fallbackResponseMessage,
          fallback: true
        });
        
      } catch (fallbackError: any) {
        console.error('Fallback model also failed:', fallbackError);
        return NextResponse.json(
          {
            error: 'Failed to generate a response. Please try again later.',
            errorDetails: error.message
          },
          { status: 500 }
        );
      }
    }
  } catch (error: any) {
    console.error('Unexpected error in chat API:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        errorDetails: error.message
      },
      { status: 500 }
    );
  }
}
