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
        .from('clients')
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
              'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarg8bllHQU2jdfy0H4wBSF1xe/glEILElyx6OetWBURRKLc8r9wIAUyhdDyxHU0BSllyO/mmlELEliw6OixWRURRqPe8b1pHgU2jdnzzXkoCiV3yPDaizsIHGvA8OKeTQ0PVqzh8LVe/wgwiNn0ync1CyJyyPLfkEAKFWG16OqmWP0MRKLZ8sl7FQZF';
            audio.volume = 0.2;
            break;
          case 'receive':
            audio.src =
              'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarg8bllHQU2jdfy0H4wBSF1xe/glEILElyx6OetWBURRKLc8r9wIAUyhdDyxHU0BSllyO/mmlELEliw6OixWRURRqPe8b1pHgU2jdnzzXkoCiV3yPDaizsIHGvA8OKeTQ0PVqzh8LVe/wgwiNn0ync1CyJyyPLfkEAKFWG16OqmWP0MRKLZ8sl7FQZF';
            audio.volume = 0.3;
            audio.playbackRate = 0.8;
            break;
          case 'error':
            audio.src =
              'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarg8bllHQU2jdfy0H4wBSF1xe/glEILElyx6OetWBURRKLc8r9wIAUyhdDyxHU0BSllyO/mmlELEliw6OixWRURRqPe8b1pHgU2jdnzzXkoCiV3yPDaizsIHGvA8OKeTQ0PVqzh8LVe/wgwiNn0ync1CyJyyPLfkEAKFWG16OqmWP0MRKLZ8sl7FQZF';
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
              'Welkom! 👋 Ik ben uw AI-assistent voor medische documenten. U kunt mij vragen stellen in gewoon Nederlands - bijvoorbeeld "Wat zijn de medicijnen van mevrouw Jansen?" of "Wanneer verlopen de indicaties?". Hoe kan ik u helpen?',
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
            'Welkom! 👋 Ik ben uw AI-assistent voor medische documenten. U kunt mij vragen stellen in gewoon Nederlands - bijvoorbeeld "Wat zijn de medicijnen van mevrouw Jansen?" of "Wanneer verlopen de indicaties?". Hoe kan ik u helpen?',
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
        .from('clients')
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
      welcomeMessage =
        'Welkom terug! 👋 Ik ben klaar om uw vragen over de medische database te beantwoorden. Vraag bijvoorbeeld naar cliënten, documenten of taken.';
    } else {
      welcomeMessage =
        'Welkom bij Morphik AI! 🚀 Ik gebruik geavanceerde AI om uw documenten te analyseren. Stel uw vraag en ik zal de relevante informatie voor u vinden.';
    }

    setMessages([
      {
        id: '1',
        type: 'assistant',
        content: welcomeMessage,
        timestamp: new Date(),
        documentSource,
        status: 'sent',
      },
    ]);

    setMorphikChatId(null); // Reset Morphik chat ID

    // Update recent chats
    setRecentChats(getRecentChatSessions(5));
    toast.success('Nieuw gesprek gestart');
  };

  // Clear current chat (legacy function for backwards compatibility)
  const clearChat = () => {
    startNewChat();
  };

  // Load a specific chat session
  const loadChatSession = (chatSession: ChatSession) => {
    setCurrentChatId(chatSession.id);
    setMessages(chatSession.messages);
    setDocumentSource(chatSession.documentSource);

    // Restore context
    if (chatSession.selectedClient) {
      setSelectedClientId(chatSession.selectedClient);
    }
    if (chatSession.selectedDocument) {
      setSelectedDocument(chatSession.selectedDocument);
    }

    toast.success('Gesprek geladen');
  };

  // Delete a specific chat session
  const deleteChatSession = (chatId: string) => {
    clearChatStorage(chatId);
    setRecentChats(getRecentChatSessions(5));

    // If we're deleting the current chat, start a new one
    if (chatId === currentChatId) {
      startNewChat();
    }

    toast.success('Gesprek verwijderd');
  };

  const handleDocumentUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Only allow uploads in uploaded document mode
    if (documentSource !== 'uploaded') {
      toast.error('Please switch to "Uploaded Documents" mode to upload files');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsLoading(true);

      // Send to RAG server for processing
      await fetch('/rag/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_name: file.name,
          file_type: file.type,
        }),
      });

      toast.success('Document uploaded successfully!');
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Error uploading document');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // NEW: Toggle document source
  const toggleDocumentSource = () => {
    setDocumentSource(prev => {
      if (prev === 'uploaded') {
        return 'database';
      }
      if (prev === 'database') {
        return 'morphik';
      }
      return 'uploaded';
    });
    setSelectedDocument(null); // Clear selection when switching
    clearChat(); // Clear chat when switching modes
    setMorphikChatId(null); // Reset Morphik chat ID when switching
  };

  // Handle template click - fill input and handle client name selection
  const handleTemplateClick = (template: string) => {
    // For database mode, we keep the actual client names
    // For uploaded mode, we keep the placeholders as they are
    setInputMessage(template);

    // Focus the input and handle selection
    setTimeout(() => {
      const textarea = document.querySelector(
        'textarea'
      ) as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();

        // Check if the template contains a real client name (not a placeholder)
        const clientNameMatch = clientNames.find(name =>
          template.includes(name)
        );
        if (clientNameMatch) {
          // Select the client name in the template
          const start = template.indexOf(clientNameMatch);
          const end = start + clientNameMatch.length;
          textarea.setSelectionRange(start, end);
        } else {
          // Select placeholder if it exists
          const placeholderMatch = template.match(/\[([^\]]+)\]/);
          if (placeholderMatch) {
            const start = template.indexOf(placeholderMatch[0]);
            const end = start + placeholderMatch[0].length;
            textarea.setSelectionRange(start, end);
          }
        }
      }
    }, 50);
  };

  // Get smart prompt templates based on context
  const getSmartPromptTemplates = (): PromptTemplate[] => {
    if (documentSource === 'uploaded') {
      // Templates for uploaded documents
      const baseTemplates: PromptTemplate[] = [
        {
          label: 'Samenvatting',
          prompt: 'Geef een beknopte samenvatting van dit document',
          icon: '📋',
          hasPlaceholder: false,
        },
        {
          label: 'Cliënt info',
          prompt:
            'Wat zijn de belangrijkste gegevens van cliënt [naam] in dit document?',
          icon: '👤',
          hasPlaceholder: true,
        },
        {
          label: 'Medicatie',
          prompt:
            'Welke medicatie wordt voorgeschreven en wat zijn de doseringen?',
          icon: '💊',
          hasPlaceholder: false,
        },
        {
          label: 'Diagnose',
          prompt: 'Welke diagnoses zijn gesteld voor [cliëntnaam]?',
          icon: '🏥',
          hasPlaceholder: true,
        },
        {
          label: 'Vervolgstappen',
          prompt: 'Wat zijn de geplande vervolgstappen en wanneer?',
          icon: '📅',
          hasPlaceholder: false,
        },
      ];

      // Add document-specific templates if a document is selected
      if (selectedDocument) {
        const docTitle =
          documents.find(d => d.id === selectedDocument)?.title || '';
        if (docTitle.toLowerCase().includes('indicatie')) {
          baseTemplates.splice(2, 0, {
            label: 'Indicatie details',
            prompt:
              'Wat zijn de details van de zorgindicatie (uren, looptijd, functies)?',
            icon: '📊',
            hasPlaceholder: false,
          });
        } else if (docTitle.toLowerCase().includes('pgb')) {
          baseTemplates.splice(2, 0, {
            label: 'PGB budget',
            prompt:
              'Wat is het PGB budget en welke voorwaarden zijn van toepassing?',
            icon: '💰',
            hasPlaceholder: false,
          });
        }
      }

      return baseTemplates;
    } else {
      // Templates for database mode
      // Get a random client name from the fetched client names
      const randomClientName =
        clientNames.length > 0
          ? clientNames[Math.floor(Math.random() * clientNames.length)]
          : '[naam]';

      return [
        {
          label: 'Dashboard',
          prompt: 'Geef me een overzicht van alle documenten van vandaag',
          icon: '📊',
          hasPlaceholder: false,
        },
        {
          label: 'Cliënt zoeken',
          prompt:
            clientNames.length > 0
              ? `Toon alle documenten van cliënt ${randomClientName}`
              : 'Toon alle documenten van cliënt [naam]',
          icon: '🔍',
          hasPlaceholder: clientNames.length === 0,
        },
        {
          label: 'Urgente taken',
          prompt: 'Welke documenten of taken vereisen vandaag urgente actie?',
          icon: '🚨',
          hasPlaceholder: false,
        },
        {
          label: 'Verlopen indicaties',
          prompt: 'Toon alle indicaties die binnen [aantal] dagen verlopen',
          icon: '⏰',
          hasPlaceholder: true,
        },
        {
          label: 'Weekoverzicht',
          prompt: 'Geef een overzicht van alle activiteiten van deze week',
          icon: '📅',
          hasPlaceholder: false,
        },
        {
          label: 'Documenttype',
          prompt: 'Zoek alle [type] documenten van deze maand',
          icon: '📁',
          hasPlaceholder: true,
        },
      ];
    }
  };

  // NEW: Get suggested questions based on document source
  const getSuggestedQuestions = () => {
    if (documentSource === 'uploaded') {
      // Questions for uploaded documents - organized by category
      const categories = {
        algemeen: [
          'Wat zijn de belangrijkste onderwerpen in dit document?',
          'Kun je een samenvatting geven van de inhoud?',
          'Welke belangrijke punten worden besproken?',
          'Wat is de hoofdconclusie van dit document?',
          'Zijn er bijzondere aandachtspunten genoemd?',
        ],
        medisch: [
          'Welke diagnoses worden genoemd in het document?',
          'Wat zijn de behandeladviezen?',
          'Zijn er medicatievoorschriften vermeld?',
          'Welke medische voorgeschiedenis wordt beschreven?',
          'Welke controles of onderzoeken zijn gepland?',
          'Zijn er contra-indicaties of waarschuwingen?',
          'Wat zijn de risicofactoren voor deze cliënt?',
        ],
        zorgplan: [
          'Wat is het behandelplan voor deze cliënt?',
          'Welke zorgdoelen zijn vastgesteld?',
          'Wie zijn de betrokken zorgverleners?',
          'Wanneer zijn de vervolgafspraken gepland?',
          'Welke evaluatiemomenten zijn vastgelegd?',
          'Wat zijn de afgesproken interventies?',
          'Hoe wordt de voortgang gemonitord?',
        ],
        indicatie: [
          'Welke zorgindicatie is afgegeven?',
          'Hoeveel uren zorg zijn geïndiceerd?',
          'Wat is de looptijd van de indicatie?',
          'Welke zorgfuncties zijn toegekend?',
          'Is er sprake van een herindicatie?',
          'Wat zijn de grondslag en zorgzwaarte?',
          'Wanneer moet de indicatie verlengd worden?',
        ],
        pgb: [
          'Wat is het PGB budget?',
          'Welke zorg mag uit het PGB betaald worden?',
          'Wat zijn de voorwaarden voor het PGB?',
          'Wanneer moet de verantwoording ingediend worden?',
          'Wie is de budgethouder?',
          'Welke zorgverleners zijn gecontracteerd?',
          'Wat zijn de uurtarieven?',
        ],
        rapportage: [
          'Wat zijn de laatste ontwikkelingen bij de cliënt?',
          'Zijn er bijzonderheden gerapporteerd?',
          'Hoe is de algemene toestand van de cliënt?',
          'Welke actiepunten zijn er vastgelegd?',
        ],
      };

      // Select one question from each of 5 different categories
      // This provides variety while covering different aspects
      const selectedCategories = [
        'algemeen',
        'medisch',
        'zorgplan',
        'indicatie',
        'pgb',
      ];
      const questions = selectedCategories.map(cat => {
        const categoryQuestions = categories[cat as keyof typeof categories];
        // Select a random question from the category
        const randomIndex = Math.floor(
          Math.random() * categoryQuestions.length
        );
        return categoryQuestions[randomIndex];
      });

      // Safeguard: Ensure no real client names in questions
      const safeQuestions = questions.map(q =>
        q
          .replace(/meneer\s+[A-Z][a-z]+/g, 'meneer [cliëntnaam]')
          .replace(/mevrouw\s+[A-Z][a-z]+/g, 'mevrouw [cliëntnaam]')
          .replace(/dhr\.\s+[A-Z][a-z]+/gi, 'dhr. [cliëntnaam]')
          .replace(/mw\.\s+[A-Z][a-z]+/gi, 'mw. [cliëntnaam]')
      );

      return safeQuestions.slice(0, 4); // Return 4 questions
    } else {
      // Questions for database mode - organized by category
      const categories = {
        overzicht: [
          'Hoeveel documenten zijn er in totaal in de database?',
          'Geef me een overzicht van de documenten van vandaag',
          'Welke documenten zijn deze week toegevoegd?',
          'Wat is het totaal aantal cliënten in het systeem?',
          'Hoeveel documenten per documenttype zijn er?',
        ],
        clienten: [
          'Welke cliënten hebben de meeste documenten?',
          'Toon alle documenten van cliënt [naam]',
          'Welke cliënten hebben recente wijzigingen?',
          'Hoeveel actieve cliënten zijn er?',
          'Bij welke cliënten lopen de indicaties binnenkort af?',
          'Welke cliënten hebben geen recent contact gehad?',
          'Toon cliënten met openstaande taken',
        ],
        urgentie: [
          'Welke documenten vereisen urgente actie?',
          'Zijn er verlopen indicaties?',
          'Welke documenten moeten binnenkort vernieuwd worden?',
          'Wat zijn de openstaande taken?',
          'Welke deadlines naderen?',
          'Zijn er gemiste afspraken?',
          'Welke verantwoordingen moeten nog ingediend worden?',
        ],
        statistieken: [
          'Geef me een dashboard overzicht',
          'Wat zijn de statistieken van deze maand?',
          'Hoeveel nieuwe cliënten deze week?',
          'Wat is de gemiddelde verwerkingstijd?',
          'Hoeveel documenten zijn er per medewerker verwerkt?',
          'Wat is de trend in documentaantallen?',
          'Welke documenttypes komen het meest voor?',
        ],
        zoeken: [
          'Zoek alle PGB documenten',
          'Vind documenten met indicatie verlengingen',
          'Toon alle behandelplannen',
          'Zoek documenten van zorgverzekeraar [naam]',
          'Vind alle rapportages van deze maand',
          'Zoek documenten met hoge prioriteit',
          'Toon alle documenten die goedkeuring vereisen',
        ],
        analyse: [
          'Analyseer de documentenstroom van afgelopen maand',
          'Wat zijn de knelpunten in de documentverwerking?',
          'Welke trends zie je in de zorgvragen?',
          'Vergelijk dit kwartaal met vorig kwartaal',
        ],
      };

      // Select questions from different categories for variety
      const selectedCategories = [
        'overzicht',
        'clienten',
        'urgentie',
        'statistieken',
        'zoeken',
      ];
      const questions = selectedCategories.map(cat => {
        const categoryQuestions = categories[cat as keyof typeof categories];
        // Select a random question from the category
        const randomIndex = Math.floor(
          Math.random() * categoryQuestions.length
        );
        return categoryQuestions[randomIndex];
      });

      // Replace placeholders with real client names when available
      const processedQuestions = questions.map(q => {
        if (q.includes('[naam]') && clientNames.length > 0) {
          // Get a random client name
          const randomClientName =
            clientNames[Math.floor(Math.random() * clientNames.length)];
          return q.replace('[naam]', randomClientName);
        }
        return q;
      });

      return processedQuestions.slice(0, 5); // Return 5 questions for database mode
    }
  };

  // Setup Guide Component
  const SetupGuide = () => {
    const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

    const copyCommand = (command: string, id: string) => {
      navigator.clipboard.writeText(command);
      setCopiedCommand(id);
      setTimeout(() => setCopiedCommand(null), 2000);
    };

    return (
      <div className='max-w-4xl mx-auto p-6'>
        <Alert className='mb-6 border-red-200 bg-red-50'>
          <AlertCircle className='h-4 w-4 text-red-600' />
          <AlertTitle className='text-red-800'>
            Services Not Available
          </AlertTitle>
          <AlertDescription className='text-red-700'>
            The AI Chat requires backend services to be running. Follow the
            steps below to get started.
          </AlertDescription>
        </Alert>

        <div className='space-y-6'>
          <div className='bg-white rounded-lg shadow p-6'>
            <h2 className='text-xl font-semibold mb-4'>Quick Start Guide</h2>

            <div className='space-y-4'>
              {/* Step 1: Check Environment */}
              <div className='border-l-4 border-blue-500 pl-4'>
                <h3 className='font-medium text-lg mb-2'>
                  1. Check Environment Setup
                </h3>
                <p className='text-gray-600 mb-3'>
                  First, verify your environment is configured:
                </p>
                <div className='bg-gray-100 rounded p-3 flex items-center justify-between'>
                  <code className='text-sm'>npm run check:env</code>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() =>
                      copyCommand('npm run check:env', 'check-env')
                    }
                  >
                    {copiedCommand === 'check-env' ? (
                      <CheckCircle className='h-4 w-4 text-green-600' />
                    ) : (
                      <Copy className='h-4 w-4' />
                    )}
                  </Button>
                </div>
              </div>

              {/* Step 2: Configure Environment */}
              <div className='border-l-4 border-blue-500 pl-4'>
                <h3 className='font-medium text-lg mb-2'>
                  2. Configure Environment Variables
                </h3>
                <p className='text-gray-600 mb-3'>
                  If you haven't already, create your .env file:
                </p>
                <div className='space-y-2'>
                  <div className='bg-gray-100 rounded p-3 flex items-center justify-between'>
                    <code className='text-sm'>cp .env.example .env</code>
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={() =>
                        copyCommand('cp .env.example .env', 'copy-env')
                      }
                    >
                      {copiedCommand === 'copy-env' ? (
                        <CheckCircle className='h-4 w-4 text-green-600' />
                      ) : (
                        <Copy className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                  <p className='text-sm text-gray-600'>
                    Then edit .env and add your Supabase credentials
                  </p>
                </div>
              </div>

              {/* Step 3: Start Services */}
              <div className='border-l-4 border-green-500 pl-4'>
                <h3 className='font-medium text-lg mb-2'>
                  3. Start All Services
                </h3>
                <p className='text-gray-600 mb-3'>
                  Run all required services with one command:
                </p>
                <div className='bg-gray-100 rounded p-3 flex items-center justify-between'>
                  <code className='text-sm'>npm run dev</code>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => copyCommand('npm run dev', 'start-all')}
                  >
                    {copiedCommand === 'start-all' ? (
                      <CheckCircle className='h-4 w-4 text-green-600' />
                    ) : (
                      <Copy className='h-4 w-4' />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Service Status */}
          <div className='bg-white rounded-lg shadow p-6'>
            <h2 className='text-xl font-semibold mb-4'>Service Status</h2>
            <div className='space-y-3'>
              <div className='flex items-center justify-between p-3 bg-gray-50 rounded'>
                <div className='flex items-center space-x-3'>
                  <div
                    className={`w-3 h-3 rounded-full ${servicesAvailable.backend ? 'bg-green-500' : 'bg-red-500'}`}
                  />
                  <span className='font-medium'>Backend API</span>
                  <span className='text-sm text-gray-500'>(Port 8081)</span>
                </div>
                {!servicesAvailable.backend && (
                  <span className='text-sm text-red-600'>Not running</span>
                )}
              </div>

              <div className='flex items-center justify-between p-3 bg-gray-50 rounded'>
                <div className='flex items-center space-x-3'>
                  <div
                    className={`w-3 h-3 rounded-full ${servicesAvailable.rag ? 'bg-green-500' : 'bg-red-500'}`}
                  />
                  <span className='font-medium'>RAG Server</span>
                  <span className='text-sm text-gray-500'>(Port 5001)</span>
                </div>
                {!servicesAvailable.rag && (
                  <span className='text-sm text-red-600'>Not running</span>
                )}
              </div>

              <div className='flex items-center justify-between p-3 bg-gray-50 rounded'>
                <div className='flex items-center space-x-3'>
                  <div
                    className={`w-3 h-3 rounded-full ${servicesAvailable.morphik ? 'bg-green-500' : 'bg-red-500'}`}
                  />
                  <span className='font-medium'>Morphik AI</span>
                  <span className='text-sm text-gray-500'>(External API)</span>
                </div>
                {!servicesAvailable.morphik && morphikStatus.error && (
                  <div className='text-right'>
                    <span className='text-sm text-red-600 block'>
                      {morphikStatus.error.message}
                    </span>
                    {morphikStatus.error.troubleshooting && (
                      <span className='text-xs text-gray-500 block mt-1'>
                        {morphikStatus.error.troubleshooting}
                      </span>
                    )}
                  </div>
                )}
                {!servicesAvailable.morphik && !morphikStatus.error && (
                  <span className='text-sm text-red-600'>
                    Service niet beschikbaar
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Additional Help */}
          <div className='bg-blue-50 rounded-lg p-6'>
            <h3 className='font-medium text-lg mb-2 text-blue-900'>
              Need More Help?
            </h3>
            <ul className='space-y-2 text-sm text-blue-800'>
              <li>
                • Run{' '}
                <code className='bg-blue-100 px-1 rounded'>npm run verify</code>{' '}
                for detailed diagnostics
              </li>
              <li>
                • Check the console where you ran npm run dev for error messages
              </li>
              <li>• Make sure ports 3000, 5001, and 8081 are not in use</li>
              <li>
                • See AI_CHAT_TROUBLESHOOTING.md for detailed troubleshooting
              </li>
            </ul>
          </div>

          {/* Morphik AI Specific Troubleshooting */}
          {!servicesAvailable.morphik && (
            <div className='bg-red-50 rounded-lg p-6'>
              <h3 className='font-medium text-lg mb-2 text-red-900'>
                Morphik AI Troubleshooting
              </h3>
              <div className='space-y-3 text-sm text-red-800'>
                {morphikStatus.error?.type === 'config' && (
                  <div>
                    <p className='font-medium'>Configuratie probleem:</p>
                    <ul className='list-disc list-inside space-y-1 mt-1'>
                      <li>
                        Controleer of{' '}
                        <code className='bg-red-100 px-1 rounded'>
                          VITE_MORPHIK_API_KEY
                        </code>{' '}
                        is ingesteld in uw .env bestand
                      </li>
                      <li>
                        Controleer of{' '}
                        <code className='bg-red-100 px-1 rounded'>
                          VITE_MORPHIK_API_URL
                        </code>{' '}
                        correct is geconfigureerd
                      </li>
                      <li>Herstart de applicatie na .env wijzigingen</li>
                    </ul>
                  </div>
                )}

                {morphikStatus.error?.type === 'auth' && (
                  <div>
                    <p className='font-medium'>Authenticatie probleem:</p>
                    <ul className='list-disc list-inside space-y-1 mt-1'>
                      <li>
                        Controleer of uw Morphik AI API-sleutel nog geldig is
                      </li>
                      <li>Vraag een nieuwe API-sleutel aan bij Morphik AI</li>
                      <li>
                        Controleer of uw API-sleutel de juiste permissies heeft
                      </li>
                    </ul>
                  </div>
                )}

                {morphikStatus.error?.type === 'network' && (
                  <div>
                    <p className='font-medium'>Netwerk probleem:</p>
                    <ul className='list-disc list-inside space-y-1 mt-1'>
                      <li>Controleer uw internetverbinding</li>
                      <li>Controleer firewall instellingen</li>
                      <li>Probeer de pagina te vernieuwen</li>
                    </ul>
                  </div>
                )}

                {morphikStatus.error?.type === 'api' && (
                  <div>
                    <p className='font-medium'>API probleem:</p>
                    <ul className='list-disc list-inside space-y-1 mt-1'>
                      <li>Controleer of de Morphik AI service online is</li>
                      <li>Probeer het later opnieuw</li>
                      <li>
                        Contacteer Morphik AI ondersteuning als het probleem
                        aanhoudt
                      </li>
                    </ul>
                  </div>
                )}

                <div className='mt-4 p-3 bg-red-100 rounded'>
                  <p className='text-xs'>
                    <strong>Status details:</strong>{' '}
                    {morphikStatus.error?.details || 'Geen details beschikbaar'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Help Dialog Component
  const HelpDialog = () => {
    if (!showHelpDialog) {
      return null;
    }

    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
        {/* Backdrop */}
        <div
          className='absolute inset-0 bg-black bg-opacity-50 animate-in fade-in duration-200'
          onClick={() => setShowHelpDialog(false)}
        />

        {/* Dialog */}
        <div
          className='relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col
          animate-in zoom-in-95 duration-200'
        >
          {/* Header */}
          <div className='flex-shrink-0 p-6 border-b border-gray-200'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <HelpCircle className='w-6 h-6 text-blue-600' />
                <h2 className='text-xl font-semibold'>
                  Hoe werkt de AI-assistent?
                </h2>
              </div>
              <button
                onClick={() => setShowHelpDialog(false)}
                className='text-gray-400 hover:text-gray-600 transition-colors'
              >
                <X className='w-5 h-5' />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className='flex-1 p-6 overflow-y-auto'>
            <div className='space-y-6'>
              {/* Natural Language Section */}
              <div>
                <h3 className='text-lg font-medium mb-3 flex items-center space-x-2'>
                  <MessageSquare className='w-5 h-5 text-blue-600' />
                  <span>Stel vragen in natuurlijk Nederlands</span>
                </h3>
                <p className='text-gray-600 mb-3'>
                  U hoeft geen speciale commando's te gebruiken. Stel uw vragen
                  zoals u dat normaal zou doen:
                </p>
                <div className='bg-blue-50 rounded-lg p-4 space-y-2'>
                  <div className='font-medium text-blue-900'>Voorbeelden:</div>
                  <ul className='space-y-1 text-sm text-blue-800'>
                    <li>• "Wat zijn de medicijnen van [cliëntnaam]?"</li>
                    <li>
                      • "Wanneer moet de indicatie van [cliëntnaam] verlengd
                      worden?"
                    </li>
                    <li>• "Geef me een overzicht van alle PGB cliënten"</li>
                    <li>• "Welke taken staan er open voor vandaag?"</li>
                    <li>• "Hoeveel uren zorg heeft deze cliënt?"</li>
                  </ul>
                </div>
              </div>

              {/* Document vs Database Mode */}
              <div>
                <h3 className='text-lg font-medium mb-3 flex items-center space-x-2'>
                  <Database className='w-5 h-5 text-green-600' />
                  <span>Twee manieren om te zoeken</span>
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='border border-blue-200 rounded-lg p-4'>
                    <div className='flex items-center space-x-2 mb-2'>
                      <Cloud className='w-5 h-5 text-blue-600' />
                      <span className='font-medium'>Geüploade Documenten</span>
                    </div>
                    <p className='text-sm text-gray-600'>
                      Zoek in specifieke PDF's die u heeft geüpload. Perfect
                      voor het analyseren van individuele documenten.
                    </p>
                  </div>
                  <div className='border border-green-200 rounded-lg p-4'>
                    <div className='flex items-center space-x-2 mb-2'>
                      <Database className='w-5 h-5 text-green-600' />
                      <span className='font-medium'>Database</span>
                    </div>
                    <p className='text-sm text-gray-600'>
                      Zoek door alle documenten in het systeem. Ideaal voor
                      overzichten en het vinden van patronen.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tips Section */}
              <div>
                <h3 className='text-lg font-medium mb-3 flex items-center space-x-2'>
                  <Sparkles className='w-5 h-5 text-amber-500' />
                  <span>Tips voor betere resultaten</span>
                </h3>
                <ul className='space-y-2 text-sm text-gray-600'>
                  <li className='flex items-start space-x-2'>
                    <span className='text-green-500 mt-0.5'>✓</span>
                    <span>
                      Wees specifiek: "medicatie van mevrouw Jansen" werkt beter
                      dan "medicatie"
                    </span>
                  </li>
                  <li className='flex items-start space-x-2'>
                    <span className='text-green-500 mt-0.5'>✓</span>
                    <span>Gebruik namen en data waar mogelijk</span>
                  </li>
                  <li className='flex items-start space-x-2'>
                    <span className='text-green-500 mt-0.5'>✓</span>
                    <span>
                      De snelle prompts zijn aanpasbaar - klik en wijzig ze naar
                      behoefte
                    </span>
                  </li>
                  <li className='flex items-start space-x-2'>
                    <span className='text-green-500 mt-0.5'>✓</span>
                    <span>
                      Bij database zoekopdrachten kunt u ook tijdsperiodes
                      opgeven
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className='flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50'>
            <button
              onClick={() => setShowHelpDialog(false)}
              className='w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
            >
              Begrepen, laten we beginnen!
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Check if we should show setup guide
  const showSetupGuide =
    (documentSource === 'database' && !servicesAvailable.backend) ||
    (documentSource === 'uploaded' && !servicesAvailable.rag);

  if (showSetupGuide) {
    return (
      <AppLayout fullHeight>
        <div className='flex flex-col h-full bg-gray-50'>
          {/* Header */}
          <div className='bg-white border-b border-gray-200 px-6 py-4'>
            <div className='flex items-center space-x-3'>
              <Bot className='w-8 h-8 text-blue-600' />
              <div>
                <h1 className='text-xl font-semibold text-gray-900'>
                  AI Document Assistant - Setup Required
                </h1>
                <p className='text-sm text-gray-600'>
                  Backend services need to be started
                </p>
              </div>
            </div>
          </div>

          {/* Setup Guide */}
          <div className='flex-1 overflow-y-auto'>
            <SetupGuide />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout fullHeight>
      <TooltipProvider>
        {/* Help Dialog */}
        <HelpDialog />

        <div className='flex flex-col h-full bg-gray-50'>
          {/* Header with Document Source Toggle */}
          <div className='flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <Bot
                  className={`w-8 h-8 text-blue-600 ${!hasSeenWelcome ? 'animate-bounce' : ''}`}
                />
                <div>
                  <h1 className='text-xl font-semibold text-gray-900'>
                    AI Document Assistent
                  </h1>
                  <p className='text-sm text-gray-600'>
                    {documentSource === 'uploaded'
                      ? 'Stel vragen over uw geüploade documenten'
                      : 'Doorzoek de medische database'}
                  </p>
                </div>
              </div>

              <div className='flex items-center space-x-4'>
                {/* Sound Toggle */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        setSoundEnabled(!soundEnabled);
                        localStorage.setItem(
                          'ai-chat-sound-enabled',
                          (!soundEnabled).toString()
                        );
                        toast.success(
                          soundEnabled
                            ? 'Geluiden uitgeschakeld'
                            : 'Geluiden ingeschakeld'
                        );
                      }}
                      className='p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                    >
                      {soundEnabled ? (
                        <Volume2 className='w-5 h-5' />
                      ) : (
                        <VolumeX className='w-5 h-5' />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {soundEnabled
                        ? 'Geluiden uitschakelen'
                        : 'Geluiden inschakelen'}
                    </p>
                  </TooltipContent>
                </Tooltip>

                {/* Help Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setShowHelpDialog(true)}
                      className='flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                    >
                      <HelpCircle className='w-5 h-5' />
                      <span className='text-sm font-medium'>Help</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Leer hoe u de AI-assistent effectief gebruikt</p>
                  </TooltipContent>
                </Tooltip>
                {/* Document Source Toggle */}
                <div className='flex items-center space-x-2 bg-gray-100 rounded-lg p-2'>
                  <div
                    className={`flex items-center space-x-2 px-2 py-1 rounded-md transition-colors cursor-pointer ${
                      documentSource === 'uploaded'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => setDocumentSource('uploaded')}
                  >
                    <Cloud className='w-4 h-4' />
                    <span className='text-sm font-medium'>Uploaded</span>
                    {documentSource === 'uploaded' && (
                      <span className='text-xs bg-blue-400 px-2 py-0.5 rounded-full'>
                        {documents.length}
                      </span>
                    )}
                  </div>

                  <div
                    className={`flex items-center space-x-2 px-2 py-1 rounded-md transition-colors cursor-pointer ${
                      documentSource === 'database'
                        ? 'bg-green-500 text-white'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => setDocumentSource('database')}
                  >
                    <Database className='w-4 h-4' />
                    <span className='text-sm font-medium'>Database</span>
                    {documentSource === 'database' && databaseStats && (
                      <span className='text-xs bg-green-400 px-2 py-0.5 rounded-full'>
                        {databaseStats.documentCount}
                      </span>
                    )}
                  </div>

                  <div
                    className={`flex items-center space-x-2 px-2 py-1 rounded-md transition-colors cursor-pointer ${
                      documentSource === 'morphik'
                        ? 'bg-purple-500 text-white'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => setDocumentSource('morphik')}
                  >
                    <Sparkles className='w-4 h-4' />
                    <span className='text-sm font-medium'>Morphik AI</span>
                    {documentSource === 'morphik' && morphikChatId && (
                      <MessageSquare className='w-3 h-3' />
                    )}
                  </div>
                </div>

                {/* Service Status Indicator */}
                {(documentSource === 'uploaded' && !servicesAvailable.rag) ||
                (documentSource === 'database' &&
                  !servicesAvailable.backend) ? (
                  <div className='flex items-center space-x-2 px-3 py-1 bg-red-100 text-red-700 rounded-lg'>
                    <span className='text-xs font-medium'>Service Offline</span>
                  </div>
                ) : documentSource === 'morphik' &&
                  !servicesAvailable.morphik ? (
                  <div
                    className='flex items-center space-x-2 px-3 py-1 bg-red-100 text-red-700 rounded-lg'
                    title={morphikStatus.error?.troubleshooting}
                  >
                    <span className='text-xs font-medium'>
                      {morphikStatus.error?.message || 'Morphik AI Offline'}
                    </span>
                  </div>
                ) : null}

                {/* New Chat Button */}
                <button
                  onClick={startNewChat}
                  className='flex items-center space-x-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors'
                >
                  <Plus className='w-4 h-4' />
                  <span className='text-sm'>Nieuw gesprek</span>
                </button>

                {/* Chat History Dropdown */}
                {recentChats.length > 0 && (
                  <div className='relative'>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() =>
                            setIsChatHistoryDropdownOpen(
                              !isChatHistoryDropdownOpen
                            )
                          }
                          className='flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors'
                        >
                          <MessageCircle className='w-4 h-4' />
                          <span className='text-sm'>Gesprekken</span>
                          <span className='text-xs bg-gray-300 px-2 py-0.5 rounded-full'>
                            {recentChats.length}
                          </span>
                          <ChevronDown className='w-4 h-4' />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Recente gesprekken</p>
                      </TooltipContent>
                    </Tooltip>

                    {isChatHistoryDropdownOpen && (
                      <div className='absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto'>
                        <div className='p-3 border-b border-gray-200'>
                          <div className='flex items-center justify-between'>
                            <h3 className='text-sm font-medium text-gray-900'>
                              Recente gesprekken
                            </h3>
                            <button
                              onClick={() => {
                                clearAllChatHistory();
                                setRecentChats([]);
                                toast.success('Alle gesprekken verwijderd');
                              }}
                              className='text-xs text-red-600 hover:text-red-700'
                            >
                              Alles wissen
                            </button>
                          </div>
                        </div>

                        <div className='p-2'>
                          {recentChats.map(chat => (
                            <div
                              key={chat.id}
                              className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer border-l-4 ${
                                chat.id === currentChatId
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-transparent'
                              }`}
                            >
                              <div
                                className='flex-1 min-w-0'
                                onClick={() => {
                                  loadChatSession(chat);
                                  setIsChatHistoryDropdownOpen(false);
                                }}
                              >
                                <div className='flex items-center space-x-2'>
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      chat.documentSource === 'uploaded'
                                        ? 'bg-blue-500'
                                        : chat.documentSource === 'database'
                                          ? 'bg-green-500'
                                          : 'bg-purple-500'
                                    }`}
                                  />
                                  <span className='text-xs font-medium text-gray-500 uppercase'>
                                    {chat.documentSource}
                                  </span>
                                </div>
                                <p className='text-sm text-gray-900 mt-1 line-clamp-2'>
                                  {getChatSummary(chat)}
                                </p>
                                <div className='flex items-center space-x-2 mt-1'>
                                  <p className='text-xs text-gray-500'>
                                    {chat.lastUpdated.toLocaleString('nl-NL', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                  <span className='text-xs text-gray-400'>
                                    •
                                  </span>
                                  <p className='text-xs text-gray-500'>
                                    {chat.messages.length} berichten
                                  </p>
                                </div>
                              </div>

                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  deleteChatSession(chat.id);
                                }}
                                className='p-1 text-gray-400 hover:text-red-600 rounded'
                              >
                                <X className='w-4 h-4' />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Client Selection Bar - Only show for database mode */}
          {documentSource === 'database' && (
            <div className='flex-shrink-0 bg-gray-50 border-b border-gray-200 px-6 py-3'>
              <div className='flex items-center space-x-4'>
                <Label className='text-sm font-medium text-gray-700'>
                  Filter op cliënt:
                </Label>
                <div className='flex-1 max-w-md'>
                  <KiesClientDropdown
                    value={selectedClientId || ''}
                    onSelect={clientId => {
                      console.log('Client selected (onSelect):', clientId);
                      setSelectedClientId(clientId || null);
                      if (clientId) {
                        fetchClientName(clientId);
                      } else {
                        setSelectedClientName('Alle cliënten');
                      }
                    }}
                    onClientSelect={(clientId, clientName) => {
                      console.log(
                        'Client selected with name:',
                        clientId,
                        clientName
                      );
                      setSelectedClientId(clientId || null);
                      setSelectedClientName(clientName || 'Alle cliënten');
                    }}
                  />
                </div>
                {selectedClientId && (
                  <div className='flex items-center space-x-2'>
                    <span className='text-sm text-gray-600'>Geselecteerd:</span>
                    <span className='text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-full'>
                      {selectedClientName}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedClientId(null);
                        setSelectedClientName('Alle cliënten');
                      }}
                      className='text-sm text-gray-500 hover:text-gray-700'
                    >
                      <X className='w-4 h-4' />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className='flex flex-1 overflow-hidden'>
            {/* Sidebar - Only show for uploaded documents */}
            {documentSource === 'uploaded' && (
              <div className='w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0'>
                <div className='p-4 border-b border-gray-200'>
                  <h2 className='text-lg font-semibold text-gray-900 mb-3'>
                    Document Context
                  </h2>
                  <p className='text-sm text-gray-600 mb-4'>
                    Selecteer document om vragen over te stellen:
                  </p>

                  {/* Document Selection */}
                  <div className='relative'>
                    <button
                      onClick={() =>
                        setIsDocumentDropdownOpen(!isDocumentDropdownOpen)
                      }
                      className='w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-left hover:bg-gray-50'
                    >
                      <span className='text-sm'>
                        {selectedDocument
                          ? documents.find(d => d.id === selectedDocument)
                              ?.title || 'Select document'
                          : 'Select document'}
                      </span>
                      <ChevronDown className='w-4 h-4 text-gray-500' />
                    </button>

                    {isDocumentDropdownOpen && (
                      <div className='absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto'>
                        <div
                          className='px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm'
                          onClick={() => {
                            setSelectedDocument(null);
                            setIsDocumentDropdownOpen(false);
                          }}
                        >
                          All documents
                        </div>
                        {documents.map(doc => (
                          <div
                            key={doc.id}
                            className='px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm'
                            onClick={() => {
                              setSelectedDocument(doc.id);
                              setIsDocumentDropdownOpen(false);
                            }}
                          >
                            {doc.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedDocument && (
                    <div className='mt-3 p-2 bg-green-50 border border-green-200 rounded-md'>
                      <div className='flex items-center justify-between'>
                        <span className='text-xs text-green-800 font-medium'>
                          Context:{' '}
                          {
                            documents.find(d => d.id === selectedDocument)
                              ?.title
                          }
                        </span>
                        <button
                          onClick={() => setSelectedDocument(null)}
                          className='text-green-600 hover:text-green-800'
                        >
                          <X className='w-3 h-3' />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Upload Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className='w-full mt-4 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                    disabled={isLoading}
                  >
                    <Upload className='w-4 h-4' />
                    <span>Upload Document</span>
                  </button>
                  <input
                    type='file'
                    ref={fileInputRef}
                    onChange={handleDocumentUpload}
                    accept='.pdf,.doc,.docx,.txt'
                    className='hidden'
                  />
                </div>

                {/* Suggested Questions */}
                <div className='flex-1 p-4 overflow-y-auto'>
                  <h3 className='text-sm font-medium text-gray-900 mb-3 flex items-center space-x-2'>
                    <Sparkles className='w-4 h-4 text-amber-500' />
                    <span>Voorbeeldvragen</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <MousePointer className='w-3 h-3 text-gray-400' />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Klik op een vraag om deze te gebruiken</p>
                      </TooltipContent>
                    </Tooltip>
                  </h3>
                  <div className='space-y-2'>
                    {getSuggestedQuestions().map((question, index) => (
                      <button
                        key={index}
                        onClick={() => setInputMessage(question)}
                        className='w-full text-left p-3 text-xs text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm group'
                      >
                        <div className='flex items-start space-x-2'>
                          <span className='text-blue-400 group-hover:text-blue-600 mt-0.5'>
                            →
                          </span>
                          <span>{question}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Database Stats Sidebar - Only show for database mode */}
            {documentSource === 'database' && databaseStats && (
              <div className='w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0'>
                <div className='p-4 border-b border-gray-200'>
                  <h2 className='text-lg font-semibold text-gray-900 mb-3'>
                    Database Overview
                  </h2>

                  <div className='space-y-3'>
                    <div className='bg-blue-50 p-3 rounded-lg'>
                      <div className='text-sm text-blue-600 font-medium'>
                        Total Documents
                      </div>
                      <div className='text-2xl font-bold text-blue-900'>
                        {databaseStats.documentCount}
                      </div>
                    </div>

                    <div className='bg-green-50 p-3 rounded-lg'>
                      <div className='text-sm text-green-600 font-medium'>
                        Database Status
                      </div>
                      <div className='text-sm font-bold text-green-900 capitalize'>
                        {databaseStats.status}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Suggested Questions for Database */}
                <div className='flex-1 p-4 overflow-y-auto'>
                  <h3 className='text-sm font-medium text-gray-900 mb-3 flex items-center space-x-2'>
                    <Sparkles className='w-4 h-4 text-amber-500' />
                    <span>Voorbeeldvragen</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <MousePointer className='w-3 h-3 text-gray-400' />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Klik op een vraag om deze te gebruiken</p>
                      </TooltipContent>
                    </Tooltip>
                  </h3>
                  <div className='space-y-2'>
                    {getSuggestedQuestions().map((question, index) => (
                      <button
                        key={index}
                        onClick={() => setInputMessage(question)}
                        className='w-full text-left p-3 text-xs text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg border border-gray-200 hover:border-green-300 transition-all duration-200 hover:shadow-sm group'
                      >
                        <div className='flex items-start space-x-2'>
                          <span className='text-green-400 group-hover:text-green-600 mt-0.5'>
                            →
                          </span>
                          <span>{question}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Chat Area */}
            <div className='flex-1 flex flex-col min-w-0'>
              {/* Messages */}
              <div className='flex-1 overflow-y-auto p-6 space-y-4'>
                {/* Loading indicator for chat restore */}
                {isLoadingChat && (
                  <div className='flex items-center justify-center py-8'>
                    <div className='flex items-center space-x-3 text-gray-500'>
                      <Loader2 className='w-5 h-5 animate-spin' />
                      <span className='text-sm'>Gesprek wordt geladen...</span>
                    </div>
                  </div>
                )}

                {!isLoadingChat &&
                  messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}
                    animate-in fade-in slide-in-from-bottom-2 duration-300`}
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animationFillMode: 'backwards',
                      }}
                    >
                      <div
                        className={`max-w-3xl flex space-x-3 ${
                          message.type === 'user'
                            ? 'flex-row-reverse space-x-reverse'
                            : ''
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            message.type === 'user'
                              ? 'bg-blue-600 text-white'
                              : message.documentSource === 'database'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-600 text-white'
                          } ${message.isTyping ? 'animate-pulse' : ''}`}
                        >
                          {message.type === 'user' ? (
                            <User className='w-4 h-4' />
                          ) : message.documentSource === 'database' ? (
                            <Database className='w-4 h-4' />
                          ) : (
                            <Bot className='w-4 h-4' />
                          )}
                        </div>
                        <div className='relative group'>
                          <div
                            className={`rounded-lg px-4 py-3 transition-all ${
                              message.type === 'user'
                                ? message.status === 'error'
                                  ? 'bg-red-600 text-white'
                                  : 'bg-blue-600 text-white'
                                : message.status === 'error'
                                  ? 'bg-red-50 border border-red-200'
                                  : 'bg-white border border-gray-200'
                            } ${
                              message.status === 'sending' ? 'opacity-70' : ''
                            }`}
                          >
                            {/* Message content with skeleton loader for typing */}
                            {message.isTyping && message.content === '' ? (
                              <div className='space-y-2'>
                                <div className='h-3 bg-gray-200 rounded animate-pulse w-3/4'></div>
                                <div className='h-3 bg-gray-200 rounded animate-pulse w-1/2'></div>
                              </div>
                            ) : (
                              <div className='prose prose-sm max-w-none'>
                                <p className='whitespace-pre-wrap'>
                                  {message.content}
                                  {message.isTyping && (
                                    <span className='inline-block w-1 h-4 bg-gray-600 animate-pulse ml-1' />
                                  )}
                                </p>
                              </div>
                            )}

                            {message.sources && message.sources.length > 0 && (
                              <div className='mt-3 pt-3 border-t border-gray-200 animate-in fade-in duration-500'>
                                <p className='text-xs font-medium text-gray-600 mb-2'>
                                  Bronnen:
                                </p>
                                <div className='space-y-2'>
                                  {message.sources.map((source, index) => {
                                    const isDetailedSource =
                                      typeof source === 'object';
                                    return (
                                      <div
                                        key={index}
                                        className='flex items-start space-x-2 p-2 bg-gray-50 rounded'
                                      >
                                        <FileText className='w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0' />
                                        {isDetailedSource ? (
                                          <div className='flex-1 text-xs'>
                                            <div className='font-medium text-gray-700'>
                                              {source.title}
                                            </div>
                                            <div className='text-gray-500 mt-0.5'>
                                              {source.document_type && (
                                                <span>
                                                  Type: {source.document_type}
                                                </span>
                                              )}
                                              {source.client_name &&
                                                source.client_name !==
                                                  'Onbekende cliënt' && (
                                                  <span className='ml-2 inline-block px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 border border-purple-500 font-medium text-xs'>
                                                    Cliënt: {source.client_name}
                                                  </span>
                                                )}
                                            </div>
                                          </div>
                                        ) : (
                                          <span className='text-xs text-gray-600'>
                                            {source}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            <div className='mt-2 flex items-center justify-between text-xs text-gray-500'>
                              <div className='flex items-center space-x-2'>
                                <span>
                                  {message.timestamp.toLocaleTimeString()}
                                </span>
                                {message.documentSource && (
                                  <span className='px-2 py-0.5 bg-gray-100 rounded text-xs'>
                                    {message.documentSource === 'database'
                                      ? '🗄️ Database'
                                      : '📁 Uploaded'}
                                  </span>
                                )}
                                {message.type === 'user' && message.status && (
                                  <span className='flex items-center space-x-1'>
                                    {message.status === 'sending' && (
                                      <Check className='w-3 h-3 text-gray-400' />
                                    )}
                                    {message.status === 'sent' && (
                                      <CheckCheck className='w-3 h-3 text-blue-600' />
                                    )}
                                    {message.status === 'error' && (
                                      <AlertCircle className='w-3 h-3 text-red-600' />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Copy button - only for assistant messages */}
                          {message.type === 'assistant' &&
                            message.content &&
                            !message.isTyping && (
                              <button
                                onClick={() =>
                                  copyMessage(message.id, message.content)
                                }
                                className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity
                            p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-800'
                              >
                                {copiedMessageId === message.id ? (
                                  <CheckCircle className='w-4 h-4 text-green-600' />
                                ) : (
                                  <Copy className='w-4 h-4' />
                                )}
                              </button>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}

                {/* Enhanced typing indicator */}
                {isTyping && (
                  <div className='flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300'>
                    <div className='max-w-3xl flex space-x-3'>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center animate-pulse ${
                          documentSource === 'database'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-600 text-white'
                        }`}
                      >
                        {documentSource === 'database' ? (
                          <Database className='w-4 h-4' />
                        ) : (
                          <Bot className='w-4 h-4' />
                        )}
                      </div>
                      <div className='bg-white border border-gray-200 rounded-lg px-4 py-3'>
                        <div className='flex items-center space-x-3'>
                          <div className='flex space-x-1'>
                            <div
                              className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                              style={{ animationDelay: '0ms' }}
                            ></div>
                            <div
                              className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                              style={{ animationDelay: '150ms' }}
                            ></div>
                            <div
                              className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                              style={{ animationDelay: '300ms' }}
                            ></div>
                          </div>
                          <span className='text-sm text-gray-600'>
                            {documentSource === 'database'
                              ? 'Database doorzoeken...'
                              : 'Documenten analyseren...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className='flex-shrink-0 border-t border-gray-200 bg-white'>
                {/* Smart Prompt Templates */}
                <div className='border-b border-gray-100 px-4 py-3'>
                  <div className='flex items-center space-x-2 mb-2'>
                    <Zap className='w-4 h-4 text-amber-500' />
                    <span className='text-xs font-medium text-gray-700'>
                      Snelle prompts - klik om te gebruiken:
                    </span>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className='w-3 h-3 text-gray-400' />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Klik op een prompt en pas de [placeholders] aan</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className='overflow-x-auto overflow-y-hidden -mx-4 px-4'>
                    <div className='flex gap-2 animate-in fade-in duration-300 pb-1'>
                      {getSmartPromptTemplates().map((template, index) => (
                        <button
                          key={index}
                          onClick={() => handleTemplateClick(template.prompt)}
                          className='group relative flex-shrink-0 px-3 py-1.5 text-xs bg-gradient-to-r from-gray-50 to-gray-100
                          hover:from-blue-50 hover:to-blue-100 text-gray-700 hover:text-blue-700 rounded-full
                          border border-gray-200 hover:border-blue-300 transition-all duration-200
                          hover:scale-105 hover:shadow-sm transform active:scale-95'
                          style={{
                            animationDelay: `${index * 50}ms`,
                            animationFillMode: 'backwards',
                          }}
                        >
                          <span className='flex items-center space-x-1.5'>
                            <span className='text-base transition-transform group-hover:scale-110'>
                              {template.icon}
                            </span>
                            <span className='whitespace-nowrap'>
                              {template.label}
                            </span>
                          </span>
                          {template.hasPlaceholder && (
                            <span className='absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse' />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className='p-4'>
                  <div className='flex space-x-3'>
                    <div className='flex-1 relative'>
                      <textarea
                        value={inputMessage}
                        onChange={e => {
                          const value = e.target.value;
                          setInputMessage(value);

                          // Check if user is typing after "cliënt" or "client"
                          const cursorPosition = e.target.selectionStart;
                          const textBeforeCursor = value.substring(
                            0,
                            cursorPosition
                          );
                          const clientMatch = textBeforeCursor.match(
                            /(?:cliënt|client)\s+([^,\s]*)$/i
                          );

                          if (
                            clientMatch &&
                            clientNames.length > 0 &&
                            documentSource === 'database'
                          ) {
                            const searchTerm = clientMatch[1].toLowerCase();
                            const filtered = clientNames
                              .filter(name =>
                                name.toLowerCase().includes(searchTerm)
                              )
                              .slice(0, 5); // Limit to 5 suggestions

                            setFilteredClientNames(filtered);
                            setShowClientSuggestions(filtered.length > 0);
                            setSelectedSuggestionIndex(0);
                          } else {
                            setShowClientSuggestions(false);
                          }
                        }}
                        onKeyPress={handleKeyPress}
                        onKeyDown={e => {
                          // Handle arrow keys for client suggestions
                          if (
                            showClientSuggestions &&
                            (e.key === 'ArrowDown' || e.key === 'ArrowUp')
                          ) {
                            handleKeyPress(e);
                          }
                        }}
                        placeholder={
                          documentSource === 'database'
                            ? "Stel uw vraag in gewoon Nederlands, bijvoorbeeld: 'Hoeveel nieuwe cliënten hebben we deze maand?' of 'Welke indicaties verlopen binnenkort?'"
                            : "Stel uw vraag over het document in gewoon Nederlands, bijvoorbeeld: 'Wat is de diagnose?' of 'Welke medicatie wordt voorgeschreven?'"
                        }
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        resize-none placeholder:text-sm transition-all duration-200
                        hover:border-gray-400 focus:shadow-lg'
                        rows={2}
                        disabled={isLoading}
                      />

                      {/* Client name suggestions dropdown */}
                      {showClientSuggestions && (
                        <div className='absolute bottom-full mb-2 left-0 w-full max-w-md bg-white border border-gray-200 rounded-lg shadow-lg z-50'>
                          <div className='p-2'>
                            <div className='text-xs text-gray-500 mb-1 px-2'>
                              Selecteer een cliënt:
                            </div>
                            {filteredClientNames.map((name, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  // Replace the partial client name with the selected one
                                  const cursorPosition =
                                    inputMessage.lastIndexOf(' ') + 1;
                                  const newMessage =
                                    inputMessage.substring(0, cursorPosition) +
                                    name;
                                  setInputMessage(newMessage);
                                  setShowClientSuggestions(false);

                                  // Focus back on textarea
                                  const textarea =
                                    document.querySelector('textarea');
                                  if (textarea) {
                                    textarea.focus();
                                  }
                                }}
                                className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-blue-50 transition-colors ${
                                  index === selectedSuggestionIndex
                                    ? 'bg-blue-50'
                                    : ''
                                }`}
                              >
                                {name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {inputMessage.length === 0 && (
                        <div
                          className='absolute bottom-2 right-2 text-xs text-gray-400 flex items-center space-x-1
                        animate-in fade-in duration-300'
                        >
                          <MessageSquare className='w-3 h-3' />
                          <span>Typ uw vraag of klik op een voorbeeld</span>
                        </div>
                      )}
                      {inputMessage.length > 0 && (
                        <div className='absolute bottom-2 right-2 text-xs text-gray-400 animate-in fade-in duration-300'>
                          <span>{inputMessage.length} tekens</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isLoading}
                      className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 transform ${
                        !inputMessage.trim() || isLoading
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : documentSource === 'database'
                            ? 'bg-green-600 text-white hover:bg-green-700 hover:scale-105 hover:shadow-lg active:scale-95'
                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 hover:shadow-lg active:scale-95'
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 className='w-4 h-4 animate-spin' />
                      ) : (
                        <Send className='w-4 h-4' />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </AppLayout>
  );
};

export default AIChat;
