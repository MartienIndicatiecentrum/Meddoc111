// Check Supabase configuration
console.log('🔍 Checking Supabase configuration...');

// Check environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Environment variables:');
console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Not set');
console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Not set');

if (!supabaseUrl || !supabaseKey) {
  console.log('\n❌ Supabase configuration is missing!');
  console.log('Please create a .env file with:');
  console.log('VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.log('VITE_SUPABASE_ANON_KEY=your-anon-key-here');
  console.log('\nYou can find these values in your Supabase project settings.');
  process.exit(1);
}

console.log('\n✅ Supabase configuration looks good!');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey.substring(0, 10) + '...');

// Test if we can create a Supabase client
try {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('\n✅ Supabase client created successfully');
} catch (error) {
  console.log('\n❌ Error creating Supabase client:', error.message);
  process.exit(1);
}