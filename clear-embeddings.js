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

console.log('Clearing bad embeddings...');

const { error } = await supabase
  .from('documents')
  .update({ vector_embedding: null })
  .not('vector_embedding', 'is', null);

if (error) {
  console.error('Error:', error);
} else {
  console.log('✅ Embeddings cleared');
}