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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function extractPDFContent(fileUrl) {
  try {
    const response = await fetch('http://localhost:5001/api/extract-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileUrl }),
    });

    if (!response.ok) {
      console.error('Failed to extract PDF:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('PDF extraction error:', error);
    return null;
  }
}

async function processDocuments() {
  console.log('📄 Extracting content from PDF documents...\n');

  // Get all documents without content
  const { data: documents, error } = await supabase
    .from('documents')
    .select('id, title, file_path, mime_type')
    .is('content', null)
    .not('file_path', 'is', null);

  if (error) {
    console.error('Error fetching documents:', error);
    return;
  }

  console.log(`Found ${documents.length} documents without content\n`);

  let processed = 0;
  let failed = 0;

  for (const doc of documents) {
    // Skip non-PDF files
    if (doc.mime_type !== 'application/pdf' && !doc.file_path.endsWith('.pdf')) {
      console.log(`⏭️  Skipping non-PDF: ${doc.title}`);
      continue;
    }

    console.log(`📑 Processing: ${doc.title}`);

    // Construct full URL if needed
    let fileUrl = doc.file_path;
    if (!fileUrl.startsWith('http')) {
      fileUrl = `${supabaseUrl}/storage/v1/object/public/${doc.file_path}`;
    }

    // Extract content
    const content = await extractPDFContent(fileUrl);

    if (content) {
      // Update document with content
      const { error: updateError } = await supabase
        .from('documents')
        .update({ content })
        .eq('id', doc.id);

      if (updateError) {
        console.error(`   ❌ Failed to update: ${updateError.message}`);
        failed++;
      } else {
        console.log(`   ✅ Content extracted (${content.length} characters)`);
        processed++;
      }
    } else {
      console.log(`   ❌ Failed to extract content`);
      failed++;
    }

    // Add a small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Successfully processed: ${processed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped (non-PDF): ${documents.length - processed - failed}`);

  if (processed > 0) {
    console.log('\n💡 Next step: Generate embeddings for the extracted content');
    console.log('   Run: node generate-embeddings.js');
  }
}

processDocuments().catch(console.error);