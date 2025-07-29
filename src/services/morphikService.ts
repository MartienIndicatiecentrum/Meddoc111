import { supabase } from '@/integrations/supabase/client';

interface MorphikSyncResult {
  success: boolean;
  morphikId?: string;
  error?: string;
}

interface MorphikQueryResult {
  response: string;
  chatId?: string;
  sources?: any[];
}

interface MorphikError {
  type: 'network' | 'auth' | 'api' | 'timeout' | 'config' | 'cors';
  message: string;
  details?: string;
  troubleshooting?: string;
  statusCode?: number;
}

interface MorphikServiceStatus {
  available: boolean;
  error?: MorphikError;
  details?: {
    baseUrlAccessible?: boolean;
    authWorking?: boolean;
    endpointsReachable?: boolean;
    responseTime?: number;
  };
}

export class MorphikService {
  private static instance: MorphikService;

  private constructor() {}

  static getInstance(): MorphikService {
    if (!MorphikService.instance) {
      MorphikService.instance = new MorphikService();
    }
    return MorphikService.instance;
  }

  /**
   * Ensure a folder exists for the client in Morphik
   */
  async ensureClientFolder(clientId: string, clientName: string): Promise<string> {
    const folderName = this.generateFolderName(clientId, clientName);

    try {
      // Check if folder exists
      const folderInfo = await this.invokeMorphikTool('morphik_get_folder_info', {
        name: folderName
      });

      if (!folderInfo.success) {
        // Create folder if it doesn't exist
        await this.invokeMorphikTool('morphik_create_folder', {
          name: folderName
        });
      }

      return folderName;
    } catch (error) {
      console.error('Error ensuring client folder:', error);
      throw error;
    }
  }

  /**
   * Sync a document to Morphik
   */
  async syncDocument(
    documentId: string,
    filePath: string,
    clientId: string,
    metadata?: Record<string, any>
  ): Promise<MorphikSyncResult> {
    try {
      // Get client info for folder organization
      const { data: client } = await supabase
        .from('clients')
        .select('naam')
        .eq('id', clientId)
        .single();

      if (!client) {
        throw new Error('Client not found');
      }

      // Ensure client folder exists
      const folderName = await this.ensureClientFolder(clientId, client.naam);

      // Download file from Supabase storage
      const fileContent = await this.downloadFromSupabase(filePath);
      if (!fileContent) {
        throw new Error('Failed to download file from Supabase');
      }

      // Extract filename from path
      const filename = filePath.split('/').pop() || 'document.pdf';

      // Upload to Morphik
      const uploadResult = await this.invokeMorphikTool('morphik_upload_file', {
        file: fileContent,
        filename: filename,
        folder: folderName,
        metadata: {
          ...metadata,
          documentId,
          clientId,
          clientName: client.naam,
          sourceSystem: 'meddoc-ai-flow',
          uploadedAt: new Date().toISOString()
        }
      });

      if (uploadResult.success) {
        // Update document record with Morphik ID
        await supabase
          .from('documents')
          .update({
            morphik_id: uploadResult.documentId,
            morphik_sync_status: 'synced',
            morphik_synced_at: new Date().toISOString()
          })
          .eq('id', documentId);

        return {
          success: true,
          morphikId: uploadResult.documentId
        };
      } else {
        await this.updateSyncStatus(documentId, 'failed', uploadResult.error);
        return {
          success: false,
          error: uploadResult.error
        };
      }
    } catch (error) {
      console.error('Error syncing document to Morphik:', error);
      await this.updateSyncStatus(documentId, 'failed', error?.message);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Enhanced service status check with detailed diagnostics
   */
  async checkServiceStatus(): Promise<MorphikServiceStatus> {
    const startTime = Date.now();
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8081';

    try {
      // First check if backend is accessible
      const backendResponse = await fetch(`${backendUrl}/health`, {
        signal: AbortSignal.timeout(5000)
      });

      if (!backendResponse.ok) {
        return {
          available: false,
          error: {
            type: 'network',
            message: 'Backend server niet bereikbaar',
            details: 'De backend server is niet beschikbaar',
            troubleshooting: 'Controleer of de server draait op ' + backendUrl
          }
        };
      }

      // Then check Morphik health through backend
      const morphikResponse = await fetch(`${backendUrl}/api/morphik/health`, {
        signal: AbortSignal.timeout(10000)
      });


      const responseTime = Date.now() - startTime;

      if (morphikResponse.ok) {
        const healthData = await morphikResponse.json();
        return {
          available: healthData.status === 'healthy',
          details: {
            baseUrlAccessible: true,
            authWorking: true,
            endpointsReachable: true,
            responseTime
          }
        };
      } else {
        const errorData = await morphikResponse.json();
        return {
          available: false,
          error: {
            type: errorData.code === 'MORPHIK_NOT_CONFIGURED' ? 'config' : 'api',
            message: errorData.message || 'Morphik service niet beschikbaar',
            details: errorData.error,
            troubleshooting: 'Controleer de Morphik configuratie op de server'
          },
          details: {
            baseUrlAccessible: true,
            authWorking: false,
            endpointsReachable: false,
            responseTime
          }
        };
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            available: false,
            error: {
              type: 'timeout',
              message: 'Verbinding time-out',
              details: 'De verbinding duurde te lang',
              troubleshooting: 'Controleer uw internetverbinding'
            },
            details: {
              baseUrlAccessible: false,
              responseTime
            }
          };
        }
      }

      return {
        available: false,
        error: {
          type: 'network',
          message: 'Netwerkverbinding mislukt',
          details: error instanceof Error ? error.message : 'Onbekende fout',
          troubleshooting: 'Controleer of de backend server draait'
        },
        details: {
          baseUrlAccessible: false,
          responseTime
        }
      };
    }
  }

  /**
   * Query Morphik AI with a question
   */
  async queryMorphik(
    query: string,
    clientId?: string,
    chatId?: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<MorphikQueryResult> {
    try {
      let folder: string | undefined;

      if (clientId) {
        // Get client info for folder name
        const { data: client } = await supabase
          .from('clients')
          .select('naam')
          .eq('id', clientId)
          .single();

        if (client) {
          folder = this.generateFolderName(clientId, client.naam);
        }
      }

      const result = await this.invokeMorphikTool('morphik_agent_query', {
        query,
        folder,
        chatId,
        ...options
      });

      if (result.success) {
        return {
          response: result.response,
          chatId: result.chatId,
          sources: result.sources
        };
      } else {
        throw new Error(result.error || 'Vraag verwerking mislukt');
      }
    } catch (error) {
      console.error('Error querying Morphik:', error);

      // Get detailed service status for better error diagnosis
      try {
        const serviceStatus = await this.checkServiceStatus();
        if (!serviceStatus.available && serviceStatus.error) {
          const morphikError = serviceStatus.error;
          const message = `${morphikError.message}. ${morphikError.troubleshooting || ''}`;
          throw new Error(message);
        }
      } catch (statusError) {
        console.error('Could not check service status:', statusError);
      }

      // Fallback to enhanced error categorization
      let userMessage = 'Er is een fout opgetreden bij het verwerken van uw vraag.';

      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();

        if (errorMsg.includes('failed to fetch') || errorMsg.includes('network')) {
          userMessage = 'Netwerkverbinding mislukt. Controleer uw internetverbinding en probeer het opnieuw.';
        } else if (errorMsg.includes('401') || errorMsg.includes('unauthorized') || errorMsg.includes('auth')) {
          userMessage = 'Morphik AI authenticatie mislukt. Controleer uw API-sleutel instellingen.';
        } else if (errorMsg.includes('403') || errorMsg.includes('forbidden')) {
          userMessage = 'Toegang geweigerd. Uw API-sleutel heeft onvoldoende rechten.';
        } else if (errorMsg.includes('404') || errorMsg.includes('not found')) {
          userMessage = 'Morphik AI endpoint niet gevonden. Controleer de API URL configuratie.';
        } else if (errorMsg.includes('429') || errorMsg.includes('rate limit')) {
          userMessage = 'Te veel verzoeken. Wacht een moment en probeer het opnieuw.';
        } else if (errorMsg.includes('500') || errorMsg.includes('502') || errorMsg.includes('503')) {
          userMessage = 'Morphik AI server fout. De service is tijdelijk niet beschikbaar.';
        } else if (errorMsg.includes('timeout') || errorMsg.includes('abort')) {
          userMessage = 'Verbinding time-out. De aanvraag duurde te lang.';
        } else if (errorMsg.includes('cors')) {
          userMessage = 'CORS configuratie probleem. Contacteer uw systeembeheerder.';
        }
      }

      throw new Error(userMessage);
    }
  }

  /**
   * Check sync status of a document
   */
  async checkSyncStatus(documentId: string): Promise<string> {
    try {
      const { data: document } = await supabase
        .from('documents')
        .select('morphik_id')
        .eq('id', documentId)
        .single();

      if (!document?.morphik_id) {
        return 'not_synced';
      }

      const result = await this.invokeMorphikTool('morphik_sync_status', {
        documentId: document.morphik_id
      });

      return result.success ? result.status : 'unknown';
    } catch (error) {
      console.error('Error checking sync status:', error);
      return 'error';
    }
  }

  /**
   * Retrieve documents from Morphik
   */
  async retrieveDocuments(
    clientId: string,
    query?: string,
    options?: {
      limit?: number;
      includeContent?: boolean;
    }
  ) {
    try {
      const { data: client } = await supabase
        .from('clients')
        .select('naam')
        .eq('id', clientId)
        .single();

      if (!client) {
        throw new Error('Client not found');
      }

      const folder = this.generateFolderName(clientId, client.naam);

      const result = await this.invokeMorphikTool('morphik_retrieve_documents', {
        query,
        folder,
        ...options
      });

      return result.success ? result.documents : [];
    } catch (error) {
      console.error('Error retrieving documents:', error);
      return [];
    }
  }

  // Private helper methods

  private generateFolderName(clientId: string, clientName: string): string {
    const sanitizedName = clientName
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);

    return `client-${clientId}-${sanitizedName}`;
  }

  private async invokeMorphikTool(toolName: string, args: any): Promise<any> {
    // Check if we're in Claude Desktop with MCP support
    if (typeof window !== 'undefined' && (window as any).electronAPI?.invokeMCPTool) {
      return await (window as any).electronAPI.invokeMCPTool('morphik', toolName, args);
    }

    // Direct API implementation for web applications
    try {
      return await this.callMorphikAPI(toolName, args);
    } catch (error) {
      console.error(`Morphik API call failed for ${toolName}:`, error);
      throw error;
    }
  }

  private async callMorphikAPI(toolName: string, args: any): Promise<any> {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8081';

    try {
      switch (toolName) {
        case 'morphik_agent_query':
          return await this.agentQuery(args, backendUrl);
        case 'morphik_get_folder_info':
          return await this.getFolderInfo(args, backendUrl);
        case 'morphik_create_folder':
          return await this.createFolder(args, backendUrl);
        case 'morphik_upload_file':
          return await this.uploadFile(args, backendUrl);
        case 'morphik_sync_status':
          return await this.getSyncStatus(args, backendUrl);
        case 'morphik_retrieve_documents':
          return await this.retrieveDocumentsAPI(args, backendUrl);
        default:
          throw new Error(`Onbekende Morphik functie: ${toolName}`);
      }
    } catch (error) {
      // Enhanced error handling for backend connection issues
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Kan geen verbinding maken met de backend server. Controleer of de server draait.');
      }
      // Convert backend error responses to user-friendly messages
      if (error instanceof Error) {
        if (error.message.includes('MORPHIK_NOT_CONFIGURED')) {
          throw new Error('Morphik service is niet geconfigureerd op de server. Contacteer uw systeembeheerder.');
        }
        if (error.message.includes('GATEWAY_TIMEOUT')) {
          throw new Error('De aanvraag duurde te lang. Probeer het opnieuw.');
        }
        if (error.message.includes('SERVICE_UNAVAILABLE')) {
          throw new Error('Morphik service is tijdelijk niet beschikbaar.');
        }
      }
      throw error;
    }
  }

  private async agentQuery(args: any, backendUrl: string): Promise<any> {
    const response = await fetch(`${backendUrl}/api/morphik/agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: args.query,
        folder_name: args.folder,
        chat_id: args.chatId,
        temperature: args.temperature || 0.7,
        max_tokens: args.maxTokens || 1000
      }),
      signal: AbortSignal.timeout(60000) // 60 second timeout
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMsg = errorData.message || `Morphik API error: ${response.status}`;

      // Enhanced error messages based on error codes
      if (errorData.code === 'MORPHIK_NOT_CONFIGURED') {
        throw new Error('Morphik service is niet geconfigureerd. Contacteer uw systeembeheerder.');
      } else if (errorData.code === 'GATEWAY_TIMEOUT') {
        throw new Error('De aanvraag duurde te lang. Probeer het opnieuw.');
      } else if (errorData.code === 'SERVICE_UNAVAILABLE') {
        throw new Error('Morphik service is tijdelijk niet beschikbaar.');
      }

      throw new Error(errorMsg);
    }

    const data = await response.json();
    return {
      success: true,
      response: data.response || data.text,
      chatId: data.chat_id,
      sources: data.sources || []
    };
  }

  private async getFolderInfo(args: any, backendUrl: string): Promise<any> {
    const response = await fetch(`${backendUrl}/api/morphik/folders/${encodeURIComponent(args.name)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(60000)
    });

    if (response.status === 404) {
      return { success: false, error: 'Folder not found' };
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Morphik API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, folder: data };
  }

  private async createFolder(args: any, backendUrl: string): Promise<any> {
    const response = await fetch(`${backendUrl}/api/morphik/folders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: args.name
      }),
      signal: AbortSignal.timeout(60000)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Morphik API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, folderId: data.id };
  }

  private async uploadFile(args: any, backendUrl: string): Promise<any> {
    // Create FormData for proper file upload
    const formData = new FormData();

    if (args.file && args.file instanceof Blob) {
      formData.append('file', args.file, args.filename || 'document.pdf');
    } else {
      throw new Error('File upload requires a Blob or File object');
    }

    if (args.folder) {
      formData.append('folder_name', args.folder);
    }

    if (args.metadata) {
      formData.append('metadata', JSON.stringify(args.metadata));
    }

    try {
      const response = await fetch(`${backendUrl}/api/morphik/ingest/file`, {
        method: 'POST',
        // Don't set Content-Type header - browser will set it with boundary
        body: formData,
        signal: AbortSignal.timeout(60000)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Upload failed: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, documentId: data.document_id };
    } catch (error) {
      console.error('File upload error:', error);
      if (error instanceof Error && error.message.includes('MORPHIK_NOT_CONFIGURED')) {
        throw new Error('Morphik service is niet geconfigureerd op de server');
      }
      throw error;
    }
  }

  private async getSyncStatus(args: any, backendUrl: string): Promise<any> {
    const response = await fetch(`${backendUrl}/api/morphik/documents/${args.documentId}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(60000)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Morphik API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, status: data.status };
  }

  private async retrieveDocumentsAPI(args: any, backendUrl: string): Promise<any> {
    const queryParams = new URLSearchParams();

    if (args.query) queryParams.append('query', args.query);
    if (args.folder) queryParams.append('folder_name', args.folder);
    if (args.limit) queryParams.append('limit', args.limit.toString());
    if (args.offset) queryParams.append('offset', args.offset.toString());
    if (args.filters) queryParams.append('filters', JSON.stringify(args.filters));

    const response = await fetch(`${backendUrl}/api/morphik/retrieve/docs?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(60000)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Morphik API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, documents: data.documents || data };
  }

  private async downloadFromSupabase(filePath: string): Promise<Blob | null> {
    try {
      // Extract bucket and path from the file URL
      const url = new URL(filePath);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.findIndex(part => part === 'storage') + 3;
      const bucket = pathParts[bucketIndex];
      const path = pathParts.slice(bucketIndex + 1).join('/');

      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);

      if (error) {
        console.error('Error downloading from Supabase:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error parsing file path:', error);
      return null;
    }
  }


  private async updateSyncStatus(
    documentId: string,
    status: string,
    error?: string
  ): Promise<void> {
    await supabase
      .from('documents')
      .update({
        morphik_sync_status: status,
        morphik_sync_error: error,
        morphik_synced_at: new Date().toISOString()
      })
      .eq('id', documentId);
  }
}

// Export singleton instance
export const morphikService = MorphikService.getInstance();