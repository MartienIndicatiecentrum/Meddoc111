// supabase/functions/ask-claude/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async req => {
  try {
    const { question, documentText } = await req.json();

    // Haal de Claude API key uit de environment
    const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY');
    if (!CLAUDE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Claude API key ontbreekt' }),
        { status: 500 }
      );
    }

    // Bouw de prompt voor Claude
    const prompt = `
Je bent een slimme assistent. Beantwoord de volgende vraag over het document:
---
${documentText || 'Geen documenttekst beschikbaar.'}
---
Vraag: ${question}
Antwoord:
    `;

    // Roep de Claude API aan (voorbeeld voor Claude v2 via Anthropic)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-2.1', // of het model dat jij gebruikt
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(JSON.stringify({ error }), { status: 500 });
    }

    const data = await response.json();
    // Claude antwoordt in data.content[0].text
    const answer =
      data.content?.[0]?.text || 'Geen antwoord ontvangen van Claude.';

    return new Response(JSON.stringify({ answer }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
