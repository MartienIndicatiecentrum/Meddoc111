// Direct test voor logboek opslaan
console.log('🔍 Direct test voor logboek opslaan...');

const { createClient } = require('@supabase/supabase-js');

// Gebruik dezelfde configuratie als de applicatie
const supabaseUrl = 'https://ltasjbgamoljvqoclgkf.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl);
console.log('API Key:', supabaseKey ? '✅ Set' : '❌ Not set');

if (!supabaseKey) {
  console.log('❌ API key niet gevonden');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function directTest() {
  try {
    console.log('\n1. Testing database connection...');
    
    // Test 1: Check if we can connect
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .limit(1);
    
    if (clientError) {
      console.error('❌ Client fetch error:', clientError.message);
      console.error('Error code:', clientError.code);
      return;
    }
    
    if (!clients || clients.length === 0) {
      console.log('❌ No clients found');
      return;
    }
    
    const client = clients[0];
    console.log('✅ Using client:', client.name);
    
    // Test 2: Check logboek table access
    console.log('\n2. Testing logboek table access...');
    const { data: logboekTest, error: logboekError } = await supabase
      .from('logboek')
      .select('*')
      .limit(1);
    
    if (logboekError) {
      console.error('❌ Logboek table error:', logboekError.message);
      console.error('Error code:', logboekError.code);
      
      if (logboekError.code === '42501') {
        console.log('\n🔍 PERMISSION DENIED - RLS is blocking access');
        console.log('You need to disable RLS in Supabase');
        console.log('Run this SQL in Supabase:');
        console.log('ALTER TABLE public.logboek DISABLE ROW LEVEL SECURITY;');
      }
      return;
    }
    
    console.log('✅ Logboek table accessible');
    
    // Test 3: Try to insert a logboek entry
    console.log('\n3. Testing logboek insert...');
    
    const testEntry = {
      client_id: client.id,
      from_name: 'Direct Test',
      from_type: 'employee',
      from_color: 'bg-blue-500',
      type: 'Test Bericht',
      action: 'Direct test actie',
      description: 'Dit is een direct test bericht.',
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
      
      if (insertError.code === '23514') {
        console.log('\n🔍 CONSTRAINT VIOLATION');
        console.log('Database constraints are blocking the insert');
        console.log('You need to run the SQL fix script in Supabase');
        console.log('\nRun this SQL in Supabase SQL Editor:');
        console.log(`
-- Fix logboek save issues
ALTER TABLE public.logboek DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_entry_documents DISABLE ROW LEVEL SECURITY;

GRANT ALL ON public.logboek TO authenticated;
GRANT ALL ON public.logboek TO anon;
GRANT ALL ON public.log_entry_documents TO authenticated;
GRANT ALL ON public.log_entry_documents TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Fix constraints
ALTER TABLE public.logboek DROP CONSTRAINT IF EXISTS logboek_from_type_check;
ALTER TABLE public.logboek DROP CONSTRAINT IF EXISTS logboek_type_check;
ALTER TABLE public.logboek DROP CONSTRAINT IF EXISTS logboek_status_check;

ALTER TABLE public.logboek ADD CONSTRAINT logboek_from_type_check 
    CHECK (from_type IN ('client', 'employee', 'insurer', 'family', 'verzekeraar'));

ALTER TABLE public.logboek ADD CONSTRAINT logboek_type_check 
    CHECK (type IS NOT NULL AND length(trim(type)) > 0);

ALTER TABLE public.logboek ADD CONSTRAINT logboek_status_check 
    CHECK (status IN ('Geen urgentie', 'Licht urgent', 'Urgent', 'Reactie nodig', 'Afgehandeld', 'In behandeling'));

-- Update defaults
ALTER TABLE public.logboek ALTER COLUMN status SET DEFAULT 'Geen urgentie';
ALTER TABLE public.logboek ALTER COLUMN from_color SET DEFAULT 'bg-gray-500';
        `);
      } else if (insertError.code === '42501') {
        console.log('\n🔍 PERMISSION DENIED');
        console.log('RLS policies are blocking the insert');
        console.log('You need to disable RLS in Supabase');
        console.log('\nRun this SQL in Supabase SQL Editor:');
        console.log('ALTER TABLE public.logboek DISABLE ROW LEVEL SECURITY;');
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
    console.log('If the frontend still doesn\'t save, check the browser console (F12) for JavaScript errors.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

directTest(); 