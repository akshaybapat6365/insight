'use client';

import { Button } from '@/components/ui/button';
import { SignInButton, SignOutButton, UserButton, useUser } from '@clerk/nextjs';

export function AuthButtons() {
  const { isSignedIn, user } = useUser();

  return (
    <div className="flex items-center gap-2">
      {isSignedIn ? (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-300">
            {user?.firstName ? `Hi, ${user.firstName}` : 'Welcome'}
          </span>
          <UserButton afterSignOutUrl="/" />
          <SignOutButton>
            <Button variant="ghost" size="sm">
              Sign out
            </Button>
          </SignOutButton>
        </div>
      ) : (
        <SignInButton mode="modal">
          <Button>Sign in</Button>
        </SignInButton>
      )}
    </div>
  );
} 