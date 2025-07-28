
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add new vector column
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS vector_embedding_new vector(1536);

-- Convert existing string embeddings to vector type
UPDATE public.documents 
SET vector_embedding_new = vector_embedding::vector
WHERE vector_embedding IS NOT NULL 
  AND vector_embedding != '';

-- Drop old column and rename new one
ALTER TABLE public.documents DROP COLUMN IF EXISTS vector_embedding;
ALTER TABLE public.documents RENAME COLUMN vector_embedding_new TO vector_embedding;

-- Recreate index
CREATE INDEX IF NOT EXISTS documents_vector_embedding_idx ON public.documents 
USING ivfflat (vector_embedding vector_cosine_ops)
WITH (lists = 100);

-- Verify the change
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'documents' 
  AND column_name = 'vector_embedding';
