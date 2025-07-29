import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { documentId, content, userId } = await req.json();

    console.log('Analyzing document:', { documentId, userId });

    // Generate AI insights
    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a document analysis assistant. Analyze the following document and provide insights in JSON format:
            {
              "summary": "Brief summary of the document",
              "keywords": ["keyword1", "keyword2", "keyword3"],
              "sentiment": "positive|neutral|negative",
              "urgency": "low|normal|high|urgent",
              "deadline_mentioned": "YYYY-MM-DD or null",
              "action_items": ["action1", "action2"],
              "document_type": "contract|invoice|letter|report|other"
            }`,
          },
          {
            role: 'user',
            content: `Analyze this document:\n\n${content}`,
          },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    const analysisData = await analysisResponse.json();
    let insights;

    try {
      insights = JSON.parse(analysisData.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      insights = {
        summary: analysisData.choices[0].message.content,
        keywords: [],
        sentiment: 'neutral',
        urgency: 'normal',
        deadline_mentioned: null,
        action_items: [],
        document_type: 'other'
      };
    }

    // Generate embedding for the document
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: content,
        model: 'text-embedding-ada-002',
      }),
    });

    const embeddingData = await embeddingResponse.json();
    const documentEmbedding = embeddingData.data[0].embedding;

    // Update document with AI insights and embedding
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        vector_embedding: documentEmbedding,
        document_type: insights.document_type,
        priority: insights.urgency,
        deadline: insights.deadline_mentioned,
        metadata: {
          ...insights,
          analyzed_at: new Date().toISOString(),
        },
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Error updating document:', updateError);
    }

    // Store AI insights
    const insightPromises = [
      supabase.from('ai_insights').insert({
        document_id: documentId,
        insight_type: 'summary',
        data: { summary: insights.summary },
        confidence_score: 0.85,
      }),
      supabase.from('ai_insights').insert({
        document_id: documentId,
        insight_type: 'keywords',
        data: { keywords: insights.keywords },
        confidence_score: 0.90,
      }),
      supabase.from('ai_insights').insert({
        document_id: documentId,
        insight_type: 'sentiment',
        data: { sentiment: insights.sentiment },
        confidence_score: 0.75,
      }),
    ];

    if (insights.deadline_mentioned) {
      insightPromises.push(
        supabase.from('ai_insights').insert({
          document_id: documentId,
          insight_type: 'deadline',
          data: { deadline: insights.deadline_mentioned },
          confidence_score: 0.80,
        })
      );
    }

    await Promise.all(insightPromises);

    // Log activity
    if (userId) {
      await supabase.from('activity_logs').insert({
        document_id: documentId,
        user_id: userId,
        action: 'ai_query',
        details: {
          action_type: 'document_analysis',
          insights_generated: Object.keys(insights).length,
        },
      });
    }

    return new Response(
      JSON.stringify({
        insights,
        message: 'Document analyzed successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in analyze-document function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});