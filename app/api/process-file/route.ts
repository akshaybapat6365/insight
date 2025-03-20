import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { loadConfig } from '@/lib/config'
import { getGeminiModel, fallbackModel } from '@/lib/ai/gemini-provider'
import * as XLSX from 'xlsx'
// pdf-parse is a CommonJS module, we need to import it this way
const pdfParse = require('pdf-parse');

// Rate limiting implementation
const RATE_LIMIT_MAX = 15; // Maximum files per window (lower than chat since files are more costly)
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window

// Simple in-memory rate limiting store (use Redis in production)
const rateLimitStore: Record<string, { count: number, resetAt: number }> = {};

// Rate limiting function
function checkRateLimit(identifier: string): { limited: boolean, resetIn?: number } {
  const now = Date.now();
  const userRateLimit = rateLimitStore[identifier];
  
  // If no existing rate limit or window expired, create new entry
  if (!userRateLimit || userRateLimit.resetAt < now) {
    rateLimitStore[identifier] = { count: 1, resetAt: now + RATE_LIMIT_WINDOW };
    return { limited: false };
  }
  
  // If under limit, increment
  if (userRateLimit.count < RATE_LIMIT_MAX) {
    userRateLimit.count++;
    return { limited: false };
  }
  
  // Rate limited
  return { 
    limited: true, 
    resetIn: Math.ceil((userRateLimit.resetAt - now) / 1000) 
  };
}

// Use Node.js runtime for file processing
export const runtime = 'nodejs';

// Configure API route settings
export const config = {
  api: {
    // Use Next.js built-in body parser with size limit matching the client-side limit
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: false, // Don't limit response size for large file extractions
  },
  maxDuration: 60, // Increase timeout for file processing (60 seconds)
}

// Rate limiting implementation
const RATE_LIMIT_MAX = 15; // Maximum files per window (lower than chat since files are more costly)
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window

// Simple in-memory rate limiting store (use Redis in production)
const rateLimitStore: Record<string, { count: number, resetAt: number }> = {};

// Rate limiting function
function checkRateLimit(identifier: string): { limited: boolean, resetIn?: number } {
  const now = Date.now();
  const userRateLimit = rateLimitStore[identifier];
  
  // If no existing rate limit or window expired, create new entry
  if (!userRateLimit || userRateLimit.resetAt < now) {
    rateLimitStore[identifier] = { count: 1, resetAt: now + RATE_LIMIT_WINDOW };
    return { limited: false };
  }
  
  // If under limit, increment
  if (userRateLimit.count < RATE_LIMIT_MAX) {
    userRateLimit.count++;
    return { limited: false };
  }
  
  // Rate limited
  return { 
    limited: true, 
    resetIn: Math.ceil((userRateLimit.resetAt - now) / 1000) 
  };
}

// Rate limiting implementation
const RATE_LIMIT_MAX = 15; // Maximum files per window (lower than chat since files are more costly)
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window

// Simple in-memory rate limiting store (use Redis in production)
const rateLimitStore: Record<string, { count: number, resetAt: number }> = {};

// Rate limiting function
function checkRateLimit(identifier: string): { limited: boolean, resetIn?: number } {
  const now = Date.now();
  const userRateLimit = rateLimitStore[identifier];
  
  // If no existing rate limit or window expired, create new entry
  if (!userRateLimit || userRateLimit.resetAt < now) {
    rateLimitStore[identifier] = { count: 1, resetAt: now + RATE_LIMIT_WINDOW };
    return { limited: false };
  }
  
  // If under limit, increment
  if (userRateLimit.count < RATE_LIMIT_MAX) {
    userRateLimit.count++;
    return { limited: false };
  }
  
  // Rate limited
  return { 
    limited: true, 
    resetIn: Math.ceil((userRateLimit.resetAt - now) / 1000) 
  };
}

export async function POST(request: Request) {
  try {
    // Apply rate limiting by IP
    const ip = request.headers.get("x-forwarded-for") || 
              request.headers.get("x-real-ip") || 
              "unknown-ip";
    
    // Apply rate limiting
    const rateLimitResult = checkRateLimit(`ip-${ip}`);
    if (rateLimitResult.limited) {
      return NextResponse.json(
        { 
          error: `Rate limit exceeded. Please try again in ${rateLimitResult.resetIn} seconds.` 
        }, 
        { 
          status: 429,
          headers: {
            'Retry-After': `${rateLimitResult.resetIn}`,
            'X-RateLimit-Limit': `${RATE_LIMIT_MAX}`,
            'X-RateLimit-Reset-In': `${rateLimitResult.resetIn}`
          } 
        }
      );
    }
  
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
    
    // Extract text based on file type
    let text = '';
    
    try {
      // Improved file type detection using both MIME type and extension
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      
      if (file.type === 'application/pdf' || fileExtension === 'pdf') {
        // For PDFs, forward to specialized processing
        return await handlePdfFile(request, formData, file);
      } 
      else if (
        file.type === 'image/jpeg' || 
        file.type === 'image/png' || 
        file.type === 'image/jpg' ||
        ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)
      ) {
        // For images, forward to specialized processing
        return await handleImageFile(request, formData, file);
      }
      else if (
        file.type === 'text/csv' || 
        fileExtension === 'csv'
      ) {
        // Process CSV files
        text = await processCsvFile(file);
      }
      else if (
        file.type === 'application/vnd.ms-excel' || 
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type.includes('excel') ||
        file.type.includes('spreadsheet') ||
        ['xls', 'xlsx'].includes(fileExtension)
      ) {
        // Process Excel files
        text = await processExcelFile(file);
      }
      else if (
        file.type === 'text/plain' ||
        ['txt', 'text'].includes(fileExtension)
      ) {
        // Plain text files
        text = await file.text();
      }
      else {
        // Try to handle unknown file types by extension
        if (['xls', 'xlsx'].includes(fileExtension)) {
          text = await processExcelFile(file);
        } else if (fileExtension === 'csv') {
          text = await processCsvFile(file);
        } else if (fileExtension === 'pdf') {
          return await handlePdfFile(request, formData, file);
        } else {
          return NextResponse.json(
            { error: `Unsupported file type: ${file.type} (${fileExtension}). Please upload a PDF, image, CSV, Excel, or text file.` },
            { status: 400 }
          );
        }
      }
      
      // Return the extracted text
      return NextResponse.json({ 
        text, 
        success: true,
        filename: file.name,
        fileType: file.type,
        fileSize: file.size
      });
      
    } catch (processingError: any) {
      console.error('Error during file processing:', processingError);
      
      // Create user-friendly error message
      let errorMessage = `Error processing file: ${processingError.message || 'Unknown error'}`;
      if (processingError.code) {
        errorMessage += ` (Error code: ${processingError.code})`;
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          success: false,
          errorType: processingError.name || 'ProcessingError',
          // Only include stack trace in development
          ...(process.env.NODE_ENV === 'development' && { stack: processingError.stack })
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error processing file:', error)
    
    // Create user-friendly error message with appropriate details
    return NextResponse.json(
      { 
        error: `An error occurred during file processing: ${error.message || 'Unknown error'}`,
        success: false,
        errorType: error.name || 'ServerError',
        // Only include stack trace in development
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      },
      { status: 500 }
    )
  }
}

// Process CSV files
async function processCsvFile(file: File): Promise<string> {
  try {
    // Get the file content as text
    const csvText = await file.text();
    
    // Handle empty files
    if (!csvText.trim()) {
      return "The CSV file appears to be empty.";
    }
    
    // Split by common CSV delimiters to detect the correct one
    const possibleDelimiters = [',', ';', '\t', '|'];
    let delimiter = ','; // default
    let maxColumns = 0;
    
    // Try to determine the delimiter by seeing which one creates the most columns
    for (const del of possibleDelimiters) {
      const sampleRow = csvText.split('\n')[0];
      const columnCount = sampleRow.split(del).length;
      if (columnCount > max