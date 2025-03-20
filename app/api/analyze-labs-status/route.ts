import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs";
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get job ID from query parameters
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('id');

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get job data from Redis
    const jobData = await redis.hgetall(`job:${jobId}`);

    if (!jobData) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Verify job ownership
    if (jobData.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to job' },
        { status: 403 }
      );
    }

    // Return job status
    return NextResponse.json({
      success: true,
      ...jobData,
    });

  } catch (error: any) {
    console.error('Error checking job status:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
} 