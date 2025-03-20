// Clerk authentication middleware configuration
// Protects routes and API endpoints with authentication
// See https://clerk.com/docs/references/nextjs/auth-middleware for configuration details
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // Routes that can be accessed while signed out
  publicRoutes: [
    // Pages accessible to all users
    "/", 
    "/health-analyzer",
    "/health-trends",
    "/sign-in",
    "/sign-up",
    
    // Documentation and static pages
    "/docs",
    "/privacy",
    "/terms",
    "/about",
    
    // Authentication-related webhook
    "/api/webhook",
    
    // Admin route (protected by a separate key-based check)
    "/admin",
    
    // Basic file processing endpoints
    // Note: Rate limiting is implemented in these routes
    "/api/process-file",
    "/api/python-process-file",
    "/api/analyze-labs",
  ],
  // Routes that can always be accessed with no auth information
  ignoredRoutes: [
    "/api/webhook",
    "/api/health", // System health check endpoint
  ],
  // Security function to ensure the request is coming from a legitimate user
  afterAuth(auth, req, evt) {
    // Implement custom logic after authentication check
    // Example: Rate limiting for authenticated users
  },
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}; 