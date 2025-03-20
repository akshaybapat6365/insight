'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getUserChats, deleteChat } from '@/lib/services/chat-service';
import { ErrorBanner } from '@/components/ui/error-banner';

type Chat = {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export default function ChatHistory() {
  const { data: session } = useSession();
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChats() {
      if (!session?.user?.id) return;
      
      try {
        setLoading(true);
        const fetchedChats = await getUserChats(session.user.id);
        setChats(fetchedChats);
        setError(null);
      } catch (err) {
        console.error('Error fetching chats:', err);
        setError('Failed to load chat history');
      } finally {
        setLoading(false);
      }
    }

    fetchChats();
  }, [session?.user?.id]);

  const handleChatSelect = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering card click
    
    if (!session?.user?.id) return;
    
    try {
      await deleteChat(session.user.id, chatId);
      setChats(chats.filter(chat => chat.id !== chatId));
    } catch (err) {
      console.error('Error deleting chat:', err);
      setError('Failed to delete chat');
    }
  };

  const handleNewChat = () => {
    router.push('/chat/new');
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center bg-black h-screen">
        <p className="text-gray-400 mb-4">Please sign in to view your chat history</p>
        <Button 
          onClick={() => router.push('/auth/signin')}
          className="bg-gray-900 hover:bg-gray-800 text-white"
        >
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-black min-h-screen">
      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-100">Your Chats</h2>
        <Button 
          onClick={handleNewChat}
          className="bg-gray-900 hover:bg-gray-800 text-white"
        >
          New Chat
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-gray-500 rounded-full animate-pulse delay-75"></div>
            <div className="w-3 h-3 bg-gray-500 rounded-full animate-pulse delay-150"></div>
          </div>
        </div>
      ) : chats.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">No chat history yet</p>
          <Button 
            onClick={handleNewChat}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            Start a new chat
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {chats.map((chat) => (
            <Card 
              key={chat.id}
              onClick={() => handleChatSelect(chat.id)}
              className="p-4 cursor-pointer hover:bg-black-light transition-colors border-dark bg-black"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-200">{chat.title || 'Untitled Chat'}</h3>
                  <p className="text-sm text-gray-400">
                    {new Date(chat.updatedAt).toLocaleString()}
                  </p>
                </div>
                <Button
                  onClick={(e) => handleDeleteChat(chat.id, e)}
                  variant="destructive"
                  size="sm"
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 