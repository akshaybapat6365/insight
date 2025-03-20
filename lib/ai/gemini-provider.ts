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
 * Logs helpful messages if API key is not found
 */
function getApiKey(): string {
  // First try to get from environment variable (highest priority)
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }

  // Then try to get from config file
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
      const config = JSON.parse(configData);
      if (config.apiKey) {
        return config.apiKey;
      }
    }
  } catch (error) {
    console.error('Error reading API key from config file:', error);
  }
  
  // Log helpful messages if API key is not found
  console.error('GEMINI_API_KEY not found in environment variables or config file.');
  console.error('Please set the GEMINI_API_KEY environment variable or update the config.json file.');
  
  return '';
}

/**
 * Initialize the Google AI SDK with the API key from config or environment
 * Returns null if no API key is available
 */
export function createFreshGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = getApiKey();
  if (!apiKey) {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
}

// Initialize the client (may be null if no API key)
export const genAI = createFreshGeminiClient();

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
  
  if (!freshClient) {
    throw new Error('API key not configured. Please set the GEMINI_API_KEY environment variable.');
  }
  
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