-- Add sample logboek data for testing
-- This script adds sample communication entries for existing clients

-- First, let's get a client ID to use for sample data
DO $$
DECLARE
    sample_client_id UUID;
BEGIN
    -- Get the first available client
    SELECT id INTO sample_client_id 
    FROM public.clients 
    LIMIT 1;
    
    -- If we have a client, add sample log entries
    IF sample_client_id IS NOT NULL THEN
        -- Add sample log entries
        INSERT INTO public.logboek (
            client_id, 
            from_name, 
            from_type, 
            from_color, 
            type, 
            action, 
            description, 
            status, 
            is_urgent, 
            needs_response
        ) VALUES 
        (
            sample_client_id,
            'Medewerker',
            'employee',
            'bg-gray-500',
            'Vraag Verzekeraar',
            'Vraag gesteld aan verzekeraar',
            'Wij hebben aanvullende informatie nodig over de zorgbehoefte. Kunt u de laatste 3 maanden van de zorgverlening toelichten? Dit is nodig voor de beoordeling.',
            'Reactie nodig',
            true,
            true
        ),
        (
            sample_client_id,
            'CZ Verzekeringen',
            'insurer',
            'bg-green-500',
            'Indicatie',
            'Indicatie beoordeling',
            'Wij hebben uw indicatie beoordeeld en goedgekeurd voor 12 uur per week thuiszorg. De indicatie is geldig tot 31 december 2024.',
            'Afgehandeld',
            false,
            false
        ),
        (
            sample_client_id,
            'Cliënt',
            'client',
            'bg-blue-500',
            'Anders',
            'PGB Aanvraag',
            'Ik wil graag een PGB aanvraag indienen voor persoonlijke verzorging. Kunt u mij helpen met het proces?',
            'In behandeling',
            false,
            true
        );
        
        RAISE NOTICE 'Sample log entries added for client ID: %', sample_client_id;
    ELSE
        RAISE NOTICE 'No clients found in database. Please add clients first.';
    END IF;
END $$;

-- Show the added data
SELECT 
    l.id,
    l.date,
    l.from_name,
    l.from_type,
    l.type,
    l.action,
    l.description,
    l.status,
    c.naam as client_name
FROM public.logboek l
LEFT JOIN public.clients c ON l.client_id = c.id
ORDER BY l.date DESC; 