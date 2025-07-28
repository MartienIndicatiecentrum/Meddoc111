import { useState, useEffect } from 'react';
import { reminderScheduler } from '@/services/reminderScheduler';
import { emailService } from '@/services/emailService';
import { toast } from 'sonner';

interface EmailReminderStatus {
  isRunning: boolean;
  lastProcessed: Date | null;
  intervalMinutes: number;
}

/**
 * Hook for managing email reminder functionality
 */
export const useEmailReminders = () => {
  const [status, setStatus] = useState<EmailReminderStatus>({
    isRunning: false,
    lastProcessed: null,
    intervalMinutes: 5
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize scheduler status on mount
  useEffect(() => {
    const schedulerStatus = reminderScheduler.getStatus();
    setStatus(prev => ({
      ...prev,
      isRunning: schedulerStatus.isRunning
    }));
  }, []);

  /**
   * Start the email reminder scheduler
   */
  const startScheduler = (intervalMinutes: number = 5) => {
    try {
      reminderScheduler.start(intervalMinutes);
      setStatus(prev => ({
        ...prev,
        isRunning: true,
        intervalMinutes
      }));
      toast.success(`Email reminder scheduler gestart (elke ${intervalMinutes} minuten)`);
    } catch (error) {
      console.error('Error starting scheduler:', error);
      toast.error('Fout bij starten van email reminder scheduler');
    }
  };

  /**
   * Stop the email reminder scheduler
   */
  const stopScheduler = () => {
    try {
      reminderScheduler.stop();
      setStatus(prev => ({
        ...prev,
        isRunning: false
      }));
      toast.success('Email reminder scheduler gestopt');
    } catch (error) {
      console.error('Error stopping scheduler:', error);
      toast.error('Fout bij stoppen van email reminder scheduler');
    }
  };

  /**
   * Manually process reminders (for testing)
   */
  const processRemindersManually = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      await reminderScheduler.triggerManualRun();
      setStatus(prev => ({
        ...prev,
        lastProcessed: new Date()
      }));
      toast.success('Email reminders handmatig verwerkt');
    } catch (error) {
      console.error('Error processing reminders manually:', error);
      toast.error('Fout bij verwerken van email reminders');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Send a test reminder email
   */
  const sendTestReminder = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const testData = {
        appointmentId: 'test-123',
        clientName: 'Test Cliënt',
        clientEmail: 'test@example.com',
        caregiverName: 'Dr. Test',
        appointmentDate: new Date().toISOString().split('T')[0],
        appointmentTime: '14:30',
        appointmentType: 'consultatie',
        location: 'Praktijk',
        notes: 'Dit is een test herinnering'
      };

      const success = await emailService.sendAppointmentReminder(testData);
      
      if (success) {
        toast.success('Test email reminder verzonden');
      } else {
        toast.error('Fout bij verzenden test email reminder');
      }
    } catch (error) {
      console.error('Error sending test reminder:', error);
      toast.error('Fout bij verzenden test email reminder');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    status,
    isProcessing,
    startScheduler,
    stopScheduler,
    processRemindersManually,
    sendTestReminder
  };
};
