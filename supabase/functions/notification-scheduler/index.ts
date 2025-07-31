import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Running notification scheduler...');

    // Get active notification rules
    const { data: rules, error: rulesError } = await supabase
      .from('notification_rules')
      .select('*')
      .eq('is_active', true);

    if (rulesError) {
      throw rulesError;
    }

    const notifications = [];

    for (const rule of rules || []) {
      console.log(`Processing rule: ${rule.trigger_type}`);

      switch (rule.trigger_type) {
        case 'deadline_approaching': {
          // Find documents with approaching deadlines
          const { data: documents } = await supabase
            .from('documents')
            .select('*, profiles!inner(email)')
            .eq('user_id', rule.user_id)
            .not('deadline', 'is', null)
            .gte('deadline', new Date().toISOString())
            .lte(
              'deadline',
              new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            ); // Next 24 hours

          for (const doc of documents || []) {
            notifications.push({
              userId: rule.user_id,
              type: 'deadline_reminder',
              title: 'Document Deadline Approaching',
              message: `The document "${doc.title}" has a deadline approaching on ${new Date(doc.deadline).toLocaleDateString()}.`,
              channels: rule.channels,
              documentId: doc.id,
              email: doc.profiles?.email,
            });
          }
          break;
        }

        case 'new_document': {
          // Find new documents uploaded in the last hour
          const oneHourAgo = new Date(
            Date.now() - 60 * 60 * 1000
          ).toISOString();
          const { data: newDocs } = await supabase
            .from('documents')
            .select('*, profiles!inner(email)')
            .eq('user_id', rule.user_id)
            .gte('created_at', oneHourAgo);

          for (const doc of newDocs || []) {
            notifications.push({
              userId: rule.user_id,
              type: 'new_document',
              title: 'New Document Uploaded',
              message: `A new document "${doc.title}" has been uploaded to your system.`,
              channels: rule.channels,
              documentId: doc.id,
              email: doc.profiles?.email,
            });
          }
          break;
        }

        case 'status_change': {
          // This would typically be triggered by document status changes
          // For now, we'll skip this as it should be event-driven
          break;
        }

        case 'ai_insight': {
          // Find recent AI insights
          const oneHourAgo = new Date(
            Date.now() - 60 * 60 * 1000
          ).toISOString();
          const { data: insights } = await supabase
            .from('ai_insights')
            .select('*, documents!inner(*, profiles!inner(email))')
            .eq('documents.user_id', rule.user_id)
            .gte('created_at', oneHourAgo);

          for (const insight of insights || []) {
            notifications.push({
              userId: rule.user_id,
              type: 'ai_insight',
              title: 'New AI Insight Available',
              message: `AI has generated new insights for document "${insight.documents.title}". Insight type: ${insight.insight_type}.`,
              channels: rule.channels,
              documentId: insight.document_id,
              email: insight.documents?.profiles?.email,
            });
          }
          break;
        }
      }
    }

    // Send notifications
    let sentCount = 0;
    for (const notification of notifications) {
      try {
        // Check if notification was already sent recently
        const { data: existingNotification } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', notification.userId)
          .eq('type', notification.type)
          .eq('title', notification.title)
          .gte(
            'created_at',
            new Date(Date.now() - 60 * 60 * 1000).toISOString()
          ) // Last hour
          .limit(1);

        if (existingNotification && existingNotification.length > 0) {
          console.log('Notification already sent recently, skipping...');
          continue;
        }

        // Store notification in database
        const { data: storedNotification, error: notificationError } =
          await supabase
            .from('notifications')
            .insert({
              user_id: notification.userId,
              type: notification.type,
              title: notification.title,
              message: notification.message,
              channels: notification.channels,
            })
            .select()
            .single();

        if (notificationError) {
          console.error('Error storing notification:', notificationError);
          continue;
        }

        // Send email if email channel is enabled and email is available
        if (notification.channels.includes('email') && notification.email) {
          const emailResponse = await supabase.functions.invoke('send-email', {
            body: {
              to: notification.email,
              subject: notification.title,
              content: notification.message,
              type: notification.type,
              userId: notification.userId,
              documentId: notification.documentId,
            },
          });

          if (emailResponse.error) {
            console.error('Error sending email:', emailResponse.error);
          } else {
            // Update notification as sent
            await supabase
              .from('notifications')
              .update({ sent_at: new Date().toISOString() })
              .eq('id', storedNotification.id);

            sentCount++;
          }
        }
      } catch (error) {
        console.error('Error processing notification:', error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: notifications.length,
        sent: sentCount,
        message: `Processed ${notifications.length} notifications, sent ${sentCount}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in notification-scheduler function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
