// check-env.js - Environment Variable Validation Script
require('dotenv').config();

const requiredVars = {
  'SUPABASE_URL': {
    description: 'Your Supabase project URL',
    example: 'https://xxxxxxxxxxxxxxxxxxx.supabase.co'
  },
  'SUPABASE_SERVICE_ROLE_KEY': {
    description: 'Your Supabase service role key',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },
  'ANTHROPIC_API_KEY': {
    description: 'Your Claude API key (optional but recommended for AI responses)',
    example: 'sk-ant-api03-...',
    optional: true
  }
};

console.log('🔍 Checking environment variables...\n');

let hasErrors = false;
let hasWarnings = false;

// Check each required variable
for (const [key, config] of Object.entries(requiredVars)) {
  const value = process.env[key];
  
  if (!value) {
    if (config.optional) {
      console.log(`⚠️  Missing (optional): ${key}`);
      console.log(`   Description: ${config.description}`);
      console.log(`   Example: ${config.example}\n`);
      hasWarnings = true;
    } else {
      console.error(`❌ Missing (required): ${key}`);
      console.log(`   Description: ${config.description}`);
      console.log(`   Example: ${config.example}\n`);
      hasErrors = true;
    }
  } else {
    // Basic validation
    if (key === 'SUPABASE_URL' && !value.includes('supabase.co')) {
      console.log(`⚠️  Warning: ${key} doesn't look like a valid Supabase URL`);
      hasWarnings = true;
    } else if (key === 'SUPABASE_SERVICE_ROLE_KEY' && value.length < 50) {
      console.log(`⚠️  Warning: ${key} seems too short`);
      hasWarnings = true;
    } else {
      console.log(`✅ Found: ${key}`);
    }
  }
}

// Check for additional helpful variables
console.log('\n📋 Additional configuration:\n');

const additionalVars = {
  'PORT': { default: '8081', description: 'Backend server port' },
  'DEBUG': { default: 'false', description: 'Enable debug logging' },
  'RAG_PORT': { default: '5000', description: 'RAG server port' }
};

for (const [key, config] of Object.entries(additionalVars)) {
  const value = process.env[key];
  if (value) {
    console.log(`✅ ${key}: ${value}`);
  } else {
    console.log(`ℹ️  ${key}: Not set (default: ${config.default})`);
  }
}

// Summary
console.log('\n📊 Summary:\n');

if (hasErrors) {
  console.error('❌ Missing required environment variables!');
  console.log('\n📝 Please add the missing variables to your .env file:');
  console.log('\n   1. Create or edit the .env file in the project root');
  console.log('   2. Add the missing variables with your actual values');
  console.log('   3. Restart the server after adding the variables\n');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  Some optional variables are missing or may be incorrect.');
  console.log('   The application will work but some features may be limited.\n');
} else {
  console.log('✅ All environment variables are configured!\n');
}

// Test database connection if variables are present
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('🔗 Testing Supabase connection...');
  
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  supabase
    .from('documents')
    .select('count')
    .single()
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Database connection failed:', error.message);
      } else {
        console.log('✅ Database connection successful!');
      }
    })
    .catch((err) => {
      console.error('❌ Database connection error:', err.message);
    });
}