// Test frontend save functionality
console.log('🔍 Testing frontend save functionality...');

const { createClient } = require('@supabase/supabase-js');

// Use the same configuration as the app
const supabaseUrl = 'https://ltasjbgamoljvqoclgkf.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.log('❌ API key not found in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFrontendSave() {
  try {
    console.log('1. Testing database connection...');
    
    // Test 1: Get clients
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .limit(1);
    
    if (clientError) {
      console.error('❌ Client fetch error:', clientError.message);
      return;
    }
    
    if (!clients || clients.length === 0) {
      console.log('❌ No clients found');
      return;
    }
    
    const client = clients[0];
    console.log('✅ Using client:', client.name);
    
    // Test 2: Check logboek table permissions
    console.log('\n2. Testing logboek table access...');
    const { data: logboekTest, error: logboekError } = await supabase
      .from('logboek')
      .select('*')
      .limit(1);
    
    if (logboekError) {
      console.error('❌ Logboek table error:', logboekError.message);
      console.error('Error code:', logboekError.code);
      
      if (logboekError.code === '42501') {
        console.log('🔍 PERMISSION DENIED - RLS is blocking access');
        console.log('You need to disable RLS in Supabase');
      }
      return;
    }
    
    console.log('✅ Logboek table accessible');
    
    // Test 3: Try to insert (simulate frontend save)
    console.log('\n3. Testing logboek insert (frontend simulation)...');
    
    const testEntry = {
      client_id: client.id,
      from_name: 'Frontend Test',
      from_type: 'employee',
      from_color: 'bg-blue-500',
      type: 'Test Bericht',
      action: 'Frontend test actie',
      description: 'Dit is een test bericht van de frontend.',
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
      
      if (insertError.code === '23514') {
        console.log('\n🔍 CONSTRAINT VIOLATION');
        console.log('Database constraints are blocking the insert');
        console.log('You need to run the SQL fix script in Supabase');
      } else if (insertError.code === '42501') {
        console.log('\n🔍 PERMISSION DENIED');
        console.log('RLS policies are blocking the insert');
        console.log('You need to disable RLS in Supabase');
      }
      
      return;
    }
    
    console.log('✅ Insert successful!');
    console.log('Created entry ID:', insertedEntry.id);
    
    // Test 4: Verify the entry appears in the list
    console.log('\n4. Testing entry retrieval...');
    const { data: retrievedEntries, error: retrieveError } = await supabase
      .from('logboek')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (retrieveError) {
      console.error('❌ Retrieve failed:', retrieveError.message);
    } else {
      console.log('✅ Retrieved entries:', retrievedEntries.length);
      if (retrievedEntries.length > 0) {
        console.log('Latest entry:', retrievedEntries[0].description);
      }
    }
    
    // Test 5: Clean up
    console.log('\n5. Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('logboek')
      .delete()
      .eq('id', insertedEntry.id);
    
    if (deleteError) {
      console.error('❌ Cleanup failed:', deleteError.message);
    } else {
      console.log('✅ Cleanup successful');
    }
    
    console.log('\n🎉 Database is working correctly!');
    console.log('If the frontend still doesn\'t save, the issue is in the frontend code.');
    console.log('Check the browser console (F12) for JavaScript errors.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFrontendSave(); 