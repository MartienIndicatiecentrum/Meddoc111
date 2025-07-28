// server.js - CommonJS versie voor Node.js
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// Optional dependencies for file upload
let multer, FormData;
try {
  multer = require('multer');
  FormData = require('form-data');
  console.log('✅ File upload dependencies loaded (multer, form-data)');
} catch (error) {
  console.warn('⚠️  multer or form-data not installed. File upload features will be disabled.');
  console.warn('   Run: npm install multer form-data');
}

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configure multer for memory storage (temporary) - only if available
const upload = multer ? multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
}) : null;

const app = express();
const PORT = process.env.PORT || 8081;

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingVars = [];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    missingVars.push(envVar);
  }
}

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please add these to your .env file and restart the server.');
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// Add debug middleware if DEBUG is true
if (process.env.DEBUG === 'true') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
      console.log('Body:', JSON.stringify(req.body, null, 2));
    }
    next();
  });
}

// Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔗 Connecting to Supabase:', process.env.SUPABASE_URL);

// Document Queries Class
class DocumentQueries {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  async searchClientDocuments(searchTerm, clientId = null, limit = 50) {
    try {
      let query = this.supabase
        .from('documents')
        .select('id, title, content, document_type, created_at, client_id, client_name, naam, file_path, status');
      
      // If clientId is provided, filter by it
      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        // Otherwise search by client name
        query = query.or(`client_name.ilike.%${searchTerm}%,naam.ilike.%${searchTerm}%,"Naam client".ilike.%${searchTerm}%,Naamclient.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching client documents:', error);
      return [];
    }
  }

  async getDocumentsByClientId(clientId, limit = 50) {
    try {
      console.log('🔎 Searching documents for client_id:', clientId);
      
      // First, get the client name from the clients table
      const { data: clientData, error: clientError } = await this.supabase
        .from('clients')
        .select('naam, full_name, first_name, last_name')
        .eq('id', clientId)
        .single();
      
      if (clientError) {
        console.error('⚠️ Error fetching client:', clientError);
      }
      
      const clientName = clientData?.naam || clientData?.full_name || 
                        `${clientData?.first_name || ''} ${clientData?.last_name || ''}`.trim();
      
      console.log('👤 Client name:', clientName);
      
      // Search by both client_id AND client name
      let query = this.supabase
        .from('documents')
        .select('id, title, content, document_type, created_at, client_id, client_name, naam, file_path, status');
      
      if (clientName) {
        // Search by ID or name
        query = query.or(`client_id.eq.${clientId},client_name.ilike.%${clientName}%,naam.ilike.%${clientName}%,"Naam client".ilike.%${clientName}%`);
      } else {
        // Fallback to just ID
        query = query.eq('client_id', clientId);
      }
      
      // Filter out documents without content
      const { data, error } = await query
        .not('content', 'is', null)
        .neq('content', '')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('❌ Error in getDocumentsByClientId:', error);
        throw error;
      }
      
      console.log('✅ Documents found:', data?.length || 0);
      console.log('📄 Documents with content:', data?.filter(d => d.content)?.length || 0);
      console.log('📏 Content sample length:', data?.[0]?.content?.length || 0);
      
      if (data && data.length > 0) {
        console.log('📄 First document sample:', {
          id: data[0].id,
          title: data[0].title,
          client_id: data[0].client_id,
          client_name: data[0].client_name || data[0].naam || data[0]['Naam client'],
          has_content: !!data[0].content,
          content_length: data[0].content?.length || 0
        });
      }
      
      return data || [];
    } catch (error) {
      console.error('Error getting documents by client ID:', error);
      return [];
    }
  }

  // Get all documents for a client (including those without content)
  async getAllDocumentsByClientId(clientId, limit = 50) {
    try {
      console.log('🔎 Getting ALL documents for client_id:', clientId);
      
      const { data, error } = await this.supabase
        .from('documents')
        .select('id, title, content, document_type, created_at, client_id, client_name, naam, file_path, status')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      console.log('📃 Total documents found:', data?.length || 0);
      console.log('📝 Documents with content:', data?.filter(d => d.content)?.length || 0);
      
      return data || [];
    } catch (error) {
      console.error('Error getting all documents by client ID:', error);
      return [];
    }
  }

  async getDashboardStats() {
    try {
      // Totaal aantal documenten
      const { count: totalDocs } = await this.supabase
        .from('documents')
        .select('*', { count: 'exact', head: true });

      // Documenten vandaag
      const today = new Date().toISOString().split('T')[0];
      const { count: todayDocs } = await this.supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      // Urgente documenten
      const { count: urgentDocs } = await this.supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .or('priority.eq.hoog,urgent.eq.true');

      // In behandeling
      const { count: inProgressDocs } = await this.supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .or('status.eq.in_behandeling,in_behandeling.eq.true');

      return {
        total: totalDocs || 0,
        today: todayDocs || 0,
        urgent: urgentDocs || 0,
        inProgress: inProgressDocs || 0,
        completed: (totalDocs || 0) - (inProgressDocs || 0)
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return { total: 0, today: 0, urgent: 0, inProgress: 0, completed: 0 };
    }
  }

  async getClientDocumentStats() {
    try {
      const { data, error } = await this.supabase
        .from('documents')
        .select('client_name, naam, "Naam client", Naamclient');
      
      if (error) throw error;
      
      // Groepeer per cliënt
      const clientStats = {};
      (data || []).forEach(doc => {
        const clientName = doc.client_name || doc.naam || doc['Naam client'] || doc.Naamclient || 'Onbekend';
        if (!clientStats[clientName]) {
          clientStats[clientName] = 0;
        }
        clientStats[clientName]++;
      });

      return Object.entries(clientStats)
        .map(([name, count]) => ({ client_name: name, document_count: count }))
        .sort((a, b) => b.document_count - a.document_count);
    } catch (error) {
      console.error('Error getting client stats:', error);
      return [];
    }
  }

  async getRecentDocuments(days = 7, clientId = null, limit = 20) {
    try {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);

      let query = this.supabase
        .from('documents')
        .select('*')
        .gte('created_at', dateThreshold.toISOString());
      
      // Apply client filter if provided
      if (clientId) {
        query = query.eq('client_id', clientId);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting recent documents:', error);
      return [];
    }
  }

  async getUrgentDocuments(clientId = null) {
    try {
      let query = this.supabase
        .from('documents')
        .select('*')
        .or('priority.eq.hoog,urgent.eq.true,status.eq.urgent');
      
      // Apply client filter if provided
      if (clientId) {
        query = query.eq('client_id', clientId);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting urgent documents:', error);
      return [];
    }
  }

  async getAllClients() {
    try {
      const { data, error } = await this.supabase
        .from('documents')
        .select('client_name, naam, "Naam client", Naamclient');
      
      if (error) throw error;
      
      // Unieke cliëntnamen extraheren
      const clients = new Set();
      (data || []).forEach(doc => {
        const clientName = doc.client_name || doc.naam || doc['Naam client'] || doc.Naamclient;
        if (clientName && clientName.trim()) {
          clients.add(clientName.trim());
        }
      });
      
      return Array.from(clients).sort();
    } catch (error) {
      console.error('Error getting all clients:', error);
      return [];
    }
  }
}

// Enhanced Chatbot Service
class EnhancedChatbotService {
  constructor(supabaseClient) {
    this.documentQueries = new DocumentQueries(supabaseClient);
  }

  async processUserQuery(query, clientId = null) {
    const lowerQuery = query.toLowerCase();
    let supabaseData = null;
    let context = '';
    let queryType = 'unknown';
    
    console.log('🔍 Processing query with clientId:', clientId);
    console.log('📝 Query:', query);
    console.log('🆙 Query Type Detection:', {
      isClientSearch: this.isClientSearchQuery(lowerQuery),
      isStats: this.isStatsQuery(lowerQuery),
      isUrgent: this.isUrgentQuery(lowerQuery),
      isRecent: this.isRecentQuery(lowerQuery),
      isAllClients: this.isAllClientsQuery(lowerQuery)
    });

    try {
      // CLIËNT GERELATEERDE QUERIES
      if (this.isClientSearchQuery(lowerQuery)) {
        const clientName = this.extractClientName(query);
        if (clientName) {
          supabaseData = await this.documentQueries.searchClientDocuments(clientName, clientId);
          queryType = 'client_search';
          context = `Gevonden ${supabaseData.length} documenten voor cliënt "${clientName}".`;
        }
      }
      // If clientId is provided but no specific client search query
      else if (clientId && !this.isAllClientsQuery(lowerQuery)) {
        console.log('📁 Fetching documents for client:', clientId);
        supabaseData = await this.documentQueries.getDocumentsByClientId(clientId);
        console.log('📊 Found documents with content:', supabaseData.length);
        
        // If no documents with content found, try getting all documents
        if (supabaseData.length === 0) {
          console.log('🔄 No documents with content, fetching all documents...');
          supabaseData = await this.documentQueries.getAllDocumentsByClientId(clientId);
          console.log('📄 Total documents found:', supabaseData.length);
        }
        
        queryType = 'client_filter';
        context = `Gevonden ${supabaseData.length} documenten voor de geselecteerde cliënt.`;
      }
      
      // STATISTIEKEN EN OVERZICHTEN
      else if (this.isStatsQuery(lowerQuery)) {
        if (lowerQuery.includes('dashboard') || lowerQuery.includes('overzicht')) {
          supabaseData = await this.documentQueries.getDashboardStats();
          queryType = 'dashboard';
          context = `Dashboard statistieken: ${supabaseData.total} totaal documenten, ${supabaseData.today} vandaag, ${supabaseData.urgent} urgent.`;
        }
        else if (lowerQuery.includes('cliënt') && (lowerQuery.includes('meeste') || lowerQuery.includes('top'))) {
          supabaseData = await this.documentQueries.getClientDocumentStats();
          queryType = 'client_stats';
          context = `Top cliënten qua aantal documenten. ${supabaseData[0]?.client_name} heeft de meeste (${supabaseData[0]?.document_count} documenten).`;
        }
        else if (lowerQuery.includes('hoeveel') && lowerQuery.includes('document')) {
          const stats = await this.documentQueries.getDashboardStats();
          supabaseData = stats;
          queryType = 'document_count';
          context = `Er zijn in totaal ${stats.total} documenten in het systeem.`;
        }
      }
      
      // URGENTE DOCUMENTEN
      else if (this.isUrgentQuery(lowerQuery)) {
        supabaseData = await this.documentQueries.getUrgentDocuments(clientId);
        queryType = 'urgent_documents';
        context = `Gevonden ${supabaseData.length} urgente of hoge prioriteit documenten${clientId ? ' voor de geselecteerde cliënt' : ''}.`;
      }
      
      // RECENTE DOCUMENTEN
      else if (this.isRecentQuery(lowerQuery)) {
        const days = this.extractDaysFromQuery(query) || 7;
        supabaseData = await this.documentQueries.getRecentDocuments(days, clientId);
        queryType = 'recent_documents';
        context = `Gevonden ${supabaseData.length} documenten van de afgelopen ${days} dagen${clientId ? ' voor de geselecteerde cliënt' : ''}.`;
      }
      
      // ALLE CLIËNTEN
      else if (this.isAllClientsQuery(lowerQuery)) {
        supabaseData = await this.documentQueries.getAllClients();
        queryType = 'all_clients';
        context = `Lijst van alle ${supabaseData.length} cliënten in het systeem.`;
      }
      
      // FALLBACK - ALGEMENE STATISTIEKEN
      else {
        if (clientId) {
          // If client is selected, show client-specific data
          console.log('📦 General query with client filter:', clientId);
          supabaseData = await this.documentQueries.getDocumentsByClientId(clientId);
          
          // If no documents with content found, try getting all documents
          if (supabaseData.length === 0) {
            console.log('🔄 No documents with content, fetching all documents...');
            supabaseData = await this.documentQueries.getAllDocumentsByClientId(clientId);
          }
          
          queryType = 'client_general';
          context = `Algemene informatie voor de geselecteerde cliënt. ${supabaseData.length} documenten gevonden.`;
        } else {
          supabaseData = await this.documentQueries.getDashboardStats();
          queryType = 'general_info';
          context = `Algemene systeem informatie. Gebruik specifiekere vragen voor betere resultaten.`;
        }
      }

    } catch (error) {
      console.error('Error processing query:', error);
      context = 'Er is een fout opgetreden bij het ophalen van gegevens uit de database.';
      queryType = 'error';
    }

    return { supabaseData, context, queryType };
  }

  // Query detection methods
  isClientSearchQuery(query) {
    return query.includes('cliënt') && (
      query.includes('zoek') || query.includes('documenten van') || 
      query.includes('toon') || query.includes('geef') || query.includes('vind')
    );
  }

  isStatsQuery(query) {
    return query.includes('hoeveel') || query.includes('statistiek') || 
           query.includes('overzicht') || query.includes('dashboard') ||
           query.includes('meeste') || query.includes('top');
  }

  isUrgentQuery(query) {
    return query.includes('urgent') || query.includes('prioriteit') || 
           query.includes('hoog') || query.includes('spoed');
  }

  isRecentQuery(query) {
    return query.includes('recent') || query.includes('nieuwe') || 
           query.includes('vandaag') || query.includes('gisteren') ||
           query.includes('afgelopen') || query.includes('laatste');
  }

  isAllClientsQuery(query) {
    return (query.includes('alle') || query.includes('lijst')) && query.includes('cliënt');
  }

  extractClientName(query) {
    const patterns = [
      /(?:cliënt|client)\s+(.+?)(?:\s|$)/i,
      /(?:van|voor)\s+(.+?)(?:\s|$)/i,
      /(?:documenten)\s+(.+?)(?:\s|$)/i,
      /(?:toon|geef|zoek)\s+(.+?)(?:\s|$)/i
    ];
    
    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  }

  extractDaysFromQuery(query) {
    const dayMatch = query.match(/(\d+)\s*dag/i);
    if (dayMatch) return parseInt(dayMatch[1]);
    
    const weekMatch = query.match(/(\d+)\s*week/i);
    if (weekMatch) return parseInt(weekMatch[1]) * 7;
    
    return null;
  }

  async generateIntelligentResponse(userMessage, context, supabaseData, queryType) {
    // Als we geen Claude API key hebben, geef een eenvoudige response
    if (!process.env.NEXT_PUBLIC_CLAUDE_API_KEY) {
      return this.getFallbackResponse(queryType, context, supabaseData);
    }

    try {
      // Extract document content for context
      let documentContent = '';
      if (Array.isArray(supabaseData) && supabaseData.length > 0) {
        documentContent = supabaseData
          .filter(doc => doc.content && doc.content.trim() !== '')
          .slice(0, 5) // Limit to 5 documents to avoid token limits
          .map(doc => `
=== Document: ${doc.title || 'Untitled'} ===
Type: ${doc.document_type || 'Onbekend'}
Datum: ${new Date(doc.created_at).toLocaleDateString('nl-NL')}
Inhoud:
${doc.content.substring(0, 2000)}${doc.content.length > 2000 ? '...' : ''}
`)
          .join('\n\n---\n\n');
      }
      
      let prompt = `Je bent een AI assistent voor documentbeheer in het Nederlands. 

Gebruikersvraag: "${userMessage}"
Context: ${context}
Query type: ${queryType}

DOCUMENT INHOUD:
${documentContent || 'Geen document inhoud beschikbaar'}

${this.getQuerySpecificPrompt(queryType, supabaseData)}

BELANGRIJKE INSTRUCTIES:
- Baseer je antwoord op de werkelijke inhoud van de documenten
- Citeer relevante passages uit de documenten
- Als er geen relevante informatie is, geef dat duidelijk aan
- Wees specifiek en verwijs naar documenten bij naam

Geef een behulpzaam, gestructureerd antwoord in het Nederlands.`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_CLAUDE_API_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-sonnet-20240229",
          max_tokens: 1500,
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error('Claude API error:', error);
      return this.getFallbackResponse(queryType, context, supabaseData);
    }
  }

  getQuerySpecificPrompt(queryType, data) {
    switch (queryType) {
      case 'client_search':
      case 'client_filter':
      case 'client_general':
        return `Documenten data: ${JSON.stringify(data?.slice(0, 10), null, 2)}
        Formatteer als een nette lijst met documenttypes en datums.`;
        
      case 'dashboard':
        return `Dashboard data: ${JSON.stringify(data, null, 2)}
        Maak een overzichtelijk dashboard met key metrics.`;
        
      case 'client_stats':
        return `Top cliënten: ${JSON.stringify(data?.slice(0, 10), null, 2)}
        Toon top 10 cliënten met aantal documenten.`;
        
      default:
        return `Data: ${JSON.stringify(data?.slice ? data.slice(0, 5) : data, null, 2)}`;
    }
  }

  getFallbackResponse(queryType, context, data) {
    switch (queryType) {
      case 'client_search':
      case 'client_filter':
      case 'client_general':
        if (!Array.isArray(data) || data.length === 0) {
          return `⚠️ **Geen documenten gevonden voor deze cliënt**\n\nDit kan betekenen dat:\n• Er nog geen documenten zijn geüpload voor deze cliënt\n• De documenten niet correct gekoppeld zijn aan de cliënt\n• De cliënt mogelijk onder een andere naam geregistreerd staat\n\nProbeer een andere cliënt te selecteren of upload nieuwe documenten voor deze cliënt.`;
        }
        
        // Check if we have documents with content
        const docsWithContent = data.filter(d => d.content);
        if (docsWithContent.length > 0) {
          // Extract key information from content
          const summary = docsWithContent.slice(0, 3).map(doc => {
            const preview = doc.content.substring(0, 200).replace(/\n/g, ' ');
            return `📄 **${doc.title}** (${doc.document_type || 'Document'})\n   *${new Date(doc.created_at).toLocaleDateString('nl-NL')}*\n   ${preview}...`;
          }).join('\n\n');
          
          return `📋 **Documenten met inhoud gevonden (${docsWithContent.length} van ${data.length}):**\n\n${summary}\n\n🔍 **Stel een specifieke vraag over deze documenten**, bijvoorbeeld:\n• "Wat staat er in het behandelplan?"\n• "Welke medicatie wordt voorgeschreven?"\n• "Wat zijn de belangrijkste punten?"`;
        } else {
          return `⚠️ **Documenten gevonden maar zonder leesbare inhoud**\n\nGevonden: ${data.length} documenten\nMet inhoud: 0 documenten\n\nDit betekent dat de documenten wel geüpload zijn, maar de tekst niet is geëxtraheerd.\nMogelijke oorzaken:\n• PDF's zijn niet correct verwerkt bij upload\n• Documenten bevatten alleen afbeeldingen\n• De content extractie is mislukt\n\n**Actie vereist:** Document processing moet opnieuw worden uitgevoerd.`;
        }
        
      case 'dashboard':
        return `📊 **Dashboard Overzicht:**\n\n• Totaal documenten: ${data?.total || 0}\n• Vandaag toegevoegd: ${data?.today || 0}\n• Urgente documenten: ${data?.urgent || 0}\n• In behandeling: ${data?.inProgress || 0}\n• Afgehandeld: ${data?.completed || 0}`;
        
      case 'client_stats':
        if (Array.isArray(data) && data.length > 0) {
          return `👥 **Top Cliënten:**\n\n${data.slice(0, 10).map((client, index) => 
            `${index + 1}. ${client.client_name} - ${client.document_count} documenten`
          ).join('\n')}`;
        }
        return "Geen cliëntstatistieken beschikbaar.";
        
      case 'urgent_documents':
        return `🚨 **Urgente Documenten (${Array.isArray(data) ? data.length : 0}):**\n\n${context}`;
        
      case 'recent_documents':
        return `🕒 **Recente Documenten (${Array.isArray(data) ? data.length : 0}):**\n\n${context}`;
        
      case 'all_clients':
        if (Array.isArray(data) && data.length > 0) {
          return `👥 **Alle Cliënten (${data.length}):**\n\n${data.slice(0, 20).join(', ')}${data.length > 20 ? '\n\n... en nog ' + (data.length - 20) + ' meer.' : ''}`;
        }
        return "Geen cliënten gevonden.";
        
      case 'document_count':
        return `📊 Er zijn **${data?.total || 0}** documenten in het systeem.`;
        
      case 'error':
        return "❌ Er is een technische fout opgetreden. Probeer het later opnieuw.";
        
      default:
        // If client filter is active but no specific query type matched
        if (context.includes('geselecteerde cliënt') && (!Array.isArray(data) || data.length === 0)) {
          return `⚠️ **Geen documenten gevonden voor deze cliënt**\n\n${context}\n\nProbeer:\n• Een andere cliënt te selecteren\n• Te controleren of er documenten zijn geüpload voor deze cliënt\n• "Alle cliënten" te selecteren voor een breder overzicht`;
        }
        return `${context}\n\nVoor meer specifieke informatie, probeer vragen zoals:\n• "Hoeveel documenten hebben we?"\n• "Toon documenten van [cliëntnaam]"\n• "Dashboard overzicht"\n• "Welke cliënt heeft de meeste documenten?"`;
    }
  }
}

// Initialize services
const documentQueries = new DocumentQueries(supabase);
const chatbotService = new EnhancedChatbotService(supabase);

// Routes
app.get('/', (req, res) => {
  res.json({ 
    status: '🚀 MedDoc AI Chatbot Server Running',
    timestamp: new Date().toISOString(),
    port: PORT,
    supabase: 'Connected',
    claude: process.env.NEXT_PUBLIC_CLAUDE_API_KEY ? 'Ready' : 'Not configured (using fallback responses)'
  });
});

// Health check met database test
app.get('/health', async (req, res) => {
  try {
    // Test database connection with a simple query
    const { data, error, count } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
    
    res.json({
      status: 'healthy',
      database: 'connected',
      documentCount: count || 0,
      claude: process.env.ANTHROPIC_API_KEY ? 'configured' : 'not configured',
      morphik: process.env.MORPHIK_API_KEY ? 'configured' : 'not configured',
      multer: multer ? 'available' : 'not installed (file upload disabled)',
      supabase: {
        url: process.env.SUPABASE_URL ? 'configured' : 'missing',
        key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
      supabase: {
        url: process.env.SUPABASE_URL ? 'configured' : 'missing',
        key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Diagnostic endpoint for troubleshooting
app.get('/api/diagnostic', async (req, res) => {
  const diagnostics = {
    status: 'checking',
    timestamp: new Date().toISOString(),
    checks: {
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd(),
        port: PORT
      },
      envVars: {
        SUPABASE_URL: process.env.SUPABASE_URL ? 'configured' : 'missing',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing',
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? 'configured' : 'not set',
        MORPHIK_API_KEY: process.env.MORPHIK_API_KEY ? 'configured' : 'missing',
        MORPHIK_API_URL: process.env.MORPHIK_API_URL || 'default (https://api.morphik.ai)',
        DEBUG: process.env.DEBUG || 'false',
        PORT: process.env.PORT || 'default (8081)'
      },
      database: {
        status: 'unknown',
        error: null,
        tables: []
      },
      services: {
        chatbot: chatbotService ? 'initialized' : 'not initialized',
        documentQueries: documentQueries ? 'initialized' : 'not initialized',
        fileUpload: multer ? 'available' : 'disabled (multer not installed)'
      }
    },
    instructions: null
  };

  // Test database connection
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      diagnostics.checks.database.status = 'misconfigured';
      diagnostics.checks.database.error = 'Missing Supabase credentials';
      diagnostics.status = 'error';
    } else {
      // Try to list tables
      const { data: tables, error: tablesError } = await supabase
        .from('documents')
        .select('id')
        .limit(1);
      
      if (tablesError) {
        diagnostics.checks.database.status = 'error';
        diagnostics.checks.database.error = tablesError.message;
        diagnostics.status = 'error';
      } else {
        diagnostics.checks.database.status = 'connected';
        
        // Try to get document count
        const { count } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true });
        
        diagnostics.checks.database.documentCount = count || 0;
        diagnostics.status = 'operational';
      }
    }
  } catch (error) {
    diagnostics.checks.database.status = 'error';
    diagnostics.checks.database.error = error.message;
    diagnostics.status = 'error';
  }

  // Add instructions based on status
  if (diagnostics.status === 'error') {
    const missingEnvVars = Object.entries(diagnostics.checks.envVars)
      .filter(([key, value]) => value === 'missing' && key !== 'ANTHROPIC_API_KEY')
      .map(([key]) => key);
    
    if (missingEnvVars.length > 0) {
      diagnostics.instructions = {
        error: 'Missing required environment variables',
        steps: [
          '1. Create a .env file in the project root',
          '2. Copy contents from .env.example',
          `3. Add values for: ${missingEnvVars.join(', ')}`,
          '4. Restart the server'
        ],
        command: 'npm run check:env'
      };
    } else if (diagnostics.checks.database.status === 'error') {
      diagnostics.instructions = {
        error: 'Database connection failed',
        steps: [
          '1. Verify your Supabase project is active',
          '2. Check that the service role key is correct',
          '3. Ensure the documents table exists',
          '4. Check Supabase dashboard for any issues'
        ],
        debugInfo: diagnostics.checks.database.error
      };
    }
  }

  const statusCode = diagnostics.status === 'operational' ? 200 : 503;
  res.status(statusCode).json(diagnostics);
});

// Debug endpoint to check document content
app.get('/api/debug/client-documents/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const { data, error } = await supabase
      .from('documents')
      .select('id, title, content, document_type, created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    const stats = {
      clientId,
      totalDocuments: data?.length || 0,
      documentsWithContent: data?.filter(d => d.content)?.length || 0,
      contentSamples: data?.slice(0, 3).map(d => ({
        title: d.title,
        hasContent: !!d.content,
        contentLength: d.content?.length || 0,
        contentPreview: d.content?.substring(0, 100) || 'No content'
      }))
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Main chatbot endpoint
app.post('/mcp/chatbot.query', async (req, res) => {
  try {
    const { query, clientId } = req.body;
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required',
        response: 'Please provide a query to process.'
      });
    }

    console.log(`📝 Processing query: "${query}"${clientId ? ` for client: ${clientId}` : ''}`);

    // Check if chatbot service is initialized
    if (!chatbotService) {
      throw new Error('Chatbot service not initialized. Check database connection.');
    }

    // Process query with enhanced service
    const result = await chatbotService.processUserQuery(query, clientId);
    
    // Generate intelligent response
    const response = await chatbotService.generateIntelligentResponse(
      query,
      result.context,
      result.supabaseData,
      result.queryType
    );

    console.log(`✅ Query processed: ${result.queryType} (${Array.isArray(result.supabaseData) ? result.supabaseData.length : 1} results)`);

    // Extract document sources from the result
    let sources = [];
    if (Array.isArray(result.supabaseData) && result.supabaseData.length > 0) {
      sources = result.supabaseData.slice(0, 5).map(doc => ({
        id: doc.id,
        title: doc.title || doc.naam || 'Onbekend document',
        document_type: doc.document_type || doc.type || 'Algemeen',
        client_name: doc.client_name || doc.naam || doc['Naam client'] || 'Onbekende cliënt',
        created_at: doc.created_at,
        file_path: doc.file_path
      }));
    }

    res.json({
      success: true,
      response,
      context: result.context,
      queryType: result.queryType,
      dataCount: Array.isArray(result.supabaseData) ? result.supabaseData.length : 1,
      sources,
      rawData: result.supabaseData
    });
  } catch (error) {
    console.error('❌ Error processing query:', error);
    
    // Provide more detailed error response
    let errorMessage = 'Er is een fout opgetreden bij het verwerken van je vraag.';
    let statusCode = 500;
    
    if (error.message.includes('Database')) {
      errorMessage = 'Database connection error. Please check your Supabase configuration.';
    } else if (error.message.includes('not initialized')) {
      errorMessage = 'Service not properly initialized. Please restart the server.';
    }
    
    res.status(statusCode).json({
      success: false,
      error: error.message,
      message: errorMessage,
      response: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// ============= MORPHIK PROXY ENDPOINTS =============

// Middleware to check Morphik configuration
const checkMorphikConfig = (req, res, next) => {
  const morphikApiKey = process.env.MORPHIK_API_KEY;
  const morphikApiUrl = process.env.MORPHIK_API_URL || 'https://api.morphik.ai';
  
  if (!morphikApiKey) {
    return res.status(500).json({ 
      error: 'Morphik API not configured',
      message: 'MORPHIK_API_KEY is missing in environment variables',
      code: 'MORPHIK_NOT_CONFIGURED'
    });
  }
  
  req.morphikConfig = { apiKey: morphikApiKey, apiUrl: morphikApiUrl };
  next();
};

// Enhanced error handler for Morphik responses
const handleMorphikError = (error, res) => {
  console.error('❌ Morphik API error:', error);
  
  if (error.code === 'ECONNREFUSED') {
    return res.status(503).json({
      error: 'Cannot connect to Morphik service',
      message: 'De Morphik service is niet bereikbaar',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
  
  if (error.code === 'ETIMEDOUT') {
    return res.status(504).json({
      error: 'Morphik request timeout',
      message: 'De aanvraag duurde te lang',
      code: 'GATEWAY_TIMEOUT'
    });
  }
  
  res.status(500).json({
    error: 'Internal proxy error',
    message: 'Er is een fout opgetreden bij het doorsturen van de aanvraag',
    code: 'PROXY_ERROR',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

// Agent query endpoint with enhanced error handling
app.post('/api/morphik/agent', checkMorphikConfig, async (req, res) => {
  try {
    const { apiKey, apiUrl } = req.morphikConfig;
    
    console.log(`🤖 Proxying Morphik agent query`);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    try {
      const response = await fetch(`${apiUrl}/agent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Forwarded-For': req.ip || req.connection.remoteAddress
        },
        body: JSON.stringify(req.body),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      const data = await response.json();
      
      // Log successful requests in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Morphik agent response: ${response.status}`);
      }
      
      res.status(response.status).json(data);
    } catch (fetchError) {
      clearTimeout(timeout);
      if (fetchError.name === 'AbortError') {
        return res.status(504).json({
          error: 'Request timeout',
          message: 'De aanvraag duurde te lang',
          code: 'GATEWAY_TIMEOUT'
        });
      }
      throw fetchError;
    }
  } catch (error) {
    handleMorphikError(error, res);
  }
});

// Folder operations with proper error handling
app.get('/api/morphik/folders/:name', checkMorphikConfig, async (req, res) => {
  try {
    const { apiKey, apiUrl } = req.morphikConfig;
    const { name } = req.params;
    
    const response = await fetch(`${apiUrl}/folders/${encodeURIComponent(name)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 404) {
      return res.status(404).json({ 
        error: 'Folder not found',
        message: `Map '${name}' niet gevonden`,
        code: 'FOLDER_NOT_FOUND'
      });
    }
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    handleMorphikError(error, res);
  }
});

app.post('/api/morphik/folders', checkMorphikConfig, async (req, res) => {
  try {
    const { apiKey, apiUrl } = req.morphikConfig;
    
    const response = await fetch(`${apiUrl}/folders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    handleMorphikError(error, res);
  }
});

// Document retrieval with query validation
app.get('/api/morphik/retrieve/docs', checkMorphikConfig, async (req, res) => {
  try {
    const { apiKey, apiUrl } = req.morphikConfig;
    
    // Validate and sanitize query parameters
    const allowedParams = ['query', 'folder_name', 'limit', 'offset', 'filters'];
    const queryParams = new URLSearchParams();
    
    allowedParams.forEach(param => {
      if (req.query[param] !== undefined) {
        queryParams.append(param, req.query[param]);
      }
    });
    
    const response = await fetch(`${apiUrl}/retrieve/docs?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    handleMorphikError(error, res);
  }
});

// Document status check
app.get('/api/morphik/documents/:id/status', checkMorphikConfig, async (req, res) => {
  try {
    const { apiKey, apiUrl } = req.morphikConfig;
    const { id } = req.params;
    
    if (!id || id === 'undefined') {
      return res.status(400).json({
        error: 'Invalid document ID',
        message: 'Document ID is verplicht',
        code: 'INVALID_DOCUMENT_ID'
      });
    }
    
    const response = await fetch(`${apiUrl}/documents/${id}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    handleMorphikError(error, res);
  }
});

// Health check endpoint for Morphik integration
app.get('/api/morphik/health', checkMorphikConfig, async (req, res) => {
  try {
    const { apiKey, apiUrl } = req.morphikConfig;
    const startTime = Date.now();
    
    // Try a simple API call to check connectivity
    const response = await fetch(`${apiUrl}/folders`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(5000) // 5s timeout
    });
    
    const responseTime = Date.now() - startTime;
    
    res.json({
      status: response.ok ? 'healthy' : 'unhealthy',
      responseTime: `${responseTime}ms`,
      apiUrl: apiUrl,
      statusCode: response.status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      apiUrl: req.morphikConfig.apiUrl,
      timestamp: new Date().toISOString()
    });
  }
});

// ENHANCED File upload with multer (no base64 needed)
// Check if multer is available before adding middleware
if (upload) {
  app.post('/api/morphik/ingest/file', checkMorphikConfig, upload.single('file'), async (req, res) => {
    try {
      const { apiKey, apiUrl } = req.morphikConfig;
    
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        message: 'Geen bestand geüpload',
        code: 'FILE_REQUIRED'
      });
    }
    
    console.log(`📄 Uploading file to Morphik: ${req.file.originalname} (${req.file.size} bytes)`);
    
    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    
    // Add additional fields from body
    if (req.body.folder_name) {
      formData.append('folder_name', req.body.folder_name);
    }
    
    if (req.body.metadata) {
      formData.append('metadata', 
        typeof req.body.metadata === 'string' 
          ? req.body.metadata 
          : JSON.stringify(req.body.metadata)
      );
    }
    
    // Get form headers (includes boundary)
    const formHeaders = formData.getHeaders();
    
    const response = await fetch(`${apiUrl}/ingest/file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...formHeaders
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ File uploaded successfully: ${data.document_id}`);
    } else {
      console.error(`❌ File upload failed: ${response.status}`);
    }
    
    res.status(response.status).json(data);
  } catch (error) {
    handleMorphikError(error, res);
  }
});
} else {
  // Fallback when multer is not available
  app.post('/api/morphik/ingest/file', checkMorphikConfig, async (req, res) => {
    res.status(503).json({
      error: 'File upload not available',
      message: 'multer is not installed. Run: npm install multer form-data',
      code: 'UPLOAD_DISABLED'
    });
  });
}

// Batch file upload endpoint
if (upload) {
  app.post('/api/morphik/ingest/files', checkMorphikConfig, upload.array('files', 10), async (req, res) => {
  try {
    const { apiKey, apiUrl } = req.morphikConfig;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files provided',
        message: 'Geen bestanden geüpload',
        code: 'FILES_REQUIRED'
      });
    }
    
    console.log(`📄 Uploading ${req.files.length} files to Morphik`);
    
    const formData = new FormData();
    
    // Add all files
    req.files.forEach((file, index) => {
      formData.append('files', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype
      });
    });
    
    // Add additional fields
    if (req.body.folder_name) {
      formData.append('folder_name', req.body.folder_name);
    }
    
    const formHeaders = formData.getHeaders();
    
    const response = await fetch(`${apiUrl}/ingest/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...formHeaders
      },
      body: formData
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    handleMorphikError(error, res);
  }
});
} else {
  // Fallback when multer is not available for batch upload
  app.post('/api/morphik/ingest/files', checkMorphikConfig, async (req, res) => {
    res.status(503).json({
      error: 'File upload not available',
      message: 'multer is not installed. Run: npm install multer form-data',
      code: 'UPLOAD_DISABLED'
    });
  });
}

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 MedDoc AI Chatbot Server running on http://localhost:${PORT}`);
  console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Test database connection
  try {
    const { count } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });
    console.log(`📊 Connected to Supabase: ${count} documents found`);
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
  }
  
  // Check Claude API
  if (process.env.NEXT_PUBLIC_CLAUDE_API_KEY) {
    console.log('🤖 Claude API: Configured');
  } else {
    console.log('⚠️  Claude API: Not configured (using fallback responses)');
  }
  
  // Check Morphik configuration
  if (process.env.MORPHIK_API_KEY) {
    console.log('🔗 Morphik API: Configured');
    if (!multer) {
      console.log('⚠️  File upload: Disabled (npm install multer form-data)');
    }
  } else {
    console.log('⚠️  Morphik API: Not configured');
  }
  
  console.log('\n🎯 Ready to chat! Try these endpoints:');
  console.log(`   GET  http://localhost:${PORT}/ - Server status`);
  console.log(`   GET  http://localhost:${PORT}/health - Health check`);
  console.log(`   GET  http://localhost:${PORT}/api/diagnostic - Diagnostic info`);
  console.log(`   POST http://localhost:${PORT}/mcp/chatbot.query - Chatbot queries`);
});