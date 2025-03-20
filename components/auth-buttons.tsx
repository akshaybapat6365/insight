'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { User, LogOut } from 'lucide-react';

export function AuthButtons() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  if (isLoading) {
    return (
      <div className="h-9 w-20 bg-gray-800/50 rounded animate-pulse"></div>
    );
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
            {session.user?.image ? (
              <img 
                src={session.user.image} 
                alt={session.user.name || 'User'} 
                className="h-full w-full object-cover" 
              />
            ) : (
              <User className="h-4 w-4 text-gray-400" />
            )}
          </div>
          <span className="text-sm text-gray-300">{session.user?.name?.split(' ')[0]}</span>
        </div>
        <Button 
          onClick={() => signOut({ callbackUrl: '/' })}
          variant="ghost" 
          size="sm" 
          className="text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <LogOut className="h-4 w-4 mr-2" />
          <span>Sign out</span>
        </Button>
      </div>
    );
  }

  return (
    <Button 
      onClick={() => signIn()}
      variant="ghost" 
      size="sm" 
      className="text-gray-400 hover:text-white hover:bg-gray-800"
    >
      <User className="h-4 w-4 mr-2" />
      <span>Sign in</span>
    </Button>
  );
} 