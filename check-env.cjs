// Check environment variables
console.log('🔍 Checking environment variables...');

// Check if .env file exists and read it
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  console.log('✅ .env file found');
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  let supabaseUrl = null;
  let supabaseKey = null;
  
  lines.forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1];
    }
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=')[1];
    }
  });
  
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Not set');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Not set');
  
  if (supabaseKey && supabaseKey !== 'your-anon-key-here') {
    console.log('✅ API key looks correct');
  } else {
    console.log('❌ API key is missing or placeholder');
    console.log('You need to update your .env file with the real API key');
  }
  
} else {
  console.log('❌ .env file not found');
  console.log('You need to create a .env file with your Supabase credentials');
}

// Also check process.env
console.log('\nProcess environment:');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Not set');
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'); 