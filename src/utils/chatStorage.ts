import type { Message } from '@/types/chat';

export interface ChatSession {
  id: string;
  messages: Message[];
  documentSource: 'uploaded' | 'database' | 'morphik';
  selectedClient?: string;
  selectedDocument?: string;
  lastUpdated: Date;
  created: Date;
}

// Storage keys
const CHAT_KEY_PREFIX = 'meddoc_chat_';
const ACTIVE_CHATS_KEY = 'meddoc_active_chats';
const CHAT_SETTINGS_KEY = 'meddoc_chat_settings';

// Maximum number of chat sessions to keep
const MAX_CHAT_SESSIONS = 10;
const MAX_CHAT_AGE_DAYS = 30;

/**
 * Generate a unique chat ID
 */
export function generateChatId(
  documentSource: string,
  clientId?: string,
  documentId?: string
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const prefix = documentSource.substring(0, 3);
  const clientPart = clientId ? `_${clientId.substring(0, 8)}` : '';
  const docPart = documentId ? `_${documentId.substring(0, 8)}` : '';

  return `${prefix}_${timestamp}_${random}${clientPart}${docPart}`;
}

/**
 * Save chat session to localStorage
 */
export function saveChatToStorage(
  messages: Message[],
  chatId: string,
  documentSource: 'uploaded' | 'database' | 'morphik',
  selectedClient?: string,
  selectedDocument?: string
): void {
  try {
    const chatSession: ChatSession = {
      id: chatId,
      messages,
      documentSource,
      selectedClient,
      selectedDocument,
      lastUpdated: new Date(),
      created: new Date(), // Will be overwritten if chat already exists
    };

    // Check if chat already exists to preserve creation date
    const existingChat = loadChatFromStorage(chatId);
    if (existingChat) {
      chatSession.created = existingChat.created;
    }

    // Save individual chat session
    localStorage.setItem(CHAT_KEY_PREFIX + chatId, JSON.stringify(chatSession));

    // Update active chats list
    updateActiveChatsList(chatId);

    // Clean up old chats
    cleanupOldChats();
  } catch (error) {
    console.error('Error saving chat to storage:', error);
  }
}

/**
 * Load chat session from localStorage
 */
export function loadChatFromStorage(chatId: string): ChatSession | null {
  try {
    const stored = localStorage.getItem(CHAT_KEY_PREFIX + chatId);
    if (!stored) {
      return null;
    }

    const chatSession: ChatSession = JSON.parse(stored);

    // Convert date strings back to Date objects
    chatSession.lastUpdated = new Date(chatSession.lastUpdated);
    chatSession.created = new Date(chatSession.created);

    return chatSession;
  } catch (error) {
    console.error('Error loading chat from storage:', error);
    return null;
  }
}

/**
 * Clear specific chat from storage
 */
export function clearChatStorage(chatId: string): void {
  try {
    // Remove individual chat
    localStorage.removeItem(CHAT_KEY_PREFIX + chatId);

    // Remove from active chats list
    const activeChats = getActiveChatSessions();
    const updatedChats = activeChats.filter(id => id !== chatId);
    localStorage.setItem(ACTIVE_CHATS_KEY, JSON.stringify(updatedChats));
  } catch (error) {
    console.error('Error clearing chat storage:', error);
  }
}

/**
 * Get list of active chat session IDs
 */
export function getActiveChatSessions(): string[] {
  try {
    const stored = localStorage.getItem(ACTIVE_CHATS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting active chat sessions:', error);
    return [];
  }
}

/**
 * Get recent chat sessions with metadata
 */
export function getRecentChatSessions(limit: number = 5): ChatSession[] {
  try {
    const activeChats = getActiveChatSessions();
    const chatSessions: ChatSession[] = [];

    for (const chatId of activeChats) {
      const session = loadChatFromStorage(chatId);
      if (session) {
        chatSessions.push(session);
      }
    }

    // Sort by last updated (most recent first)
    chatSessions.sort(
      (a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime()
    );

    return chatSessions.slice(0, limit);
  } catch (error) {
    console.error('Error getting recent chat sessions:', error);
    return [];
  }
}

/**
 * Clear all chat history
 */
export function clearAllChatHistory(): void {
  try {
    const activeChats = getActiveChatSessions();

    // Remove all individual chat sessions
    for (const chatId of activeChats) {
      localStorage.removeItem(CHAT_KEY_PREFIX + chatId);
    }

    // Clear active chats list
    localStorage.removeItem(ACTIVE_CHATS_KEY);
    localStorage.removeItem(CHAT_SETTINGS_KEY);
  } catch (error) {
    console.error('Error clearing all chat history:', error);
  }
}

/**
 * Get chat session summary for display
 */
export function getChatSummary(chatSession: ChatSession): string {
  if (chatSession.messages.length === 0) {
    return 'Leeg gesprek';
  }

  // Find first user message
  const firstUserMessage = chatSession.messages.find(
    msg => msg.sender === 'user'
  );
  if (firstUserMessage && firstUserMessage.content) {
    // Truncate to 50 characters
    return firstUserMessage.content.length > 50
      ? firstUserMessage.content.substring(0, 50) + '...'
      : firstUserMessage.content;
  }

  return `Gesprek (${chatSession.messages.length} berichten)`;
}

/**
 * Export chat session to text file
 */
export function exportChatToText(chatSession: ChatSession): string {
  const lines: string[] = [];

  lines.push(`# Chat Export - ${chatSession.created.toLocaleString('nl-NL')}`);
  lines.push(`Document Source: ${chatSession.documentSource}`);
  if (chatSession.selectedClient) {
    lines.push(`Client: ${chatSession.selectedClient}`);
  }
  if (chatSession.selectedDocument) {
    lines.push(`Document: ${chatSession.selectedDocument}`);
  }
  lines.push('---\n');

  for (const message of chatSession.messages) {
    const timestamp = new Date(message.timestamp).toLocaleTimeString('nl-NL');
    const sender = message.sender === 'user' ? 'Gebruiker' : 'AI Assistent';

    lines.push(`[${timestamp}] ${sender}:`);
    lines.push(message.content);
    lines.push('');
  }

  return lines.join('\n');
}

// Private helper functions

/**
 * Update the active chats list with a new or updated chat ID
 */
function updateActiveChatsList(chatId: string): void {
  try {
    let activeChats = getActiveChatSessions();

    // Remove if already exists (to move to front)
    activeChats = activeChats.filter(id => id !== chatId);

    // Add to front
    activeChats.unshift(chatId);

    // Limit to maximum number of sessions
    if (activeChats.length > MAX_CHAT_SESSIONS) {
      // Remove excess sessions
      const toRemove = activeChats.slice(MAX_CHAT_SESSIONS);
      for (const oldChatId of toRemove) {
        localStorage.removeItem(CHAT_KEY_PREFIX + oldChatId);
      }
      activeChats = activeChats.slice(0, MAX_CHAT_SESSIONS);
    }

    localStorage.setItem(ACTIVE_CHATS_KEY, JSON.stringify(activeChats));
  } catch (error) {
    console.error('Error updating active chats list:', error);
  }
}

/**
 * Clean up old chat sessions
 */
function cleanupOldChats(): void {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_CHAT_AGE_DAYS);

    const activeChats = getActiveChatSessions();
    const validChats: string[] = [];

    for (const chatId of activeChats) {
      const session = loadChatFromStorage(chatId);
      if (session && session.lastUpdated > cutoffDate) {
        validChats.push(chatId);
      } else {
        // Remove old session
        localStorage.removeItem(CHAT_KEY_PREFIX + chatId);
      }
    }

    // Update active chats list
    localStorage.setItem(ACTIVE_CHATS_KEY, JSON.stringify(validChats));
  } catch (error) {
    console.error('Error cleaning up old chats:', error);
  }
}

/**
 * Get storage usage statistics
 */
export function getChatStorageStats(): {
  totalChats: number;
  totalSize: number;
  oldestChat?: Date;
  newestChat?: Date;
} {
  try {
    const activeChats = getActiveChatSessions();
    let totalSize = 0;
    let oldestChat: Date | undefined;
    let newestChat: Date | undefined;

    for (const chatId of activeChats) {
      const session = loadChatFromStorage(chatId);
      if (session) {
        const sessionSize = JSON.stringify(session).length;
        totalSize += sessionSize;

        if (!oldestChat || session.created < oldestChat) {
          oldestChat = session.created;
        }
        if (!newestChat || session.created > newestChat) {
          newestChat = session.created;
        }
      }
    }

    return {
      totalChats: activeChats.length,
      totalSize,
      oldestChat,
      newestChat,
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return { totalChats: 0, totalSize: 0 };
  }
}
