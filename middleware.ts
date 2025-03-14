import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Simple protection for admin route - in a real app, use proper authentication
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Get the admin password from query parameter
    const adminPassword = request.nextUrl.searchParams.get('key')
    
    // Check if password matches (a very basic approach - not secure for production)
    // In a real app, use proper authentication with NextAuth.js or similar
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
} 