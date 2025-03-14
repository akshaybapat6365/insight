'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Simple admin content component that uses useSearchParams
function AdminSimpleContent() {
  const searchParams = useSearchParams();
  const key = searchParams.get('key');
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Simple Admin Panel</h2>
      
      <div className="bg-gray-700/30 p-4 rounded mb-6">
        <h3 className="text-lg font-medium mb-2">URL Parameters</h3>
        <p>Key parameter: {key ? '✅ Present' : '❌ Missing'}</p>
        {key && <p>Value: {key.substring(0, 2)}{'*'.repeat(Math.max(0, key.length - 4))}{key.substring(key.length - 2)}</p>}
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Status</h3>
        <p>You have successfully accessed the simplified admin panel with authentication.</p>
      </div>
      
      <div className="flex gap-4">
        <Link href="/" className="text-blue-400 hover:text-blue-300 underline">
          Back to Home
        </Link>
        <Link href="/admin?key=adminpass" className="text-blue-400 hover:text-blue-300 underline">
          Go to Full Admin
        </Link>
      </div>
    </div>
  );
}

// Main page with Suspense boundary around the component using hooks
export default function AdminSimplePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-blue-950 text-white">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-xl">Loading admin panel...</p>
            <div className="mt-4 flex justify-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce"></div>
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      }>
        <AdminSimpleContent />
      </Suspense>
    </div>
  );
} 