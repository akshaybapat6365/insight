import { prisma } from '@/lib/db/prisma';

type Message = {
  role: string;
  content: string;
  id?: string;
};

export async function saveChat(userId: string, chatId: string, messages: Message[]) {
  try {
    // Generate a title from the first user message 
    const firstUserMessage = messages.find(m => m.role === 'user')?.content || 'New Chat';
    const title = generateTitleFromMessage(firstUserMessage);

    // Save or update chat in database
    return await prisma.chat.upsert({
      where: { id: chatId },
      create: {
        id: chatId,
        userId: userId,
        messages: JSON.stringify(messages),
        title: title,
      },
      update: {
        messages: JSON.stringify(messages),
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error saving chat:', error);
    throw error;
  }
}

export async function getUserChats(userId: string) {
  try {
    return await prisma.chat.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        createdAt: true,
      },
    });
  } catch (error) {
    console.error('Error fetching user chats:', error);
    throw error;
  }
}

export async function getChatById(chatId: string, userId: string) {
  try {
    const chat = await prisma.chat.findUnique({
      where: { 
        id: chatId,
        userId: userId,
      },
    });

    if (!chat) return null;

    // Parse messages back into an array of message objects
    return {
      ...chat,
      messages: JSON.parse(chat.messages) as Message[],
    };
  } catch (error) {
    console.error('Error fetching chat by ID:', error);
    throw error;
  }
}

export async function deleteChat(chatId: string, userId: string) {
  try {
    return await prisma.chat.delete({
      where: {
        id: chatId,
        userId: userId,
      },
    });
  } catch (error) {
    console.error('Error deleting chat:', error);
    throw error;
  }
}

// Helper function to generate a title from the first message
function generateTitleFromMessage(message: string): string {
  // Take the first few words (max 7) of the first message and add ellipsis if needed
  const words = message.split(' ');
  const titleWords = words.slice(0, 7);
  let title = titleWords.join(' ');
  
  if (words.length > 7) {
    title += '...';
  }
  
  return title;
} 