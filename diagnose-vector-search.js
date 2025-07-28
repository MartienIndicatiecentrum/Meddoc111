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

console.log('🔍 Diagnosing Vector Search Issues\n');

// 1. Check if embeddings are stored correctly
console.log('1. Checking embedding storage format...\n');
const { data: sampleDoc, error: e1 } = await supabase
  .from('documents')
  .select('id, title, vector_embedding')
  .not('vector_embedding', 'is', null)
  .limit(1)
  .single();

if (sampleDoc) {
  console.log(`Sample document: ${sampleDoc.title}`);
  console.log(`Embedding type: ${typeof sampleDoc.vector_embedding}`);
  console.log(`Raw embedding preview: ${JSON.stringify(sampleDoc.vector_embedding).substring(0, 100)}...`);
  
  // Check if it's a valid vector format
  if (typeof sampleDoc.vector_embedding === 'string') {
    console.log('\n⚠️  Embeddings are stored as strings!');
    console.log('   PostgreSQL expects vector type, not string.');
  }
}

// 2. Test raw SQL query
console.log('\n2. Testing raw SQL query...\n');
const { data: sqlTest, error: sqlError } = await supabase
  .rpc('match_documents', {
    query_embedding: new Array(1536).fill(0).map((_, i) => i === 0 ? 1 : 0),
    match_threshold: 0.0,
    match_count: 5
  });

if (sqlError) {
  console.error('SQL error:', sqlError);
} else {
  console.log(`Raw SQL returned ${sqlTest?.length || 0} results`);
}

// 3. Check vector column type
console.log('\n3. Checking vector column type...\n');
const { data: columnInfo, error: colError } = await supabase
  .rpc('get_column_info', {
    table_name: 'documents',
    column_name: 'vector_embedding'
  })
  .single();

if (colError) {
  // Try alternative approach
  const { data: tableInfo, error: tableError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, udt_name')
    .eq('table_name', 'documents')
    .eq('column_name', 'vector_embedding')
    .single();
    
  if (tableInfo) {
    console.log(`Column type: ${tableInfo.data_type}`);
    console.log(`UDT name: ${tableInfo.udt_name}`);
  }
}

// 4. Check if pgvector extension is properly installed
console.log('\n4. Checking pgvector extension...\n');
const { data: extensions, error: extError } = await supabase
  .from('pg_extension')
  .select('extname, extversion')
  .eq('extname', 'vector')
  .single();

if (extensions) {
  console.log(`✅ pgvector installed: version ${extensions.extversion}`);
} else {
  console.log('❌ pgvector extension not found!');
}

// 5. Try to manually cast and search
console.log('\n5. Testing manual vector cast...\n');
try {
  // Get a document with embedding
  const { data: testDoc } = await supabase
    .from('documents')
    .select('id, title, vector_embedding')
    .not('vector_embedding', 'is', null)
    .limit(1)
    .single();
    
  if (testDoc && testDoc.vector_embedding) {
    // Try to parse the embedding if it's a string
    let embedding;
    if (typeof testDoc.vector_embedding === 'string') {
      // Remove brackets and parse
      const cleaned = testDoc.vector_embedding.replace(/[\[\]]/g, '');
      embedding = cleaned.split(',').map(Number);
    } else {
      embedding = testDoc.vector_embedding;
    }
    
    console.log(`Testing with embedding from: ${testDoc.title}`);
    console.log(`Parsed embedding length: ${embedding.length}`);
    
    // Search with the same embedding (should find itself with high similarity)
    const { data: selfSearch, error: selfError } = await supabase
      .rpc('match_documents', {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: 5
      });
      
    if (selfError) {
      console.error('Self-search error:', selfError);
    } else {
      console.log(`Self-search returned ${selfSearch?.length || 0} results`);
      if (selfSearch && selfSearch.length > 0) {
        console.log(`Top match: ${selfSearch[0].title} (similarity: ${selfSearch[0].similarity})`);
      }
    }
  }
} catch (err) {
  console.error('Manual cast error:', err);
}

console.log('\n✅ Diagnosis complete');