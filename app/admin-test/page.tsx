'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';

function AdminTestContent() {
  const searchParams = useSearchParams();
  const key = searchParams.get('key');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-blue-950 p-8">
      <div className="max-w-md mx-auto bg-gray-900/70 rounded-lg p-6 shadow-lg border border-blue-900/30">
        <h1 className="text-2xl font-bold text-blue-100 mb-4">Admin Test Page</h1>
        
        <div className="bg-gray-950/50 p-4 rounded-md mb-6">
          <h2 className="text-lg text-blue-200 mb-2">URL Parameters</h2>
          <p className="text-white">Key parameter: {key ? 'Present ✓' : 'Missing ✗'}</p>
          {key && <p className="text-white">Value: {key.substring(0, 2)}{'*'.repeat(Math.max(0, key.length - 4))}{key.substring(key.length - 2)}</p>}
        </div>
        
        <div className="space-y-3">
          <p className="text-sm text-gray-300">
            If you can see this page, it means your middleware is allowing access with the provided key.
            If you're redirected to the home page, the middleware is blocking access.
          </p>
          
          <div className="flex gap-3">
            <Link href="/" className="text-blue-400 hover:text-blue-300 underline text-sm">
              Back to Home
            </Link>
            <Link href="/admin?key=adminpass" className="text-blue-400 hover:text-blue-300 underline text-sm">
              Go to Admin
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminTestPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminTestContent />
    </Suspense>
  );
} 