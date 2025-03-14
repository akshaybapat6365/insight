import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
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
    
    // Initialize Gemini API with proper error handling
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
    
    // Get model configuration from the config
    const primaryModelName = "gemini-2.0-flash-thinking-exp-01-21";
    const fallbackModelName = config.fallbackModel || "gemini-1.5-pro";
    const shouldUseFallback = config.useFallback !== undefined ? config.useFallback : true;
    const maxOutputTokens = config.maxOutputTokens || 1000;
    
    console.log(`Attempting to use model: ${primaryModelName}`);
    console.log(`Fallback enabled: ${shouldUseFallback}, fallback model: ${fallbackModelName}`);
    console.log(`Max output tokens: ${maxOutputTokens}`);
    
    // Try to use the primary model, with fallback options
    let model;
    try {
      // First try the experimental model
      model = genAI.getGenerativeModel({ model: primaryModelName });
    } catch (modelError: any) {
      console.warn(`Failed to use ${primaryModelName}:`, modelError.message);
      
      if (!shouldUseFallback) {
        return NextResponse.json(
          { error: `Could not access the primary Gemini model (${primaryModelName}) and fallback is disabled.` },
          { status: 500 }
        );
      }
      
      try {
        // Fall back to standard Gemini model
        console.log(`Attempting fallback to ${fallbackModelName}`);
        model = genAI.getGenerativeModel({ model: fallbackModelName });
      } catch (fallbackError: any) {
        console.error('Error creating fallback Gemini model:', fallbackError);
        return NextResponse.json(
          { error: 'Could not access any Gemini models. Please check your API key and permissions.' },
          { status: 500 }
        );
      }
    }
    
    interface ChatMessage {
      role: string;
      content: string;
    }
    
    // Prepare conversation history
    const formattedMessages = messages.map((msg: ChatMessage) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Ensure we have at least one message to process
    if (formattedMessages.length === 0) {
      return NextResponse.json(
        { error: 'No messages provided for chat' },
        { status: 400 }
      );
    }

    // Get system prompt from config
    const systemPrompt = config.systemPrompt || 
      "You are a helpful AI assistant specializing in health insights.";
    
    console.log(`Using system prompt (${systemPrompt.length} chars)`);

    // Configure the chat with the system prompt
    let chat;
    try {
      chat = model.startChat({
        history: formattedMessages.slice(0, -1), // All messages except the last one
        generationConfig: {
          maxOutputTokens: maxOutputTokens,
        },
        systemInstruction: systemPrompt,
      });
    } catch (chatError: any) {
      console.error('Error starting chat session:', chatError);
      return NextResponse.json(
        { error: 'Failed to start chat session: ' + (chatError.message || 'Unknown error') },
        { status: 500 }
      );
    }
    
    // Get the last message to send
    const lastMessage = formattedMessages[formattedMessages.length - 1].parts[0].text;
    console.log(`Processing user message (${lastMessage.length} chars)`);
    
    // Send the message and stream the response
    let streamingResult;
    try {
      streamingResult = await chat.sendMessageStream(lastMessage);
    } catch (streamError: any) {
      console.error('Error sending message to Gemini:', streamError);
      return NextResponse.json(
        { error: 'Failed to get response from Gemini: ' + (streamError.message || 'Unknown error') },
        { status: 500 }
      );
    }
    
    // Create a ReadableStream to stream the response back to the client
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamingResult.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        } catch (streamingError: any) {
          console.error('Error streaming response:', streamingError);
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ error: 'Error during streaming: ' + streamingError.message })}\n\n`
            )
          );
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        }
      },
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during the request' },
      { status: 500 }
    );
  }
}
