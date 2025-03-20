import fs from 'fs';
import path from 'path';

interface AppConfig {
  systemPrompt?: string;
  apiKey?: string;
  fallbackModel?: string;
  useFallback?: boolean;
  maxOutputTokens?: number;
}

const CONFIG_FILE_PATH = path.join(process.cwd(), 'config.json');

// Check if we're running on Vercel (production)
const isVercel = !!process.env.VERCEL;

/**
 * Load configuration from file system and environment variables
 * Priority: Environment variables > config.json > defaults
 */
export function loadConfig(): AppConfig {
  let fileConfig: AppConfig = {};
  
  // Only try to load from config file if not on Vercel
  if (!isVercel) {
    try {
      if (fs.existsSync(CONFIG_FILE_PATH)) {
        const rawData = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
        fileConfig = JSON.parse(rawData);
        console.log('Config loaded from file:', Object.keys(fileConfig).join(', '));
      } else {
        console.log('No config.json file found');
      }
    } catch (error) {
      console.error('Error loading config file:', error);
      // Continue with empty config
    }
  }
  
  // Create merged config with environment variables ALWAYS taking precedence
  const config: AppConfig = {
    // Default values
    systemPrompt: "You are a health analysis assistant that helps users understand their bloodwork and medical reports.",
    fallbackModel: "gemini-1.5-pro",
    useFallback: true,
    maxOutputTokens: 1000,
    
    // File config overrides defaults (only if not on Vercel)
    ...((!isVercel && fileConfig) || {}),
    
    // Environment variables ALWAYS override file config
    ...process.env.SYSTEM_PROMPT ? { systemPrompt: process.env.SYSTEM_PROMPT } : {},
    ...process.env.GEMINI_API_KEY ? { apiKey: process.env.GEMINI_API_KEY } : {},
    ...process.env.DEFAULT_GEMINI_MODEL ? { fallbackModel: process.env.DEFAULT_GEMINI_MODEL } : {},
    ...process.env.USE_FALLBACK_MODEL ? { useFallback: process.env.USE_FALLBACK_MODEL === 'true' } : {},
    ...process.env.MAX_OUTPUT_TOKENS ? { maxOutputTokens: parseInt(process.env.MAX_OUTPUT_TOKENS, 10) } : {},
  };
  
  // Ensure we have an API key - critical for operation
  if (!config.apiKey) {
    console.warn('No API key found in environment variables or config file');
  }
  
  return config;
}

/**
 * Save configuration to file system
 * Note: In serverless environments, this might not persist between invocations
 */
export async function saveConfig(newConfig: Partial<AppConfig>): Promise<{success: boolean, message: string, isEphemeral?: boolean}> {
  try {
    // If on Vercel, only update environment variables for current instance
    // but don't try to write to filesystem
    if (isVercel) {
      // Update environment variables for current instance only
      if (newConfig.systemPrompt) {
        process.env.SYSTEM_PROMPT = newConfig.systemPrompt;
      }
      
      if (newConfig.apiKey) {
        process.env.GEMINI_API_KEY = newConfig.apiKey;
      }
      
      if (newConfig.fallbackModel) {
        process.env.DEFAULT_GEMINI_MODEL = newConfig.fallbackModel;
      }
      
      if (newConfig.useFallback !== undefined) {
        process.env.USE_FALLBACK_MODEL = newConfig.useFallback ? 'true' : 'false';
      }
      
      if (newConfig.maxOutputTokens !== undefined) {
        process.env.MAX_OUTPUT_TOKENS = newConfig.maxOutputTokens.toString();
      }
      
      return {
        success: true,
        isEphemeral: true,
        message: 'Configuration applied to current instance. IMPORTANT: On Vercel, changes will NOT persist after the serverless function restarts. For permanent changes, set environment variables in the Vercel dashboard.'
      };
    }
    
    // For local development, merge with existing config and save to file
    let existingConfig: AppConfig = {};
    try {
      if (fs.existsSync(CONFIG_FILE_PATH)) {
        const rawData = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
        existingConfig = JSON.parse(rawData);
      }
    } catch (error) {
      console.error('Error reading existing config:', error);
      // Continue with empty config
    }
    
    // Merge configs
    const mergedConfig: AppConfig = {
      ...existingConfig,
      ...newConfig,
    };
    
    // Also update environment variables for current instance
    if (newConfig.systemPrompt) {
      process.env.SYSTEM_PROMPT = newConfig.systemPrompt;
    }
    
    if (newConfig.apiKey) {
      process.env.GEMINI_API_KEY = newConfig.apiKey;
    }
    
    if (newConfig.fallbackModel) {
      process.env.DEFAULT_GEMINI_MODEL = newConfig.fallbackModel;
    }
    
    if (newConfig.useFallback !== undefined) {
      process.env.USE_FALLBACK_MODEL = newConfig.useFallback ? 'true' : 'false';
    }
    
    if (newConfig.maxOutputTokens !== undefined) {
      process.env.MAX_OUTPUT_TOKENS = newConfig.maxOutputTokens.toString();
    }
    
    // Save config to file
    try {
      fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(mergedConfig, null, 2), 'utf8');
      console.log('Configuration saved to file successfully');
      
      return {
        success: true,
        isEphemeral: false,
        message: 'Configuration saved successfully and applied to the current instance.'
      };
    } catch (writeError) {
      console.error('Error writing config file:', writeError);
      
      return {
        success: false,
        message: `Failed to write config file: ${writeError instanceof Error ? writeError.message : 'Unknown error'}. However, values have been applied to the current instance.`
      };
    }
  } catch (error) {
    console.error('Error saving config:', error);
    return {
      success: false,
      message: `Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Get environment information for debugging
 */
export function getEnvironmentInfo() {
  return {
    nodeEnv: process.env.NODE_ENV || 'Not set',
    isVercel: !!process.env.VERCEL || false,
    vercelEnv: process.env.VERCEL_ENV || 'Not set',
    hasGeminiApiKey: !!process.env.GEMINI_API_KEY,
    hasSystemPrompt: !!process.env.SYSTEM_PROMPT,
    hasAdminPassword: !!process.env.ADMIN_PASSWORD,
    hasConfigFile: !isVercel && fs.existsSync(CONFIG_FILE_PATH),
    serverPid: process.pid,
    configPath: CONFIG_FILE_PATH,
  };
} 