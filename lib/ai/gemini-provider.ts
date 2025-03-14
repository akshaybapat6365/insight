import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// Path to store configuration
const CONFIG_PATH = path.join(process.cwd(), 'config.json');

export const geminiModel = "gemini-2.0-flash-thinking-exp-01-21"; // Using the correct experimental model

// Fallback model in case the primary model isn't available
export const fallbackModel = "gemini-1.5-pro";

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

// Function to get the appropriate model based on availability and config
export function getGeminiModel(): string {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
      const config = JSON.parse(configData);
      if (config.aiModel) {
        return config.aiModel;
      }
    }
  } catch (error) {
    console.error('Error reading model from config:', error);
  }
  
  return geminiModel;
}

// Create a function to generate content with Gemini
export async function generateContentWithGemini(prompt: string) {
  // Always create a fresh client to ensure we have the latest API key
  const freshClient = createFreshGeminiClient();
  try {
    const model = getGeminiModel();
    console.log(`Using Gemini model: ${model}`);
    const genModel = freshClient.getGenerativeModel({ model });
    const result = await genModel.generateContent(prompt);
    return result.response.text();
  } catch (error: any) {
    console.error(`Error with primary model: ${error.message}`);
    console.log(`Falling back to ${fallbackModel}`);
    
    // Try with fallback model
    const genModel = freshClient.getGenerativeModel({ model: fallbackModel });
    const result = await genModel.generateContent(prompt);
    return result.response.text();
  }
} 