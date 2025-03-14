import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

export const geminiModel = "gemini-2.0-pro-exp-02-05"; // Updated to latest Gemini 2.0 Pro Experimental model

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
export const genAI = new GoogleGenAI({
  apiKey: getApiKey()
});

/**
 * Creates a new instance of the Google AI SDK with the latest API key
 * This ensures we always use the most up-to-date API key from the config
 */
export function createFreshGeminiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: getApiKey()
  });
}

// Create a function to generate content with Gemini
export async function generateContentWithGemini(prompt: string) {
  // Always create a fresh client to ensure we have the latest API key
  const freshClient = createFreshGeminiClient();
  const result = await freshClient.models.generateContent({
    model: geminiModel,
    contents: prompt
  });
  return result.text;
} 