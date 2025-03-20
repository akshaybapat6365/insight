import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// Path to store configuration
const CONFIG_PATH = path.join(process.cwd(), 'config.json');

export const geminiModel = "gemini-2.0-flash-thinking-exp-01-21"; // Using the correct experimental model

// Fallback model in case the primary model isn't available
export const fallbackModel = "gemini-1.5-pro";

// Additional fallback if both models fail
export const ultimateFallbackModel = "gemini-1.0-pro";

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
  
  // Add health disclaimer to all prompts
  const promptWithDisclaimer = 
    `${prompt}\n\nYour response must include a disclaimer that this is AI-generated content for ` +
    `educational purposes only and should not be considered medical advice. Always consult with ` +
    `healthcare professionals for interpreting health information and making medical decisions.`;
  
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    attempts++;
    try {
      // Select the appropriate model based on the attempt number
      let modelToUse: string;
      if (attempts === 1) {
        modelToUse = getGeminiModel();
      } else if (attempts === 2) {
        modelToUse = fallbackModel;
      } else {
        modelToUse = ultimateFallbackModel;
      }
      
      console.log(`Attempt ${attempts}: Using Gemini model: ${modelToUse}`);
      
      const genModel = freshClient.getGenerativeModel({ model: modelToUse });
      const result = await genModel.generateContent(promptWithDisclaimer);
      return result.response.text();
    } catch (error: any) {
      console.error(`Error with attempt ${attempts}: ${error.message}`);
      
      // If we've tried all models and still failed, throw an error
      if (attempts === maxAttempts) {
        throw new Error(`All model attempts failed. Last error: ${error.message}`);
      }
      
      // Otherwise continue to the next attempt with the fallback model
      console.log(`Falling back to next model attempt...`);
    }
  }
  
  // This shouldn't be reached due to the error throw above, but TypeScript requires a return
  throw new Error('Unexpected error: All model attempts failed without throwing an error');
} 