import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Database, Loader2, FileText, Clock, AlertTriangle, RefreshCw, Settings } from 'lucide-react';

function App() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hallo! 👋 Ik ben je AI assistent voor cliëntgegevens. Ik kan je helpen met het opzoeken en analyseren van cliëntinformatie uit je Supabase database. Wat wil je weten?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');
  const [retryCount, setRetryCount] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkServerStatus = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8080/health', {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      if (response.ok) {
        const data = await response.json();
        setServerStatus('connected');
        setRetryCount(0);
        console.log('✅ Server connected:', data);
      } else {
        setServerStatus('error');
      }
    } catch (error) {
      setServerStatus('error');
      console.error('❌ Server connection failed:', error);
    }
  }, []);

  // Check server status on load and retry logic
  useEffect(() => {
    checkServerStatus();

    const interval = setInterval(() => {
      if (serverStatus === 'error' && retryCount < 3) {
        setRetryCount(prev => prev + 1);
        checkServerStatus();
      }
    }, 10000); // Retry every 10 seconds

    return () => clearInterval(interval);
  }, [checkServerStatus, serverStatus, retryCount]);

  const sendMessageToMCP = async (userMessage) => {
    try {
      const response = await fetch('http://localhost:8080/mcp/chatbot.query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userMessage }),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('MCP Server error:', error);
      return {
        success: false,
        response: error.name === 'TimeoutError'
          ? '⏱️ De server reageert niet binnen de verwachte tijd. Probeer het opnieuw met een eenvoudigere vraag.'
          : `❌ Kan geen verbinding maken met de server. Zorg dat je MCP server draait op http://localhost:8080\n\nFout: ${error.message}`,
        queryType: 'error'
      };
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    // Focus back to input for better UX
    setTimeout(() => inputRef.current?.focus(), 100);

    try {
      const result = await sendMessageToMCP(currentInput);

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: result.response || 'Geen antwoord ontvangen van de server.',
        timestamp: new Date(),
        queryType: result.queryType,
        dataCount: result.dataCount,
        context: result.context,
        success: result.success !== false
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: '❌ Er is een onverwachte fout opgetreden. Controleer of de MCP server draait.',
        timestamp: new Date(),
        success: false
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
    inputRef.current?.focus();
  };

  const clearChat = () => {
    setMessages([{
      id: 1,
      type: 'bot',
      content: 'Chat gewist! 🧹 Wat wil je weten over je cliëntgegevens?',
      timestamp: new Date()
    }]);
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = () => {
    switch (serverStatus) {
      case 'connected':
        return <div className="w-3 h-3 bg-green-500 rounded-full" />;
      case 'error':
        return <div className="w-3 h-3 bg-red-500 rounded-full" />;
      default:
        return <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />;
    }
  };

  const getQueryTypeIcon = (queryType) => {
    switch (queryType) {
      case 'client_search':
        return <User className="w-4 h-4 text-blue-500" />;
      case 'dashboard':
        return <Database className="w-4 h-4 text-green-500" />;
      case 'urgent_documents':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'recent_documents':
        return <Clock className="w-4 h-4 text-purple-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const suggestionQuestions = [
    "Hoeveel documenten hebben we?",
    "Toon dashboard overzicht",
    "Zoek documenten van Arkojan",
    "Welke cliënt heeft de meeste documenten?",
    "Toon urgente documenten",
    "Recente documenten van deze week"
  ];

  return (
    <div className="flex flex-col h-screen max-w-6xl mx-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                MedDoc AI Cliënt Assistant
              </h1>
              <p className="text-sm text-gray-500">
                AI-powered cliëntgegevens analyse via Supabase
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Server Status */}
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-sm text-gray-600">
                {serverStatus === 'connected' ? 'Server Verbonden' :
                 serverStatus === 'error' ? 'Server Offline' : 'Verbinding maken...'}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={checkServerStatus}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Server status vernieuwen"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={clearChat}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Chat wissen"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-4xl ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`p-2 rounded-full ${message.type === 'user' ? 'bg-blue-500' : 'bg-gray-600'}`}>
                {message.type === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              <div className={`rounded-lg p-4 ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.success === false
                  ? 'bg-red-50 border border-red-200 text-red-900'
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}>
                <div className="whitespace-pre-wrap">{message.content}</div>

                {/* Query metadata */}
                {message.queryType && message.type === 'bot' && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      {getQueryTypeIcon(message.queryType)}
                      <span>Query: {message.queryType}</span>
                      {message.dataCount && (
                        <>
                          <span>•</span>
                          <span>{message.dataCount} resultaten</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className={`text-xs mt-2 ${
                  message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-4xl">
              <div className="p-2 rounded-full bg-gray-600">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="rounded-lg p-4 bg-white border border-gray-200">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-gray-600">Aan het zoeken in database...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Pills */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <div className="text-xs text-gray-500 mb-2">Probeer deze vragen:</div>
          <div className="flex flex-wrap gap-2">
            {suggestionQuestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={isLoading}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-full text-xs text-gray-700 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex gap-3">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Vraag iets over je cliëntgegevens... (bijv. 'Hoeveel nieuwe cliënten deze maand?' of 'Zoek cliënt met naam Arkojan')"
            className="flex-1 border border-gray-300 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="2"
            disabled={isLoading || serverStatus === 'error'}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading || serverStatus === 'error'}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-2 text-xs text-gray-500">
          Voorbeeldvragen: "Dashboard overzicht", "Documenten van Arkojan", "Urgente documenten", "Cliënt statistieken"
        </div>

        {serverStatus === 'error' && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
              ⚠️ Kan geen verbinding maken met de MCP server. Zorg dat de server draait op http://localhost:8080
              {retryCount > 0 && ` (${retryCount}/3 pogingen)`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;