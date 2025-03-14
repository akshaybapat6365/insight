'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import Link from 'next/link';
import { FileUpload } from '@/components/file-upload';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { HeartPulse, Microscope, Bot, User } from 'lucide-react';

export default function Chat() {
  const {
    error,
    input,
    status,
    handleInputChange,
    handleSubmit,
    messages,
    reload,
    stop,
    setInput,
  } = useChat({
    api: '/api/chat',
    onFinish(message, { usage, finishReason }) {
      console.log('Chat message completed:', message);
      console.log('Finish reason:', finishReason);
    },
  });

  // Add this near the top of the component
  console.log('Admin key configured:', process.env.NEXT_PUBLIC_ADMIN_KEY ? '****' : 'not set');
  
  // Hardcoded admin password for reliable access
  const adminPassword = 'adminpass'; // IMPORTANT: This must match value in middleware.ts
  console.log('Using admin password:', '[REDACTED]');
  
  // Admin URL with password parameter
  const adminUrl = `/admin?key=${adminPassword}`;
  console.log('Admin URL configured');

  // Handler for when a file is processed
  const handleFileProcessed = (text: string) => {
    setInput(text);
    // Auto-submit after a short delay to allow the UI to update
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, 100);
  };

  // Helper to send predetermined messages
  const handleSendMessage = (text: string) => {
    setInput(text);
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, 100);
  };

  const isLoading = status === 'streaming' || status === 'submitted';

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-950 to-blue-950">
      {/* Header */}
      <header className="border-b border-blue-900/30 bg-gray-900/70 backdrop-blur-sm p-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
              <HeartPulse className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg font-medium text-blue-100">Health Insights AI</h1>
          </div>
          <div className="flex gap-3">
            <a 
              href={adminUrl}
              className="text-blue-300 hover:text-blue-100 text-sm flex items-center gap-1.5"
              onClick={() => console.log('Admin link clicked')}
            >
              <User className="h-3.5 w-3.5" />
              <span>Admin Console</span>
            </a>
            <a
              href="/admin-link-test"
              className="text-green-300 hover:text-green-100 text-sm flex items-center gap-1.5"
            >
              <span>Admin Access Test</span>
            </a>
            <a
              href="/test-upload"
              className="text-yellow-300 hover:text-yellow-100 text-sm flex items-center gap-1.5"
            >
              <span>File Upload Test</span>
            </a>
          </div>
        </div>
      </header>
      
      {/* Chat container */}
      <div className="flex-1 overflow-auto p-4 container">
        {/* System status indicator */}
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-900/50 border border-red-700 text-red-100 animate-pulse">
            <h3 className="font-medium mb-1">Error connecting to AI</h3>
            <p className="text-sm">{error.message || "The AI service is currently unavailable. Please try again later."}</p>
          </div>
        )}
        
        {/* Only show status indicator when the system is active */}
        {(status === 'streaming' || status === 'submitted' || status === 'ready') && !error && (
          <div className="mb-4 p-3 rounded-lg bg-blue-900/30 border border-blue-800 text-blue-100">
            <p className="text-sm flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${isLoading ? 'bg-green-400 animate-pulse' : 'bg-blue-400'}`}></span>
              {isLoading ? "AI is thinking..." : `Status: ${status}`}
            </p>
          </div>
        )}
        
        {/* Lab Analyzer Promo Card */}
        <div className="mb-6 p-4 rounded-lg bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-800/50">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="bg-blue-500/20 p-3 rounded-full">
              <Microscope className="h-8 w-8 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-blue-100 mb-1">Advanced Lab Report Analysis</h3>
              <p className="text-blue-300 text-sm mb-3">
                Upload your medical lab reports for detailed analysis and get personalized insights about what your results mean for your health.
              </p>
              <Link href="/health-analyzer">
                <Button className="bg-blue-600 hover:bg-blue-500 text-white">
                  Analyze Lab Reports
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-900/20 mb-4">
              <Microscope className="h-8 w-8 text-blue-400" />
            </div>
            <h2 className="text-xl font-medium text-blue-100 mb-2">Welcome to Health Insights AI</h2>
            <p className="text-blue-300 mb-6 max-w-md mx-auto">Upload your health data or ask questions about medical terminology and lab results.</p>
          </div>
        )}
        
        <div className="space-y-4 mb-4">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`p-4 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-900/40 border border-blue-800 text-white'
                  : 'bg-gray-800/70 border border-gray-700 text-gray-100'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {message.role === 'user' ? (
                  <User className="h-5 w-5 text-blue-400" />
                ) : (
                  <Bot className="h-5 w-5 text-gray-400" />
                )}
                <p className="text-sm font-medium">
                  {message.role === 'user' ? 'You' : 'Health AI'}
                </p>
              </div>
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
        
        {isLoading && messages.length > 0 && (
          <div className="flex justify-center my-4">
            <div className="animate-pulse flex space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animation-delay-200"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animation-delay-400"></div>
            </div>
          </div>
        )}
      </div>
      
      {/* Input area */}
      <div className="border-t border-blue-900/30 bg-gray-900/70 backdrop-blur-sm p-4">
        <div className="container max-w-3xl mx-auto">
          <FileUpload onFileProcessed={handleFileProcessed} />
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Input
              placeholder="Ask about your health data or general health questions..."
              value={input}
              onChange={handleInputChange}
              className="flex-1 bg-gray-800/50 border-blue-900/30 focus-visible:ring-blue-500"
            />
            <Button type="submit" disabled={isLoading || input.trim() === ''} className="bg-blue-600 hover:bg-blue-500 text-white">
              Send
            </Button>
          </form>
          <p className="mt-2 text-xs text-gray-400 text-center">
            Note: This AI assistant provides educational information only, not medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}
