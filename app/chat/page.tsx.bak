'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getChatById } from '@/lib/services/chat-service';
import { ErrorBanner } from '@/components/ui/error-banner';

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface PageProps {
  params: { id: string };
}

export default function ChatPage({ params }: PageProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat if ID is provided and not 'new'
  useEffect(() => {
    if (!isLoaded) return;
    
    // If not authenticated, redirect to sign-in
    if (!user) {
      router.push('/sign-in');
      return;
    }

    if (params.id !== 'new' && user?.id) {
      const fetchChat = async () => {
        try {
          const chatData = await getChatById(params.id, user.id);
          if (chatData && chatData.messages) {
            setMessages(chatData.messages as ChatMessage[]);
          }
        } catch (err) {
          console.error('Error fetching chat:', err);
          setError('Failed to load chat. Please try again later.');
        }
      };

      fetchChat();
    }
  }, [params.id, router, user, isLoaded]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: input.trim(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          chatId: params.id === 'new' ? undefined : params.id,
          userId: user?.id,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }
      
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: data.content
      }]);
      
      // If this was a new chat, update URL to the new chat ID
      if (params.id === 'new' && data.chatId) {
        router.push(`/chat/${data.chatId}`);
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-gray-500 rounded-full animate-pulse"></div>
          <div className="w-3 h-3 bg-gray-500 rounded-full animate-pulse delay-75"></div>
          <div className="w-3 h-3 bg-gray-500 rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 h-screen flex flex-col bg-black">
      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}
      
      <div className="flex items-center justify-between mb-4">
        <Button
          onClick={() => router.push('/chat')}
          variant="outline"
          className="border-gray-800 text-gray-300 hover:bg-gray-900"
        >
          Back to Chats
        </Button>
        
        <Button
          onClick={() => router.push('/chat/new')}
          className="bg-black-light hover:bg-gray-900 text-white"
        >
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 rounded-lg bg-black border border-dark">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <h2 className="text-xl font-semibold text-gray-300 mb-2">
              {params.id === 'new' ? 'Start a New Chat' : 'No Messages Yet'}
            </h2>
            <p className="text-gray-400 max-w-md">
              Ask about health metrics, lab results, or general health questions.
              <br />
              <span className="text-sm italic mt-2 block">
                All responses are for educational purposes only and not medical advice.
              </span>
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message.id || index}
              className={`p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-gray-900 ml-8 border-l-2 border-blue-700'
                  : 'bg-black-light mr-8 border-l-2 border-gray-700'
              }`}
            >
              <div className="font-semibold text-xs text-gray-400 mb-1">
                {message.role === 'user' ? 'You' : 'Health Assistant'}
              </div>
              <div className="text-gray-200 whitespace-pre-wrap">
                {message.content}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message here..."
          disabled={isLoading}
          className="flex-1 bg-black-light border-dark focus:border-gray-600 text-white"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <Button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-gray-900 hover:bg-gray-800 disabled:bg-black-light disabled:text-gray-600 text-white"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </Button>
      </form>
      
      <div className="mt-2 text-xs text-gray-500 text-center">
        <p>This is for educational purposes only. Not a substitute for professional medical advice.</p>
      </div>
    </div>
  );
} 