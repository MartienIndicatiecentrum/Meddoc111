// Quick debug voor logboek opslaan
console.log('🔍 Quick debug voor logboek opslaan...');

// Test direct met de applicatie configuratie
const { createClient } = require('@supabase/supabase-js');

// Gebruik dezelfde URL als de applicatie
const supabaseUrl = 'https://ltasjbgamoljvqoclgkf.supabase.co';

// Probeer de API key uit de environment
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl);
console.log('API Key:', supabaseKey ? '✅ Set' : '❌ Not set');

if (!supabaseKey) {
  console.log('❌ API key niet gevonden in environment');
  console.log('Controleer je .env bestand');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function quickTest() {
  try {
    console.log('\n1. Testing basic connection...');
    
    // Test 1: Check if we can connect
    const { data: testData, error: testError } = await supabase
      .from('clients')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection failed:', testError.message);
      console.error('Error code:', testError.code);
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Test 2: Get a client
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .limit(1);
    
    if (clientError) {
      console.error('❌ Client fetch failed:', clientError.message);
      return;
    }
    
    if (!clients || clients.length === 0) {
      console.log('❌ No clients found');
      return;
    }
    
    const client = clients[0];
    console.log('✅ Using client:', client.name);
    
    // Test 3: Try to insert a logboek entry
    console.log('\n2. Testing logboek insert...');
    
    const testEntry = {
      client_id: client.id,
      from_name: 'Quick Test',
      from_type: 'employee',
      from_color: 'bg-blue-500',
      type: 'Test',
      action: 'Quick test',
      description: 'Dit is een quick test bericht.',
      status: 'Geen urgentie',
      is_urgent: false,
      needs_response: false
    };
    
    console.log('Attempting to insert:', testEntry);
    
    const { data: insertedEntry, error: insertError } = await supabase
      .from('logboek')
      .insert(testEntry)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Insert failed:', insertError.message);
      console.error('Error code:', insertError.code);
      console.error('Error details:', insertError.details);
      console.error('Error hint:', insertError.hint);
      
      // Specific error handling
      if (insertError.code === '23514') {
        console.log('\n🔍 CONSTRAINT VIOLATION');
        console.log('Database constraints are blocking the insert');
        console.log('You need to run the SQL fix script');
      } else if (insertError.code === '42501') {
        console.log('\n🔍 PERMISSION DENIED');
        console.log('RLS policies are blocking the insert');
        console.log('You need to disable RLS');
      } else if (insertError.code === '23503') {
        console.log('\n🔍 FOREIGN KEY VIOLATION');
        console.log('The client_id might not exist');
      }
      
      return;
    }
    
    console.log('✅ Insert successful!');
    console.log('Created entry:', insertedEntry);
    
    // Test 4: Verify we can read it back
    console.log('\n3. Testing read back...');
    const { data: readEntry, error: readError } = await supabase
      .from('logboek')
      .select('*')
      .eq('id', insertedEntry.id)
      .single();
    
    if (readError) {
      console.error('❌ Read failed:', readError.message);
    } else {
      console.log('✅ Read successful:', readEntry);
    }
    
    // Test 5: Clean up
    console.log('\n4. Cleaning up...');
    const { error: deleteError } = await supabase
      .from('logboek')
      .delete()
      .eq('id', insertedEntry.id);
    
    if (deleteError) {
      console.error('❌ Cleanup failed:', deleteError.message);
    } else {
      console.log('✅ Cleanup successful');
    }
    
    console.log('\n🎉 All tests passed! Database is working correctly.');
    console.log('The issue might be in the frontend code.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

quickTest(); 