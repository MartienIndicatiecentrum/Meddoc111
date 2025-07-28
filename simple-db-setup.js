const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase URL en Key zijn niet gevonden in .env bestand');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🚀 Database setup gestart...');

  try {
    // Check if clients table exists
    console.log('📋 Controleren of clients tabel bestaat...');
    const { data: existingClients, error: checkError } = await supabase
      .from('clients')
      .select('count')
      .limit(1);

    if (checkError && checkError.code === 'PGRST116') {
      console.log('❌ Clients tabel bestaat niet. Je moet eerst de database tabellen aanmaken via de Supabase dashboard.');
      console.log('📝 Kopieer en plak het SQL script uit create-tables.sql in je Supabase SQL editor.');
      return;
    }

    console.log('✅ Clients tabel bestaat al');

    // Check if we have any clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);

    if (clientsError) {
      console.error('❌ Fout bij ophalen clients:', clientsError);
      return;
    }

    if (!clients || clients.length === 0) {
      console.log('📝 Geen clients gevonden, sample data toevoegen...');
      
      // Insert sample clients
      const { data: newClients, error: insertError } = await supabase
        .from('clients')
        .insert([
          {
            name: 'Mw. P. Kroesen',
            email: 'p.kroesen@email.com',
            phone: '06-12345678',
            city: 'Amsterdam',
            insurance_company: 'CZ Verzekeringen',
            status: 'active'
          },
          {
            name: 'Dhr. J. van der Berg',
            email: 'j.vanderberg@email.com',
            phone: '06-87654321',
            city: 'Rotterdam',
            insurance_company: 'VGZ',
            status: 'active'
          },
          {
            name: 'Mw. A. de Vries',
            email: 'a.devries@email.com',
            phone: '06-11223344',
            city: 'Den Haag',
            insurance_company: 'Achmea',
            status: 'active'
          }
        ])
        .select();

      if (insertError) {
        console.error('❌ Fout bij toevoegen sample clients:', insertError);
        return;
      }

      console.log('✅ Sample clients toegevoegd');

      // Add sample tasks and log entries if clients were created
      if (newClients && newClients.length > 0) {
        await addSampleData(newClients[0].id);
      }
    } else {
      console.log('✅ Clients bestaan al');
    }

    console.log('🎉 Database setup voltooid!');
    console.log('📊 Je kunt nu de Lopende Zaken en Logboek pagina\'s bekijken met echte data');

  } catch (error) {
    console.error('❌ Fout tijdens database setup:', error);
  }
}

async function addSampleData(clientId) {
  try {
    // Add sample tasks
    const { error: tasksError } = await supabase
      .from('taken')
      .insert([
        {
          client_id: clientId,
          title: 'Aanvraag rolstoel voor cliënt',
          description: 'Rolstoel aanvraag voor dagelijks gebruik',
          type: 'Hulpmiddel Aanvraag',
          status: 'Niet gestart',
          priority: 'Urgent',
          progress: 10,
          deadline: '2024-01-25',
          insurer: 'Achmea',
          is_urgent: true,
          is_expired: true,
          needs_response: true
        },
        {
          client_id: clientId,
          title: 'PGB aanvraag nieuwe indicatie',
          description: 'Nieuwe PGB indicatie voor thuiszorg',
          type: 'PGB Aanvraag',
          status: 'In behandeling',
          priority: 'Hoog',
          progress: 65,
          deadline: '2024-02-15',
          insurer: 'CZ Verzekeringen',
          is_urgent: true,
          is_expired: true,
          needs_response: false
        }
      ]);

    if (tasksError) {
      console.log('ℹ️  Sample tasks konden niet toegevoegd worden:', tasksError.message);
    } else {
      console.log('✅ Sample tasks toegevoegd');
    }

    // Add sample log entries
    const { error: logError } = await supabase
      .from('logboek')
      .insert([
        {
          client_id: clientId,
          from_name: 'Mw. P. Kroesen',
          from_type: 'client',
          from_color: 'bg-blue-500',
          type: 'Vraag',
          action: 'Vraag gesteld',
          description: 'Wanneer kan ik verwachten dat de indicatie wordt goedgekeurd? Ik heb dringend zorg nodig.',
          status: 'Reactie nodig',
          is_urgent: true,
          needs_response: true
        },
        {
          client_id: clientId,
          from_name: 'Sarah (Medewerker)',
          from_type: 'employee',
          from_color: 'bg-gray-500',
          type: 'Antwoord',
          action: 'Antwoord gegeven',
          description: 'Ik heb uw dossier bekeken. De indicatie wordt momenteel beoordeeld door de verzekeraar. Ik verwacht binnen 2 weken een reactie. Ik zal dit voor u opvolgen.',
          status: 'Afgehandeld',
          is_urgent: false,
          needs_response: false
        }
      ]);

    if (logError) {
      console.log('ℹ️  Sample log entries konden niet toegevoegd worden:', logError.message);
    } else {
      console.log('✅ Sample log entries toegevoegd');
    }

  } catch (error) {
    console.error('❌ Fout bij toevoegen sample data:', error);
  }
}

setupDatabase(); 