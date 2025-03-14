'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/file-upload';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TestUpload() {
  const [result, setResult] = useState('');

  const handleFileProcessed = (text: string) => {
    setResult(text);
  };

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black p-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-medium text-white">Health Insights AI</h1>
          </div>
          <div>
            <Link
              href="/"
              className="text-gray-400 hover:text-white text-sm flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <div className="flex-1 p-4 container py-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">File Upload Test</h1>
          
          <div className="mb-8">
            <FileUpload onFileProcessed={handleFileProcessed} />
          </div>
          
          {result && (
            <div className="bg-black border border-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-medium text-white mb-2">Extracted Text:</h2>
              <div className="bg-gray-900 p-3 rounded border border-gray-800 text-gray-300 text-sm font-mono whitespace-pre-wrap">
                {result}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 