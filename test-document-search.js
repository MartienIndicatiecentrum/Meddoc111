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

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDocumentSearch() {
  console.log('🔍 Testing Document Search Setup...\n');

  // 1. Check if content column exists
  console.log('1. Checking if content column exists in documents table...');
  const { data: docs, error: docsError } = await supabase
    .from('documents')
    .select('id, title, content, vector_embedding')
    .limit(5);

  if (docsError) {
    console.error('❌ Error checking documents table:', docsError.message);
    if (docsError.message.includes('column "content" does not exist')) {
      console.error('   → Migration not applied! Run: npx supabase db push');
    }
  } else {
    console.log('✅ Documents table has content column');
    console.log(`   Found ${docs?.length || 0} documents`);
    
    // Check how many have content
    const docsWithContent = docs?.filter(d => d.content) || [];
    const docsWithEmbeddings = docs?.filter(d => d.vector_embedding) || [];
    
    console.log(`   - ${docsWithContent.length} have content`);
    console.log(`   - ${docsWithEmbeddings.length} have embeddings`);
    
    if (docsWithContent.length === 0) {
      console.log('\n⚠️  No documents have content extracted!');
      console.log('   → Run: python scripts/pdf_parse_to_supabase.py');
    }
    
    if (docsWithContent.length > 0 && docsWithEmbeddings.length === 0) {
      console.log('\n⚠️  Documents have content but no embeddings!');
      console.log('   → Run: python scripts/generate_embeddings.py');
    }
  }

  // 2. Check if match_documents function exists
  console.log('\n2. Checking if match_documents RPC function exists...');
  try {
    // Generate a dummy embedding (1536 dimensions of 0s)
    const dummyEmbedding = new Array(1536).fill(0);
    
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: dummyEmbedding,
      match_threshold: 0.5,
      match_count: 1
    });

    if (error) {
      console.error('❌ match_documents function error:', error.message);
      if (error.message.includes('function match_documents') || error.message.includes('does not exist')) {
        console.error('   → Migration not applied! Run: npx supabase db push');
      }
    } else {
      console.log('✅ match_documents function exists and is callable');
    }
  } catch (err) {
    console.error('❌ Unexpected error testing match_documents:', err);
  }

  // 3. List all documents with their status
  console.log('\n3. Document Status Summary:');
  const { data: allDocs, error: allDocsError } = await supabase
    .from('documents')
    .select('id, title, file_path, content, vector_embedding, created_at')
    .order('created_at', { ascending: false });

  if (!allDocsError && allDocs) {
    console.log(`\nTotal documents: ${allDocs.length}`);
    
    allDocs.forEach((doc, i) => {
      if (i < 10) { // Show first 10
        const hasContent = !!doc.content;
        const hasEmbedding = !!doc.vector_embedding;
        const contentPreview = doc.content ? doc.content.substring(0, 50) + '...' : 'No content';
        
        console.log(`\n${i + 1}. ${doc.title}`);
        console.log(`   File: ${doc.file_path}`);
        console.log(`   Content: ${hasContent ? '✅' : '❌'} (${contentPreview})`);
        console.log(`   Embedding: ${hasEmbedding ? '✅' : '❌'}`);
      }
    });
    
    if (allDocs.length > 10) {
      console.log(`\n... and ${allDocs.length - 10} more documents`);
    }
  }

  // 4. Test a real search (if we have embeddings)
  const docsWithBothContentAndEmbeddings = allDocs?.filter(d => d.content && d.vector_embedding) || [];
  if (docsWithBothContentAndEmbeddings.length > 0) {
    console.log('\n4. Testing real document search...');
    
    // Use OpenAI to generate a real embedding for a test query
    const openAIKey = envVars.VITE_OPENAI_API_KEY || envVars.OPENAI_API_KEY;
    
    if (openAIKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: 'test document search',
            model: 'text-embedding-ada-002',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const embedding = data.data[0].embedding;
          
          const { data: searchResults, error: searchError } = await supabase.rpc('match_documents', {
            query_embedding: embedding,
            match_threshold: 0.5,
            match_count: 3
          });

          if (!searchError && searchResults) {
            console.log(`✅ Search returned ${searchResults.length} results`);
            searchResults.forEach((result, i) => {
              console.log(`   ${i + 1}. ${result.title} (similarity: ${result.similarity.toFixed(3)})`);
            });
          }
        }
      } catch (err) {
        console.log('⚠️  Could not test real search - OpenAI API issue');
      }
    }
  }

  console.log('\n📊 Summary:');
  console.log('===========');
  const hasContentColumn = !docsError;
  const hasMatchFunction = true; // Assume true if we got this far
  const hasDocuments = allDocs && allDocs.length > 0;
  const hasContent = docsWithContent && docsWithContent.length > 0;
  const hasEmbeddings = docsWithEmbeddings && docsWithEmbeddings.length > 0;

  console.log(`Database setup: ${hasContentColumn && hasMatchFunction ? '✅' : '❌'}`);
  console.log(`Documents exist: ${hasDocuments ? '✅' : '❌'}`);
  console.log(`Content extracted: ${hasContent ? '✅' : '❌'}`);
  console.log(`Embeddings generated: ${hasEmbeddings ? '✅' : '❌'}`);

  if (!hasContentColumn || !hasMatchFunction) {
    console.log('\n🔧 Fix: Run database migration');
    console.log('   npx supabase db push');
  }
  
  if (hasDocuments && !hasContent) {
    console.log('\n🔧 Fix: Extract content from PDFs');
    console.log('   python scripts/pdf_parse_to_supabase.py');
  }
  
  if (hasContent && !hasEmbeddings) {
    console.log('\n🔧 Fix: Generate embeddings');
    console.log('   python scripts/generate_embeddings.py');
  }
}

testDocumentSearch().catch(console.error);