export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { loadConfig } from '@/lib/config';
import { getGeminiModel, fallbackModel } from '@/lib/ai/gemini-provider';

// Allowed file types
const allowedTypes = [
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

// System prompt for extracting health metrics from reports
const SYSTEM_PROMPT = `
You are a healthcare data analyst assistant. Your task is to extract health metrics from provided lab reports.
Extract all health metrics from the report and structure them as a JSON array.

For each metric:
- name: The name of the metric (e.g., "Glucose", "LDL Cholesterol")
- value: The numeric value
- unit: The unit of measurement (e.g., "mg/dL", "mmol/L")
- range: The reference range if provided (e.g., "70-99", "<100")
- status: Whether the value is "normal", "high", or "low" based on the reference range

IMPORTANT:
- Return ONLY the JSON array with no other text
- Only include metrics that have clear numeric values
- Include all relevant health metrics present in the report
- Format your response as a valid JSON array of objects
`;

export async function POST(req: Request) {
  try {
    // Check if form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload a PDF, TXT, CSV, or Excel file' 
      }, { status: 400 });
    }
    
    // For this MVP, we'll just extract the text content from the file
    // In a production app, you'd want more sophisticated file parsing
    let content = '';
    
    if (file.type === 'application/pdf') {
      // For PDFs, read as arrayBuffer and use pdf-parse in a real implementation
      content = await file.text(); // Simplified for MVP
    } else {
      // For text-based files, just read as text
      content = await file.text();
    }
    
    // Ensure we have some content to process
    if (!content || content.trim().length < 10) {
      return NextResponse.json({ 
        error: 'The uploaded file contains no readable text or is too short' 
      }, { status: 400 });
    }
    
    // Initialize the AI model
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'API key not configured' 
      }, { status: 500 });
    }
    
    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(apiKey);
    
    try {
      // Ask Gemini to extract and organize metrics
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const result = await model.generateContent({
        contents: [
          { 
            role: "user", 
            parts: [{ 
              text: `${SYSTEM_PROMPT}
                    The text to analyze is: ${content}`
            }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 32,
          topP: 0.95,
          maxOutputTokens: 8192
        }
      });

      const response = result.response;
      const responseText = response.text();
      
      // Try to parse the response as JSON
      try {
        // The model should return a JSON array
        const metrics = JSON.parse(responseText);
        
        return NextResponse.json({ 
          metrics,
          success: true 
        });
      } catch (jsonError) {
        console.error('Error parsing model response as JSON:', jsonError);
        
        // If parsing fails, return the raw text response
        return NextResponse.json({ 
          rawResponse: responseText,
          error: 'Failed to parse metrics as JSON',
          success: false 
        }, { status: 500 });
      }
    } catch (aiError) {
      console.error('Primary model error:', aiError);
      
      // Try fallback model
      try {
        // Fallback to a simpler approach
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        const fallbackResult = await fallbackModel.generateContent({
          contents: [
            { 
              role: "user", 
              parts: [{ 
                text: `Extract health metrics from this text and return as JSON: ${content}`
              }]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096
          }
        });
        
        const fallbackResponse = fallbackResult.response;
        const fallbackText = fallbackResponse.text();
        
        return NextResponse.json({ 
          rawResponse: fallbackText,
          fallback: true,
          success: false
        });
      } catch (fallbackError) {
        console.error('Fallback model error:', fallbackError);
        return NextResponse.json({ 
          error: 'Failed to extract metrics from the report',
          success: false 
        }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred processing the report',
      success: false 
    }, { status: 500 });
  }
} 