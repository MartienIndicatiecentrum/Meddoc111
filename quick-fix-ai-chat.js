// Quick fix to ensure AI Chat works properly

const fs = require('fs');
const path = require('path');

console.log('🔧 Quick Fix for AI Chat Integration\n');

// Check if dependencies are installed
const nodeModules = path.join(__dirname, 'node_modules');

if (!fs.existsSync(nodeModules)) {
  console.log('❌ Dependencies not installed!');
  console.log('Please run: npm install');
} else {
  console.log('✅ Dependencies installed');
}

// Check environment variables
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  const hasSupabaseUrl = envContent.includes('SUPABASE_URL=');
  const hasSupabaseKey = envContent.includes('SUPABASE_SERVICE_ROLE_KEY=');
  
  if (hasSupabaseUrl && hasSupabaseKey) {
    console.log('✅ Environment variables configured');
  } else {
    console.log('❌ Missing Supabase environment variables');
  }
} else {
  console.log('❌ .env file not found');
}

console.log('\n📋 To start the AI Chat properly:');
console.log('1. Run: npm install (if not done)');
console.log('2. Run: npm run dev');
console.log('   OR manually start:');
console.log('   - Terminal 1: node server.js');
console.log('   - Terminal 2: python advanced_rag_server.py');
console.log('   - Terminal 3: npm run dev:frontend');
console.log('\n3. Open http://localhost:3000/ai-chat');
console.log('4. Toggle between "Uploaded Docs" and "Database" modes');