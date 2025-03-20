'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getChatById } from '@/lib/services/chat-service';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default function ChatPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat if ID is provided and not 'new'
  useEffect(() => {
    if (status === 'loading') return;
    
    // If not authenticated, redirect to login
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (params.id !== 'new' && session?.user?.id) {
      const fetchChat = async () => {
        try {
          // Ensure user id exists before calling API
          if (!session.user || !session.user.id) return;
          
          const chatData = await getChatById(session.user.id, params.id);
          if (chatData && chatData.messages) {
            setMessages(chatData.messages as ChatMessage[]);
          }
        } catch (err) {
          console.error('Error fetching chat:', err);
          setError('Failed to load chat');
        }
      };

      fetchChat();
    }
  }, [params.id, router, session?.user?.id, status]);

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
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }
      
      setMessages((prev) => [...prev, data.message]);
      
      // If this was a new chat, update URL to the new chat ID
      if (params.id === 'new' && data.chatId) {
        router.push(`/chat/${data.chatId}`);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-pulse h-4 w-48 bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 h-screen flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <Button
          onClick={() => router.push('/chat')}
          variant="outline"
          className="border-gray-700 text-gray-300"
        >
          Back to Chats
        </Button>
        
        <Button
          onClick={() => router.push('/chat/new')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 rounded-lg bg-gray-900 border border-gray-800">
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
          messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-900 ml-8'
                  : 'bg-gray-800 mr-8'
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

      {error && <div className="text-red-500 mb-2 text-center">{error}</div>}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message here..."
          disabled={isLoading}
          className="flex-1 bg-gray-800 border-gray-700 focus:border-blue-600"
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
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700"
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