import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs";
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Configure request size limits
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Process the uploaded file
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const message = formData.get('message') as string || 'Please analyze this lab report and explain what it means for my health.';
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Generate a unique job ID
    const jobId = `${userId}-${Date.now()}`;
    
    // Store initial job data in Redis
    await redis.hset(`job:${jobId}`, {
      userId,
      status: 'pending',
      progress: 0,
      message,
      createdAt: Date.now(),
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });

    // Set job expiration (24 hours)
    await redis.expire(`job:${jobId}`, 24 * 60 * 60);

    // Start background processing
    // In a production environment, this would be handled by a proper job queue
    // For now, we'll simulate it with setTimeout
    setTimeout(async () => {
      try {
        // Update job status to processing
        await redis.hset(`job:${jobId}`, {
          status: 'processing',
          progress: 20,
        });

        // Process the file (simulated)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update progress
        await redis.hset(`job:${jobId}`, {
          progress: 50,
        });

        // Simulate AI processing
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Update progress
        await redis.hset(`job:${jobId}`, {
          progress: 80,
        });

        // Final processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mark job as complete
        await redis.hset(`job:${jobId}`, {
          status: 'completed',
          progress: 100,
          completedAt: Date.now(),
        });

      } catch (error) {
        console.error('Background processing error:', error);
        await redis.hset(`job:${jobId}`, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }, 1000);

    // Return job ID to client
    return NextResponse.json({
      success: true,
      jobId,
      message: 'Analysis job started',
    });

  } catch (error: any) {
    console.error('Error initializing analysis:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
} 