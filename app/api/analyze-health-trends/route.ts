import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { loadConfig } from '@/lib/config';
import { getGeminiModel, fallbackModel } from '@/lib/ai/gemini-provider';

// System prompt for the AI model to analyze health trends
const SYSTEM_PROMPT = `# Task: Analyze Health Metrics Trends Over Time

Your task is to analyze health metrics from multiple lab reports over time and provide insights about the trends. Use the provided data to generate a comprehensive analysis that helps the user understand how their health metrics are changing.

## Follow these guidelines:

1. Compare the values of each metric across different time periods
2. Identify significant increases or decreases in values
3. Highlight metrics that have moved in or out of normal ranges
4. Explain potential health implications of these changes (educational only, not medical advice)
5. Suggest potential areas to focus on for health improvement (as educational information only)

## Important Notes:
- Present your analysis in a clear, organized format using markdown
- Use bullet points and sections to make the information easily scannable
- Include a summary section at the beginning highlighting the most important findings
- Use professional, educational language appropriate for explaining health data
- Always include appropriate health disclaimers in your response
- Explain technical medical terms in simple language
- NEVER diagnose conditions; only provide educational information

## Response Format:
Structure your response with these sections:
1. Summary of Key Findings
2. Detailed Analysis of Each Metric
3. Educational Context
4. Areas to Consider Discussing with Healthcare Provider
`;

type Metric = {
  value: number;
  unit: string;
  normalRange?: string;
  status?: 'normal' | 'high' | 'low';
};

type Report = {
  id: string;
  name: string;
  date: string;
  content: string;
  metrics?: {
    [key: string]: Metric;
  };
};

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { reports, metrics } = body;
    
    if (!reports || !Array.isArray(reports) || reports.length < 2) {
      return NextResponse.json(
        { error: 'At least two lab reports are required for trend analysis' },
        { status: 400 }
      );
    }
    
    if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
      return NextResponse.json(
        { error: 'At least one metric must be selected for analysis' },
        { status: 400 }
      );
    }
    
    console.log(`Analyzing trends for ${metrics.length} metrics across ${reports.length} reports`);
    
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
    
    // Sort reports by date
    const sortedReports = [...reports].sort((a: Report, b: Report) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Extract metrics data for analysis
    const metricsData: Record<string, any> = {};
    
    // Only include the selected metrics
    metrics.forEach((metricName: string) => {
      metricsData[metricName] = sortedReports
        .filter(report => report.metrics && report.metrics[metricName])
        .map(report => ({
          date: report.date,
          reportName: report.name,
          ...report.metrics![metricName]
        }));
    });
    
    // Prepare prompt with extracted data
    const promptData = {
      metrics: metricsData,
      timespan: {
        startDate: sortedReports[0].date,
        endDate: sortedReports[sortedReports.length - 1].date,
        numberOfReports: sortedReports.length
      }
    };
    
    // Configure AI settings
    const modelName = getGeminiModel();
    console.log(`Using model: ${modelName} for health trends analysis`);
    
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
              { text: "Health metrics data: " + JSON.stringify(promptData, null, 2) }
            ]
          }
        ]
      });
      
      return NextResponse.json({
        success: true,
        analysis: result.text,
        model: modelName
      });
      
    } catch (error: any) {
      console.error('Error analyzing health trends with primary model:', error);
      
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
                { text: "Health metrics data: " + JSON.stringify(promptData, null, 2) }
              ]
            }
          ]
        });
        
        return NextResponse.json({
          success: true,
          analysis: fallbackResult.text,
          model: fallbackModel,
          fallback: true
        });
        
      } catch (fallbackError: any) {
        console.error('Fallback model also failed:', fallbackError);
        return NextResponse.json(
          {
            error: 'Both primary and fallback AI models failed to analyze health trends.',
            originalError: error.message,
            fallbackError: fallbackError.message
          },
          { status: 500 }
        );
      }
    }
  } catch (error: any) {
    console.error('Error analyzing health trends:', error);
    return NextResponse.json(
      {
        error: error.message || 'An error occurred during health trends analysis',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 