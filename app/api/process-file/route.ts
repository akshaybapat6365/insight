import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { loadConfig } from '@/lib/config'
import { getGeminiModel, fallbackModel } from '@/lib/ai/gemini-provider'

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 60, // Increase timeout for file processing
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    console.log('Processing file:', file.name, 'Type:', file.type, 'Size:', file.size)
    
    // File size validation
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_FILE_SIZE) {
      console.error('File too large:', file.size, 'bytes (max:', MAX_FILE_SIZE, 'bytes)')
      return NextResponse.json(
        { error: `File too large. Maximum file size is 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.` },
        { status: 400 }
      )
    }
    
    // Load configuration
    const appConfig = loadConfig()
    
    // Check for API key
    const apiKey = appConfig.apiKey || process.env.GEMINI_API_KEY || ''
    if (!apiKey) {
      console.error('Gemini API key not configured')
      return NextResponse.json(
        { error: 'API key not configured. Please add a valid Gemini API key in the admin console.' },
        { status: 500 }
      )
    }
    
    // Get model configuration from the config
    const primaryModelName = getGeminiModel()
    const fallbackModelName = appConfig.fallbackModel || fallbackModel
    const shouldUseFallback = appConfig.useFallback !== undefined ? appConfig.useFallback : true
    const maxOutputTokens = appConfig.maxOutputTokens || 4096
    
    console.log(`Using Gemini with model: ${primaryModelName}`)
    console.log(`Fallback enabled: ${shouldUseFallback}, fallback model: ${fallbackModelName}`)
    
    // Convert file to text
    let fileText = ''
    
    // For debugging and demonstration, just use the file name as sample text
    // In a production app, you would extract text from file
    fileText = `Sample text from ${file.name}`
    
    // Try with primary model
    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: primaryModelName })
      
      // Create prompt for processing the document
      const prompt = `Analyze this document and extract the key information in a clear, organized way: ${fileText}`
      
      const result = await model.generateContent(prompt)
      
      // Return extracted text
      return NextResponse.json({ 
        text: result.response.text(),
        model: primaryModelName
      })
    } catch (error: any) {
      console.error('Error with primary model:', error)
      
      if (!shouldUseFallback) {
        return NextResponse.json(
          { error: 'Failed to process file with primary model and fallback is disabled' },
          { status: 500 }
        )
      }
      
      // Try fallback model
      try {
        console.log(`Attempting fallback to ${fallbackModelName}`)
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: fallbackModelName })
        
        const prompt = `Analyze this document and extract the key information in a clear, organized way: ${fileText}`
        const result = await model.generateContent(prompt)
        
        return NextResponse.json({ 
          text: result.response.text(),
          model: fallbackModelName,
          fallback: true
        })
      } catch (fallbackError: any) {
        console.error('Fallback model also failed:', fallbackError)
        return NextResponse.json(
          { error: 'Could not process file with any available models' },
          { status: 500 }
        )
      }
    }
  } catch (error: any) {
    console.error('Error processing file:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred during file processing' },
      { status: 500 }
    )
  }
}

// Helper function to convert blob to base64
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      // Just get the base64 data part without the prefix
      resolve(base64String.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
} 