import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import KiesClientDropdown from '@/components/KiesClientDropdown';
import { supabase } from '@/integrations/supabase/client';

const AI_CHAT_ENDPOINT =
  'https://ltasjbgamoljvqoclgkf.supabase.co/functions/v1/ai-chat';

export default function TestAIChat() {
  const [clientId, setClientId] = useState<string>('');
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [clientData, setClientData] = useState<any>(null);

  // Fetch client data when client is selected
  React.useEffect(() => {
    if (clientId) {
      supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()
        .then(({ data }) => {
          setClientData(data);
        });
    } else {
      setClientData(null);
    }
  }, [clientId]);

  const testQueries = [
    'wat is de geboortedatum?',
    'wat is de geboorte datum?',
    'wanneer is de client geboren?',
    'wat is het adres?',
    'wie is de huisarts?',
    'wat is het telefoonnummer?',
  ];

  async function handleTest() {
    if (!query.trim()) {
      return;
    }

    setLoading(true);
    setResponse('');

    try {
      console.log('[TestAIChat] Sending request with client context:', {
        hasClient: !!clientId,
        clientName: clientData ? clientData.naam : 'None',
      });

      const res = await fetch(AI_CHAT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          userId: null,
          documentId: null,
          clientId: clientId || null,
          clientData: clientData,
          context: clientData
            ? `Je hebt toegang tot gegevens van client ${clientData.naam}`
            : null,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data.response || 'Geen antwoord ontvangen.');
    } catch (error) {
      console.error('[TestAIChat] Error:', error);
      setResponse(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='container mx-auto p-6'>
      <Card>
        <CardHeader>
          <CardTitle>Test AI Chat met Client Context</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <Label>Selecteer een client</Label>
            <KiesClientDropdown value={clientId} onSelect={setClientId} />
          </div>

          {clientData && (
            <div className='bg-blue-50 p-4 rounded-lg'>
              <p className='font-semibold'>Geselecteerde client:</p>
              <p>{clientData.naam}</p>
              <p className='text-sm text-gray-600'>ID: {clientId}</p>
            </div>
          )}

          <div>
            <Label>Test vraag</Label>
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder='Stel een vraag over de client...'
              onKeyDown={e => e.key === 'Enter' && handleTest()}
            />
          </div>

          <div className='flex flex-wrap gap-2'>
            <p className='w-full text-sm text-gray-600'>Voorbeeldvragen:</p>
            {testQueries.map(q => (
              <Button
                key={q}
                variant='outline'
                size='sm'
                onClick={() => setQuery(q)}
              >
                {q}
              </Button>
            ))}
          </div>

          <Button
            onClick={handleTest}
            disabled={loading || !query.trim() || !clientId}
            className='w-full'
          >
            {loading ? 'Bezig...' : 'Test AI Chat'}
          </Button>

          {response && (
            <div className='bg-gray-50 p-4 rounded-lg'>
              <p className='font-semibold mb-2'>AI Antwoord:</p>
              <p className='whitespace-pre-wrap'>{response}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
