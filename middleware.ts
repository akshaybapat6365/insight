import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Simple protection for admin route - in a real app, use proper authentication
  if (request.nextUrl.pathname.startsWith('/admin')) {
    console.log('Admin route accessed, checking authentication');
    
    // Get the admin password from query parameter
    const adminPassword = request.nextUrl.searchParams.get('key')
    console.log('Admin password in URL:', adminPassword ? 'Password provided' : 'No password');
    
    // Log environment variable presence (not the actual value for security)
    console.log('ADMIN_PASSWORD environment variable:', process.env.ADMIN_PASSWORD ? 'Set' : 'Not set');
    
    // Check if password matches (a very basic approach - not secure for production)
    // In a real app, use proper authentication with NextAuth.js or similar
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      console.log('Password mismatch, redirecting to home');
      return NextResponse.redirect(new URL('/', request.url))
    }
    
    console.log('Admin authentication successful');
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
} 