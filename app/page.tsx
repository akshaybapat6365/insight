'use client';

// Specify Node.js runtime to ensure compatibility with Prisma and NextAuth
export const runtime = 'nodejs';

import { useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { FileUpload } from '@/components/file-upload';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { Bot, User, LineChart, Microscope, Menu, X, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { AuthButtons } from '@/components/auth-buttons';
import { useUser } from '@clerk/nextjs';

export default function Chat() {
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
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
    setMessages,
  } = useChat({
    api: '/api/chat',
    body: {
      userId: user?.id || 'anonymous',
    },
    onResponse(response) {
      // Reset retry count on successful response
      if (response.status === 200) {
        setRetryCount(0);
      }
    },
    onFinish(message, { usage, finishReason }) {
      console.log('Chat message completed:', message);
      console.log('Finish reason:', finishReason);
    },
    onError(error) {
      console.error('Chat error:', error);
    }
  });
  
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

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Handle retrying when error occurs
  const handleRetry = () => {
    if (messages.length === 0) return;
    
    // If we've retried too many times, start fresh
    if (retryCount >= 3) {
      // Keep only user messages and remove the last one that failed
      const userMessages = messages
        .filter(m => m.role === 'user')
        .slice(0, -1);
        
      setMessages(userMessages);
      setRetryCount(0);
      return;
    }
    
    setRetryCount(prev => prev + 1);
    reload();
  };
  
  // Clear chat and start fresh
  const handleClearChat = () => {
    setMessages([]);
    setInput('');
    setRetryCount(0);
  };

  return (
    <div className="flex flex-col min-h-screen h-full bg-black">
      {/* Header */}
      <header className="border-b border-dark bg-black p-4 sticky top-0 z-10">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-medium text-white">Health Insights AI</h1>
          </div>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden text-gray-400 hover:text-white"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              href="/chat"
              className="text-gray-400 hover:text-white text-sm flex items-center gap-1.5"
            >
              <Bot className="h-3.5 w-3.5" />
              <span>Chat History</span>
            </Link>
            <AuthButtons />
            <Link 
              href="/admin"
              className="text-gray-400 hover:text-white text-sm flex items-center gap-1.5"
            >
              <User className="h-3.5 w-3.5" />
              <span>Admin</span>
            </Link>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-2 border-t border-gray-800 pt-4">
            <div className="flex flex-col space-y-3">
              <Link 
                href="/chat"
                className="text-gray-400 hover:text-white text-sm flex items-center gap-1.5 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Bot className="h-4 w-4" />
                <span>Chat History</span>
              </Link>
              <Link 
                href="/admin"
                className="text-gray-400 hover:text-white text-sm flex items-center gap-1.5 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="h-4 w-4" />
                <span>Admin</span>
              </Link>
              <div className="py-2">
                <AuthButtons />
              </div>
            </div>
          </div>
        )}
      </header>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto p-4 container">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left sidebar - File Upload */}
          <div className="md:col-span-4 order-2 md:order-1">
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
          <div className="md:col-span-8 order-1 md:order-2">
            <div className="border border-dark bg-black-light rounded-lg p-4 h-[60vh] md:h-[calc(100vh-12rem)] flex flex-col">
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
                            ? 'bg-black ml-4 md:ml-8 border-l-2 border-gray-700'
                            : 'bg-black-lighter mr-4 md:mr-8 border-l-2 border-gray-600'
                        }`}
                      >
                        <div className="text-xs text-gray-400 mb-1">
                          {m.role === 'user' ? 'You' : 'Health Assistant'}
                        </div>
                        <div className="prose prose-invert max-w-none text-sm md:text-base">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {isLoading && (
                <div className="mb-4 p-3 bg-gray-900/30 border border-gray-800/50 rounded-md text-gray-300 text-sm flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating AI response...
                </div>
              )}
              
              {error && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-800/50 rounded-md text-red-200 text-sm flex flex-col gap-2">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Error generating response</p>
                      <p className="text-sm opacity-90">{error.toString()}</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <Button 
                      size="sm"
                      variant="outline"
                      className="border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300"
                      onClick={handleClearChat}
                    >
                      Clear Chat
                    </Button>
                    <Button 
                      size="sm"
                      className="bg-gray-700 hover:bg-gray-600 text-white"
                      onClick={handleRetry}
                    >
                      Retry
                    </Button>
                  </div>
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
