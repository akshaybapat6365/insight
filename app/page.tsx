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
      <header className="border-b border-gray-800 bg-black p-4">
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
            <div className="mt-4 border border-gray-800 rounded-lg p-4 bg-black">
              <h3 className="text-sm font-semibold text-white mb-3">Health Features</h3>
              <div className="space-y-2">
                <Link href="/health-analyzer" className="flex items-center p-2 rounded-md hover:bg-gray-900 text-gray-400 hover:text-white transition-colors">
                  <Microscope className="h-4 w-4 mr-2" />
                  <span className="text-sm">Lab Report Analyzer</span>
                </Link>
                <Link href="/health-trends" className="flex items-center p-2 rounded-md hover:bg-gray-900 text-gray-400 hover:text-white transition-colors">
                  <LineChart className="h-4 w-4 mr-2" />
                  <span className="text-sm">Health Trends Tracker</span>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Main chat area */}
          <div className="md:col-span-8 flex flex-col">
            <div className="flex-1 overflow-auto bg-black border border-gray-800 rounded-lg p-4 mb-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center">
                  <div className="max-w-sm space-y-4">
                    <div className="h-12 w-12 mx-auto rounded-full bg-gray-900 flex items-center justify-center">
                      <Bot className="h-6 w-6 text-gray-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">
                      Health Insights AI
                    </h2>
                    <p className="text-sm text-gray-400">
                      Upload your health data or ask questions about medical terminology and lab results.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`flex ${
                        m.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`rounded-lg px-4 py-2 max-w-[85%] ${
                          m.role === 'user'
                            ? 'bg-gray-800 text-white'
                            : 'bg-gray-900 text-gray-100'
                        }`}
                      >
                        <ReactMarkdown>
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="rounded-lg px-4 py-2 max-w-[85%] bg-gray-900">
                        <div className="flex space-x-2 items-center">
                          <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse"></div>
                          <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse delay-75"></div>
                          <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse delay-150"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex space-x-2">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask about your health data or lab results..."
                className="flex-1 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
              />
              <Button type="submit" disabled={isLoading} className="bg-gray-800 hover:bg-gray-700 text-white">
                Send
              </Button>
            </form>
            <p className="text-xs text-gray-600 mt-2 text-center">
              Note: This AI assistant provides educational information only, not medical advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
