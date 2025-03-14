import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

export const geminiModel = "gemini-2.0-flash-thinking-exp-01-21"; // Latest Gemini model

// Path to store configuration
const CONFIG_PATH = path.join(process.cwd(), 'config.json');

/**
 * Gets the API key from config file or falls back to environment variable
 */
function getApiKey(): string {
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

// Initialize the Google AI SDK with the API key from config or environment
export const genAI = new GoogleGenerativeAI(getApiKey());

/**
 * Creates a new instance of the Google AI SDK with the latest API key
 * This ensures we always use the most up-to-date API key from the config
 */
export function createFreshGeminiClient(): GoogleGenerativeAI {
  return new GoogleGenerativeAI(getApiKey());
}

// Create a function to generate content with Gemini
export async function generateContentWithGemini(prompt: string) {
  // Always create a fresh client to ensure we have the latest API key
  const freshClient = createFreshGeminiClient();
  const model = freshClient.getGenerativeModel({ model: geminiModel });
  const result = await model.generateContent(prompt);
  return result.response.text();
} 