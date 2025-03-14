import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check if the URL starts with /admin or /admin-test
  if (request.nextUrl.pathname.startsWith('/admin') || 
      request.nextUrl.pathname.startsWith('/admin-test')) {
    console.log('Protected route accessed:', request.nextUrl.pathname);
    
    // Get the admin password from query parameter
    const adminPassword = request.nextUrl.searchParams.get('key')
    console.log('Admin password in URL:', adminPassword ? 'Password provided' : 'No password');
    
    // Log environment variable presence (not the actual value for security)
    console.log('ADMIN_PASSWORD environment variable:', process.env.ADMIN_PASSWORD ? 'Set' : 'Not set');
    
    // Use a default password if environment variable isn't set
    const expectedPassword = process.env.ADMIN_PASSWORD || 'adminpass';
    
    // Check if password matches (a very basic approach - not secure for production)
    // In a real app, use proper authentication with NextAuth.js or similar
    if (adminPassword !== expectedPassword) {
      console.log('Password mismatch, redirecting to home');
      console.log('Expected:', expectedPassword, 'Received:', adminPassword);
      return NextResponse.redirect(new URL('/', request.url))
    }
    
    console.log('Authentication successful for:', request.nextUrl.pathname);
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/admin-test/:path*']
} 