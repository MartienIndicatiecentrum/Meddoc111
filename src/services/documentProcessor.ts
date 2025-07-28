// src/services/documentProcessor.ts
import { supabase } from '@/integrations/supabase/client';
import { documentEmbeddingService } from './documentEmbeddingService';
import { morphikService } from './morphikService';

export interface DocumentWithClient {
  id: number;
  title: string;
  date: string;
  created_at: string;
  type?: string;
  category?: string;
  client_id?: number;
  client_name?: string;
  client_avatar?: string;
}

export class DocumentProcessor {
  constructor() {
    console.log('DocumentProcessor initialized');
  }

  async processExistingDocument(documentId: string) {
    console.log('Processing document:', documentId);
    
    try {
      // Generate embeddings for the document
      const result = await documentEmbeddingService.processDocument(documentId);
      
      if (result.success) {
        console.log('Document processed successfully with embeddings');
      } else {
        console.error('Failed to process document:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Document processing error:', error);
      return { success: false, error: error.message };
    }
  }

  async processNewDocument(file: File, metadata: {
    title: string;
    clientId?: string;
    documentType?: string;
  }) {
    console.log('Processing new document:', metadata.title);
    
    try {
      // Upload file to Supabase Storage
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `public/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return { success: false, error: 'Failed to upload file' };
      }

      // Create document record in database
      const { data: document, error: dbError } = await supabase
        .from('documents')
        .insert({
          title: metadata.title,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          document_type: metadata.documentType || 'general',
          client_id: metadata.clientId,
          status: 'nieuw'
        })
        .select()
        .single();

      if (dbError || !document) {
        console.error('Database error:', dbError);
        // Clean up uploaded file
        await supabase.storage.from('documents').remove([filePath]);
        return { success: false, error: 'Failed to create document record' };
      }

      // Process document to extract content and generate embeddings
      // This happens asynchronously
      documentEmbeddingService.processDocument(document.id).then(result => {
        console.log('Embedding generation result:', result);
      });

      // Sync to Morphik if enabled
      if (process.env.VITE_ENABLE_MORPHIK_SYNC === 'true') {
        this.syncToMorphik(document, filePath);
      }

      return { success: true, documentId: document.id };
    } catch (error) {
      console.error('Document upload error:', error);
      return { success: false, error: error.message };
    }
  }

  private async syncToMorphik(document: any, filePath: string) {
    try {
      console.log('Starting Morphik sync for document:', document.id);
      
      // Get the public URL for the file
      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
      
      if (!publicUrlData?.publicUrl) {
        console.error('Failed to get public URL for Morphik sync');
        return;
      }

      // Sync to Morphik asynchronously
      morphikService.syncDocument(
        document.id,
        publicUrlData.publicUrl,
        document.client_id || '',
        {
          title: document.title,
          documentType: document.document_type,
          mimeType: document.mime_type,
          fileSize: document.file_size,
          uploadedAt: new Date().toISOString()
        }
      ).then(result => {
        if (result.success) {
          console.log('Document synced to Morphik successfully:', result.morphikId);
        } else {
          console.error('Failed to sync document to Morphik:', result.error);
        }
      }).catch(error => {
        console.error('Morphik sync error:', error);
      });
    } catch (error) {
      console.error('Error initiating Morphik sync:', error);
    }
  }
}

// Fetch recent documents with client information
export const getRecentDocumentsWithClients = async (limit: number = 10): Promise<DocumentWithClient[]> => {
  try {
    // First try to get documents with client info using left join
    const { data, error } = await supabase
      .from('documents')
      .select(`
        id,
        title,
        date,
        created_at,
        type,
        category,
        client_id,
        clients(
          id,
          naam,
          profile_photo
        )
      `)
      .not('type', 'eq', 'folder')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Error fetching documents with client join, falling back to basic query:', error);
      // Fallback to basic document query
      return await getRecentDocuments(limit);
    }

    return data?.map(doc => ({
      id: doc.id,
      title: doc.title,
      date: doc.date || new Date(doc.created_at).toLocaleDateString('nl-NL'),
      created_at: doc.created_at,
      type: doc.type,
      category: doc.category,
      client_id: doc.client_id,
      client_name: doc.clients?.naam,
      client_avatar: doc.clients?.profile_photo
    })) || [];
  } catch (error) {
    console.error('Error in getRecentDocumentsWithClients:', error);
    // Fallback to basic document query if join fails
    return await getRecentDocuments(limit);
  }
};

// Fallback function for documents without client info
export const getRecentDocuments = async (limit: number = 10): Promise<DocumentWithClient[]> => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('id, title, date, created_at, type, category, client_id')
      .not('type', 'eq', 'folder')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent documents:', error);
      return [];
    }

    return data?.map(doc => ({
      id: doc.id,
      title: doc.title,
      date: doc.date || new Date(doc.created_at).toLocaleDateString('nl-NL'),
      created_at: doc.created_at,
      type: doc.type,
      category: doc.category,
      client_id: doc.client_id
    })) || [];
  } catch (error) {
    console.error('Error in getRecentDocuments:', error);
    return [];
  }
};
