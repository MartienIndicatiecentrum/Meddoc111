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
    // Create clients table
    console.log('📋 Clients tabel aanmaken...');
    const { error: clientsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.clients (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          address TEXT,
          city TEXT,
          postal_code TEXT,
          date_of_birth DATE,
          bsn_number TEXT,
          insurance_number TEXT,
          insurance_company TEXT,
          contact_person_name TEXT,
          contact_person_phone TEXT,
          contact_person_email TEXT,
          contact_person_relation TEXT,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (clientsError) {
      console.log('ℹ️  Clients tabel bestaat al of kon niet aangemaakt worden:', clientsError.message);
    } else {
      console.log('✅ Clients tabel aangemaakt');
    }

    // Create taken table
    console.log('📋 Taken tabel aanmaken...');
    const { error: takenError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.taken (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          type TEXT NOT NULL CHECK (type IN ('Hulpmiddel Aanvraag', 'PGB Aanvraag', 'WMO Herindicatie', 'Indicatie', 'Vraagstelling', 'Update', 'Notitie')),
          status TEXT NOT NULL DEFAULT 'Niet gestart' CHECK (status IN ('Niet gestart', 'In behandeling', 'Wachten op info', 'Opvolging', 'Afgerond')),
          priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Laag', 'Medium', 'Hoog', 'Urgent')),
          progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
          deadline DATE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          insurer TEXT,
          external_party TEXT,
          is_urgent BOOLEAN DEFAULT FALSE,
          is_expired BOOLEAN DEFAULT FALSE,
          needs_response BOOLEAN DEFAULT FALSE
        );
      `
    });

    if (takenError) {
      console.log('ℹ️  Taken tabel bestaat al of kon niet aangemaakt worden:', takenError.message);
    } else {
      console.log('✅ Taken tabel aangemaakt');
    }

    // Create logboek table
    console.log('📋 Logboek tabel aanmaken...');
    const { error: logboekError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.logboek (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
          date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          from_name TEXT NOT NULL,
          from_type TEXT NOT NULL CHECK (from_type IN ('client', 'employee', 'insurer', 'family')),
          from_color TEXT DEFAULT 'bg-gray-500',
          type TEXT NOT NULL CHECK (type IN ('Vraag', 'Antwoord', 'Update', 'Notitie')),
          action TEXT NOT NULL,
          description TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'Afgehandeld' CHECK (status IN ('Urgent', 'Reactie nodig', 'Afgehandeld', 'In behandeling')),
          is_urgent BOOLEAN DEFAULT FALSE,
          needs_response BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (logboekError) {
      console.log('ℹ️  Logboek tabel bestaat al of kon niet aangemaakt worden:', logboekError.message);
    } else {
      console.log('✅ Logboek tabel aangemaakt');
    }

    // Insert sample data
    console.log('📝 Sample data toevoegen...');

    // Insert sample clients
    const { data: clients, error: insertClientsError } = await supabase
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

    if (insertClientsError) {
      console.log('ℹ️  Sample clients konden niet toegevoegd worden:', insertClientsError.message);
    } else {
      console.log('✅ Sample clients toegevoegd');

      // Insert sample tasks for the first client
      if (clients && clients.length > 0) {
        const { error: insertTasksError } = await supabase
          .from('taken')
          .insert([
            {
              client_id: clients[0].id,
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
              client_id: clients[0].id,
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

        if (insertTasksError) {
          console.log('ℹ️  Sample tasks konden niet toegevoegd worden:', insertTasksError.message);
        } else {
          console.log('✅ Sample tasks toegevoegd');
        }

        // Insert sample log entries
        const { error: insertLogError } = await supabase
          .from('logboek')
          .insert([
            {
              client_id: clients[0].id,
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
              client_id: clients[0].id,
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

        if (insertLogError) {
          console.log('ℹ️  Sample log entries konden niet toegevoegd worden:', insertLogError.message);
        } else {
          console.log('✅ Sample log entries toegevoegd');
        }
      }
    }

    console.log('🎉 Database setup voltooid!');
    console.log('📊 Je kunt nu de Lopende Zaken en Logboek pagina\'s bekijken met echte data');

  } catch (error) {
    console.error('❌ Fout tijdens database setup:', error);
  }
}

setupDatabase();