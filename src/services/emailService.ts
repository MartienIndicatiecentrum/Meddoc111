import { supabase } from '@/integrations/supabase/client';

export interface EmailReminderData {
  appointmentId: string;
  clientName: string;
  clientEmail: string;
  caregiverName?: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  location?: string;
  notes?: string;
  reminderEmail?: string;
}

export interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody: string;
}

/**
 * Email service for sending appointment reminders
 */
export class EmailService {
  private static instance: EmailService;

  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Generate email template for appointment reminder
   */
  private generateReminderTemplate(data: EmailReminderData): EmailTemplate {
    const appointmentDateTime = new Date(`${data.appointmentDate}T${data.appointmentTime}`);
    const formattedDate = appointmentDateTime.toLocaleDateString('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = appointmentDateTime.toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const subject = `Herinnering: Afspraak ${formattedDate} om ${formattedTime}`;

    const htmlBody = `
      <!DOCTYPE html>
      <html lang="nl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Afspraak Herinnering</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .appointment-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
          .detail-row { margin: 10px 0; }
          .label { font-weight: bold; color: #374151; }
          .value { color: #1f2937; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Afspraak Herinnering</h1>
          </div>
          <div class="content">
            <p>Beste ${data.clientName},</p>
            <p>Dit is een herinnering voor uw aankomende afspraak:</p>

            <div class="appointment-details">
              <div class="detail-row">
                <span class="label">📅 Datum:</span>
                <span class="value">${formattedDate}</span>
              </div>
              <div class="detail-row">
                <span class="label">🕐 Tijd:</span>
                <span class="value">${formattedTime}</span>
              </div>
              <div class="detail-row">
                <span class="label">📋 Type:</span>
                <span class="value">${data.appointmentType}</span>
              </div>
              ${data.caregiverName ? `
              <div class="detail-row">
                <span class="label">👨‍⚕️ Medewerker:</span>
                <span class="value">${data.caregiverName}</span>
              </div>
              ` : ''}
              ${data.location ? `
              <div class="detail-row">
                <span class="label">📍 Locatie:</span>
                <span class="value">${data.location}</span>
              </div>
              ` : ''}
              ${data.notes ? `
              <div class="detail-row">
                <span class="label">📝 Opmerkingen:</span>
                <span class="value">${data.notes}</span>
              </div>
              ` : ''}
            </div>

            <p>Mocht u vragen hebben of wijzigingen nodig zijn, neem dan contact met ons op.</p>
            <p>Met vriendelijke groet,<br>Het MedDoc Team</p>
          </div>
          <div class="footer">
            <p>Deze email is automatisch gegenereerd door het MedDoc afspraaksysteem.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `
Afspraak Herinnering

Beste ${data.clientName},

Dit is een herinnering voor uw aankomende afspraak:

📅 Datum: ${formattedDate}
🕐 Tijd: ${formattedTime}
📋 Type: ${data.appointmentType}
${data.caregiverName ? `👨‍⚕️ Medewerker: ${data.caregiverName}\n` : ''}
${data.location ? `📍 Locatie: ${data.location}\n` : ''}
${data.notes ? `📝 Opmerkingen: ${data.notes}\n` : ''}

Mocht u vragen hebben of wijzigingen nodig zijn, neem dan contact met ons op.

Met vriendelijke groet,
Het MedDoc Team

---
Deze email is automatisch gegenereerd door het MedDoc afspraaksysteem.
    `;

    return { subject, htmlBody, textBody };
  }

  /**
   * Send appointment reminder email
   */
  public async sendAppointmentReminder(data: EmailReminderData): Promise<boolean> {
    try {
      const template = this.generateReminderTemplate(data);
      const recipientEmail = data.reminderEmail || data.clientEmail;

      if (!recipientEmail) {
        console.error('No email address available for reminder');
        return false;
      }

      // Call Supabase Edge Function to send email
      const { data: result, error } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'appointment_reminder',
          to: recipientEmail,
          subject: template.subject,
          html: template.htmlBody,
          text: template.textBody,
          appointmentId: data.appointmentId
        }
      });

      if (error) {
        console.error('Error sending email reminder:', error);
        return false;
      }

      console.log('Email reminder sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Failed to send appointment reminder:', error);
      return false;
    }
  }

  /**
   * Check for appointments that need reminders and send them
   */
  public async processAppointmentReminders(): Promise<void> {
    try {
      const now = new Date();

      // Query appointments that have reminders enabled and haven't been sent yet
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          client_id,
          caregiver_id,
          date,
          start_time,
          type,
          location,
          notes,
          reminder_enabled,
          reminder_value,
          reminder_unit,
          reminder_email,
          reminder_sent,
          clients!inner(naam, email),
          caregivers(naam)
        `)
        .eq('reminder_enabled', true)
        .eq('status', 'scheduled')
        .is('reminder_sent', null) as { data: any[] | null; error: any };

      if (error) {
        console.error('Error fetching appointments for reminders:', error);
        return;
      }

      if (!appointments || appointments.length === 0) {
        console.log('No appointments found that need reminders');
        return;
      }

      for (const appointment of appointments) {
        const appointmentDateTime = new Date(`${appointment.date}T${appointment.start_time}`);

        // Calculate when to send reminder
        let reminderTime = new Date(appointmentDateTime);
        switch (appointment.reminder_unit) {
          case 'minutes':
            reminderTime.setMinutes(reminderTime.getMinutes() - appointment.reminder_value);
            break;
          case 'hours':
            reminderTime.setHours(reminderTime.getHours() - appointment.reminder_value);
            break;
          case 'days':
            reminderTime.setDate(reminderTime.getDate() - appointment.reminder_value);
            break;
        }

        // Check if it's time to send the reminder
        if (now >= reminderTime && now < appointmentDateTime) {
          const emailData: EmailReminderData = {
            appointmentId: appointment.id,
            clientName: appointment.clients?.naam || 'Onbekende cliënt',
            clientEmail: appointment.clients?.email || '',
            caregiverName: appointment.caregivers?.naam,
            appointmentDate: appointment.date,
            appointmentTime: appointment.start_time,
            appointmentType: appointment.type,
            location: appointment.location,
            notes: appointment.notes,
            reminderEmail: appointment.reminder_email
          };

          const emailSent = await this.sendAppointmentReminder(emailData);

          if (emailSent) {
            // Mark reminder as sent
            await supabase
              .from('appointments')
              .update({
                reminder_sent: now.toISOString(),
                updated_at: now.toISOString()
              })
              .eq('id', appointment.id);

            console.log(`Reminder sent for appointment ${appointment.id}`);
          }
        }
      }
    } catch (error) {
      console.error('Error processing appointment reminders:', error);
    }
  }
}

export const emailService = EmailService.getInstance();
