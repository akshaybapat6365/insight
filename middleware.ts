// Adding Node.js runtime configuration at the top
export const runtime = 'nodejs';

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from './auth'

export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Admin authentication using both NextAuth and password parameter
  if (path.startsWith('/admin')) {
    // Check for password in URL for legacy support
    const url = request.nextUrl.clone();
    const keyParam = url.searchParams.get('key');
    const adminPassword = process.env.ADMIN_PASSWORD || 'adminpass';
    
    // If the key parameter matches the admin password, allow access
    if (keyParam === adminPassword) {
      return NextResponse.next();
    }
    
    // Otherwise, check for authenticated session
    const session = await auth();
    const adminEmail = process.env.ADMIN_EMAIL;
    
    // If no session or session email doesn't match admin email, redirect to sign in
    if (!session?.user || (adminEmail && session.user.email !== adminEmail)) {
      // Redirect unauthenticated users to the sign-in page with a return URL
      return NextResponse.redirect(
        new URL(`/auth/signin?callbackUrl=${encodeURIComponent(path)}`, request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
} 