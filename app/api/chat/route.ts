// Specify Node.js runtime to ensure compatibility with Prisma
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { saveChat } from '@/lib/services/chat-service';

const systemPrompt = `
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, chatId, userId } = body;

    // Validate messages format
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    // Ensure API key is configured
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error("GOOGLE_API_KEY is not configured");
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(apiKey);

    try {
      // Try the primary model first (gemini-1.5-flash)
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
            maxOutputTokens: 2048,
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
        
        // Fallback to gemini-pro model
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro" });
        
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
            maxOutputTokens: 2048,
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
      }
    } catch (error) {
      console.error("Error generating response:", error);
      return NextResponse.json(
        { error: "Failed to generate response" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
