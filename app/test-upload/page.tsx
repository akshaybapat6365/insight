'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function TestUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [endpoint, setEndpoint] = useState('/api/debug-file');
  const [fileDetails, setFileDetails] = useState<any>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileDetails({
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024).toFixed(2)} KB`,
    });

    setIsUploading(true);
    setError('');
    setResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      console.log(`Uploading ${file.name} to ${endpoint}`);
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      console.log('Response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Unknown error');
      }
      
      setResult(data);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">File Upload Test Page</h1>
          <Link href="/" className="text-blue-400 hover:text-blue-300 underline">
            Back to Home
          </Link>
        </div>
        
        <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <h2 className="text-xl mb-3">Upload Test</h2>
          
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium">Select endpoint:</label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="endpoint"
                  value="/api/debug-file"
                  checked={endpoint === '/api/debug-file'}
                  onChange={(e) => setEndpoint(e.target.value)}
                  className="mr-2"
                />
                Debug Endpoint
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="endpoint"
                  value="/api/process-file"
                  checked={endpoint === '/api/process-file'}
                  onChange={(e) => setEndpoint(e.target.value)}
                  className="mr-2"
                />
                Regular Endpoint
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="endpoint"
                  value="/api/python-process-file"
                  checked={endpoint === '/api/python-process-file'}
                  onChange={(e) => setEndpoint(e.target.value)}
                  className="mr-2"
                />
                Python-Compatible Endpoint
              </label>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => document.getElementById('test-file-upload')?.click()}
              disabled={isUploading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Select File'}
            </button>
            <span className="text-sm text-gray-300">PDF, JPEG, or Excel files</span>
          </div>
          
          <input
            id="test-file-upload"
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          
          {fileDetails && (
            <div className="mb-4 p-3 bg-slate-700 rounded text-sm">
              <h3 className="font-medium mb-1">File Details:</h3>
              <p>Name: {fileDetails.name}</p>
              <p>Type: {fileDetails.type}</p>
              <p>Size: {fileDetails.size}</p>
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-900/50 rounded text-red-200">
              <h3 className="font-medium mb-1">Error:</h3>
              <p>{error}</p>
            </div>
          )}
          
          {result && (
            <div className="p-3 bg-green-900/30 border border-green-900/50 rounded text-green-200">
              <h3 className="font-medium mb-1">Result:</h3>
              <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
        
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <h2 className="text-xl mb-3">Troubleshooting Tips</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Check if your Gemini API key is set properly in <code className="bg-slate-700 px-1 rounded">.env.local</code></li>
            <li>Make sure you're running only one development server</li>
            <li>Try a smaller PDF file first (1-2 pages)</li>
            <li>Check browser console for any errors</li>
            <li>When using the debug endpoint, you'll see environment info</li>
            <li>The Python-Compatible endpoint is specifically designed to match the Python implementation you're using successfully in Google AI Studio</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 