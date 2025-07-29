// Test script om frontend logboek functionaliteit te controleren
console.log('🔍 Testing frontend logboek functionality...');

// Simuleer de browser environment
const { createClient } = require('@supabase/supabase-js');

// Test met dezelfde configuratie als de applicatie
const supabaseUrl = 'https://ltasjbgamoljvqoclgkf.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

console.log('Testing with:');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? '✅ Set' : '❌ Not set');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFrontendLogboek() {
  try {
    console.log('\n1. Testing client selection...');

    // Test 1: Get clients
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .limit(5);

    if (clientError) {
      console.error('❌ Client fetch error:', clientError);
      return;
    }

    console.log('✅ Clients found:', clients?.length || 0);
    console.log('Client names:', clients?.map(c => c.name) || []);

    if (!clients || clients.length === 0) {
      console.log('⚠️  No clients found - this might be the issue');
      return;
    }

    const testClient = clients[0];
    console.log('Using client:', testClient.name);

    // Test 2: Check if logboek entries exist for this client
    console.log('\n2. Testing existing logboek entries...');
    const { data: existingEntries, error: entriesError } = await supabase
      .from('logboek')
      .select('*')
      .eq('client_id', testClient.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (entriesError) {
      console.error('❌ Logboek entries fetch error:', entriesError);
    } else {
      console.log('✅ Existing entries found:', existingEntries?.length || 0);
      if (existingEntries && existingEntries.length > 0) {
        console.log('Latest entry:', existingEntries[0]);
      }
    }

    // Test 3: Try to create a new entry (simulate frontend)
    console.log('\n3. Testing new entry creation...');
    const newEntry = {
      client_id: testClient.id,
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

    console.log('Attempting to create entry:', newEntry);

    const { data: createdEntry, error: createError } = await supabase
      .from('logboek')
      .insert(newEntry)
      .select()
      .single();

    if (createError) {
      console.error('❌ Create entry failed:', createError);
      console.error('Error details:', {
        code: createError.code,
        message: createError.message,
        details: createError.details,
        hint: createError.hint
      });

      // Check specific error types
      if (createError.code === '23514') {
        console.log('\n🔍 Constraint violation - database constraints are blocking the insert');
        console.log('You need to run the SQL fix script in Supabase');
      } else if (createError.code === '42501') {
        console.log('\n🔍 Permission denied - RLS policies are blocking the insert');
        console.log('You need to disable RLS or create proper policies');
      } else if (createError.code === '23503') {
        console.log('\n🔍 Foreign key violation - client_id might not exist');
        console.log('Check if the client exists in the database');
      }

      return;
    }

    console.log('✅ Entry created successfully:', createdEntry);

    // Test 4: Verify the entry was created
    console.log('\n4. Verifying created entry...');
    const { data: verifyEntry, error: verifyError } = await supabase
      .from('logboek')
      .select('*')
      .eq('id', createdEntry.id)
      .single();

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
    } else {
      console.log('✅ Entry verified:', verifyEntry);
    }

    // Test 5: Clean up
    console.log('\n5. Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('logboek')
      .delete()
      .eq('id', createdEntry.id);

    if (deleteError) {
      console.error('❌ Cleanup failed:', deleteError);
    } else {
      console.log('✅ Test data cleaned up');
    }

    console.log('\n🎉 Frontend logboek test completed successfully!');
    console.log('The database is working correctly.');
    console.log('If the frontend still doesn\'t work, check the browser console for errors.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFrontendLogboek();