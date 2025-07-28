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
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
const openAIKey = envVars.VITE_OPENAI_API_KEY || envVars.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseServiceKey || !openAIKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateEmbedding(text) {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text.substring(0, 8000), // Limit to 8000 chars
        model: 'text-embedding-ada-002',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return null;
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Embedding generation error:', error);
    return null;
  }
}

async function generateEmbeddings() {
  console.log('🚀 Generating embeddings for documents...\n');

  // Get documents with content but no embeddings
  const { data: documents, error } = await supabase
    .from('documents')
    .select('id, title, content')
    .not('content', 'is', null)
    .is('vector_embedding', null)
    .is('deleted_at', null);

  if (error) {
    console.error('Error fetching documents:', error);
    return;
  }

  console.log(`Found ${documents.length} documents to process\n`);

  let processed = 0;
  let failed = 0;

  for (const doc of documents) {
    console.log(`📄 Processing: ${doc.title}`);
    
    if (!doc.content || doc.content.trim().length < 10) {
      console.log(`   ⏭️  Skipping - content too short`);
      continue;
    }

    // Generate embedding
    const embedding = await generateEmbedding(doc.content);
    
    if (embedding) {
      // Update document with embedding
      // Convert array to PostgreSQL vector format
      const vectorString = `[${embedding.join(',')}]`;
      
      const { error: updateError } = await supabase
        .from('documents')
        .update({ vector_embedding: vectorString })
        .eq('id', doc.id);

      if (updateError) {
        console.error(`   ❌ Failed to save embedding: ${updateError.message}`);
        failed++;
      } else {
        console.log(`   ✅ Embedding generated and saved`);
        processed++;
      }
    } else {
      console.log(`   ❌ Failed to generate embedding`);
      failed++;
    }

    // Rate limiting - OpenAI has rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Successfully processed: ${processed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${documents.length - processed - failed}`);

  if (processed > 0) {
    console.log('\n🎉 Documents are now searchable!');
    console.log('   You can now ask questions about the uploaded documents.');
  }
}

generateEmbeddings().catch(console.error);