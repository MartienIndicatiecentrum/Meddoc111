import React, { useState, useRef, useEffect, useCallback } from 'react';

import AppLayout from '@/components/layout/AppLayout';
import KiesClientDropdown from '@/components/KiesClientDropdown';
import type {
  Message,
  DocumentSource as DocumentSourceType,
  ChatResponse,
  Document,
  PromptTemplate,
} from '@/types/chat';
import {
  Send,
  Bot,
  User,
  FileText,
  MessageCircle,
  Loader2,
  RefreshCw,
  Upload,
  Sparkles,
  ChevronDown,
  X,
  Plus,
  Database,
  Cloud,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Terminal,
  Copy,
  CheckCircle,
  Zap,
  HelpCircle,
  MousePointer,
  MessageSquare,
  Volume2,
  VolumeX,
  Check,
  CheckCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { ServiceManager } from '@/utils/serviceManager';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { morphikService } from '@/services/morphikService';
import {
  generateChatId,
  saveChatToStorage,
  loadChatFromStorage,
  clearChatStorage,
  getRecentChatSessions,
  clearAllChatHistory,
  getChatSummary,
  type ChatSession,
} from '@/utils/chatStorage';

const AIChat: React.FC = () => {
  // Existing state - will be loaded from storage if available
  const [messages, setMessages] = useState<Message[]>([]);

  // New state for help dialog
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(() => {
    // Check localStorage to see if user has seen welcome before
    return localStorage.getItem('ai-chat-welcome-seen') === 'true';
  });

  // New state for enhanced UX
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('ai-chat-sound-enabled') !== 'false';
  });
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessage, setTypingMessage] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isDocumentDropdownOpen, setIsDocumentDropdownOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // NEW: Document source state
  const [documentSource, setDocumentSource] = useState<
    'uploaded' | 'database' | 'morphik'
  >('uploaded');

  // NEW: Chat session management
  const [currentChatId, setCurrentChatId] = useState<string>(() => {
    // Generate initial chat ID based on document source
    return generateChatId('uploaded');
  });
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [recentChats, setRecentChats] = useState<ChatSession[]>([]);
  const [isChatHistoryDropdownOpen, setIsChatHistoryDropdownOpen] =
    useState(false);
  const [databaseStats, setDatabaseStats] = useState<any>(null);
  const [servicesAvailable, setServicesAvailable] = useState<{
    backend: boolean;
    rag: boolean;
    morphik: boolean;
  }>({ backend: true, rag: true, morphik: true });
  const [morphikStatus, setMorphikStatus] = useState<{
    available: boolean;
    error?: {
      type: 'network' | 'auth' | 'api' | 'timeout' | 'config' | 'cors';
      message: string;
      details?: string;
      troubleshooting?: string;
      statusCode?: number;
    };
  }>({ available: false });
  const [morphikChatId, setMorphikChatId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(true);
  const [clientNames, setClientNames] = useState<string[]>([]);

  // Client selection state
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [filteredClientNames, setFilteredClientNames] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] =
    useState<string>('Alle cliënten');

  // Fetch client name when ID changes
  const fetchClientName = async (clientId: string) => {
    if (!clientId) {
      setSelectedClientName('Alle cliënten');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('clients_mockdata')
        .select('naam, full_name, first_name, last_name')
        .eq('id', clientId)
        .single();

      if (data && !error) {
        const name =
          data.naam ||
          data.full_name ||
          `${data.first_name || ''} ${data.last_name || ''}`.trim() ||
          'Naam onbekend';
        setSelectedClientName(name);
      }
    } catch (error) {
      console.error('Error fetching client name:', error);
    }
  };

  const scrollToBottom = (instant = false) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: instant ? 'instant' : 'smooth',
      block: 'end',
    });
  };

  // Sound effects
  const playSound = useCallback(
    (type: 'send' | 'receive' | 'error') => {
      if (!soundEnabled) {
        return;
      }

      try {
        const audio = new Audio();
        // Use data URLs for simple sounds
        switch (type) {
          case 'send':
            audio.src =
              '/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarg8bllHQU2jdfy0H4wBSF1xe/glEILElyx6OetWBURRKLc8r9wIAUyhdDyxHU0BSllyO/mmlELEliw6OixWRURRqPe8b1pHgU2jdnzzXkoCiV3yPDaizsIHGvA8OKeTQ0PVqzh8LVe/wgwiNn0ync1CyJyyPLfkEAKFWG16OqmWP0MRKLZ8sl7FQZF';
            audio.volume = 0.2;
            break;
          case 'receive':
            audio.src =
              '/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarg8bllHQU2jdfy0H4wBSF1xe/glEILElyx6OetWBURRKLc8r9wIAUyhdDyxHU0BSllyO/mmlELEliw6OixWRURRqPe8b1pHgU2jdnzzXkoCiV3yPDaizsIHGvA8OKeTQ0PVqzh8LVe/wgwiNn0ync1CyJyyPLfkEAKFWG16OqmWP0MRKLZ8sl7FQZF';
            audio.volume = 0.3;
            audio.playbackRate = 0.8;
            break;
          case 'error':
            audio.src =
              '/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarg8bllHQU2jdfy0H4wBSF1xe/glEILElyx6OetWBURRKLc8r9wIAUyhdDyxHU0BSllyO/mmlELEliw6OixWRURRqPe8b1pHgU2jdnzzXkoCiV3yPDaizsIHGvA8OKeTQ0PVqzh8LVe/wgwiNn0ync1CyJyyPLfkEAKFWG16OqmWP0MRKLZ8sl7FQZF';
            audio.volume = 0.4;
            audio.playbackRate = 0.6;
            break;
        }
        audio.play().catch(() => {});
      } catch (error) {
        // Silently fail if audio doesn't work
      }
    },
    [soundEnabled]
  );

  // Copy message to clipboard
  const copyMessage = useCallback((messageId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    toast.success('Bericht gekopieerd naar klembord');
    setTimeout(() => setCopiedMessageId(null), 2000);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Show welcome dialog for first-time users
  useEffect(() => {
    if (!hasSeenWelcome) {
      // Show help dialog after a short delay
      const timer = setTimeout(() => {
        setShowHelpDialog(true);
        localStorage.setItem('ai-chat-welcome-seen', 'true');
        setHasSeenWelcome(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [hasSeenWelcome]);

  useEffect(() => {
    // Check and wait for services on mount
    const serviceManager = ServiceManager.getInstance();
    serviceManager
      .waitForServices()
      .then(status => {
        // Services are ready, fetch initial data
        if (status.rag) {
          fetchDocuments();
        }
        if (status.backend) {
          fetchDatabaseStats();
          fetchClientNames();
        }
      })
      .catch(error => {
        console.error('Service startup error:', error);
        // Still try to fetch in case services were already running
        fetchDocuments();
        fetchDatabaseStats();
      });
  }, []);

  // Re-check service availability when switching modes
  useEffect(() => {
    if (documentSource === 'database') {
      fetchDatabaseStats();
      fetchClientNames();
    } else if (documentSource === 'uploaded') {
      fetchDocuments();
    } else if (documentSource === 'morphik') {
      // Check Morphik AI service availability
      checkMorphikAvailability();
    }
  }, [documentSource]);

  // Load chat history on component mount and when chat ID changes
  useEffect(() => {
    const loadChatHistory = async () => {
      setIsLoadingChat(true);
      try {
        const savedChat = loadChatFromStorage(currentChatId);

        if (savedChat && savedChat.messages.length > 0) {
          // Load existing chat
          setMessages(savedChat.messages);
          setDocumentSource(savedChat.documentSource);

          // Update recent chats list
          setRecentChats(getRecentChatSessions(5));
        } else {
          // New chat - show welcome message
          const welcomeMessage: Message = {
            id: '1',
            type: 'assistant',
            content:
              'Welkom! 👋 Ik ben uw AI-assistent voor medische documenten. U kunt mij vragen stellen in gewoon Nederlands - bijvoorbeeld Wat zijn de medicijnen van mevrouw Jansen? of Wanneer verlopen de indicaties?. Hoe kan ik u helpen?',
            timestamp: new Date(),
            status: 'sent',
          };
          setMessages([welcomeMessage]);

          // Update recent chats list
          setRecentChats(getRecentChatSessions(5));
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        // Fallback to welcome message
        const welcomeMessage: Message = {
          id: '1',
          type: 'assistant',
          content:
            'Welkom! 👋 Ik ben uw AI-assistent voor medische documenten. U kunt mij vragen stellen in gewoon Nederlands - bijvoorbeeld Wat zijn de medicijnen van mevrouw Jansen? of Wanneer verlopen de indicaties?. Hoe kan ik u helpen?',
          timestamp: new Date(),
          status: 'sent',
        };
        setMessages([welcomeMessage]);
      } finally {
        setIsLoadingChat(false);
      }
    };

    loadChatHistory();
  }, [currentChatId]);

  // Auto-save messages when they change
  useEffect(() => {
    if (messages.length > 0 && !isLoadingChat) {
      // Save to storage with current context
      saveChatToStorage(
        messages,
        currentChatId,
        documentSource,
        selectedClientId,
        selectedDocument
      );

      // Update recent chats list
      setRecentChats(getRecentChatSessions(5));
    }
  }, [
    messages,
    currentChatId,
    documentSource,
    selectedClientId,
    selectedDocument,
    isLoadingChat,
  ]);

  // Update chat ID when document source changes (for new chats)
  useEffect(() => {
    // Only generate new chat ID if this is a fresh start (no messages or only welcome message)
    if (messages.length <= 1) {
      const newChatId = generateChatId(
        documentSource,
        selectedClientId,
        selectedDocument
      );
      setCurrentChatId(newChatId);
    }
  }, [documentSource, selectedClientId, selectedDocument]);

  // Fetch database stats for database mode
  const fetchDatabaseStats = async () => {
    try {
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || 'http://localhost:8081';
      const response = await fetch(`${backendUrl}/health`);

      if (!response.ok) {
        setServicesAvailable(prev => ({ ...prev, backend: false }));
        const data = await response.json();
        console.error('Backend health check failed:', data);

        // Show error message if in database mode
        if (documentSource === 'database') {
          toast.error(
            'Database service is unavailable. Please check your configuration.'
          );
        }
        return;
      }

      const data = await response.json();
      setDatabaseStats(data);
      setServicesAvailable(prev => ({ ...prev, backend: true }));
    } catch (error) {
      console.error('Error fetching database stats:', error);
      setServicesAvailable(prev => ({ ...prev, backend: false }));

      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        toast.error(
          'Cannot connect to backend server. Please run: npm run backend'
        );
      }
    }
  };

  // Existing document fetching (for uploaded documents)
  const fetchDocuments = async () => {
    try {
      const response = await fetch('/rag/documents');

      if (!response.ok) {
        setServicesAvailable(prev => ({ ...prev, rag: false }));
        console.error('RAG server not available');
        return;
      }

      const data = await response.json();
      if (data.documents) {
        setDocuments(data.documents);
      }
      setServicesAvailable(prev => ({ ...prev, rag: true }));
    } catch (error) {
      console.error('Error fetching documents:', error);
      setServicesAvailable(prev => ({ ...prev, rag: false }));

      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        if (documentSource === 'uploaded') {
          toast.error(
            'Cannot connect to RAG server. Please run: python rag_server.py'
          );
        }
      }
    }
  };

  // Check Morphik AI service availability
  const checkMorphikAvailability = async () => {
    try {
      const status = await morphikService.checkServiceStatus();
      setServicesAvailable(prev => ({ ...prev, morphik: status.available }));
      setMorphikStatus(status);

      if (!status.available && status.error) {
        console.warn('Morphik AI service not available:', status.error.message);
      }
    } catch (error) {
      console.error('Error checking Morphik availability:', error);
      setServicesAvailable(prev => ({ ...prev, morphik: false }));
      setMorphikStatus({
        available: false,
        error: {
          type: 'network',
          message: 'Onbekende fout bij service controle',
          details: error instanceof Error ? error.message : 'Onbekende fout',
          troubleshooting: 'Vernieuw de pagina en probeer het opnieuw.',
        },
      });
    }
  };

  // Fetch client names from Supabase database
  const fetchClientNames = async () => {
    if (isLoadingClients) {
      return;
    }

    try {
      setIsLoadingClients(true);

      // Fetch clients from Supabase, excluding soft deleted ones
      const { data, error } = await supabase
        .from('clients_mockdata')
        .select('naam')
        .is('deleted_at', null)
        .order('naam', { ascending: true })
        .limit(50); // Limit to prevent too many options

      if (error) {
        console.error('Error fetching client names:', error);
        return;
      }

      if (data && data.length > 0) {
        // Extract unique client names
        const names = data.map(client => client.naam);
        const uniqueNames = [...new Set(names)].filter(
          name => name && name.trim()
        );
        setClientNames(uniqueNames);
        console.log(`Loaded ${uniqueNames.length} client names from database`);
      } else {
        console.log('No clients found in database');
        setClientNames([]);
      }
    } catch (error) {
      console.error('Error fetching client names:', error);
    } finally {
      setIsLoadingClients(false);
    }
  };

  // NEW: Get API configuration based on document source
  const getApiConfig = () => {
    const backendUrl =
      import.meta.env.VITE_BACKEND_URL || 'http://localhost:8081';
    if (documentSource === 'uploaded') {
      return {
        url: '/rag/chat',
        format: 'rag',
      };
    } else {
      return {
        url: `${backendUrl}/mcp/chatbot.query`,
        format: 'node',
      };
    }
  };

  // NEW: Enhanced message sending with dual system support
  const sendMessage = async (question: string): Promise<ChatResponse> => {
    const apiConfig = getApiConfig();

    try {
      if (documentSource === 'morphik') {
        // Morphik AI format
        return await sendMessageToMorphik(question);
      } else if (apiConfig.format === 'rag') {
        // RAG server format (existing logic)
        return await sendMessageToRAG(question);
      } else {
        // Node.js backend format (new logic)
        return await sendMessageToDatabase(question);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        answer:
          'I apologize, but I encountered an error while processing your request. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  // Existing RAG server function (unchanged)
  const sendMessageToRAG = async (question: string): Promise<ChatResponse> => {
    try {
      const response = await fetch('/rag/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
          document_id: selectedDocument,
          client_id: selectedClientId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        answer:
          data.answer ||
          "I couldn't find relevant information for your question.",
        sources: data.sources || [],
      };
    } catch (error) {
      console.error('Error sending message to RAG:', error);
      throw error;
    }
  };

  // NEW: Send message to Node.js backend (Supabase database)
  const sendMessageToDatabase = async (
    question: string
  ): Promise<ChatResponse> => {
    try {
      const response = await fetch('/api/mcp/chatbot.query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: question,
          clientId: selectedClientId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Database query failed:', data);

        // Provide specific error messages based on the error
        let errorMessage = 'Database query failed. ';

        if (response.status === 500) {
          if (data.error?.includes('SUPABASE_URL')) {
            errorMessage +=
              'Database configuration is missing. Please check your environment variables.';
          } else if (data.error?.includes('Database connection failed')) {
            errorMessage +=
              'Cannot connect to the database. Please check your Supabase configuration.';
          } else {
            errorMessage += data.message || 'Internal server error occurred.';
          }
        } else {
          errorMessage += data.error || 'Unknown error occurred.';
        }

        return {
          answer: errorMessage,
          error: data.error,
        };
      }

      return {
        answer:
          data.response ||
          "I couldn't find relevant information in the database.",
        sources: data.sources || [],
      };
    } catch (error) {
      console.error('Error sending message to database:', error);
      throw error;
    }
  };

  // NEW: Send message to Morphik AI
  const sendMessageToMorphik = async (
    question: string
  ): Promise<ChatResponse> => {
    try {
      const result = await morphikService.queryMorphik(
        question,
        selectedClientId || undefined,
        morphikChatId || undefined,
        {
          temperature: 0.7,
          maxTokens: 1000,
        }
      );

      // Update chat ID for conversation context
      if (result.chatId) {
        setMorphikChatId(result.chatId);
      }

      return {
        answer: result.response,
        sources: result.sources?.map(source => ({
          source: source.documentId,
          content: source.content,
          relevance_score: source.relevanceScore || 0,
        })),
      };
    } catch (error) {
      console.error('Error sending message to Morphik:', error);
      return {
        answer:
          'Er is een fout opgetreden bij het communiceren met Morphik AI. Controleer of de service beschikbaar is.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) {
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      documentSource,
      status: 'sending',
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Play send sound
    playSound('send');

    // Update message status after a short delay
    setTimeout(() => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg
        )
      );
    }, 300);

    try {
      // Show typing indicator
      setIsTyping(true);

      const response = await sendMessage(userMessage.content);

      // Simulate typing effect
      const fullContent = response.answer;
      const typingDelay = Math.min(fullContent.length * 10, 2000); // Max 2 seconds

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '',
        timestamp: new Date(),
        sources: response.sources,
        documentSource,
        isTyping: true,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);

      // Typing animation
      let currentIndex = 0;
      const typingInterval = setInterval(() => {
        if (currentIndex < fullContent.length) {
          const chunkSize = Math.random() > 0.95 ? 3 : 1; // Occasionally type faster
          currentIndex = Math.min(currentIndex + chunkSize, fullContent.length);
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessage.id
                ? { ...msg, content: fullContent.slice(0, currentIndex) }
                : msg
            )
          );
        } else {
          clearInterval(typingInterval);
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessage.id
                ? { ...msg, isTyping: false, status: 'sent' }
                : msg
            )
          );
          playSound('receive');
        }
      }, 30);
    } catch (error) {
      console.error('Error:', error);
      setIsTyping(false);

      let errorContent =
        'I apologize, but I encountered an error while processing your request. ';

      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        errorContent +=
          documentSource === 'database'
            ? 'Please make sure the backend server is running (npm run backend).'
            : 'Please make sure the RAG server is running (python rag_server.py).';
      } else {
        errorContent += 'Please try again.';
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: errorContent,
        timestamp: new Date(),
        documentSource,
        status: 'error',
      };
      setMessages(prev => [...prev, errorMessage]);
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Handle client suggestions navigation
    if (showClientSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev =>
          Math.min(prev + 1, filteredClientNames.length - 1)
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredClientNames[selectedSuggestionIndex]) {
          // Replace the partial client name with the selected one
          const cursorPosition = inputMessage.lastIndexOf(' ') + 1;
          const newMessage =
            inputMessage.substring(0, cursorPosition) +
            filteredClientNames[selectedSuggestionIndex];
          setInputMessage(newMessage);
          setShowClientSuggestions(false);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowClientSuggestions(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Start a new chat session
  const startNewChat = () => {
    // Generate new chat ID
    const newChatId = generateChatId(
      documentSource,
      selectedClientId,
      selectedDocument
    );
    setCurrentChatId(newChatId);

    // Clear current messages
    let welcomeMessage = '';
    if (documentSource === 'uploaded') {
      welcomeMessage =
        'Welkom terug! 👋 Ik ben klaar om uw vragen over de geüploade documenten te beantwoorden. Stel gerust uw vraag in gewoon Nederlands.';
    } else if (documentSource === 'database') {
      welcomeMessage = 'Welkom terug! 👋 Ik';
    }
  };
};

export default AIChat;
