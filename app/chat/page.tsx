import { Metadata } from 'next';
import ChatHistory from '@/components/chat-history';

export const metadata: Metadata = {
  title: 'Chat History | Health Insights AI',
  description: 'View and manage your health chat history',
};

export default function ChatsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-white">Chat History</h1>
      <ChatHistory />
    </div>
  );
} 