-- Add content field to documents table if it doesn't exist
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS content TEXT;

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create index on vector_embedding for faster similarity search
CREATE INDEX IF NOT EXISTS documents_vector_embedding_idx ON public.documents 
USING ivfflat (vector_embedding vector_cosine_ops)
WITH (lists = 100);

-- Create function to search documents by vector similarity
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  client_id_filter uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  file_path text,
  client_id uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.title,
    d.content,
    d.file_path,
    d.client_id,
    1 - (d.vector_embedding <=> query_embedding) as similarity
  FROM public.documents d
  WHERE 
    d.vector_embedding IS NOT NULL
    AND d.content IS NOT NULL
    AND d.deleted_at IS NULL
    AND (client_id_filter IS NULL OR d.client_id = client_id_filter)
    AND 1 - (d.vector_embedding <=> query_embedding) > match_threshold
  ORDER BY d.vector_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create function to get document chunks for better context
CREATE OR REPLACE FUNCTION get_document_chunks (
  document_id uuid,
  chunk_size int DEFAULT 1000,
  chunk_overlap int DEFAULT 200
)
RETURNS TABLE (
  chunk_text text,
  chunk_index int
)
LANGUAGE plpgsql
AS $$
DECLARE
  doc_content text;
  content_length int;
  current_pos int := 1;
  chunk_idx int := 0;
BEGIN
  -- Get document content
  SELECT content INTO doc_content
  FROM public.documents
  WHERE id = document_id AND deleted_at IS NULL;
  
  IF doc_content IS NULL THEN
    RETURN;
  END IF;
  
  content_length := length(doc_content);
  
  -- Split content into chunks
  WHILE current_pos <= content_length LOOP
    chunk_idx := chunk_idx + 1;
    
    RETURN QUERY
    SELECT 
      substring(doc_content FROM current_pos FOR chunk_size) as chunk_text,
      chunk_idx as chunk_index;
    
    -- Move to next chunk with overlap
    current_pos := current_pos + chunk_size - chunk_overlap;
  END LOOP;
END;
$$;

-- Add client_id column to documents table if it doesn't exist
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id);

-- Create index on client_id for faster filtering
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON public.documents(client_id);

-- Create a table to store document processing status
CREATE TABLE IF NOT EXISTS public.document_processing_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for document processing status
CREATE INDEX IF NOT EXISTS idx_processing_status_document_id ON public.document_processing_status(document_id);
CREATE INDEX IF NOT EXISTS idx_processing_status_status ON public.document_processing_status(status);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.documents TO authenticated;
GRANT EXECUTE ON FUNCTION match_documents TO authenticated;
GRANT EXECUTE ON FUNCTION get_document_chunks TO authenticated;