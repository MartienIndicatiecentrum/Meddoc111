import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const {
      query,
      documentId,
      userId,
      clientId,
      clientData,
      context: additionalContext,
    } = await req.json();

    console.log('AI Chat request:', {
      query,
      documentId,
      userId,
      clientId,
      hasClientData: !!clientData,
    });

    // Create embedding for the query
    const embeddingResponse = await fetch(
      'https://api.openai.com/v1/embeddings',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: query,
          model: 'text-embedding-ada-002',
        }),
      }
    );

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // Search for similar documents using vector similarity
    // If a client is selected, prioritize their documents
    const { data: similarDocs, error: searchError } = await supabase.rpc(
      'match_documents',
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: 5,
        client_id_filter: clientId || null,
      }
    );

    let documentContext = '';
    if (similarDocs && similarDocs.length > 0) {
      documentContext =
        '## Relevante documenten:\n\n' +
        similarDocs
          .map((doc: any) => {
            const preview = doc.content
              ? doc.content.substring(0, 500) + '...'
              : 'Geen inhoud beschikbaar';
            return `**${doc.title}** (Relevantie: ${(doc.similarity * 100).toFixed(1)}%)\n${preview}`;
          })
          .join('\n\n---\n\n');
    }

    // If no documents found for the client, search all documents
    if (clientId && (!similarDocs || similarDocs.length === 0)) {
      console.log(
        'No client-specific documents found, searching all documents...'
      );
      const { data: allDocs } = await supabase.rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.6,
        match_count: 3,
        client_id_filter: null,
      });

      if (allDocs && allDocs.length > 0) {
        documentContext +=
          '\n\n## Andere relevante documenten:\n\n' +
          allDocs
            .map((doc: any) => {
              const preview = doc.content
                ? doc.content.substring(0, 300) + '...'
                : 'Geen inhoud beschikbaar';
              return `**${doc.title}** (Relevantie: ${(doc.similarity * 100).toFixed(1)}%)\n${preview}`;
            })
            .join('\n\n---\n\n');
      }
    }

    // Generate AI response
    const chatResponse = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a helpful assistant for a Dutch healthcare organization. You help with document management and client information queries.
${
  clientData
    ? `
Client Information:
Naam: ${clientData.naam || 'Niet bekend'}
Geboortedatum: ${clientData.geboortedatum || 'Niet bekend'}
Adres: ${clientData.adres || 'Niet bekend'}
Woonplaats: ${clientData.woonplaats || 'Niet bekend'}
Postcode: ${clientData.postcode || 'Niet bekend'}
Telefoon: ${clientData.telefoon || clientData.telefoonnummer || 'Niet bekend'}
Email: ${clientData.email || 'Niet bekend'}
BSN: ${clientData.bsn || 'Niet bekend'}
Verzekeraar: ${clientData.verzekeraar || 'Niet bekend'}
Polisnummer: ${clientData.polisnummer || 'Niet bekend'}
Huisarts: ${clientData.huisarts || 'Niet bekend'}
Algemene informatie: ${clientData.algemene_informatie || 'Niet bekend'}
Notities: ${clientData.notities || 'Niet bekend'}
`
    : ''
}
${
  additionalContext
    ? `
${additionalContext}
`
    : ''
}
${
  documentContext
    ? `

${documentContext}`
    : ''
}

Always respond in Dutch. If asked about client information, use the provided client data. Be helpful and concise.`,
            },
            {
              role: 'user',
              content: query,
            },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      }
    );

    const chatData = await chatResponse.json();
    const aiResponse = chatData.choices[0].message.content;

    // Log the search query
    if (userId) {
      await supabase.from('search_queries').insert({
        user_id: userId,
        query: query,
        query_type: 'semantic',
        results_count: similarDocs?.length || 0,
        processing_time: 0.5,
      });

      // Log activity
      if (documentId) {
        await supabase.from('activity_logs').insert({
          document_id: documentId,
          user_id: userId,
          action: 'ai_query',
          details: {
            query: query,
            response_preview: aiResponse.substring(0, 100),
          },
        });
      }
    }

    return new Response(
      JSON.stringify({
        response: aiResponse,
        sources:
          similarDocs?.map((doc: any) => ({
            id: doc.id,
            title: doc.title,
            similarity: doc.similarity,
          })) || [],
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
