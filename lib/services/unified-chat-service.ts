import { Message, generateId as aiGenerateId } from 'ai';
import { prisma, isUsingFallback } from '@/lib/db/prisma';
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

// Define interfaces for chat data
type ChatMessage = {
  role: string;
  content: string;
  id?: string;
};

interface SaveChatParams {
  userId: string;
  chatId: string;
  messages: Message[] | ChatMessage[];
}

/**
 * Unified chat service that attempts to use Prisma database first,
 * and falls back to local file storage if database operations fail
 */

// Save chat to database or file system
export async function saveChat({ userId, chatId, messages }: SaveChatParams) {
  // Use 'anonymous' as userId if not provided (supports both auth systems)
  const userIdentifier = userId || 'anonymous';
  try {
    // Generate a title from the first user message
    const firstUserMessage = messages.find(m => m.role === 'user')?.content || 'New Chat';
    const title = generateTitleFromMessage(firstUserMessage);
    
    try {
      // Try to save in database first
      return await prisma.chat.upsert({
        where: { id: chatId },
        create: {
          id: chatId,
          userId: userIdentifier,
          messages: JSON.stringify(messages),
          title: title,
        },
        update: {
          messages: JSON.stringify(messages),
          updatedAt: new Date(),
        },
      });
    } catch (dbError) {
      // If database fails, fall back to file system
      console.warn('Database save failed, falling back to file system:', dbError);
      await saveToFile({ id: chatId, messages: messages as Message[] });
      return { id: chatId, title, userId };
    }
  } catch (error) {
    console.error('Error saving chat:', error);
    throw error;
  }
}

// Get all chats for a user
export async function getUserChats(userId: string) {
  try {
    try {
      // Try database first
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
    } catch (dbError) {
      // Database failed - we can't easily list all files by userId
      // Just return an empty array or implement file directory scanning
      console.warn('Database query failed, file-based chat listing not implemented:', dbError);
      return [];
    }
  } catch (error) {
    console.error('Error fetching user chats:', error);
    throw error;
  }
}

// Get a specific chat by ID
export async function getChatById(chatId: string, userId: string) {
  try {
    try {
      // Try database first
      const chat = await prisma.chat.findUnique({
        where: { 
          id: chatId,
          userId: userId,
        },
      });

      if (chat) {
        return {
          ...chat,
          messages: JSON.parse(chat.messages) as Message[],
        };
      }
    } catch (dbError) {
      console.warn('Database query failed, falling back to file system:', dbError);
      // Fall through to file-based approach
    }
    
    // If database failed or chat not found, try file system
    try {
      const messages = await loadFromFile(chatId);
      return {
        id: chatId,
        userId,
        messages,
        createdAt: new Date(),
        updatedAt: new Date(),
        title: messages.find(m => m.role === 'user')?.content?.substring(0, 50) || 'Chat',
      };
    } catch (fileError) {
      // If both methods fail, return null
      console.error('Failed to load chat from file system:', fileError);
      return null;
    }
  } catch (error) {
    console.error('Error fetching chat by ID:', error);
    throw error;
  }
}

// Delete a chat
export async function deleteChat(chatId: string, userId: string) {
  try {
    try {
      // Try database first
      return await prisma.chat.delete({
        where: {
          id: chatId,
          userId: userId,
        },
      });
    } catch (dbError) {
      // If database fails, try to delete file
      console.warn('Database delete failed, attempting file deletion:', dbError);
      const chatFile = getChatFile(chatId);
      const fs = require('fs');
      if (fs.existsSync(chatFile)) {
        fs.unlinkSync(chatFile);
      }
      return { id: chatId, deleted: true };
    }
  } catch (error) {
    console.error('Error deleting chat:', error);
    throw error;
  }
}

// Create a new chat
export async function createChat(userId: string): Promise<string> {
  const id = generateId();
  
  try {
    // Try to create in database first
    await prisma.chat.create({
      data: {
        id,
        userId,
        messages: '[]',
        title: 'New Chat',
      },
    });
  } catch (dbError) {
    // Fall back to file creation
    console.warn('Database creation failed, falling back to file system:', dbError);
    await writeFile(getChatFile(id), '[]');
  }
  
  return id;
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

// Helper functions for file-based operations
function getChatFile(id: string): string {
  const chatDir = path.join(process.cwd(), '.chats');
  if (!existsSync(chatDir)) mkdirSync(chatDir, { recursive: true });
  return path.join(chatDir, `${id}.json`);
}

async function saveToFile({ id, messages }: { id: string; messages: Message[] }): Promise<void> {
  await writeFile(getChatFile(id), JSON.stringify(messages, null, 2));
}

async function loadFromFile(id: string): Promise<Message[]> {
  return JSON.parse(await readFile(getChatFile(id), 'utf8'));
}

// Generate a unique ID for new chats
function generateId(): string {
  // Use the AI package's generateId if available, otherwise fallback to our implementation
  try {
    return aiGenerateId();
  } catch (error) {
    // Fallback implementation
    return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  }
} 