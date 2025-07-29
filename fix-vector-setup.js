import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [key, value] = line.split('=');
    envVars[key.trim()] = value.trim();
  }
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function fixVectorSetup() {
  console.log('🔧 Fixing vector setup for documents table...\n');

  // 1. Enable pgvector extension
  console.log('1. Enabling pgvector extension...');
  try {
    const { error: extError } = await supabase.rpc('enable_vector_extension', {});
    if (!extError) {
      console.log('✅ pgvector extension enabled');
    }
  } catch (e) {
    // Try raw SQL
    console.log('   Trying alternative approach...');
  }

  // 2. Check current column type
  console.log('\n2. Checking current vector_embedding column type...');
  const { data: colCheck } = await supabase
    .from('documents')
    .select('vector_embedding')
    .limit(1)
    .single();

  if (colCheck && typeof colCheck.vector_embedding === 'string') {
    console.log('⚠️  Column is currently TEXT type, needs to be converted to vector');

    // 3. Create temporary column
    console.log('\n3. Creating migration strategy...');
    console.log('   This requires manual database migration to convert TEXT to vector type.');
    console.log('   The current embeddings are stored as strings and need to be converted.');

    // Generate SQL migration script
    const migrationSQL = `
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
`;

    console.log('\n📝 Migration SQL generated:');
    console.log('━'.repeat(50));
    console.log(migrationSQL);
    console.log('━'.repeat(50));

    // Save migration file
    writeFileSync('fix-vector-column.sql', migrationSQL);
    console.log('\n✅ Migration saved to: fix-vector-column.sql');
    console.log('\n⚠️  IMPORTANT: This migration needs to be run directly in Supabase:');
    console.log('   1. Go to your Supabase dashboard');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Copy and run the SQL from fix-vector-column.sql');
    console.log('   4. After migration, run generate-embeddings.js again');
  }

  // 4. Test if we can create a simple function
  console.log('\n4. Testing function creation...');
  const testFunctionSQL = `
CREATE OR REPLACE FUNCTION test_vector_ready()
RETURNS boolean
LANGUAGE sql
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM pg_extension
    WHERE extname = 'vector'
  );
$$;
`;

  try {
    const { error: funcError } = await supabase.rpc('query', { sql: testFunctionSQL });
    if (!funcError) {
      console.log('✅ Function creation successful');
    }
  } catch (e) {
    console.log('❌ Cannot create functions via client');
  }

  console.log('\n🎯 Next steps:');
  console.log('1. Run the migration SQL in Supabase SQL Editor');
  console.log('2. Re-run generate-embeddings.js to create proper vector embeddings');
  console.log('3. Test the search functionality again');
}

fixVectorSetup();