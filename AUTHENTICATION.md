# Authentication in Health Insights AI

Health Insights AI uses [Clerk](https://clerk.dev/) for authentication, providing a secure and customizable authentication system with minimal configuration.

## Authentication Implementation

### Current Implementation: Clerk

The application now exclusively uses Clerk for authentication. Clerk provides:

- Pre-built UI components for sign-in/sign-up flows

- Multi-provider authentication (Google, GitHub, etc.)

- User management

- JWT-based sessions

- Role-based access control

### Environment Variables

The following environment variables are required for Clerk:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-publishable-key"
CLERK_SECRET_KEY="your-secret-key"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/"
```

### Admin Access

To grant admin access:

1. Set the following variables in your environment:

   ```env
   ADMIN_EMAIL="your_admin_email@example.com"
   ADMIN_PASSWORD="your_admin_password"
   NEXT_PUBLIC_ADMIN_KEY="your_admin_key" # Used for accessing admin page
   ```

2. Alternatively, implement role-based access using Clerk's user metadata:

   ```typescript
   // Example of setting admin status in Clerk user metadata
   await clerkClient.users.updateUser(userId, {
     publicMetadata: {
       role: "admin",
     },
   });
   ```

## Authentication Flow

1. Unauthenticated users can access public routes as defined in `middleware.ts`

2. Protected routes require authentication

3. After sign-in, the user is redirected to the home page

4. The Clerk session is available via the `useUser()` hook in client components

5. In server components and API routes, use the `auth()` function

## Error Handling

Common authentication scenarios to handle:

1. **Invalid credentials**: Display appropriate error messages using Clerk's built-in error handling

2. **Session expiration**: Redirect to sign-in page with a message about session expiration

3. **Unauthorized access**: Implement proper HTTP 401/403 responses for protected API routes

4. **Rate limiting**: Implement protection against brute force attacks

Example error handling in API route:

```typescript
import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Proceed with authenticated request
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

## Implementation Details

### Client-Side

```typescript
'use client';
import { useUser } from '@clerk/nextjs';

export default function MyComponent() {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <div>Please sign in</div>;
  }
  
  return <div>Hello {user.firstName}</div>;
}
```

### Server-Side and API Routes

```typescript
import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Proceed with authenticated request
}
```

### Middleware Protection

Routes are protected via the middleware defined in `middleware.ts`:

```typescript
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // SECURITY NOTE: Review public routes carefully. Consider requiring 
  // authentication for sensitive endpoints like "/api/chat"
  publicRoutes: ["/", "/health-analyzer"],
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

## Migration from NextAuth

The application previously used NextAuth.js but has been migrated to Clerk for improved user experience and features. This migration involved:

1. Removing NextAuth.js dependencies and configuration

2. Adding Clerk middleware and configuration

3. Updating components to use Clerk's hooks and components

4. Updating API routes to use Clerk's auth() function

### Data Migration Guide

If you have existing users from NextAuth.js:

1. Export user data from your NextAuth database:

   ```typescript
   // Script to export NextAuth users
   import { PrismaClient } from '@prisma/client';
   const prisma = new PrismaClient();
   
   async function exportUsers() {
     const users = await prisma.user.findMany({
       include: { accounts: true, sessions: true }
     });
     return users;
   }
   ```

2. Import users to Clerk using the Backend API:

   ```typescript
   // Example script to create users in Clerk
   import { clerkClient } from '@clerk/nextjs/server';
   
   async function importUsers(users) {
     for (const user of users) {
       try {
         await clerkClient.users.createUser({
           emailAddress: [user.email],
           password: 'temporary-password', // Consider a password reset flow
           firstName: user.name?.split(' ')[0] || '',
           lastName: user.name?.split(' ').slice(1).join(' ') || '',
         });
       } catch (error) {
         console.error(`Failed to import user ${user.email}:`, error);
       }
     }
   }
   ```

3. Notify users about the migration and provide instructions for setting a new password if necessary.
