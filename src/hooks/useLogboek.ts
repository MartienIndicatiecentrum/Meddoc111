/**
 * Custom hook for managing logboek (log entries) state and operations
 * Provides centralized state management for log entries with proper error handling
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { clientService, ServiceError } from '@/services/clientService';
import type { 
  LogboekEntry, 
  LogEntryFilters, 
  NewEntryForm, 
  EditEntryForm,
  UploadedDocument,
  LoadingState 
} from '@/types/database';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseLogboekOptions {
  clientId?: string;
  initialFilters?: LogEntryFilters;
}

interface UseLogboekReturn {
  // State
  entries: LogboekEntry[];
  loading: LoadingState;
  error: string | null;
  
  // Filters
  filters: LogEntryFilters;
  setFilters: (filters: Partial<LogEntryFilters>) => void;
  
  // Operations
  loadEntries: () => Promise<void>;
  addEntry: (entry: NewEntryForm, documents?: UploadedDocument[]) => Promise<boolean>;
  updateEntry: (id: string, updates: EditEntryForm) => Promise<boolean>;
  deleteEntry: (id: string) => Promise<boolean>;
  
  // Document operations
  uploadDocument: (file: File, logEntryId?: string) => Promise<UploadedDocument | null>;
  deleteDocument: (documentId: string) => Promise<boolean>;
  
  // Utilities
  clearError: () => void;
  resetFilters: () => void;
}

export const useLogboek = (options: UseLogboekOptions = {}): UseLogboekReturn => {
  const { clientId, initialFilters = {} } = options;
  
  // State
  const [entries, setEntries] = useState<LogboekEntry[]>([]);
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<LogEntryFilters>(initialFilters);
  
  // Realtime subscription ref
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Set up real-time subscription for logboek changes
  useEffect(() => {
    if (!clientId) return;

    console.log('Setting up real-time subscription for client:', clientId);

    // Create channel for logboek changes
    const channel = supabase
      .channel(`logboek-changes-${clientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'logboek',
          filter: `client_id=eq.${clientId}`
        },
        (payload) => {
          console.log('Real-time logboek change received:', payload);
          
          const { eventType, new: newRecord, old: oldRecord } = payload;
          
          switch (eventType) {
            case 'INSERT':
              if (newRecord) {
                const newEntry: LogboekEntry = {
                  id: newRecord.id,
                  date: newRecord.date,
                  client_id: newRecord.client_id,
                  from: {
                    name: newRecord.from_name,
                    type: newRecord.from_type,
                    color: newRecord.from_color,
                  },
                  type: newRecord.type,
                  action: newRecord.action,
                  description: newRecord.description,
                  status: newRecord.status,
                  isUrgent: newRecord.is_urgent,
                  needsResponse: newRecord.needs_response,
                };
                
                setEntries(prev => {
                  // Check if entry already exists to avoid duplicates
                  const exists = prev.some(entry => entry.id === newEntry.id);
                  if (exists) return prev;
                  
                  // Add new entry at the beginning (most recent first)
                  return [newEntry, ...prev];
                });
              }
              break;
              
            case 'UPDATE':
              if (newRecord) {
                setEntries(prev => prev.map(entry => 
                  entry.id === newRecord.id 
                    ? {
                        ...entry,
                        from: {
                          name: newRecord.from_name,
                          type: newRecord.from_type,
                          color: newRecord.from_color,
                        },
                        type: newRecord.type,
                        action: newRecord.action,
                        description: newRecord.description,
                        status: newRecord.status,
                        isUrgent: newRecord.is_urgent,
                        needsResponse: newRecord.needs_response,
                      }
                    : entry
                ));
              }
              break;
              
            case 'DELETE':
              if (oldRecord) {
                console.log('Log entry deleted via real-time:', oldRecord.id);
                setEntries(prev => prev.filter(entry => entry.id !== oldRecord.id));
                
                // Show a user-friendly notification when an entry is deleted
                // This helps users understand why their document upload might fail
                if (entries.length > 0) {
                  console.warn('Een logboek bericht is verwijderd. Document uploads naar dit bericht zullen falen.');
                }
              }
              break;
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to logboek changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error with real-time subscription');
          setError('Real-time synchronisatie fout. Ververs de pagina om de laatste gegevens te zien.');
        }
      });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      console.log('Cleaning up real-time subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [clientId, entries.length]); // Include entries.length to update notifications

  // Clear error utility
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset filters utility
  const resetFilters = useCallback(() => {
    setFiltersState(initialFilters);
  }, [initialFilters]);

  // Set filters with validation
  const setFilters = useCallback((newFilters: Partial<LogEntryFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Load entries with error handling
  const loadEntries = useCallback(async () => {
    if (!clientId) {
      setError('Client ID is required');
      return;
    }

    setLoading('loading');
    setError(null);

    try {
      const data = await clientService.getClientLogEntries(clientId);
      
      // Transform data to LogboekEntry format
      const transformedEntries: LogboekEntry[] = data.map(entry => ({
        id: entry.id,
        date: entry.date,
        client_id: entry.client_id,
        from: {
          name: entry.from_name,
          type: entry.from_type,
          color: entry.from_color,
        },
        type: entry.type,
        action: entry.action,
        description: entry.description,
        status: entry.status,
        isUrgent: entry.is_urgent,
        needsResponse: entry.needs_response,
      }));

      setEntries(transformedEntries);
      setLoading('success');
    } catch (err) {
      const errorMessage = err instanceof ServiceError 
        ? err.message 
        : 'Failed to load log entries';
      setError(errorMessage);
      setLoading('error');
    }
  }, [clientId]);

  // Add new entry
  const addEntry = useCallback(async (
    entryData: NewEntryForm, 
    documents?: UploadedDocument[]
  ): Promise<boolean> => {
    if (!clientId) {
      setError('Client ID is required');
      return false;
    }

    setLoading('loading');
    setError(null);

    try {
      // Prepare entry data
      const finalType = entryData.type === 'Anders' && entryData.customType 
        ? entryData.customType 
        : entryData.type;

      let finalDescription = entryData.description || 'Geen beschrijving';
      if (documents && documents.length > 0) {
        const documentList = documents.map(doc => 
          `📎 ${doc.name} (${(doc.size / 1024 / 1024).toFixed(1)} MB)`
        ).join('\n');
        finalDescription += `\n\n📎 **BIJLAGEN:**\n${documentList}`;
      }

      const logEntryData = {
        client_id: clientId,
        date: new Date().toISOString(),
        from_name: entryData.fromName || getDefaultNameForType(entryData.fromType),
        from_type: entryData.fromType,
        from_color: getColorForType(entryData.fromType),
        type: finalType,
        action: entryData.action || `${finalType} toegevoegd`,
        description: finalDescription,
        status: (entryData.isUrgent ? 'Urgent' : entryData.needsResponse ? 'Reactie nodig' : 'Geen urgentie') as any,
        is_urgent: entryData.isUrgent,
        needs_response: entryData.needsResponse,
      };

      const newEntry = await clientService.createLogEntry(logEntryData);

      if (newEntry) {
        // Upload documents if provided
        if (documents && documents.length > 0) {
          const uploadPromises = documents.map(async (doc) => {
            if (doc.file) {
              return await clientService.uploadDocument(doc.file, clientId, newEntry.id);
            }
            return null;
          });
          
          await Promise.all(uploadPromises);
        }

        // Reload entries to get the latest data
        await loadEntries();
        setLoading('success');
        return true;
      } else {
        setError('Failed to create log entry');
        setLoading('error');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof ServiceError 
        ? err.message 
        : 'Failed to create log entry';
      setError(errorMessage);
      setLoading('error');
      return false;
    }
  }, [clientId, loadEntries]);

  // Update entry
  const updateEntry = useCallback(async (
    id: string, 
    updates: EditEntryForm
  ): Promise<boolean> => {
    setLoading('loading');
    setError(null);

    try {
      const updatedEntry = await clientService.updateLogEntry(id, {
        action: updates.action,
        description: updates.description,
        status: updates.status,
      });

      if (updatedEntry) {
        // Update local state
        setEntries(prev => prev.map(entry => 
          entry.id === id 
            ? {
                ...entry,
                action: updates.action,
                description: updates.description,
                status: updates.status,
              }
            : entry
        ));
        setLoading('success');
        return true;
      } else {
        setError('Failed to update log entry');
        setLoading('error');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof ServiceError 
        ? err.message 
        : 'Failed to update log entry';
      setError(errorMessage);
      setLoading('error');
      return false;
    }
  }, []);

  // Delete entry
  const deleteEntry = useCallback(async (id: string): Promise<boolean> => {
    setLoading('loading');
    setError(null);

    try {
      const success = await clientService.deleteLogEntry(id);
      
      if (success) {
        // Remove from local state
        setEntries(prev => prev.filter(entry => entry.id !== id));
        setLoading('success');
        return true;
      } else {
        setError('Failed to delete log entry');
        setLoading('error');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof ServiceError 
        ? err.message 
        : 'Failed to delete log entry';
      setError(errorMessage);
      setLoading('error');
      return false;
    }
  }, []);

  // Upload document
  const uploadDocument = useCallback(async (
    file: File, 
    logEntryId?: string
  ): Promise<UploadedDocument | null> => {
    if (!clientId) {
      setError('Client ID is required');
      return null;
    }

    try {
      const document = await clientService.uploadDocument(file, clientId, logEntryId);
      
      if (document) {
        return {
          id: document.id,
          name: document.file_name,
          type: document.file_type,
          size: document.file_size,
          url: document.public_url,
        };
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof ServiceError 
        ? err.message 
        : 'Failed to upload document';
      setError(errorMessage);
      return null;
    }
  }, [clientId]);

  // Delete document
  const deleteDocument = useCallback(async (documentId: string): Promise<boolean> => {
    try {
      return await clientService.deleteDocument(documentId);
    } catch (err) {
      const errorMessage = err instanceof ServiceError 
        ? err.message 
        : 'Failed to delete document';
      setError(errorMessage);
      return false;
    }
  }, []);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      if (filters.from && !entry.from.name.toLowerCase().includes(filters.from.toLowerCase())) {
        return false;
      }
      if (filters.type && filters.type !== 'all' && entry.type !== filters.type) {
        return false;
      }
      if (filters.status && filters.status !== 'all' && entry.status !== filters.status) {
        return false;
      }
      if (filters.description && !entry.description.toLowerCase().includes(filters.description.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [entries, filters]);

  return {
    // State
    entries: filteredEntries,
    loading,
    error,
    
    // Filters
    filters,
    setFilters,
    
    // Operations
    loadEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    
    // Document operations
    uploadDocument,
    deleteDocument,
    
    // Utilities
    clearError,
    resetFilters,
  };
};

// Utility functions
const getDefaultNameForType = (type: string): string => {
  const defaults: Record<string, string> = {
    employee: 'Medewerker',
    client: 'Cliënt',
    insurer: 'Verzekeraar',
    family: 'Familie',
    verzekeraar: 'Verzekeraar',
  };
  return defaults[type] || 'Onbekend';
};

const getColorForType = (type: string): string => {
  const colors: Record<string, string> = {
    employee: 'bg-blue-500',
    client: 'bg-green-500',
    insurer: 'bg-purple-500',
    family: 'bg-orange-500',
    verzekeraar: 'bg-purple-500',
  };
  return colors[type] || 'bg-gray-500';
}; 