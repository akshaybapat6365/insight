import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// Get configuration
const CONFIG_PATH = path.join(process.cwd(), 'config.json');
function getConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf8');
      return JSON.parse(data);
    }
    return {
      systemPrompt: "You are a health analysis assistant that helps users understand their bloodwork and medical reports. You explain lab results in simple terms and provide general health insights. You always remind users that you are not providing medical advice and they should consult with healthcare professionals."
    };
  } catch (error) {
    console.error('Error reading config:', error);
    return { systemPrompt: "" };
  }
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const config = getConfig();
    
    // Use the API key from config if available, otherwise from env
    const apiKey = config.apiKey || process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use the model you want
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-thinking-exp-01-21" });
    
    interface ChatMessage {
      role: string;
      content: string;
    }
    
    // Prepare conversation history
    const formattedMessages = messages.map((msg: ChatMessage) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Configure the chat with the system prompt
    const chat = model.startChat({
      history: formattedMessages.slice(0, -1), // All messages except the last one
      generationConfig: {
        maxOutputTokens: 1000,
      },
      systemInstruction: config.systemPrompt,
    });
    
    // Get the last message to send
    const lastMessage = formattedMessages[formattedMessages.length - 1].parts[0].text;
    
    // Send the message and stream the response
    const streamingResult = await chat.sendMessageStream(lastMessage);
    
    // Create a ReadableStream to stream the response back to the client
    const stream = new ReadableStream({
      async start(controller) {
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
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during the request' },
      { status: 500 }
    );
  }
}
