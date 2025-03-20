# Serverless Optimization Guide

This document explains strategies for optimizing long-running operations in a serverless environment like Vercel.

## Understanding Serverless Timeout Limits

Serverless platforms have built-in timeout limits that can't be circumvented:

| Platform | Free Tier | Pro Tier | Enterprise |
|----------|-----------|----------|------------|
| Vercel   | 10s       | 60s      | 60s+ (negotiable) |
| Netlify  | 10s       | 26s      | Custom |
| AWS Lambda | 3s (default) | 15min | 15min |

**Important**: Next.js's `maxDuration` config setting **cannot exceed** the platform's limits.

## Our Approach

We've implemented the following strategies to handle long-running operations:

### 1. Streaming Responses

For operations that may exceed timeouts (like lab report analysis):

1. Start delivering data immediately through a stream
2. Break the process into smaller steps
3. Continue processing in the background

**Example API Routes:**

- `/api/analyze-labs` - Initial quick analysis with streaming
- `/api/analyze-labs-background` - Background processing
- `/api/analyze-labs-continue` - Status checking

### 2. Progressive Enhancement

For complex operations:

1. Return a quick initial result first
2. Continue processing more detailed results in the background
3. Let the client poll for completion

### 3. Optimized Timeouts

We've adjusted timeouts based on each function's needs:

- Quick responses: 10-30 seconds
- File processing: 60 seconds
- Complex analyses: Split into multiple steps

### 4. Implementation Details

#### Streaming Example

```typescript
// Set reasonable timeout
export const config = { maxDuration: 60 };

export async function POST(request: Request) {
  // Initialize stream
  const stream = new ReadableStream({
    async start(controller) {
      // 1. Quick initial processing
      controller.enqueue("Initial results...");
      
      // 2. Offload to background
      startBackgroundProcessing();
      
      // 3. Let client know where to get full results
      controller.enqueue("Check /api/status/123 for full results");
      controller.close();
    }
  });
  
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  });
}
```

#### Background Processing

For operations that might take longer than the timeout:

1. Store a job ID in a cache/database
2. Return the ID to the client
3. Continue processing in a separate function
4. Have the client poll for completion

## Production Considerations

For a production environment with truly long-running jobs:

1. Use a proper job queue system (e.g., Redis Queue, AWS SQS)
2. Implement serverless background workers
3. Consider dedicated server resources for CPU-intensive operations
4. Implement proper error handling and retry mechanisms

## Health Insights File Processing

Specifically for health data analysis:

1. Extract text from files first (quick operation)
2. Perform quick initial analysis (summary)
3. Perform detailed analysis in background
4. Use streaming to deliver results progressively

This approach ensures users get immediate feedback while complex processing happens in the background.

## Monitoring and Debugging

- Monitor timeouts and failed requests in logs
- Add timing information to help identify slow operations
- Consider implementing timeouts on the client side as well

## Future Improvements

- Implement Redis for proper job queue management
- Add progress tracking for long-running operations
- Consider edge functions for quicker initial responses
