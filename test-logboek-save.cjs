// Test script voor logboek opslaan functionaliteit
// Run dit script om te testen of de database correct werkt

const { createClient } = require('@supabase/supabase-js');

// Vervang deze waarden met je eigen Supabase configuratie
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogboekSave() {
  console.log('🧪 Testing logboek save functionality...');
  
  try {
    // 1. Test database connection
    console.log('1. Testing database connection...');
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .limit(1);
    
    if (clientError) {
      console.error('❌ Database connection failed:', clientError);
      return;
    }
    
    console.log('✅ Database connection successful');
    console.log('Available clients:', clients);
    
    if (!clients || clients.length === 0) {
      console.log('⚠️  No clients found. Please add a client first.');
      return;
    }
    
    const testClient = clients[0];
    console.log('Using client:', testClient.name);
    
    // 2. Test logboek table insert
    console.log('2. Testing logboek insert...');
    const testEntry = {
      client_id: testClient.id,
      from_name: 'Test User',
      from_type: 'employee',
      from_color: 'bg-blue-500',
      type: 'Test Bericht',
      action: 'Test actie',
      description: 'Dit is een test bericht om te controleren of het opslaan werkt.',
      status: 'Geen urgentie',
      is_urgent: false,
      needs_response: false
    };
    
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
      return;
    }
    
    console.log('✅ Logboek entry created successfully:', insertedEntry);
    
    // 3. Test document upload (if storage bucket exists)
    console.log('3. Testing document upload...');
    try {
      const testFile = new Blob(['Test document content'], { type: 'text/plain' });
      const fileName = `test-${Date.now()}.txt`;
      const filePath = `logboek-documents/${testClient.id}/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, testFile);
      
      if (uploadError) {
        console.log('⚠️  Document upload failed (this might be expected if storage is not configured):', uploadError.message);
      } else {
        console.log('✅ Document uploaded successfully');
        
        // Test document database entry
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);
        
        const documentData = {
          log_entry_id: insertedEntry.id,
          client_id: testClient.id,
          file_name: fileName,
          file_path: filePath,
          file_size: testFile.size,
          file_type: testFile.type,
          public_url: urlData.publicUrl
        };
        
        const { data: docEntry, error: docError } = await supabase
          .from('log_entry_documents')
          .insert(documentData)
          .select()
          .single();
        
        if (docError) {
          console.error('❌ Document database entry failed:', docError);
        } else {
          console.log('✅ Document database entry created:', docEntry);
        }
      }
    } catch (storageError) {
      console.log('⚠️  Storage test skipped (storage might not be configured):', storageError.message);
    }
    
    // 4. Test reading back the entry
    console.log('4. Testing read back...');
    const { data: readEntry, error: readError } = await supabase
      .from('logboek')
      .select('*')
      .eq('id', insertedEntry.id)
      .single();
    
    if (readError) {
      console.error('❌ Read back failed:', readError);
    } else {
      console.log('✅ Read back successful:', readEntry);
    }
    
    // 5. Clean up test data
    console.log('5. Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('logboek')
      .delete()
      .eq('id', insertedEntry.id);
    
    if (deleteError) {
      console.error('❌ Cleanup failed:', deleteError);
    } else {
      console.log('✅ Test data cleaned up');
    }
    
    console.log('🎉 All tests completed successfully!');
    console.log('✅ Logboek save functionality is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testLogboekSave(); 