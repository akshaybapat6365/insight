import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { loadConfig } from '@/lib/config';
import { getGeminiModel, fallbackModel } from '@/lib/ai/gemini-provider';

// System prompt for the AI model to extract metrics
const SYSTEM_PROMPT = `# Task: Extract Health Metrics from Lab Reports

Your task is to analyze the provided lab report text and extract all relevant health metrics in a structured format. Follow these guidelines:

1. Identify all health metrics/biomarkers in the lab report (e.g., Glucose, HbA1c, Cholesterol, etc.)
2. For each metric, extract:
   - The exact numerical value
   - The unit of measurement
   - The normal reference range if provided
   - The status (normal, high, low) based on the reference range

## Response Format
Return a JSON object with the following structure:
{
  "metrics": {
    "Glucose": {
      "value": 95,
      "unit": "mg/dL",
      "normalRange": "70-99 mg/dL",
      "status": "normal"
    },
    "Total Cholesterol": {
      "value": 210,
      "unit": "mg/dL",
      "normalRange": "<200 mg/dL",
      "status": "high"
    }
    // Add all identified metrics
  }
}

## Important Notes:
- Only extract metrics that have numerical values
- Always include units when available
- Be precise with the metric names for consistency across reports
- If a normal range isn't provided, omit the normalRange field
- If status can't be determined, omit the status field
- Process all metrics you can find in the report
`;

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { content } = body;
    
    if (!content) {
      return NextResponse.json(
        { error: 'No content provided' },
        { status: 400 }
      );
    }
    
    console.log('Processing lab report for metrics extraction, content length:', content.length);
    
    // Load configuration
    const config = loadConfig();
    
    // Check for API key
    const apiKey = config.apiKey || process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      console.error('Gemini API key not configured');
      return NextResponse.json(
        { error: 'API key not configured. Please add a valid Gemini API key in the admin console.' },
        { status: 500 }
      );
    }
    
    // Configure AI settings
    const modelName = getGeminiModel();
    console.log(`Using model: ${modelName} for metrics extraction`);
    
    // Initialize the Gemini API client
    const genAI = new GoogleGenAI({
      apiKey: apiKey
    });
    
    try {
      // Generate response with Gemini
      const result = await genAI.models.generateContent({
        model: modelName,
        contents: [
          {
            role: "user",
            parts: [
              { text: SYSTEM_PROMPT },
              { text: "Lab report contents: " + content }
            ]
          }
        ],
        // Force JSON response with generationConfig
        generationConfig: {
          responseType: "json_object"
        }
      });
      
      // Parse the response
      let metricsData;
      try {
        // Try to extract JSON from the response
        const responseText = result.text;
        // Check if result is already valid JSON
        try {
          metricsData = JSON.parse(responseText);
        } catch {
          // If not, try to extract JSON using regex
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            metricsData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Could not extract JSON from response');
          }
        }
      } catch (parseError) {
        console.error('Error parsing metrics JSON:', parseError);
        return NextResponse.json(
          { error: 'Failed to parse metrics from the report' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        metrics: metricsData.metrics || {},
        model: modelName
      });
      
    } catch (error: any) {
      console.error('Error processing lab report with primary model:', error);
      
      // Try with fallback model
      try {
        console.log(`Falling back to ${fallbackModel}`);
        
        const fallbackResult = await genAI.models.generateContent({
          model: fallbackModel,
          contents: [
            {
              role: "user",
              parts: [
                { text: SYSTEM_PROMPT },
                { text: "Lab report contents: " + content }
              ]
            }
          ],
          generationConfig: {
            responseType: "json_object"
          }
        });
        
        // Parse the fallback response
        let fallbackMetricsData;
        try {
          const fallbackResponseText = fallbackResult.text;
          try {
            fallbackMetricsData = JSON.parse(fallbackResponseText);
          } catch {
            const jsonMatch = fallbackResponseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              fallbackMetricsData = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error('Could not extract JSON from fallback response');
            }
          }
        } catch (parseError) {
          console.error('Error parsing fallback metrics JSON:', parseError);
          return NextResponse.json(
            { error: 'Failed to parse metrics from the report (fallback failed)' },
            { status: 500 }
          );
        }
        
        return NextResponse.json({
          success: true,
          metrics: fallbackMetricsData.metrics || {},
          model: fallbackModel,
          fallback: true
        });
        
      } catch (fallbackError: any) {
        console.error('Fallback model also failed:', fallbackError);
        return NextResponse.json(
          {
            error: 'Both primary and fallback AI models failed to extract metrics.',
            originalError: error.message,
            fallbackError: fallbackError.message
          },
          { status: 500 }
        );
      }
    }
  } catch (error: any) {
    console.error('Error processing report for metrics:', error);
    return NextResponse.json(
      {
        error: error.message || 'An error occurred during metrics extraction',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 