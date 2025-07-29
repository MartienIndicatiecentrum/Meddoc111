// Debug script voor logboek opslaan
console.log('🔍 Debugging logboek save functionality...');

// Test Supabase connectie
const { createClient } = require('@supabase/supabase-js');

// Gebruik dezelfde configuratie als de applicatie
const supabaseUrl = 'https://ltasjbgamoljvqoclgkf.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? '✅ Set' : '❌ Not set');

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugLogboek() {
  try {
    console.log('\n1. Testing database connection...');

    // Test 1: Check clients
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .limit(1);

    if (clientError) {
      console.error('❌ Client fetch error:', clientError);
      return;
    }

    console.log('✅ Clients found:', clients);

    if (!clients || clients.length === 0) {
      console.log('⚠️  No clients found');
      return;
    }

    const testClient = clients[0];
    console.log('Using client:', testClient.name);

    // Test 2: Check logboek table structure
    console.log('\n2. Testing logboek table...');
    const { data: logboekStructure, error: structureError } = await supabase
      .from('logboek')
      .select('*')
      .limit(0);

    if (structureError) {
      console.error('❌ Logboek table error:', structureError);
      console.error('Error details:', {
        code: structureError.code,
        message: structureError.message,
        details: structureError.details,
        hint: structureError.hint
      });
    } else {
      console.log('✅ Logboek table accessible');
    }

    // Test 3: Try to insert a test entry
    console.log('\n3. Testing logboek insert...');
    const testEntry = {
      client_id: testClient.id,
      from_name: 'Debug Test',
      from_type: 'employee',
      from_color: 'bg-blue-500',
      type: 'Test Bericht',
      action: 'Debug test actie',
      description: 'Dit is een debug test bericht.',
      status: 'Geen urgentie',
      is_urgent: false,
      needs_response: false
    };

    console.log('Test entry data:', testEntry);

    const { data: insertedEntry, error: insertError } = await supabase
      .from('logboek')
      .insert(testEntry)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Logboek insert failed:', insertError);
      console.error('Error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });

      // Check if it's a constraint error
      if (insertError.code === '23514') {
        console.log('\n🔍 This is a constraint violation error.');
        console.log('The database constraints are blocking the insert.');
        console.log('You need to run the SQL fix script in Supabase.');
      }

      return;
    }

    console.log('✅ Logboek entry created successfully:', insertedEntry);

    // Test 4: Clean up
    console.log('\n4. Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('logboek')
      .delete()
      .eq('id', insertedEntry.id);

    if (deleteError) {
      console.error('❌ Cleanup failed:', deleteError);
    } else {
      console.log('✅ Test data cleaned up');
    }

    console.log('\n🎉 Database is working correctly!');
    console.log('The issue might be in the frontend code or permissions.');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugLogboek();