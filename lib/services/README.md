# Chat Services

## Overview

The Health Insights AI application provides two chat service implementations:

1. **unified-chat-service.ts** - The primary service that includes fallback mechanisms
2. **chat-service.ts** - The legacy service (kept for backward compatibility)

## Usage Guidelines

### Recommended: Use the Unified Chat Service

```typescript
import { saveChat, getUserChats, getChatById, deleteChat, createChat } from '@/lib/services/unified-chat-service';
```

The unified service provides:
- Database persistence with file-based fallback
- Support for both auth systems (NextAuth and Clerk)
- Better error handling
- More robust ID generation

### Legacy: Original Chat Service 

```typescript
import { saveChat, getUserChats, getChatById, deleteChat } from '@/lib/services/chat-service';
```

The legacy service is kept for backward compatibility but will be deprecated in future versions.

## Service Capabilities

Both services provide the following functions:

- `saveChat`: Save or update a chat conversation
- `getUserChats`: Get all chats for a user
- `getChatById`: Get a specific chat by ID
- `deleteChat`: Delete a chat

The unified service additionally provides:
- `createChat`: Create a new chat with a unique ID

## Implementation Details

### Unified Chat Service

The unified service attempts to use the database first, but falls back to file-based storage if database operations fail. This makes the application more resilient to database connectivity issues.

### Legacy Chat Service

The legacy service uses only the database and will fail if database operations are not available.

## Updating References

To update all legacy references to use the unified service:

```bash
find . -type f -name "*.ts" -o -name "*.tsx" | xargs grep -l "chat-service" | xargs sed -i '' 's/chat-service/unified-chat-service/g'
```

This command finds all TypeScript files that import the legacy service and updates them to use the unified service.
