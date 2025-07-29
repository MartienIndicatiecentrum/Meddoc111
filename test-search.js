import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read environment variables
const envContent = readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [key, value] = line.split('=');
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;
const openAIKey = envVars.VITE_OPENAI_API_KEY || envVars.OPENAI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDocumentSearch(query) {
  console.log(`\n🔍 Testing search for: "${query}"\n`);

  // Generate embedding for the query
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: query,
      model: 'text-embedding-ada-002',
    }),
  });

  if (!response.ok) {
    console.error('Failed to generate query embedding');
    return;
  }

  const data = await response.json();
  const queryEmbedding = data.data[0].embedding;

  // Search for similar documents
  const { data: results, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_threshold: 0.5, // Lowered threshold
    match_count: 5
  });

  if (error) {
    console.error('Search error:', error);
    return;
  }

  if (!results || results.length === 0) {
    console.log('No matching documents found');
    return;
  }

  console.log(`Found ${results.length} matching documents:\n`);

  results.forEach((doc, i) => {
    console.log(`${i + 1}. ${doc.title}`);
    console.log(`   Relevance: ${(doc.similarity * 100).toFixed(1)}%`);
    console.log(`   Preview: ${doc.content.substring(0, 200).replace(/\n/g, ' ')}...`);
    console.log('');
  });
}

// Test with different queries
async function runTests() {
  console.log('🧪 Testing Document Search Functionality\n');

  const testQueries = [
    'zorgplan',
    'Arkojan Arakelyan',
    'medicatie',
    'diabetes',
    'indicatie',
    'verpleging'
  ];

  for (const query of testQueries) {
    await testDocumentSearch(query);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
  }
}

runTests().catch(console.error);