import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

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
    
    // For this simplified version, we'll use Gemini directly to extract text from files
    // This approach avoids implementing separate OCR and parsing logic
    
    const bytes = await file.arrayBuffer()
    const blob = new Blob([bytes])
    
    // Initialize Google AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-thinking-exp-01-21' })
    
    // Extract the file contents using Gemini's multimodal capabilities
    let extractionPrompt
    
    if (file.type.includes('pdf') || file.type.includes('image')) {
      // For PDFs and images, we can use Gemini's vision capabilities
      extractionPrompt = "Extract all text from this document that appears to be related to medical test results or health data. Format it clearly with test names, values, and reference ranges if present."
    } else {
      // For Excel/CSV, we can ask Gemini to help structure the data
      extractionPrompt = "This is a spreadsheet with health data. Extract and organize the medical test results into a clear format with test names, values, and reference ranges if present."
    }
    
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: extractionPrompt },
            { inlineData: { data: await blobToBase64(blob), mimeType: file.type } }
          ]
        }
      ]
    })
    
    const extractedText = result.response.text()
    
    return NextResponse.json({ text: extractedText })
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
      resolve(base64String.split(',')[1]) // Remove the data URL prefix
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
} 