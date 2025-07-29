import { supabase } from '@/integrations/supabase/client';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || 'your-openai-api-key';

export interface DocumentEmbeddingResult {
  success: boolean;
  documentId?: string;
  error?: string;
}

export class DocumentEmbeddingService {
  /**
   * Generate embeddings for document content
   */
  async generateEmbedding(text: string): Promise<number[] | null> {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: text,
          model: 'text-embedding-ada-002',
        }),
      });

      if (!response.ok) {
        console.error('OpenAI API error:', response.statusText);
        return null;
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      return null;
    }
  }

  /**
   * Process a document: extract content and generate embeddings
   */
  async processDocument(documentId: string): Promise<DocumentEmbeddingResult> {
    try {
      // Get document from database
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (fetchError || !document) {
        return { success: false, error: 'Document not found' };
      }

      // Check if content exists
      if (!document.content) {
        // Try to extract content from file if it's a PDF
        if (document.mime_type === 'application/pdf' && document.file_path) {
          const content = await this.extractPDFContent(document.file_path);
          if (!content) {
            return { success: false, error: 'Failed to extract PDF content' };
          }

          // Update document with content
          const { error: updateError } = await supabase
            .from('documents')
            .update({ content })
            .eq('id', documentId);

          if (updateError) {
            return { success: false, error: 'Failed to update document content' };
          }

          document.content = content;
        } else {
          return { success: false, error: 'No content available for document' };
        }
      }

      // Generate embedding for the content
      const embedding = await this.generateEmbedding(document.content);
      if (!embedding) {
        return { success: false, error: 'Failed to generate embedding' };
      }

      // Update document with embedding
      const { error: updateError } = await supabase
        .from('documents')
        .update({ vector_embedding: embedding })
        .eq('id', documentId);

      if (updateError) {
        console.error('Failed to update embedding:', updateError);
        return { success: false, error: 'Failed to save embedding' };
      }

      // Update processing status
      await this.updateProcessingStatus(documentId, 'completed');

      return { success: true, documentId };
    } catch (error) {
      console.error('Document processing error:', error);
      await this.updateProcessingStatus(documentId, 'failed', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Extract content from PDF file
   */
  async extractPDFContent(filePath: string): Promise<string | null> {
    try {
      // Construct the full URL for the PDF
      const fileUrl = filePath.startsWith('http')
        ? filePath
        : `${supabase.storage.from('documents').getPublicUrl(filePath).data.publicUrl}`;

      // Use a PDF extraction service or API
      // For now, we'll return a placeholder
      // In production, you'd use a service like pdf.js or a backend API
      console.log('PDF extraction needed for:', fileUrl);

      // Call your backend PDF extraction endpoint
      const response = await fetch('http://localhost:5000/api/extract-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl }),
      });

      if (!response.ok) {
        return null;
      }

      const { content } = await response.json();
      return content;
    } catch (error) {
      console.error('PDF extraction error:', error);
      return null;
    }
  }

  /**
   * Update document processing status
   */
  async updateProcessingStatus(
    documentId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('document_processing_status')
        .upsert({
          document_id: documentId,
          status,
          error_message: errorMessage,
          processed_at: status === 'completed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'document_id'
        });

      if (error) {
        console.error('Failed to update processing status:', error);
      }
    } catch (error) {
      console.error('Processing status update error:', error);
    }
  }

  /**
   * Process all documents without embeddings
   */
  async processUnprocessedDocuments(): Promise<void> {
    try {
      // Find documents without embeddings
      const { data: documents, error } = await supabase
        .from('documents')
        .select('id')
        .is('vector_embedding', null)
        .not('content', 'is', null)
        .is('deleted_at', null);

      if (error || !documents) {
        console.error('Failed to fetch unprocessed documents:', error);
        return;
      }

      console.log(`Found ${documents.length} documents to process`);

      // Process each document
      for (const doc of documents) {
        await this.updateProcessingStatus(doc.id, 'processing');
        const result = await this.processDocument(doc.id);
        console.log(`Processed document ${doc.id}:`, result);
      }
    } catch (error) {
      console.error('Batch processing error:', error);
    }
  }

  /**
   * Search documents using vector similarity
   */
  async searchDocuments(
    query: string,
    options: {
      limit?: number;
      threshold?: number;
      clientId?: string;
    } = {}
  ): Promise<any[]> {
    const { limit = 5, threshold = 0.7, clientId } = options;

    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);
      if (!queryEmbedding) {
        console.error('Failed to generate query embedding');
        return [];
      }

      // Search for similar documents
      const { data, error } = await supabase.rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit,
        client_id_filter: clientId || null
      });

      if (error) {
        console.error('Document search error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const documentEmbeddingService = new DocumentEmbeddingService();