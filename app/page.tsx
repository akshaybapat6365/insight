'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { FileUpload } from '@/components/file-upload';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { Bot, User, LineChart, Microscope } from 'lucide-react';
import Link from 'next/link';
import { AuthButtons } from '@/components/auth-buttons';

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
  
  // Admin URL with password parameter
  const adminPassword = 'adminpass'; // IMPORTANT: This must match value in middleware.ts
  const adminUrl = `/admin?key=${adminPassword}`;

  // Handler for when a file is processed
  const handleFileProcessed = (text: string) => {
    setInput(text);
    // Auto-submit after a short delay to allow the UI to update
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, 100);
  };

  const isLoading = status === 'streaming' || status === 'submitted';

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header */}
      <header className="border-b border-dark bg-black p-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-medium text-white">Health Insights AI</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/chat"
              className="text-gray-400 hover:text-white text-sm flex items-center gap-1.5"
            >
              <Bot className="h-3.5 w-3.5" />
              <span>Chat History</span>
            </Link>
            <AuthButtons />
            <a 
              href={adminUrl}
              className="text-gray-400 hover:text-white text-sm flex items-center gap-1.5"
            >
              <User className="h-3.5 w-3.5" />
              <span>Admin</span>
            </a>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto p-4 container">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left sidebar - File Upload */}
          <div className="md:col-span-4">
            <FileUpload onFileProcessed={handleFileProcessed} />
            
            {/* Health Features */}
            <div className="mt-4 border border-dark rounded-lg p-4 bg-black-light">
              <h3 className="text-sm font-semibold text-white mb-3">Health Features</h3>
              <div className="space-y-2">
                <Link 
                  href="/health-trends" 
                  className="flex items-center text-sm text-gray-300 hover:text-white p-2 rounded hover:bg-black transition-colors"
                >
                  <LineChart className="h-4 w-4 mr-2" />
                  Health Trends
                </Link>
                <Link 
                  href="/health-analyzer" 
                  className="flex items-center text-sm text-gray-300 hover:text-white p-2 rounded hover:bg-black transition-colors"
                >
                  <Microscope className="h-4 w-4 mr-2" />
                  Lab Analyzer
                </Link>
              </div>
            </div>
          </div>
          
          {/* Main chat area */}
          <div className="md:col-span-8">
            <div className="border border-dark bg-black-light rounded-lg p-4 h-[calc(100vh-12rem)] flex flex-col">
              <div className="flex-1 overflow-y-auto mb-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <h2 className="text-xl font-semibold text-gray-300 mb-2">Welcome to Health Insights AI</h2>
                    <p className="text-gray-400 max-w-md">
                      Upload your health data or ask questions about health topics, lab results, or medical terminology.
                    </p>
                    <p className="text-xs text-gray-500 mt-4">
                      This tool provides educational information only, not medical advice.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`p-3 rounded-lg ${
                          m.role === 'user'
                            ? 'bg-black ml-8 border-l-2 border-gray-700'
                            : 'bg-black-lighter mr-8 border-l-2 border-gray-600'
                        }`}
                      >
                        <div className="text-xs text-gray-400 mb-1">
                          {m.role === 'user' ? 'You' : 'Health Assistant'}
                        </div>
                        <div className="prose prose-invert max-w-none">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-800/50 rounded-md text-red-200 text-sm">
                  {error.toString()}
                </div>
              )}
              
              <form 
                onSubmit={handleSubmit}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask a health question..."
                  className="flex-1 bg-black border-dark text-white"
                  disabled={isLoading}
                />
                <Button 
                  type="submit"
                  className="bg-gray-900 hover:bg-gray-800 text-white transition-colors"
                  disabled={isLoading || !input.trim()}
                >
                  {isLoading ? 'Thinking...' : 'Ask'}
                </Button>
              </form>
            </div>
          </div>
          
        </div>
      </div>
      
    </div>
  );
}
