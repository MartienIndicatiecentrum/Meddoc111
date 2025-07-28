import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [key, value] = line.split('=');
    envVars[key.trim()] = value.trim();
  }
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

console.log('Checking embeddings...\n');

// Check documents with embeddings
const { data: docsWithEmbeddings, error: e1 } = await supabase
  .from('documents')
  .select('id, title, vector_embedding')
  .not('vector_embedding', 'is', null);

console.log(`Documents with embeddings: ${docsWithEmbeddings?.length || 0}`);

if (docsWithEmbeddings && docsWithEmbeddings.length > 0) {
  console.log('\nFirst document embedding check:');
  const firstDoc = docsWithEmbeddings[0];
  const embedding = firstDoc.vector_embedding;
  console.log(`- Document: ${firstDoc.title}`);
  console.log(`- Embedding type: ${typeof embedding}`);
  console.log(`- Is array: ${Array.isArray(embedding)}`);
  console.log(`- Embedding length: ${Array.isArray(embedding) ? embedding.length : 'N/A'}`);
  console.log(`- First 5 values: ${Array.isArray(embedding) ? embedding.slice(0, 5).join(', ') : 'N/A'}`);
}

// Test a simple vector search with a dummy embedding
console.log('\nTesting match_documents function...');
const dummyEmbedding = new Array(1536).fill(0);
dummyEmbedding[0] = 1; // Make it slightly different from all zeros

const { data: testResults, error: testError } = await supabase.rpc('match_documents', {
  query_embedding: dummyEmbedding,
  match_threshold: 0.0, // Very low threshold
  match_count: 3
});

if (testError) {
  console.error('Test error:', testError);
} else {
  console.log(`Test returned ${testResults?.length || 0} results`);
}