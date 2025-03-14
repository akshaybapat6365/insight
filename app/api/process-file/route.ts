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
    
    // Route based on file type
    let processingRoute = '';
    if (file.type === 'application/pdf' || 
        file.type === 'image/jpeg' || 
        file.type === 'image/png' || 
        file.type === 'image/jpg') {
      processingRoute = '/api/python-process-file';
      console.log(`Forwarding ${file.type} file to ${processingRoute}`);
    } else if (file.type === 'application/vnd.ms-excel' || 
               file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      // TODO: Implement Excel processing route
      return NextResponse.json(
        { error: 'Excel files are not supported yet.' },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}` },
        { status: 400 }
      );
    }

    // Forward the request to the appropriate processing route
    try {
      const forwardedResponse = await fetch(new URL(processingRoute, request.url), {
        method: 'POST',
        body: formData, // Pass the original formData
      });

      if (!forwardedResponse.ok) {
        const errorData = await forwardedResponse.json();
        console.error('Error from processing route:', errorData);
        return NextResponse.json(errorData, { status: forwardedResponse.status });
      }

      const processedData = await forwardedResponse.json();
      return NextResponse.json(processedData);
    } catch (forwardError: any) {
      console.error('Error forwarding request:', forwardError);
      return NextResponse.json(
        { error: `Error processing file: ${forwardError.message}` },
        { status: 500 }
      );
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