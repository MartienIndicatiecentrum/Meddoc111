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

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

console.log('📊 Checking document content status...\n');

const { data: docsWithContent, error: e1 } = await supabase
  .from('documents')
  .select('id, title, content')
  .not('content', 'is', null);

const { data: docsWithEmbeddings, error: e2 } = await supabase
  .from('documents')
  .select('id')
  .not('vector_embedding', 'is', null);

const { count: totalDocs } = await supabase
  .from('documents')
  .select('*', { count: 'exact', head: true });

console.log(`Total documents: ${totalDocs}`);
console.log(`Documents with content: ${docsWithContent?.length || 0}`);
console.log(`Documents with embeddings: ${docsWithEmbeddings?.length || 0}`);

console.log('\nSample documents with content:');
docsWithContent?.slice(0, 5).forEach((doc, i) => {
  const preview = doc.content.substring(0, 100).replace(/\n/g, ' ');
  console.log(`${i + 1}. ${doc.title}: "${preview}..."`);
});