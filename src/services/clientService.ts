/**
 * Client Service - Handles all client-related database operations
 * Provides a clean API for client, task, and log entry management
 */

import { supabase } from '@/integrations/supabase/client';
import type { 
  Client, 
  Task, 
  LogEntry, 
  LogEntryDocument, 
  ApiResponse,
  LogEntryFilters,
  PaginationParams 
} from '@/types/database';

/**
 * Custom error class for service operations
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

/**
 * Utility function to handle Supabase errors
 */
const handleSupabaseError = (error: any, operation: string): never => {
  console.error(`Error in ${operation}:`, error);
  throw new ServiceError(
    `Failed to ${operation}: ${error.message || 'Unknown error'}`,
    error.code || 'UNKNOWN_ERROR',
    error
  );
};

/**
 * Transform database client to frontend client format
 */
const transformClient = (client: any): Client => ({
  ...client,
  name: client.naam || client.name || 'Onbekende cliënt',
  phone: client.telefoon || client.phone || '',
});

/**
 * Transform database log entry to frontend format
 */
const transformLogEntry = (entry: any): LogEntry => ({
  ...entry,
  from_type: entry.from_type as any,
  type: entry.type as any,
  status: entry.status as any,
});

export const clientService = {
  /**
   * Get all clients with optional filtering and pagination
   */
  async getClients(params?: PaginationParams): Promise<Client[]> {
    try {
      let query = supabase
        .from('clients')
        .select('*')
        .order('naam');

      if (params) {
        query = query.range(params.offset, params.offset + params.limit - 1);
      }

      const { data, error } = await query;
      
      if (error) {
        handleSupabaseError(error, 'fetch clients');
      }
      
      return (data || []).map(transformClient);
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      handleSupabaseError(error, 'fetch clients');
    }
  },

  /**
   * Get a single client by ID
   */
  async getClient(id: string): Promise<Client | null> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        handleSupabaseError(error, 'fetch client');
      }
      
      return data ? transformClient(data) : null;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      handleSupabaseError(error, 'fetch client');
    }
  },

  /**
   * Get tasks for a specific client
   */
  async getClientTasks(clientId: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('taken')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      
      if (error) {
        handleSupabaseError(error, 'fetch client tasks');
      }
      
      return data || [];
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      handleSupabaseError(error, 'fetch client tasks');
    }
  },

  /**
   * Get all tasks with optional filtering
   */
  async getAllTasks(): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('taken')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        handleSupabaseError(error, 'fetch all tasks');
      }
      
      return data || [];
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      handleSupabaseError(error, 'fetch all tasks');
    }
  },

  /**
   * Get log entries for a specific client
   */
  async getClientLogEntries(clientId: string): Promise<LogEntry[]> {
    try {
      const { data, error } = await supabase
        .from('logboek')
        .select(`
          *,
          clients!logboek_client_id_fkey (
            id,
            naam
          )
        `)
        .eq('client_id', clientId)
        .order('date', { ascending: false });
      
      if (error) {
        handleSupabaseError(error, 'fetch client log entries');
      }
      
      return (data || []).map(entry => ({
        ...transformLogEntry(entry),
        client_name: entry.clients?.naam || 'Onbekende cliënt'
      }));
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      handleSupabaseError(error, 'fetch client log entries');
    }
  },

  /**
   * Get all log entries with optional filtering
   */
  async getAllLogEntries(filters?: LogEntryFilters): Promise<LogEntry[]> {
    try {
      let query = supabase
        .from('logboek')
        .select(`
          *,
          clients!logboek_client_id_fkey (
            id,
            naam
          )
        `)
        .order('date', { ascending: false });

      if (filters) {
        if (filters.from) {
          query = query.ilike('from_name', `%${filters.from}%`);
        }
        if (filters.type && filters.type !== 'all') {
          query = query.eq('type', filters.type);
        }
        if (filters.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }
        if (filters.description) {
          query = query.ilike('description', `%${filters.description}%`);
        }
      }

      const { data, error } = await query;
      
      if (error) {
        handleSupabaseError(error, 'fetch all log entries');
      }
      
      return (data || []).map(entry => ({
        ...transformLogEntry(entry),
        client_name: entry.clients?.naam || 'Onbekende cliënt'
      }));
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      handleSupabaseError(error, 'fetch all log entries');
    }
  },

  /**
   * Get recent log entries with limit
   */
  async getRecentLogEntries(limit: number = 5): Promise<LogEntry[]> {
    try {
      const { data, error } = await supabase
        .from('logboek')
        .select(`
          *,
          clients!logboek_client_id_fkey (
            id,
            naam
          )
        `)
        .order('date', { ascending: false })
        .limit(limit);
      
      if (error) {
        handleSupabaseError(error, 'fetch recent log entries');
      }
      
      return (data || []).map(entry => ({
        ...transformLogEntry(entry),
        client_name: entry.clients?.naam || 'Onbekende cliënt'
      }));
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      handleSupabaseError(error, 'fetch recent log entries');
    }
  },

  /**
   * Create a new task
   */
  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task | null> {
    try {
      const { data, error } = await supabase
        .from('taken')
        .insert(task)
        .select()
        .single();
      
      if (error) {
        handleSupabaseError(error, 'create task');
      }
      
      return data;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      handleSupabaseError(error, 'create task');
    }
  },

  /**
   * Create a new log entry
   */
  async createLogEntry(entry: Omit<LogEntry, 'id' | 'created_at' | 'updated_at'>): Promise<LogEntry | null> {
    try {
      console.log('Creating log entry with data:', entry);
      
      const { data, error } = await supabase
        .from('logboek')
        .insert(entry)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error creating log entry:', error);
        handleSupabaseError(error, 'create log entry');
      }
      
      console.log('Log entry created successfully:', data);
      return data ? transformLogEntry(data) : null;
    } catch (error) {
      console.error('Error in createLogEntry:', error);
      if (error instanceof ServiceError) throw error;
      handleSupabaseError(error, 'create log entry');
    }
  },

  /**
   * Update an existing task
   */
  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    try {
      const { data, error } = await supabase
        .from('taken')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        handleSupabaseError(error, 'update task');
      }
      
      return data;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      handleSupabaseError(error, 'update task');
    }
  },

  /**
   * Update an existing log entry
   */
  async updateLogEntry(id: string, updates: Partial<LogEntry>): Promise<LogEntry | null> {
    try {
      const { data, error } = await supabase
        .from('logboek')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        handleSupabaseError(error, 'update log entry');
      }
      
      return data ? transformLogEntry(data) : null;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      handleSupabaseError(error, 'update log entry');
    }
  },

  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('taken')
        .delete()
        .eq('id', id);
      
      if (error) {
        handleSupabaseError(error, 'delete task');
      }
      
      return true;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      handleSupabaseError(error, 'delete task');
    }
  },

  /**
   * Delete a log entry
   */
  async deleteLogEntry(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('logboek')
        .delete()
        .eq('id', id);
      
      if (error) {
        handleSupabaseError(error, 'delete log entry');
      }
      
      return true;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      handleSupabaseError(error, 'delete log entry');
    }
  },

  /**
   * Upload document to Supabase Storage and save to database
   */
  async uploadDocument(file: File, clientId: string, logEntryId?: string): Promise<LogEntryDocument | null> {
    try {
      console.log('Uploading document:', file.name, 'for client:', clientId, 'logEntryId:', logEntryId);
      
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `logboek-documents/${clientId}/${fileName}`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);
      
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        handleSupabaseError(uploadError, 'upload document to storage');
      }
      
      console.log('File uploaded to storage successfully');
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
      
      // Save document info to database
      const documentData = {
        log_entry_id: logEntryId,
        client_id: clientId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        public_url: urlData.publicUrl
      };
      
      console.log('Saving document to database:', documentData);
      
      const { data: dbData, error: dbError } = await supabase
        .from('log_entry_documents')
        .insert(documentData)
        .select()
        .single();
      
      if (dbError) {
        console.error('Database save error:', dbError);
        // Try to delete the uploaded file if database save fails
        await supabase.storage.from('documents').remove([filePath]);
        handleSupabaseError(dbError, 'save document to database');
      }
      
      console.log('Document saved to database successfully:', dbData);
      return dbData;
    } catch (error) {
      console.error('Error in uploadDocument:', error);
      if (error instanceof ServiceError) throw error;
      handleSupabaseError(error, 'upload document');
    }
  },

  /**
   * Get documents for a log entry
   */
  async getLogEntryDocuments(logEntryId: string): Promise<LogEntryDocument[]> {
    try {
      const { data, error } = await supabase
        .from('log_entry_documents')
        .select('*')
        .eq('log_entry_id', logEntryId)
        .order('created_at', { ascending: true });
      
      if (error) {
        handleSupabaseError(error, 'fetch documents');
      }
      
      return data || [];
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      handleSupabaseError(error, 'fetch documents');
    }
  },

  /**
   * Delete document from storage and database
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      // First get the document info
      const { data: document, error: fetchError } = await supabase
        .from('log_entry_documents')
        .select('*')
        .eq('id', documentId)
        .single();
      
      if (fetchError) {
        handleSupabaseError(fetchError, 'fetch document for deletion');
      }
      
      if (!document) {
        throw new ServiceError('Document not found', 'NOT_FOUND');
      }
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.file_path]);
      
      if (storageError) {
        console.error('Error deleting from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('log_entry_documents')
        .delete()
        .eq('id', documentId);
      
      if (dbError) {
        handleSupabaseError(dbError, 'delete document from database');
      }
      
      return true;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      handleSupabaseError(error, 'delete document');
    }
  },

  /**
   * Get document count for a log entry
   */
  async getLogEntryDocumentCount(logEntryId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('log_entry_documents')
        .select('*', { count: 'exact', head: true })
        .eq('log_entry_id', logEntryId);
      
      if (error) {
        handleSupabaseError(error, 'count documents');
      }
      
      return count || 0;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      handleSupabaseError(error, 'count documents');
    }
  },

  /**
   * Get document URL from Supabase Storage
   */
  async getDocumentUrl(filePath: string): Promise<string | null> {
    try {
      const { data } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error getting document URL:', error);
      return null;
    }
  }
};