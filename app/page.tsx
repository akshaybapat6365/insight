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
  console.log('Admin key from env:', process.env.NEXT_PUBLIC_ADMIN_KEY || 'not set');
  
  // Create a hardcoded admin URL for now to debug
  const adminUrl = `/admin?key=${process.env.NEXT_PUBLIC_ADMIN_KEY || 'adminpass'}`;
  console.log('Admin URL:', adminUrl);

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
          {/* Debug the link issue by trying both Link and regular anchor */}
          <div className="flex gap-2">
            <Link 
              href={adminUrl}
              className="text-blue-300 hover:text-blue-100 text-sm underline"
              onClick={() => console.log('Admin link clicked via Link component')}
            >
              Admin Console
            </Link>
            <a 
              href={adminUrl}
              className="text-green-300 hover:text-green-100 text-sm underline"
              onClick={() => console.log('Admin link clicked via anchor tag')}
            >
              Admin (Direct)
            </a>
          </div>
        </div>
      </header>
      
      {/* Chat container */}
      <div className="flex-1 overflow-auto p-4 container">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="h-20 w-20 rounded-full bg-blue-900/20 flex items-center justify-center mb-6">
                <Microscope className="h-10 w-10 text-blue-400" />
              </div>
              <h2 className="text-2xl font-semibold text-blue-200 mb-3">Health Insights Assistant</h2>
              <p className="text-blue-300/80 mb-6 max-w-md">
                Upload your bloodwork or health reports, or simply ask questions about health metrics, normal ranges, and what your results might mean.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                <Button 
                  className="bg-blue-950/30 border border-blue-800/30 text-blue-300 hover:bg-blue-900/20" 
                  onClick={() => handleSendMessage("What are normal vitamin D levels?")}
                >
                  Normal vitamin D levels
                </Button>
                <Button 
                  className="bg-blue-950/30 border border-blue-800/30 text-blue-300 hover:bg-blue-900/20" 
                  onClick={() => handleSendMessage("What does high cholesterol mean?")}
                >
                  About high cholesterol
                </Button>
                <Button 
                  className="bg-blue-950/30 border border-blue-800/30 text-blue-300 hover:bg-blue-900/20" 
                  onClick={() => handleSendMessage("What blood tests should I get for a general checkup?")}
                >
                  Recommended blood tests
                </Button>
                <Button 
                  className="bg-blue-950/30 border border-blue-800/30 text-blue-300 hover:bg-blue-900/20" 
                  onClick={() => handleSendMessage("How can I improve my iron levels naturally?")}
                >
                  Natural iron boosters
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-5">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-4 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role !== 'user' && (
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                  )}
                  <div
                    className={`p-4 rounded-lg max-w-[85%] ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800/70 text-gray-100 border border-blue-900/30'
                    }`}
                  >
                    <div className="prose prose-invert">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <div className="h-8 w-8 rounded-full bg-blue-800 flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="p-4 rounded-lg bg-gray-800/70 text-gray-100 border border-blue-900/30">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse delay-75"></div>
                      <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse delay-150"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
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
      
      {error && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-gray-900 border border-red-900/30 p-6 rounded-lg shadow-xl max-w-md">
            <h3 className="text-xl font-semibold text-red-400 mb-2">Error</h3>
            <p className="text-gray-300 mb-4">{error.message || "An error occurred analyzing your health data."}</p>
            <div className="flex justify-end">
              <Button
                onClick={() => reload()}
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
