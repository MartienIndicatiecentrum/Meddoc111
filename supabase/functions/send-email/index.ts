import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

const resend = new Resend(resendApiKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const requestBody = await req.json();
    
    // Handle different email types
    if (requestBody.type === 'appointment_reminder') {
      return await handleAppointmentReminder(requestBody);
    } else {
      return await handleDocumentNotification(requestBody);
    }
  } catch (error) {
    console.error('Error in send-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Handle appointment reminder emails
async function handleAppointmentReminder(requestBody: any) {
  const { to, subject, html, text, appointmentId } = requestBody;

  console.log('Sending appointment reminder:', { to, subject, appointmentId });

  try {
    const emailResponse = await resend.emails.send({
      from: 'MedDoc Afspraken <afspraken@meddoc.nl>',
      to: [to],
      subject: subject,
      html: html,
      text: text,
      tags: [
        { name: 'type', value: 'appointment_reminder' },
        { name: 'appointment_id', value: appointmentId }
      ]
    });

    if (emailResponse.error) {
      console.error('Resend error:', emailResponse.error);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: emailResponse.error }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Appointment reminder sent successfully:', emailResponse.data);
    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResponse.data?.id,
        appointmentId: appointmentId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending appointment reminder:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send appointment reminder' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

// Handle document notification emails (existing functionality)
async function handleDocumentNotification(requestBody: any) {
  const { to, subject, content, type, userId, documentId } = requestBody;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('Sending document notification:', { to, subject, type, userId });

  try {
    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: 'Document System <noreply@resend.dev>',
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            Document System Notification
          </h2>
          <div style="margin: 20px 0; line-height: 1.6;">
            ${content}
          </div>
          ${documentId ? `
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #666;">
                <strong>Document ID:</strong> ${documentId}
              </p>
            </div>
          ` : ''}
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px; text-align: center;">
            This is an automated notification from your Document Management System.
          </p>
        </div>
      `,
    });

    // Log the notification in the database
    if (userId) {
      await supabase.from('notifications').insert({
        user_id: userId,
        type: type || 'email',
        title: subject,
        message: content,
        channels: ['email'],
        sent_at: new Date().toISOString(),
      });

      // Log activity if document-related
      if (documentId) {
        await supabase.from('activity_logs').insert({
          document_id: documentId,
          user_id: userId,
          action: 'status_change',
          details: {
            action_type: 'email_sent',
            email_subject: subject,
            recipient: to,
          },
        });
      }
    }

    console.log('Email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        emailId: emailResponse.data?.id,
        message: 'Email sent successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in document notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}